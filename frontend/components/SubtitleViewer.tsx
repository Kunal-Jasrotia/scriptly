'use client';

import { useState } from 'react';

interface SrtBlock {
  index: number;
  start: string;
  end: string;
  text: string;
}

interface Props {
  srt: string;
  rawJson?: object;
}

function parseSRT(srt: string): SrtBlock[] {
  const blocks = srt.trim().split(/\n\n+/);
  return blocks
    .map((block) => {
      const lines = block.trim().split('\n');
      if (lines.length < 3) return null;

      const index = parseInt(lines[0], 10);
      const timecode = lines[1];
      const text = lines.slice(2).join(' ');

      const timeParts = timecode.split(' --> ');
      if (timeParts.length !== 2) return null;

      return {
        index,
        start: timeParts[0].trim(),
        end: timeParts[1].trim(),
        text,
      };
    })
    .filter((b): b is SrtBlock => b !== null);
}

export default function SubtitleViewer({ srt, rawJson }: Props) {
  const [showRaw, setShowRaw] = useState(false);
  const [copiedSrt, setCopiedSrt] = useState(false);

  const blocks = parseSRT(srt);

  function copySRT() {
    navigator.clipboard.writeText(srt).then(() => {
      setCopiedSrt(true);
      setTimeout(() => setCopiedSrt(false), 2000);
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-secondary" onClick={copySRT} style={{ fontSize: '0.8rem' }}>
          {copiedSrt ? 'Copied!' : '📋 Copy SRT'}
        </button>
        <a
          href={`data:text/plain;charset=utf-8,${encodeURIComponent(srt)}`}
          download="subtitles.srt"
          className="btn btn-secondary"
          style={{ fontSize: '0.8rem' }}
        >
          ↓ Download .srt
        </a>
        {rawJson && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowRaw(!showRaw)}
            style={{ fontSize: '0.8rem' }}
          >
            {showRaw ? 'Hide' : 'Show'} Raw JSON
          </button>
        )}
      </div>

      {/* Subtitle blocks */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          maxHeight: '400px',
          overflowY: 'auto',
        }}
      >
        {blocks.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No subtitle blocks found.</p>
        ) : (
          blocks.map((block) => (
            <div
              key={block.index}
              style={{
                display: 'grid',
                gridTemplateColumns: '32px 160px 1fr',
                gap: '0.75rem',
                alignItems: 'start',
                padding: '0.6rem 0.75rem',
                background: 'var(--surface-2)',
                borderRadius: '6px',
                fontSize: '0.85rem',
              }}
            >
              <span style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                {block.index}
              </span>
              <span
                style={{
                  color: 'var(--accent)',
                  fontFamily: 'monospace',
                  fontSize: '0.78rem',
                  whiteSpace: 'nowrap',
                }}
              >
                {block.start.split(',')[0]} → {block.end.split(',')[0]}
              </span>
              <span>{block.text}</span>
            </div>
          ))
        )}
      </div>

      {/* Raw JSON */}
      {showRaw && rawJson && (
        <details open>
          <summary
            style={{
              cursor: 'pointer',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              marginBottom: '0.5rem',
            }}
          >
            Raw Deepgram JSON
          </summary>
          <pre
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '1rem',
              overflow: 'auto',
              maxHeight: '300px',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
            }}
          >
            {JSON.stringify(rawJson, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
