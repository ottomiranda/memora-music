import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAudioPlayerStore } from '@/store/audioPlayerStore';
// Lyrica: robust LRC parser with karaoke (per-word) support
import Lyrica from 'lyrica';

type LrcLine = {
  t: number; // start time in seconds
  text: string;
};

// Optional word-level timing support
export type WordTiming = { t: number; d?: number; text: string };
export type WordTimingLine = { t: number; words: WordTiming[]; text?: string };

function parseLRC(raw: string): LrcLine[] | null {
  const lines = raw.split(/\r?\n/);
  const result: LrcLine[] = [];
  const timeRe = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.*)$/;
  for (const line of lines) {
    const m = line.match(timeRe);
    if (m) {
      const min = parseInt(m[1], 10);
      const sec = parseInt(m[2], 10);
      const ms = m[3] ? parseInt(m[3].padEnd(3, '0'), 10) : 0;
      const t = min * 60 + sec + ms / 1000;
      const text = m[4] || '';
      result.push({ t, text });
    }
  }
  return result.length > 0 ? result.sort((a, b) => a.t - b.t) : null;
}

// Parse LRC [offset:+/-ms] tag (applies to all timestamps)
function parseLrcOffset(raw: string): number { // seconds
  const m = raw.match(/\[offset\s*:\s*([+-]?\d+)\s*\]/i);
  if (!m) return 0;
  const ms = parseInt(m[1], 10);
  if (Number.isFinite(ms)) return ms / 1000;
  return 0;
}

function distributeByLength(raw: string, totalDuration: number): LrcLine[] {
  const rawLines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (rawLines.length === 0) return [{ t: 0, text: '' }];

  const lengths = rawLines.map((l) => Math.max(1, l.split(/\s+/).length));
  const totalUnits = lengths.reduce((a, b) => a + b, 0);
  const perUnit = totalDuration / Math.max(1, totalUnits);

  const out: LrcLine[] = [];
  let acc = 0;
  for (let i = 0; i < rawLines.length; i++) {
    out.push({ t: acc, text: rawLines[i] });
    acc += lengths[i] * perUnit;
  }
  return out;
}

interface KaraokeLyricsProps {
  lyrics: string;
  className?: string;
  // If provided, enables word-level highlighting
  wordTimings?: WordTimingLine[];
}

