'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, ClipSection, PexelsClip } from '@/lib/api';

// ─── Video card ───────────────────────────────────────────────────────────────

function ClipCard({ clip }: { clip: PexelsClip }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [hovered, setHovered] = useState(false);

  function togglePlay(e: React.MouseEvent) {
    e.preventDefault();
    const video = videoRef.current;
    if (!video) return;
    if (playing) {
      video.pause();
      setPlaying(false);
    } else {
      video.play().then(() => setPlaying(true)).catch(() => {});
    }
  }

  function handleEnded() {
    setPlaying(false);
  }

  return (
    <div
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        overflow: 'hidden',
        position: 'relative',
        transition: 'border-color 0.15s, transform 0.15s',
        transform: hovered ? 'translateY(-2px)' : 'none',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Video / Thumbnail */}
      <div style={{ position: 'relative', aspectRatio: '9/16', background: '#000', maxHeight: '240px' }}>
        {/* Thumbnail shown when not playing */}
        {!playing && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={clip.thumbnail}
            alt="Video thumbnail"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}

        {/* Actual video element */}
        <video
          ref={videoRef}
          src={clip.sdUrl}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: playing ? 'block' : 'none',
          }}
          onEnded={handleEnded}
          loop={false}
          muted
          playsInline
        />

        {/* Duration badge */}
        <span
          style={{
            position: 'absolute',
            bottom: '6px',
            right: '6px',
            background: 'rgba(0,0,0,0.75)',
            color: '#fff',
            fontSize: '0.68rem',
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: '4px',
          }}
        >
          {clip.duration}s
        </span>

        {/* Play/Pause overlay */}
        <button
          type="button"
          onClick={togglePlay}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            background: playing ? 'transparent' : 'rgba(0,0,0,0.25)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s',
          }}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {!playing && (
            <span
              style={{
                width: '40px',
                height: '40px',
                background: 'rgba(255,255,255,0.9)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
              }}
            >
              ▶
            </span>
          )}
        </button>
      </div>

      {/* Card footer */}
      <div style={{ padding: '0.6rem 0.75rem' }}>
        {/* Photographer attribution (required by Pexels license) */}
        <p
          style={{
            margin: '0 0 0.5rem',
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          📷 {clip.photographer}
        </p>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <a
            href={clip.sdUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1,
              padding: '4px 8px',
              background: 'var(--accent)',
              color: '#fff',
              borderRadius: '5px',
              fontSize: '0.7rem',
              fontWeight: 600,
              textDecoration: 'none',
              textAlign: 'center',
              transition: 'opacity 0.15s',
            }}
          >
            ↓ Download
          </a>
          <a
            href={clip.pexelsUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="View on Pexels"
            style={{
              padding: '4px 8px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '5px',
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              textDecoration: 'none',
              textAlign: 'center',
              transition: 'border-color 0.15s',
            }}
          >
            Pexels ↗
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Section row ──────────────────────────────────────────────────────────────

function SectionRow({ section }: { section: ClipSection }) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      {/* Section header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          marginBottom: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            padding: '2px 10px',
            background: 'rgba(99,102,241,0.12)',
            color: 'var(--accent)',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 700,
          }}
        >
          {section.sectionLabel}
        </span>
        <span
          style={{
            padding: '2px 8px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
          }}
        >
          🔍 "{section.keyword}"
        </span>
      </div>

      {/* Script text preview */}
      <p
        style={{
          margin: '0 0 0.75rem',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          lineHeight: 1.5,
          fontStyle: 'italic',
          paddingLeft: '0.75rem',
          borderLeft: '3px solid var(--border)',
        }}
      >
        "{section.sectionText.slice(0, 140)}{section.sectionText.length > 140 ? '…' : ''}"
      </p>

      {/* Clip grid */}
      {section.clips.length === 0 ? (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          No clips found for this section.
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {section.clips.map((clip) => (
            <ClipCard key={clip.id} clip={clip} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ClipsPage() {
  const params = useParams();
  const scriptId = params.id as string;

  const [sections, setSections] = useState<ClipSection[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [topic, setTopic] = useState('');

  useEffect(() => {
    async function init() {
      try {
        const [script, clips] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/scripts/${scriptId}`)
            .then((r) => r.json())
            .then((r) => r.data),
          api.clips.get(scriptId),
        ]);
        setTopic(script?.topic || '');
        setSections(clips);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [scriptId]);

  async function handleGenerate() {
    setGenerating(true);
    setError('');
    try {
      const result = await api.clips.generate(scriptId);
      setSections(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Clip generation failed');
    } finally {
      setGenerating(false);
    }
  }

  const totalClips = sections?.reduce((sum, s) => sum + s.clips.length, 0) ?? 0;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '2rem', color: 'var(--text-muted)' }}>
        <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
        Loading...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px' }}>
      {/* Breadcrumb */}
      <a
        href={`/scripts/${scriptId}`}
        style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none' }}
      >
        ← Back to script
      </a>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          margin: '0.75rem 0 0.5rem',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem' }}>B-Roll Clips</h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {topic}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? (
            <><span className="spinner" /> Finding clips...</>
          ) : sections ? (
            '↺ Regenerate Clips'
          ) : (
            '✦ Generate B-Roll Clips'
          )}
        </button>
      </div>

      {/* Info strip */}
      {sections && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '0.6rem 1rem',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: '7px',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            marginBottom: '1.75rem',
            flexWrap: 'wrap',
          }}
        >
          <span>🎬 {totalClips} clips across {sections.length} sections</span>
          <span>·</span>
          <span>Portrait (9:16) · Free for commercial use</span>
          <span>·</span>
          <a
            href="https://www.pexels.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent)', textDecoration: 'none' }}
          >
            Powered by Pexels ↗
          </a>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            padding: '0.75rem 1rem',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '6px',
            color: 'var(--danger)',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Empty state */}
      {!sections && !generating && !error && (
        <div
          className="card"
          style={{ textAlign: 'center', padding: '3.5rem 2rem', marginTop: '1rem' }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎬</div>
          <p style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 0.4rem' }}>
            No clips generated yet
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0 0 1.5rem' }}>
            AI will pick the best Pexels search keywords per script section and find matching portrait video clips.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGenerate}
          >
            ✦ Generate B-Roll Clips
          </button>
        </div>
      )}

      {/* Generating state */}
      {generating && (
        <div
          className="card"
          style={{ textAlign: 'center', padding: '3rem 2rem', marginTop: '1rem' }}
        >
          <span
            className="spinner"
            style={{ width: '32px', height: '32px', borderWidth: '3px', marginBottom: '1rem' }}
          />
          <p style={{ margin: '0 0 0.25rem', fontWeight: 600 }}>Finding clips…</p>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Extracting keywords per section → searching Pexels for portrait B-roll
          </p>
        </div>
      )}

      {/* Section grid */}
      {sections && !generating && (
        <div>
          {sections.map((section) => (
            <SectionRow key={section.sectionIndex} section={section} />
          ))}

          {/* Pexels attribution footer */}
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: '7px',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              textAlign: 'center',
            }}
          >
            Videos provided by{' '}
            <a
              href="https://www.pexels.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent)' }}
            >
              Pexels
            </a>
            {' '}— free for commercial use, no attribution required (but appreciated)
          </div>
        </div>
      )}
    </div>
  );
}
