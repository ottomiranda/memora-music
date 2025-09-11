import React, { useEffect, useMemo, useRef } from 'react';

interface HighlightedTextareaProps {
  value: string;
  onChange: (next: string) => void;
  highlightQuery?: string;
  className?: string;
  rows?: number;
}

// Escape HTML entities to avoid injection
function escapeHtml(str: string) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildHighlightHtml(text: string, query: string | undefined) {
  const safe = escapeHtml(text || '');
  const q = (query || '').trim();
  if (!q) return safe;
  const parts = q
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!parts.length) return safe;
  const re = new RegExp(`(${parts.join('|')})`, 'gi');
  return safe.replace(re, '<mark class="bg-yellow-200 text-inherit rounded-sm">$1</mark>');
}

const HighlightedTextarea: React.FC<HighlightedTextareaProps> = ({
  value,
  onChange,
  highlightQuery,
  className = '',
  rows = 12,
}) => {
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const hiRef = useRef<HTMLDivElement | null>(null);

  const html = useMemo(() => buildHighlightHtml(value, highlightQuery), [value, highlightQuery]);

  useEffect(() => {
    const ta = taRef.current;
    const hi = hiRef.current;
    if (!ta || !hi) return;
    const sync = () => {
      hi.scrollTop = ta.scrollTop;
      hi.scrollLeft = ta.scrollLeft;
    };
    ta.addEventListener('scroll', sync);
    sync();
    return () => ta.removeEventListener('scroll', sync);
  }, [value, highlightQuery]);

  return (
    <div className={`relative ${className}`}>
      {/* Highlights layer */}
      <div
        ref={hiRef}
        className="absolute inset-0 overflow-auto pointer-events-none select-none whitespace-pre-wrap break-words rounded-md border p-3 text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: html }}
        aria-hidden="true"
      />
      {/* Textarea layer */}
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="relative w-full rounded-md border p-3 text-sm leading-relaxed bg-transparent caret-blue-600"
        style={{ position: 'relative' }}
      />
    </div>
  );
};

export default HighlightedTextarea;

