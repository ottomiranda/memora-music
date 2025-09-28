import { createClient } from '@supabase/supabase-js';
import { DatabaseSongSchema, sanitizeSongTitle } from '../schemas/song.js';

// Lazy initialization of Supabase clients
let anonSupabase = null;
let serviceSupabase = null;

/**
 * Get Supabase client with anon key (respects RLS)
 * Use this for operations that should respect Row Level Security
 */
function getAnonSupabaseClient() {
  if (!anonSupabase) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing. Please check SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
    }
    
    anonSupabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return anonSupabase;
}

/**
 * Get Supabase client with service role key (bypasses RLS)
 * Use ONLY for admin operations that need to bypass RLS
 */
function getServiceSupabaseClient() {
  if (!serviceSupabase) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing. Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
    }
    
    serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);
  }
  return serviceSupabase;
}

/**
 * Historical helper retained for backwards compatibility.
 * The legacy code expects `getSupabaseClient` to exist, so expose the
 * service-role client through this wrapper.
 */
function getSupabaseClient() {
  return getServiceSupabaseClient();
}

/**
 * Get authenticated Supabase client with JWT token
 * This respects RLS and user authentication
 */
function getAuthenticatedSupabaseClient(accessToken) {
  const client = getAnonSupabaseClient();
  if (accessToken) {
    client.auth.setSession({ access_token: accessToken, refresh_token: '' });
  }
  return client;
}

export class SongService {
  /**
   * Create a new song in the database
   */
  static async createSong(songData) {
    try {
      // Sanitize and validate data
      const sanitizedTitle = sanitizeSongTitle(songData.title);
      
      // Determine if this song should be paid based on user's freesongsused count
      const isPaid = await this.shouldSongBePaid(songData.userId, songData.guestId);
      
      console.log(`🎵 Creating song for ${songData.userId ? 'user' : 'guest'} ${songData.userId || songData.guestId}, isPaid: ${isPaid}`);
      
      // Use service role for creation to ensure it works regardless of RLS
      const { data, error } = await getServiceSupabaseClient()
        .from('songs')
        .insert({
          user_id: songData.userId || null,
          guest_id: songData.guestId || null,
          title: sanitizedTitle,
          lyrics: songData.lyrics || null,
          prompt: songData.prompt || null,
          genre: songData.genre || null,
          mood: songData.mood || null,
          image_url: songData.imageUrl || null,
          audio_url_option1: songData.audioUrlOption1 || null,
          audio_url_option2: songData.audioUrlOption2 || null,
          suno_task_id: songData.sunoTaskId || songData.taskId || null,
          generation_status: 'completed',
          ispaid: isPaid
        })
        .select()
        .single();

      if (error) {
        console.error('Database error creating song:', error);
        throw new Error(`Failed to create song: ${error.message}`);
      }

      // Increment freesongsused counter only when song consumed a free slot
      if (!isPaid) {
        await this.incrementFreeSongsUsed(songData.userId, songData.guestId);
      }

      return this.mapDbToSong(data);
    } catch (error) {
      console.error('Error in createSong:', error);
      throw error;
    }
  }

  /**
   * Get a random selection of public songs (with cover and audio)
   * Intended for discovery sections on the homepage.
   * Uses anon client since these are public songs
   */
  static async getRandomPublicSongs(limit = 24) {
    try {
      // Fetch latest pool and randomize in memory for portability
      const { data, error } = await getAnonSupabaseClient()
        .from('songs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(Math.max(limit * 8, 200));

      if (error) {
        console.error('Database error fetching discovery songs:', error);
        throw new Error(`Failed to fetch discovery songs: ${error.message}`);
      }

      const pool = (data || []).filter((row) => {
        const hasCover = !!row.image_url;
        const hasAudio = !!row.audio_url_option1 || !!row.audio_url_option2;
        const isComplete = (row.generation_status || row.status) === 'completed' || row.generation_status == null;
        return hasCover && hasAudio && isComplete;
      });

      // Shuffle (Fisher–Yates)
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }

      const selected = pool.slice(0, limit).map(this.mapDbToSong.bind(this));
      return selected;
    } catch (error) {
      console.error('Error in getRandomPublicSongs:', error);
      throw error;
    }
  }

