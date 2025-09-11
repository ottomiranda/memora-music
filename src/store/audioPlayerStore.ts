import { create } from 'zustand';

interface AudioMeta {
  title?: string;
  versionLabel?: string; // 'A' | 'B' | etc.
}

interface AudioPlayerState {
  currentId: string | null;
  currentUrl: string | null;
  currentTitle?: string | null;
  currentVersionLabel?: string | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  play: (id: string, url: string, meta?: AudioMeta) => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  getMediaElement: () => HTMLAudioElement | null;
}

let audioEl: HTMLAudioElement | null = null;

let initialVolume = 1;
try {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('memora_volume');
    const v = stored ? parseFloat(stored) : NaN;
    if (!Number.isNaN(v) && v >= 0 && v <= 1) initialVolume = v;
  }
} catch {}

export const useAudioPlayerStore = create<AudioPlayerState>((set, get) => ({
  currentId: null,
  currentUrl: null,
  currentTitle: null,
  currentVersionLabel: null,
  isPlaying: false,
  isLoading: false,
  currentTime: 0,
  duration: 0,
  volume: initialVolume,
  play: (id: string, url: string, meta?: AudioMeta) => {
    try {
      set({ isLoading: true });
      if (!audioEl) {
        audioEl = new Audio(url);
      } else {
        if (audioEl.src !== url) {
          audioEl.src = url;
        }
      }
      // attach listeners once
      audioEl.onloadedmetadata = () => {
        set({ duration: audioEl?.duration || 0, isLoading: false });
      };
      audioEl.ontimeupdate = () => {
        set({ currentTime: audioEl?.currentTime || 0 });
      };
      audioEl.onended = () => {
        set({ isPlaying: false, currentId: null, currentUrl: null, currentVersionLabel: null });
      };
      audioEl.onplaying = () => set({ isPlaying: true, isLoading: false });
      audioEl.onwaiting = () => set({ isLoading: true });
      audioEl.onerror = () => set({ isLoading: false });

      audioEl.currentTime = 0;
      audioEl.volume = get().volume;
      void audioEl.play();
      set({ 
        currentId: id, 
        currentUrl: url, 
        isPlaying: true,
        currentTitle: meta?.title || null,
        currentVersionLabel: meta?.versionLabel || null
      });
    } catch (e) {
      console.error('[AudioPlayer] play error', e);
    }
  },
  pause: () => {
    try {
      if (audioEl) {
        audioEl.pause();
      }
      set({ isPlaying: false });
    } catch (e) {
      console.error('[AudioPlayer] pause error', e);
    }
  },
  stop: () => {
    try {
      if (audioEl) {
        audioEl.pause();
        audioEl.currentTime = 0;
      }
      set({ isPlaying: false, currentId: null, currentUrl: null, currentTime: 0, currentTitle: null, currentVersionLabel: null });
    } catch (e) {
      console.error('[AudioPlayer] stop error', e);
    }
  },
  seek: (time: number) => {
    try {
      if (audioEl && !Number.isNaN(time)) {
        audioEl.currentTime = Math.max(0, Math.min(time, audioEl.duration || time));
        set({ currentTime: audioEl.currentTime });
      }
    } catch (e) {
      console.error('[AudioPlayer] seek error', e);
    }
  },
  setVolume: (v: number) => {
    const vol = Math.max(0, Math.min(1, v));
    if (audioEl) audioEl.volume = vol;
    set({ volume: vol });
    try {
      if (typeof window !== 'undefined') localStorage.setItem('memora_volume', String(vol));
    } catch {}
  },
  getMediaElement: () => audioEl
}));
