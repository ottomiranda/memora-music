import { SongService } from './songService.js';
/**
 * API wrapper for song operations
 * This module provides a simplified interface for song-related operations
 */
/**
 * Get a song by its ID
 * @param {string} songId - The song ID
 * @returns {Promise<Object|null>} The song object or null if not found
 */
export const getSongById = async (songId) => {
    try {
        return await SongService.getSongById(songId);
    }
    catch (error) {
        console.error('Error getting song by ID:', error);
        throw error;
    }
};
/**
 * Get random public songs for discovery
 * @param {number} limit - Number of songs to fetch (default: 24)
 * @returns {Promise<Array>} Array of public songs
 */
export const getRandomPublicSongs = async (limit = 24) => {
    try {
        return await SongService.getRandomPublicSongs(limit);
    }
    catch (error) {
        console.error('Error getting random public songs:', error);
        throw error;
    }
};
/**
 * Alias for discovery of public songs (compatibility for callers)
 * @param {number} limit - Number of songs to fetch
 * @returns {Promise<Array>} Array of public songs
 */
export const discover = async (limit = 24) => {
    return await getRandomPublicSongs(limit);
};
/**
 * Get songs by user ID
 * @param {string} userId - The user ID
 * @param {number} limit - Number of songs to fetch (default: 20)
 * @param {number} offset - Offset for pagination (default: 0)
 * @param {string} accessToken - Optional access token for authentication
 * @returns {Promise<Array>} Array of user songs
 */
export const getSongsByUser = async (userId, limit = 20, offset = 0, accessToken = null) => {
    try {
        return await SongService.getSongsByUser(userId, limit, offset, accessToken);
    }
    catch (error) {
        console.error('Error getting songs by user:', error);
        throw error;
    }
};
/**
 * Get songs by guest ID
 * @param {string} guestId - The guest ID
 * @param {number} limit - Number of songs to fetch (default: 20)
 * @param {number} offset - Offset for pagination (default: 0)
 * @returns {Promise<Array>} Array of guest songs
 */
export const getSongsByGuest = async (guestId, limit = 20, offset = 0) => {
    try {
        return await SongService.getSongsByGuest(guestId, limit, offset);
    }
    catch (error) {
        console.error('Error getting songs by guest:', error);
        throw error;
    }
};
/**
 * Update a song
 * @param {string} songId - The song ID
 * @param {Object} fields - Fields to update
 * @param {Object} identity - User or guest identity
 * @returns {Promise<Object>} Updated song object
 */
export const updateSong = async (songId, fields, identity = { userId: null, guestId: null }) => {
    try {
        return await SongService.updateSong(songId, fields, identity);
    }
    catch (error) {
        console.error('Error updating song:', error);
        throw error;
    }
};
/**
 * Delete a song
 * @param {string} songId - The song ID
 * @param {Object} identity - User or guest identity
 * @returns {Promise<boolean>} Success status
 */
export const deleteSong = async (songId, identity = { userId: null, guestId: null }) => {
    try {
        return await SongService.deleteSong(songId, identity);
    }
    catch (error) {
        console.error('Error deleting song:', error);
        throw error;
    }
};
/**
 * Get a song by task ID
 * @param {string} taskId - The task ID
 * @returns {Promise<Object|null>} The song object or null if not found
 */
export const getSongByTaskId = async (taskId) => {
    try {
        return await SongService.getSongByTaskId(taskId);
    }
    catch (error) {
        console.error('Error getting song by task ID:', error);
        throw error;
    }
};
/**
 * Get song statistics
 * @param {string} userId - Optional user ID
 * @param {string} guestId - Optional guest ID
 * @returns {Promise<Object>} Song statistics
 */
export const getSongStats = async (userId = null, guestId = null) => {
    try {
        return await SongService.getSongStats(userId, guestId);
    }
    catch (error) {
        console.error('Error getting song stats:', error);
        throw error;
    }
};
// Export songsApi object for compatibility
export const songsApi = {
    getSongById,
    getRandomPublicSongs,
    discover,
    getSongsByUser,
    getSongsByGuest,
    updateSong,
    deleteSong,
    getSongByTaskId,
    getSongStats
};
export default {
    getSongById,
    getRandomPublicSongs,
    discover,
    getSongsByUser,
    getSongsByGuest,
    updateSong,
    deleteSong,
    getSongByTaskId,
    getSongStats
};
//# sourceMappingURL=songsApi.js.map