'use client';

import { useState } from 'react';
import { api, ApiError, Script } from '@/lib/api';

interface Props {
  scriptId: string;
  onRefined: (script: Script) => void;
}

const QUICK_PROMPTS = [
  'Make the hook more shocking and curiosity-driven',
  'Shorten all sentences — make it more punchy',
  'Add more emotional storytelling to the body',
  'Make the CTA more urgent and specific',
  'Rewrite for a younger audience (Gen Z)',
  'Add a pattern interrupt in the middle',
];

export default function ChatRefinement({ scriptId, onRefined }: Props) {
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<{ role: 'user' | 'system'; text: string }[]>([]);

  async function handleRefine(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    setLoading(true);
    setError('');
    setHistory((h) => [...h, { role: 'user', text: trimmed }]);
    setFeedback('');

    try {
      const updated = await api.scripts.refine(scriptId, trimmed);
      setHistory((h) => [
        ...h,
        { role: 'system', text: 'Script refined and saved. Previous version archived.' },
      ]);
      onRefined(updated);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Refinement failed';
      setError(msg);
      setHistory((h) => [...h, { role: 'system', text: `Error: ${msg}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Message history */}
      {history.length > 0 && (
        <div
          style={{
            maxHeight: '200px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            padding: '0.75rem',
            background: 'var(--surface-2)',
            borderRadius: '6px',
            border: '1px solid var(--border)',
          }}
        >
          {history.map((msg, i) => (
            <div
              key={i}
              style={{
                fontSize: '0.8rem',
                padding: '0.4rem 0.6rem',
                borderRadius: '4px',
                background: msg.role === 'user' ? 'rgba(99,102,241,0.1)' : 'var(--surface)',
                borderLeft: `3px solid ${msg.role === 'user' ? 'var(--accent)' : 'var(--border)'}`,
                color: msg.role === 'system' ? 'var(--text-muted)' : 'var(--text)',
              }}
            >
              <span style={{ fontWeight: 600, marginRight: '0.4rem' }}>
                {msg.role === 'user' ? 'You:' : 'AI:'}
              </span>
              {msg.text}
            </div>
          ))}
        </div>
      )}

      {/* Quick prompts */}
      <div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
          Quick refinements:
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="btn btn-secondary"
              onClick={() => handleRefine(prompt)}
              disabled={loading}
              style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Custom feedback input */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <textarea
          className="textarea"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Describe exactly how you want the script improved..."
          rows={3}
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              handleRefine(feedback);
            }
          }}
        />
      </div>

      {error && (
        <p style={{ fontSize: '0.8rem', color: 'var(--danger)', margin: 0 }}>{error}</p>
      )}

      <button
        type="button"
        className="btn btn-primary"
        onClick={() => handleRefine(feedback)}
        disabled={loading || !feedback.trim()}
        style={{ alignSelf: 'flex-start' }}
      >
        {loading ? (
          <>
            <span className="spinner" />
            Refining...
          </>
        ) : (
          'Refine Script (Ctrl+Enter)'
        )}
      </button>
    </div>
  );
}
