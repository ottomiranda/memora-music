import { sunoApi } from '@/config/api';

interface SunoAudioLinks {
  streamUrl: string | null;
  audioUrl: string | null;
  status?: string;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: SunoAudioLinks; fetchedAt: number }>();

export async function getSunoAudioLinks(taskId?: string | null): Promise<SunoAudioLinks | null> {
  if (!taskId) return null;

  const cached = cache.get(taskId);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  const response = await sunoApi.getMusicDetails(taskId);
  if (!response?.success || !response.data) {
    return null;
  }

  const result: SunoAudioLinks = {
    streamUrl: response.data.stream_audio_url || response.data.audio_url || null,
    audioUrl: response.data.audio_url || response.data.stream_audio_url || null,
    status: response.data.status,
  };

  cache.set(taskId, { data: result, fetchedAt: Date.now() });
  return result;
}

export function clearSunoAudioCache(taskId?: string) {
  if (taskId) {
    cache.delete(taskId);
  } else {
    cache.clear();
  }
}
