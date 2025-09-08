import { createClient } from '@supabase/supabase-js';
import { DatabaseSongSchema, sanitizeSongTitle } from '../schemas/song';

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
          audio_url_option1: songData.audioUrlOption1 || null,
          audio_url_option2: songData.audioUrlOption2 || null,
          suno_task_id: songData.sunoTaskId || null,
          generation_status: 'completed'
        })
        .select()
        .single();

      if (error) {
        console.error('Database error creating song:', error);
        throw new Error(`Failed to create song: ${error.message}`);
      }

      return this.mapDbToSong(data);
    } catch (error) {
      console.error('Error in createSong:', error);
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
      // First, check how many songs exist for migration
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
        .eq('suno_task_id', taskId)
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
        audioUrlOption1: validatedRow.audio_url_option1,
        audioUrlOption2: validatedRow.audio_url_option2,
        sunoTaskId: validatedRow.task_id,
        generationStatus: validatedRow.status,
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