  /**
   * Update song fields (title/lyrics) owned by user or guest
   */
  static async updateSong(songId, fields, identity = { userId: null, guestId: null }) {
    try {
      const updates = {};
      if (typeof fields?.title === 'string') updates['title'] = sanitizeSongTitle(fields.title);
      if (typeof fields?.lyrics === 'string') updates['lyrics'] = fields.lyrics;
      if (Object.keys(updates).length === 0) {
        return null;
      }

      const client = getServiceSupabaseClient();
      let query = client.from('songs').update({
        ...updates,
        updated_at: new Date().toISOString(),
      }).eq('id', songId);

      if (identity?.userId) {
        query = query.eq('user_id', identity.userId);
      } else if (identity?.guestId) {
        query = query.eq('guest_id', identity.guestId);
      } else {
        // No identity: refuse
        throw new Error('Missing identity for update');
      }

      const { data, error } = await query.select('*').maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return this.mapDbToSong(data);
    } catch (error) {
      console.error('Error in updateSong:', error);
      throw error;
    }
  }

  /**
   * Delete a song if owned by user or guest
   */
  static async deleteSong(songId, identity = { userId: null, guestId: null }) {
    try {
      const client = getServiceSupabaseClient();
      let query = client.from('songs').delete().eq('id', songId);
      if (identity?.userId) {
        query = query.eq('user_id', identity.userId);
      } else if (identity?.guestId) {
        query = query.eq('guest_id', identity.guestId);
      } else {
        throw new Error('Missing identity for delete');
      }
      const { data, error } = await query.select('id');
      if (error) throw error;
      return Array.isArray(data) && data.length > 0;
    } catch (error) {
      console.error('Error in deleteSong:', error);
      throw error;
    }
  }

