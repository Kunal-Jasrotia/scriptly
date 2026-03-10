'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';

const TONES = [
  'motivational',
  'storytelling',
  'finance',
  'educational',
  'comedy',
  'inspirational',
  'news',
  'documentary',
  'sales',
  'personal development',
];

export default function ScriptForm() {
  const router = useRouter();

  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('');
  const [duration, setDuration] = useState(60);
  const [tone, setTone] = useState('motivational');
  const [contextSummary, setContextSummary] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [researchUrls, setResearchUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function addUrl() {
    const trimmed = urlInput.trim();
    if (trimmed && !researchUrls.includes(trimmed)) {
      try {
        new URL(trimmed); // validate URL format
        setResearchUrls([...researchUrls, trimmed]);
        setUrlInput('');
      } catch {
        setError('Invalid URL format');
      }
    }
  }

  function removeUrl(url: string) {
    setResearchUrls(researchUrls.filter((u) => u !== url));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!topic.trim() || !audience.trim()) {
      setError('Topic and audience are required');
      return;
    }

    setLoading(true);
    try {
      const script = await api.scripts.create({
        topic: topic.trim(),
        audience: audience.trim(),
        duration,
        tone,
        researchUrls,
        contextSummary: contextSummary.trim() || undefined,
      });
      router.push(`/scripts/${script.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const contextWordCount = contextSummary.trim()
    ? contextSummary.trim().split(/\s+/).length
    : 0;

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {error && (
        <div
          style={{
            padding: '0.75rem 1rem',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '6px',
            color: 'var(--danger)',
            fontSize: '0.875rem',
          }}
        >
          {error}
        </div>
      )}

      {/* ── Topic ── */}
      <div>
        <label className="label">Topic *</label>
        <input
          className="input"
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. The hidden reason why most people stay broke"
          required
        />
      </div>

      {/* ── Audience ── */}
      <div>
        <label className="label">Target Audience *</label>
        <input
          className="input"
          type="text"
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          placeholder="e.g. Young professionals aged 22-35 interested in personal finance"
          required
        />
      </div>

      {/* ── Duration ── */}
      <div>
        <label className="label">Duration: {duration} seconds</label>
        <input
          type="range"
          min={15}
          max={600}
          step={15}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--accent)' }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            marginTop: '0.25rem',
          }}
        >
          <span>15s</span>
          <span>~{Math.round((duration / 60) * 150)} words</span>
          <span>600s</span>
        </div>
      </div>

      {/* ── Tone ── */}
      <div>
        <label className="label">Tone</label>
        <select
          className="select"
          value={tone}
          onChange={(e) => setTone(e.target.value)}
        >
          {TONES.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* ── Context / Idea Summary ── */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: '0.35rem',
          }}
        >
          <label className="label" style={{ margin: 0 }}>
            Your Context / Idea Summary
            <span
              style={{
                marginLeft: '0.4rem',
                fontWeight: 400,
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
              }}
            >
              (optional)
            </span>
          </label>
          {contextWordCount > 0 && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {contextWordCount} words
            </span>
          )}
        </div>
        <textarea
          className="input"
          value={contextSummary}
          onChange={(e) => setContextSummary(e.target.value)}
          placeholder={
            'Paste your notes, research bullet points, article summary, or raw idea here.\n\n' +
            'Example:\n' +
            '• Iran\'s attacks target US allies — "whoever is a friend of America is our enemy"\n' +
            '• Saudi Arabia: MBS transforming Middle East into modern hub (Ronaldo, MrBeast, NEOM)\n' +
            '• UAE: Dubai airport handles 8,500 flights/week — airspace closures strand travellers\n' +
            '• Iran\'s strategy described as a global "blackmail" trap'
          }
          rows={8}
          style={{
            resize: 'vertical',
            fontFamily: 'inherit',
            lineHeight: 1.6,
            fontSize: '0.875rem',
          }}
        />
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem', lineHeight: 1.5 }}>
          The AI will use this as primary context when writing the script. Bullet points, article excerpts, and raw notes all work well.
          {researchUrls.length > 0 && (
            <span style={{ color: 'var(--accent)' }}>
              {' '}Your context will be combined with the scraped URL content below.
            </span>
          )}
        </p>
      </div>

      {/* ── Research URLs ── */}
      <div>
        <label className="label">
          Research URLs
          <span
            style={{
              marginLeft: '0.4rem',
              fontWeight: 400,
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
            }}
          >
            (optional — scraped automatically)
          </span>
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            className="input"
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/article"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrl())}
          />
          <button type="button" className="btn btn-secondary" onClick={addUrl}>
            Add
          </button>
        </div>
        {researchUrls.length > 0 && (
          <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {researchUrls.map((url) => (
              <div
                key={url}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.35rem 0.75rem',
                  background: 'var(--surface-2)',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                }}
              >
                <span
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: 'var(--accent)',
                  }}
                >
                  {url}
                </span>
                <button
                  type="button"
                  onClick={() => removeUrl(url)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '0 4px',
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
          URLs will be scraped and summarized. Use with or instead of the context box above.
        </p>
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        disabled={loading}
        style={{ alignSelf: 'flex-start', padding: '0.6rem 1.5rem' }}
      >
        {loading ? (
          <>
            <span className="spinner" />
            Generating script...
          </>
        ) : (
          'Generate Script'
        )}
      </button>
    </form>
  );
}