const KaraokeLyrics: React.FC<KaraokeLyricsProps> = ({ lyrics, className = '', wordTimings }) => {
  const { currentTime, duration, getMediaElement } = useAudioPlayerStore();

  // If no explicit wordTimings passed, attempt to parse with Lyrica (advanced LRC)
  const [parsedWordTimings, setParsedWordTimings] = useState<WordTimingLine[] | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!lyrics) { setParsedWordTimings(undefined); return; }
        // Try extract mode with karaoke enabled; pass raw text
        const inst: any = new (Lyrica as any)(lyrics, {
          type: 'extract',
          isRaw: true,
          isKaraoke: true,
          actKaraoke: true,
          offset: 0,
        });
        // Some builds may expose data immediately after init; try common fields
        const data: any[] = inst?.lyrics || inst?.data || inst?.result || [];
        if (Array.isArray(data) && data.length > 0) {
          const mapped: WordTimingLine[] = data.map((ln: any) => {
            const lineStart = Number(ln.t ?? ln.time ?? ln.start ?? 0);
            // Words can be in ln.words or ln.karaoke (each with t,d,text)
            const wordsSrc: any[] = Array.isArray(ln.words) ? ln.words : (Array.isArray(ln.karaoke) ? ln.karaoke : []);
            const words: WordTiming[] = wordsSrc.map((w: any) => ({
              t: Number(w.t ?? w.time ?? w.start ?? 0),
              d: w.d ?? w.duration,
              text: String(w.text ?? w.word ?? ''),
            }));
            const text = typeof ln.text === 'string' ? ln.text : (words.length ? words.map(w => w.text).join(' ') : '');
            return { t: lineStart, words, text };
          });
          if (!cancelled) setParsedWordTimings(mapped);
        } else {
          if (!cancelled) setParsedWordTimings(undefined);
        }
      } catch (e) {
        // Fallback to previous behavior if parsing fails
        if (!cancelled) setParsedWordTimings(undefined);
      }
    })();
    return () => { cancelled = true; };
  }, [lyrics]);

  // Build timeline: prefer LRC; fallback to heuristic distribution by words
  const timeline = useMemo<LrcLine[]>(() => {
    if (!lyrics) return [{ t: 0, text: '' }];
    // Prefer external wordTimings, else parsedWordTimings (Lyrica), else fallback parsers
    const wl = wordTimings && wordTimings.length > 0 ? wordTimings : parsedWordTimings;
    if (wl && wl.length > 0) {
      return wl
        .map((l) => ({ t: l.t, text: l.text ?? l.words.map((w) => w.text).join(' ') }))
        .sort((a, b) => a.t - b.t);
    }
    const lrc = parseLRC(lyrics);
    if (lrc) return lrc;
    const total = Number.isFinite(duration) && duration > 0 ? duration : 180; // default 3:00
    return distributeByLength(lyrics, total);
  }, [lyrics, duration, wordTimings, parsedWordTimings]);

  // Determine active line and next line time
  const lrcOffset = useMemo(() => parseLrcOffset(lyrics || ''), [lyrics]);

  // Voice onset detection (basic VAD) to anchor start of singing when we don't have precise timings
  const [detectedVocalStart, setDetectedVocalStart] = useState<number>(0);
  const vadRef = useRef<{ raf?: number; ctx?: AudioContext; src?: MediaElementAudioSourceNode; analyser?: AnalyserNode; hp?: BiquadFilterNode; lp?: BiquadFilterNode; lastSrc?: string } | null>(null);

  useEffect(() => {
    const el = getMediaElement?.();
    if (!el) return;

    // Recreate graph if src changed
    const setup = async () => {
      try {
        const state = vadRef.current || (vadRef.current = {} as any);
        const srcUrl = el.currentSrc || el.src;
        if (state.lastSrc === srcUrl && state.ctx) return; // already setup for this src
        // Clean previous
        if (state.raf) cancelAnimationFrame(state.raf);
        try { state.ctx?.close(); } catch {}
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const src = ctx.createMediaElementSource(el);
        // Band-pass approx 200Hz-4kHz to focus on vocals
        const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 180;
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4000;
        const analyser = ctx.createAnalyser(); analyser.fftSize = 1024; analyser.smoothingTimeConstant = 0.85;
        src.connect(hp); hp.connect(lp); lp.connect(analyser); analyser.connect(ctx.destination);
        state.ctx = ctx; state.src = src; state.analyser = analyser; state.hp = hp; state.lp = lp; state.lastSrc = srcUrl;

        const buf = new Uint8Array(analyser.frequencyBinCount);
        let baseline = 0; let frames = 0; let sustained = 0; let detected = false;
        const startTime = () => el.currentTime;
        const tick = () => {
          state.raf = requestAnimationFrame(tick);
          // Only sample when playing
          if (el.paused) return;
          analyser.getByteFrequencyData(buf);
          // Compute energy in mid band bins
          let energy = 0; let count = 0;
          for (let i = 5; i < buf.length * 0.65; i++) { energy += buf[i]; count++; }
          energy = count ? energy / count : 0;
          frames++;
          if (frames < 20) { baseline = baseline ? (baseline * 0.9 + energy * 0.1) : energy; return; }
          // Adaptive baseline
          baseline = baseline * 0.995 + energy * 0.005;
          const ratio = baseline > 1 ? energy / baseline : 0;
          if (!detected) {
            if (ratio > 1.8) sustained++; else sustained = Math.max(0, sustained - 1);
            if (sustained > 6) { // ~6 frames over threshold
              detected = true;
              setDetectedVocalStart(startTime());
            }
          }
        };
        state.raf = requestAnimationFrame(tick);
      } catch {}
    };

    setup();
    return () => {
      const state = vadRef.current; if (!state) return;
      if (state.raf) cancelAnimationFrame(state.raf);
    };
  }, [getMediaElement]);

  const useDetectedOffset = useMemo(() => {
    // Use detected onset only when we don't have precise timings (neither wordTimings nor LRC)
    const hasPrecise = (parsedWordTimings && parsedWordTimings.length > 0) || (!!parseLRC(lyrics || ''));
    return !hasPrecise && detectedVocalStart > 0.05;
  }, [parsedWordTimings, lyrics, detectedVocalStart]);

  const effectiveTime = useMemo(() => {
    const t = currentTime + lrcOffset - (useDetectedOffset ? detectedVocalStart : 0);
    return Math.max(0, t);
  }, [currentTime, lrcOffset, useDetectedOffset, detectedVocalStart]);

  const { activeIndex, nextTime, lineProgress } = useMemo(() => {
    if (!timeline || timeline.length === 0) return { activeIndex: 0, nextTime: 0, lineProgress: 0 };

    // Find current line by time
    let idx = 0;
    for (let i = 0; i < timeline.length; i++) {
      const start = timeline[i].t;
      const end = i < timeline.length - 1 ? timeline[i + 1].t : (duration || start + 3);
      if (effectiveTime >= start && effectiveTime < end) {
        idx = i;
        break;
      }
      if (effectiveTime >= end) idx = i; // last line when time beyond
    }
    const start = timeline[idx]?.t || 0;
    const end = idx < timeline.length - 1 ? timeline[idx + 1].t : (duration || start + 3);
    const len = Math.max(0.3, end - start);
    const prog = Math.min(1, Math.max(0, (effectiveTime - start) / len));
    return { activeIndex: idx, nextTime: end, lineProgress: prog };
  }, [timeline, effectiveTime, duration]);

  // Auto-scroll to active line
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const el = lineRefs.current[activeIndex];
    const container = containerRef.current;
    if (el && container) {
      const elTop = el.offsetTop - container.offsetTop;
      const elHeight = el.clientHeight;
      const containerHeight = container.clientHeight;
      const targetScroll = Math.max(0, elTop - containerHeight / 2 + elHeight / 2);
      container.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }
  }, [activeIndex]);

  // Resolve word-level highlight info for the active line
  const activeWordInfo = useMemo(() => {
    const wl = (wordTimings && wordTimings.length > 0 ? wordTimings : parsedWordTimings) || [];
    if (wl.length === 0 || !timeline || timeline.length === 0) return null;
    const line = wl.find((l) => Math.abs(l.t - (timeline[activeIndex]?.t || 0)) < 0.05);
    if (!line) return null;
    const words = line.words || [];
    // Determine active word based on cumulative timings
    let idx = -1;
    for (let i = 0; i < words.length; i++) {
      const start = line.t + (words[i].t || 0);
      const end = start + (words[i].d || 0.2);
      if (effectiveTime >= start && effectiveTime < end) { idx = i; break; }
      if (effectiveTime >= end) idx = i; // last word when passed
    }
    return { line, activeWordIndex: Math.max(0, idx) };
  }, [wordTimings, parsedWordTimings, timeline, activeIndex, effectiveTime]);

  return (
    <div className={`rounded-lg bg-white/5 border border-white/10 p-4 max-h-80 overflow-y-auto ${className}`} ref={containerRef}>
      {timeline.map((line, i) => {
        const isActive = i === activeIndex;
        const text = line.text || '\u00A0';
        const renderText = () => {
          if (isActive && activeWordInfo && Math.abs(activeWordInfo.line.t - line.t) < 0.05) {
            // Render words with per-word highlighting
            const words = activeWordInfo.line.words;
            return (
              <span className="relative inline-block text-white/90">
                {words.map((w, idx) => {
                  const start = activeWordInfo!.line.t + (w.t || 0);
                  const end = start + (w.d || 0.2);
                  const done = currentTime >= end;
                  const active = currentTime >= start && currentTime < end;
                  return (
                    <span key={`${start}-${idx}`}>
                      <span
                        className={`transition-colors ${done ? 'text-white' : active ? 'text-white/90' : 'text-white/50'}`}
                        style={{ transitionDuration: '120ms' }}
                      >
                        {w.text}
                      </span>
                      {idx < words.length - 1 ? ' ' : ''}
                    </span>
                  );
                })}
              </span>
            );
          }
          // Default line-level gradient fill
          return (
            <span
              className="relative inline-block text-white/90"
              style={{
                backgroundImage: isActive
                  ? `linear-gradient(90deg, rgba(255,255,255,0.95) ${Math.round(lineProgress * 100)}%, rgba(255,255,255,0.25) ${Math.round(lineProgress * 100)}%)`
                  : 'none',
                WebkitBackgroundClip: isActive ? 'text' as any : 'initial',
                backgroundClip: isActive ? 'text' : ('initial' as any),
                color: isActive ? 'transparent' : undefined,
                transition: 'background 120ms linear',
              }}
            >
              {text}
            </span>
          );
        };
        return (
          <div
            key={`${line.t}-${i}`}
            ref={(el) => (lineRefs.current[i] = el)}
            className={`my-1 px-2 py-1 rounded transition-colors ${
              isActive ? 'bg-blue-600/10' : 'bg-transparent'
            }`}
          >
            {renderText()}
          </div>
        );
      })}
    </div>
  );
};

export default KaraokeLyrics;