  /**
   * Get songs by authenticated user ID
   * Uses service role for now but should be migrated to use JWT auth
   */
  static async getSongsByUser(userId, limit = 20, offset = 0, accessToken = null) {
    try {
      // For authenticated users, we can use service role since we already validated the user
      // TODO: Migrate to use JWT token with RLS policies
      const client = accessToken ? getAuthenticatedSupabaseClient(accessToken) : getServiceSupabaseClient();
      
      const { data, error } = await client
        .from('songs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Database error fetching user songs:', error);
        throw new Error(`Failed to fetch user songs: ${error.message}`);
      }

      return (data || []).map(this.mapDbToSong);
    } catch (error) {
      console.error('Error in getSongsByUser:', error);
      throw error;
    }
  }

  /**
   * Get songs by guest ID
   * Uses service role since guests don't have JWT tokens
   */
  static async getSongsByGuest(guestId, limit = 20, offset = 0) {
    try {
      // Use service role for guest access since they don't have JWT authentication
      const { data, error } = await getServiceSupabaseClient()
        .from('songs')
        .select('*')
        .eq('guest_id', guestId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Database error fetching guest songs:', error);
        throw new Error(`Failed to fetch guest songs: ${error.message}`);
      }

      return (data || []).map(this.mapDbToSong);
    } catch (error) {
      console.error('Error in getSongsByGuest:', error);
      throw error;
    }
  }

  /**
   * Migrate guest songs to authenticated user
   */
  static async migrateGuestSongs(guestId, userId) {
    try {
      // Importante: esta função deve apenas migrar músicas.
      // A consolidação do contador e do device_id ocorre via RPC merge_guest_into_user.

      // Check how many songs exist for migration
      const { data: existingSongs, error: countError } = await getSupabaseClient()
        .from('songs')
        .select('id')
        .eq('guest_id', guestId)
        .is('user_id', null);

      if (countError) {
        console.error('Database error counting guest songs:', countError);
        throw new Error(`Failed to count guest songs: ${countError.message}`);
      }

      if (!existingSongs || existingSongs.length === 0) {
        return 0;
      }

      console.log(`Found ${existingSongs.length} songs to migrate from guest ${guestId} to user ${userId}`);

      // Migrate the songs in a single operation
      const { error: updateError } = await getSupabaseClient()
        .from('songs')
        .update({
          user_id: userId,
          guest_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('guest_id', guestId)
        .is('user_id', null);

      if (updateError) {
        console.error('Database error migrating songs:', updateError);
        throw new Error(`Failed to migrate songs: ${updateError.message}`);
      }

      console.log(`Successfully migrated ${existingSongs.length} songs from guest ${guestId} to user ${userId}`);
      return existingSongs.length;
    } catch (error) {
      console.error('Error in migrateGuestSongs:', error);
      throw error;
    }
  }

  /**
   * Get song by Suno task ID
   */
  static async getSongByTaskId(taskId) {
    try {
      const client = getSupabaseClient();

      const primary = await client
        .from('songs')
        .select('*')
        .eq('task_id', taskId)
        .maybeSingle();

      let row = primary.data;
      let error = primary.error;

      if (error && error.code !== 'PGRST116') {
        console.error('Database error fetching song by task ID:', error);
        throw new Error(`Failed to fetch song by task ID: ${error.message}`);
      }

      if (!row) {
        const fallback = await client
          .from('songs')
          .select('*')
          .eq('suno_task_id', taskId)
          .maybeSingle();

        row = fallback.data;
        error = fallback.error;

        if (error && error.code !== 'PGRST116') {
          console.error('Database error fetching song by suno_task_id:', error);
          throw new Error(`Failed to fetch song by task ID: ${error.message}`);
        }
      }

      if (!row) {
        return null;
      }

      return this.mapDbToSong(row);
    } catch (error) {
      console.error('Error in getSongByTaskId:', error);
      throw error;
    }
  }

  /**
   * Get song by ID (server-side, service role)
   */
  static async getSongById(songId) {
    try {
      const { data, error } = await getSupabaseClient()
        .from('songs')
        .select('*')
        .eq('id', songId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return this.mapDbToSong(data);
    } catch (error) {
      console.error('Error in getSongById:', error);
      throw error;
    }
  }

  /**
   * Update song status
   */
  static async updateSongStatus(songId, status) {
    try {
      const { error } = await getSupabaseClient()
        .from('songs')
        .update({
          generation_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', songId);

      if (error) {
        console.error('Database error updating song status:', error);
        throw new Error(`Failed to update song status: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in updateSongStatus:', error);
      throw error;
    }
  }

  /**
   * Delete old guest songs (cleanup job)
   */
  static async deleteOldGuestSongs(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { data, error } = await getSupabaseClient()
        .from('songs')
        .delete()
        .is('user_id', null)
        .not('guest_id', 'is', null)
        .lt('created_at', cutoffDate.toISOString())
        .select('id');

      if (error) {
        console.error('Database error deleting old guest songs:', error);
        throw new Error(`Failed to delete old guest songs: ${error.message}`);
      }

      const deletedCount = data?.length || 0;
      console.log(`Deleted ${deletedCount} old guest songs (older than ${daysOld} days)`);
      return deletedCount;
    } catch (error) {
      console.error('Error in deleteOldGuestSongs:', error);
      throw error;
    }
  }

  /**
   * Get song statistics
   * @param {string|null} userId - Optional user ID to filter stats
   * @param {string|null} guestId - Optional guest ID to filter stats
   */
  static async getSongStats(userId = null, guestId = null) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const client = getSupabaseClient();
      
      // If specific user or guest is requested, return their stats
      if (userId || guestId) {
        let query = client.from('songs').select('generation_status', { count: 'exact' });
        
        if (userId) {
          query = query.eq('user_id', userId);
        } else if (guestId) {
          query = query.eq('guest_id', guestId);
        }
        
        const [totalResult, recentResult] = await Promise.all([
          query,
          query.gte('created_at', today.toISOString())
        ]);
        
        // Count by status
        const byStatus = {};
        if (totalResult.data) {
          totalResult.data.forEach(song => {
            const status = song.generation_status || 'unknown';
            byStatus[status] = (byStatus[status] || 0) + 1;
          });
        }
        
        return {
          total: totalResult.count || 0,
          byStatus,
          recent: recentResult.count || 0
        };
      }
      
      // Global stats (original behavior)
      const [totalResult, userResult, guestResult, todayResult] = await Promise.all([
        client.from('songs').select('id', { count: 'exact', head: true }),
        client.from('songs').select('id', { count: 'exact', head: true }).not('user_id', 'is', null),
        client.from('songs').select('id', { count: 'exact', head: true }).not('guest_id', 'is', null),
        client.from('songs').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString())
      ]);

      return {
        totalSongs: totalResult.count || 0,
        userSongs: userResult.count || 0,
        guestSongs: guestResult.count || 0,
        todaySongs: todayResult.count || 0
      };
    } catch (error) {
      console.error('Error in getSongStats:', error);
      throw error;
    }
  }

  /**
   * Check if a song should be paid based on user's current freesongsused count
   */
  static async shouldSongBePaid(userId, guestId) {
    try {
      if (!userId && !guestId) {
        console.warn('No user_id or guest_id provided for checking payment status');
        return true; // Default to paid if no user info
      }

      const orFilters = [];
      if (userId) {
        orFilters.push(`user_id.eq.${userId}`);
      }
      [userId, guestId].filter(Boolean).forEach(id => {
        orFilters.push(`device_id.eq.${id}`);
      });

      if (orFilters.length === 0) {
        console.log('⚠️ No identifiers matched for user_creations lookup, defaulting to free song');
        return false; // First song is always free for new users
      }

      const { data, error } = await getSupabaseClient()
        .from('user_creations')
        .select('freesongsused')
        .or(orFilters.join(','))
        .order('freesongsused', { ascending: false })
        .limit(1);

      if (error) {
        console.error('❌ Error checking payment status:', error);
        return false;
      }

      if (!data || data.length === 0) {
        console.log('⚠️ User not found in user_creations, defaulting to free song');
        return false;
      }

      const currentCount = data[0]?.freesongsused || 0;
      const shouldBePaid = currentCount >= 1; // First song (count 0) is free, subsequent songs are paid
      
      console.log(`💰 Payment check: freesongsused=${currentCount}, shouldBePaid=${shouldBePaid}`);
      
      return shouldBePaid;
    } catch (error) {
      console.error('❌ Error checking payment status:', error);
      return false; // Default to free on error
    }
  }

  /**
   * Increment the freesongsused counter for a user or guest
   */
  static async incrementFreeSongsUsed(userId, guestId) {
    try {
      // Determine the device_id to use (user_id takes priority over guest_id)
      const deviceId = userId || guestId;
      
      if (!deviceId) {
        console.warn('No user_id or guest_id provided for incrementing freesongsused');
        return;
      }

      console.log(`🔄 Incrementing freesongsused for device_id: ${deviceId} (${userId ? 'user' : 'guest'})`);

      // Call the RPC function to increment freesongsused
      const { data, error } = await getSupabaseClient()
        .rpc('increment_freesongsused', {
          user_device_id: deviceId
        });

      if (error) {
        console.error('❌ Error incrementing freesongsused:', error);
        throw new Error(`Failed to increment freesongsused: ${error.message}`);
      }

      console.log(`✅ Successfully incremented freesongsused for device_id: ${deviceId}`, data);
    } catch (error) {
      console.error('❌ Error in incrementFreeSongsUsed:', error);
      // Don't throw the error to avoid breaking song creation
      // Just log it for monitoring purposes
    }
  }

  /**
   * Map database row to Song object
   */
  static mapDbToSong(dbRow) {
    try {
      console.log('🔍 Raw database row:', JSON.stringify(dbRow, null, 2));
      
      // Validate database row structure
      const validatedRow = DatabaseSongSchema.parse(dbRow);
      
      console.log('✅ Validated row:', JSON.stringify(validatedRow, null, 2));
      
      return {
        id: validatedRow.id,
        userId: validatedRow.user_id,
        guestId: validatedRow.guest_id,
        title: validatedRow.title,
        lyrics: validatedRow.lyrics,
        prompt: validatedRow.prompt,
        genre: validatedRow.genre,
        mood: validatedRow.mood,
        imageUrl: validatedRow.image_url || null,
        audioUrlOption1: validatedRow.audio_url_option1,
        audioUrlOption2: validatedRow.audio_url_option2,
        sunoTaskId: validatedRow.suno_task_id || validatedRow.task_id || dbRow.task_id || null,
        generationStatus: validatedRow.generation_status,
        isPaid: false, // Default to false since ispaid column doesn't exist
        createdAt: new Date(validatedRow.created_at),
        updatedAt: new Date(validatedRow.updated_at)
      };
    } catch (error) {
      console.error('❌ Error mapping database row to Song:', error.message);
      console.error('❌ Raw database row that failed:', JSON.stringify(dbRow, null, 2));
      if (error.errors) {
        console.error('❌ Validation errors:', JSON.stringify(error.errors, null, 2));
      }
      throw new Error('Invalid database row structure');
    }
  }
}

// Export singleton instance for convenience
export const songService = SongService;
