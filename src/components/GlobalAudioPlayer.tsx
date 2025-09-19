import React, { useMemo } from 'react';
import { useAudioPlayerStore } from '@/store/audioPlayerStore';
import { Play, Pause, Volume2, X } from 'lucide-react';

function formatTime(t: number) {
  if (!isFinite(t) || t < 0) return '0:00';
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const GlobalAudioPlayer: React.FC = () => {
  const { currentId, currentUrl, currentTitle, currentVersionLabel, isPlaying, currentTime, duration, seek, play, pause, stop, volume, setVolume } = useAudioPlayerStore();

  const visible = useMemo(() => !!currentId && !!currentUrl, [currentId, currentUrl]);

  if (!visible) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-3xl w-[92%] sm:w-[640px]">
      <div className="rounded-xl border p-3 backdrop-blur-md bg-white/90 border-gray-200 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          {isPlaying ? (
            <button
              onClick={pause}
              className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center active:scale-95 transition"
              aria-label="Pausar"
            >
              <Pause className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => currentId && currentUrl && play(currentId, currentUrl, { title: currentTitle || undefined, versionLabel: currentVersionLabel || undefined })}
              className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center active:scale-95 transition"
              aria-label="Reproduzir"
            >
              <Play className="w-5 h-5" />
            </button>
          )}

          {/* Title */}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900 truncate">
              {currentTitle || 'Reproduzindo áudio'} {currentVersionLabel ? <span className="text-gray-500">· Versão {currentVersionLabel}</span> : null}
            </div>
            {/* Progress */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-500 w-10 text-right">{formatTime(currentTime)}</span>
              <input
                type="range"
                min={0}
                max={Math.max(1, duration)}
                step={0.5}
                value={currentTime}
                onChange={(e) => seek(Number(e.target.value))}
                className="flex-1 accent-blue-600"
              />
              <span className="text-[11px] text-gray-500 w-10">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume */}
          <div className="hidden sm:flex items-center gap-2 w-28">
            <Volume2 className="w-4 h-4 text-gray-500" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>

          {/* Close */}
          <button onClick={stop} className="p-2 rounded-md hover:bg-gray-100" aria-label="Fechar player">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalAudioPlayer;
