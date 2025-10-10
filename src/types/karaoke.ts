export interface LyricWord {
  text: string;
  start: number;
  end: number;
  duration?: number;
  confidence?: number;
}

export interface LyricLine {
  text: string;
  start: number;
  end: number;
  words: LyricWord[];
  karaoke?: LyricWord[];
  translation?: string;
}

export interface LyricData {
  lyrics: LyricLine[];
  metadata?: {
    title?: string;
    artist?: string;
    language?: string;
    duration?: number;
  };
}

export interface LyricaOptions {
  language?: string;
  enableTranslation?: boolean;
  enableKaraoke?: boolean;
  confidence?: number;
  minWordDuration?: number;
  maxWordDuration?: number;
}

export interface LyricaInstance {
  lyrics: LyricLine[];
  data?: LyricData;
  result?: LyricLine[];
  options: LyricaOptions;
  parse: (text: string) => void;
  align: (audio: AudioBuffer) => Promise<void>;
  destroy: () => void;
}

export interface VADState {
  audioContext?: AudioContext;
  source?: AudioBufferSourceNode;
  analyzer?: AnalyserNode;
  buffer?: AudioBuffer;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

declare global {
  interface Window {
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
  }
}