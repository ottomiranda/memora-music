import { createClient } from '@supabase/supabase-js';
import { DatabaseSongSchema, sanitizeSongTitle } from '../schemas/song.js';

// Lazy initialization of Supabase client
let supabase = null;

function getSupabaseClient() {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing. Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
    }
    
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
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
      
      const { data, error } = await getSupabaseClient()
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
          task_id: songData.taskId || null,
          generation_status: 'completed',
          ispaid: isPaid
        })
        .select()
        .single();

      if (error) {
        console.error('Database error creating song:', error);
        throw new Error(`Failed to create song: ${error.message}`);
      }

      // Increment freesongsused counter after successful song creation
      await this.incrementFreeSongsUsed(songData.userId, songData.guestId);

      return this.mapDbToSong(data);
    } catch (error) {
      console.error('Error in createSong:', error);
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

      const client = getSupabaseClient();
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
      const client = getSupabaseClient();
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
   */
  static async getSongsByUser(userId, limit = 20, offset = 0) {
    try {
      const { data, error } = await getSupabaseClient()
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
   */
  static async getSongsByGuest(guestId, limit = 20, offset = 0) {
    try {
      const { data, error } = await getSupabaseClient()
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
      // First, get guest user data to transfer freesongsused count
      const { data: guestUser, error: guestError } = await getSupabaseClient()
        .from('users')
        .select('freesongsused')
        .eq('device_id', guestId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (guestError) {
        console.warn('Database warning fetching guest user (continuando com freesongsused=0):', guestError);
      }

      const guestFreesongsused = guestUser?.freesongsused || 0;

      // Create or update the registered user with the guest's freesongsused count
      const { data: registeredUser, error: userError } = await getSupabaseClient()
        .from('users')
        .upsert({
          id: userId,
          freesongsused: guestFreesongsused,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (userError) {
        console.error('Database error creating/updating registered user:', userError);
        throw new Error(`Failed to create/update registered user: ${userError.message}`);
      }

      console.log(`✅ Created/updated registered user with freesongsused: ${guestFreesongsused}`);

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
      const { data, error } = await getSupabaseClient()
        .from('songs')
        .select('*')
        .eq('task_id', taskId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return null;
        }
        console.error('Database error fetching song by task ID:', error);
        throw new Error(`Failed to fetch song by task ID: ${error.message}`);
      }

      return this.mapDbToSong(data);
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
   */
  static async getSongStats() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const client = getSupabaseClient();
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
      const deviceId = userId || guestId;
      
      if (!deviceId) {
        console.warn('No user_id or guest_id provided for checking payment status');
        return true; // Default to paid if no user info
      }

      // Get current user data to check freesongsused count
      let userData = null;
      let error = null;
      
      if (userId) {
        // For authenticated users, search by user ID
        const result = await getSupabaseClient()
          .from('users')
          .select('freesongsused')
          .eq('id', userId)
          .single();
        userData = result.data;
        error = result.error;
      } else {
        // For guest users, search by device_id
        const result = await getSupabaseClient()
          .from('users')
          .select('freesongsused')
          .eq('device_id', guestId)
          .single();
        userData = result.data;
        error = result.error;
      }

      if (error || !userData) {
        console.log(`⚠️ User not found for device_id: ${deviceId}, defaulting to free song`);
        return false; // First song is always free for new users
      }

      const currentCount = userData.freesongsused || 0;
      const shouldBePaid = currentCount >= 1; // First song (count 0) is free, subsequent songs are paid
      
      console.log(`💰 Payment check for device_id ${deviceId}: freesongsused=${currentCount}, shouldBePaid=${shouldBePaid}`);
      
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
        sunoTaskId: validatedRow.task_id,
        generationStatus: validatedRow.generation_status || validatedRow.status,
        isPaid: validatedRow.ispaid || false,
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
