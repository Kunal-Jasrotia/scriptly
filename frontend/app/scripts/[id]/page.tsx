'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Script, ScriptClean } from '@/lib/api';
import ScriptEditor from '@/components/ScriptEditor';
import ChatRefinement from '@/components/ChatRefinement';

type Tab = 'view' | 'edit' | 'refine' | 'ssml' | 'versions';

function ScriptCleanView({ script }: { script: ScriptClean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div
        style={{
          padding: '1rem',
          background: 'rgba(99,102,241,0.08)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: '8px',
          borderLeft: '4px solid var(--accent)',
        }}
      >
        <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
          HOOK
        </p>
        <p style={{ margin: 0, fontWeight: 600, fontSize: '1rem', lineHeight: 1.5 }}>{script.hook}</p>
      </div>

      {script.body.map((section, i) => (
        <div
          key={i}
          style={{
            padding: '1rem',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
          }}
        >
          <p style={{ margin: '0 0 0.4rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {section.section}
          </p>
          <p style={{ margin: 0, lineHeight: 1.6 }}>{section.text}</p>
        </div>
      ))}

      <div
        style={{
          padding: '1rem',
          background: 'rgba(34,197,94,0.08)',
          border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: '8px',
          borderLeft: '4px solid var(--success)',
        }}
      >
        <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--success)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
          CALL TO ACTION
        </p>
        <p style={{ margin: 0, fontWeight: 600, fontSize: '1rem', lineHeight: 1.5 }}>{script.cta}</p>
      </div>
    </div>
  );
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select all in a textarea
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      style={{
        padding: '3px 10px',
        fontSize: '0.72rem',
        fontWeight: 600,
        background: copied ? 'rgba(34,197,94,0.12)' : 'var(--surface-2)',
        color: copied ? 'var(--success)' : 'var(--text-muted)',
        border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
        borderRadius: '5px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {copied ? '✓ Copied' : label}
    </button>
  );
}

// ─── YouTube Panel ────────────────────────────────────────────────────────────

function YouTubePanel({ title, description }: { title: string | null; description: string | null }) {
  if (!title && !description) return null;

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        overflow: 'hidden',
        marginBottom: '1.5rem',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.85rem 1.25rem',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(255,0,0,0.04)',
        }}
      >
        {/* YouTube logo */}
        <svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="22" height="16" rx="4" fill="#FF0000"/>
          <polygon points="9,4 16,8 9,12" fill="white"/>
        </svg>
        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>YouTube Content</span>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          AI-generated · ready to publish
        </span>
      </div>

      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Title */}
        {title && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Video Title
              </span>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <span style={{
                  fontSize: '0.7rem',
                  color: title.length > 60 ? 'var(--warning)' : 'var(--text-muted)',
                }}>
                  {title.length}/70 chars
                </span>
                <CopyButton text={title} label="Copy Title" />
              </div>
            </div>
            <div
              style={{
                padding: '0.85rem 1rem',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: '7px',
                fontSize: '1rem',
                fontWeight: 700,
                lineHeight: 1.4,
                color: 'var(--text)',
                letterSpacing: '-0.01em',
              }}
            >
              {title}
            </div>
          </div>
        )}

        {/* Description */}
        {description && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Video Description
              </span>
              <CopyButton text={description} label="Copy Description" />
            </div>
            <pre
              style={{
                margin: 0,
                padding: '0.85rem 1rem',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: '7px',
                fontSize: '0.83rem',
                lineHeight: 1.7,
                color: 'var(--text)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'inherit',
              }}
            >
              {description}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ScriptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const scriptId = params.id as string;

  const [script, setScript] = useState<Script | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('view');
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    api.scripts
      .get(scriptId)
      .then(setScript)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [scriptId]);

  async function handleApprove() {
    if (!script) return;
    setApproving(true);
    try {
      const updated = await api.scripts.approve(scriptId);
      setScript({ ...script, approved: updated.approved });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Approval failed');
    } finally {
      setApproving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '2rem' }}>
        <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px', borderTopColor: 'var(--accent)', border: '2px solid var(--border)', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} />
        Loading script...
      </div>
    );
  }

  if (error || !script) {
    return (
      <div className="card" style={{ color: 'var(--danger)' }}>
        {error || 'Script not found'}
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'view', label: 'Script' },
    { key: 'edit', label: 'Edit' },
    { key: 'refine', label: 'AI Refine' },
    { key: 'ssml', label: 'SSML' },
    { key: 'versions', label: `Versions (${script.versions?.length || 0})` },
  ];

  return (
    <div style={{ maxWidth: '900px' }}>
      {/* Breadcrumb */}
      <a href="/" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
        ← All Scripts
      </a>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          margin: '0.75rem 0 1.5rem',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: '1.4rem' }}>{script.topic}</h1>
            <span className={`badge ${script.approved ? 'badge-approved' : 'badge-pending'}`}>
              {script.approved ? 'Approved' : 'Draft'}
            </span>
          </div>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            {script.audience} · {script.tone} · {script.duration}s
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {!script.approved && (
            <button
              className="btn btn-success"
              onClick={handleApprove}
              disabled={approving}
            >
              {approving ? <><span className="spinner" /> Approving...</> : '✓ Approve Script'}
            </button>
          )}
          <Link href={`/scripts/${scriptId}/voice`} className="btn btn-secondary">
            Voice →
          </Link>
          <Link href={`/scripts/${scriptId}/subs`} className="btn btn-secondary">
            Subtitles →
          </Link>
          <Link href={`/scripts/${scriptId}/clips`} className="btn btn-secondary">
            🎬 Clips →
          </Link>
        </div>
      </div>

      {/* Research summary */}
      {script.research_summary && (
        <details style={{ marginBottom: '1.5rem' }}>
          <summary
            style={{
              cursor: 'pointer',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              padding: '0.5rem 0',
            }}
          >
            Research Summary
          </summary>
          <div
            className="card"
            style={{
              marginTop: '0.5rem',
              fontSize: '0.85rem',
              lineHeight: 1.7,
              color: 'var(--text-muted)',
            }}
          >
            {script.research_summary}
          </div>
        </details>
      )}

      {/* YouTube title & description */}
      <YouTubePanel title={script.yt_title ?? null} description={script.yt_description ?? null} />

      {/* Caption & hashtags */}
      {(script.caption || script.hashtags?.length > 0) && (
        <div className="card" style={{ marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          {script.caption && (
            <p style={{ margin: '0 0 0.5rem', fontStyle: 'italic' }}>{script.caption}</p>
          )}
          {script.hashtags?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {script.hashtags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: '2px 8px',
                    background: 'rgba(99,102,241,0.1)',
                    color: 'var(--accent)',
                    borderRadius: '4px',
                    fontSize: '0.78rem',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border)',
          marginBottom: '1.5rem',
          gap: '0',
          overflowX: 'auto',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            style={{
              background: 'none',
              border: 'none',
              padding: '0.6rem 1rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: activeTab === tab.key ? 600 : 400,
              color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: activeTab === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: '-1px',
              whiteSpace: 'nowrap',
              transition: 'color 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="card">
        {activeTab === 'view' && (
          <ScriptCleanView script={script.script_clean} />
        )}

        {activeTab === 'edit' && (
          <ScriptEditor
            scriptId={scriptId}
            initialScript={script.script_clean}
            onSaved={(updated: ScriptClean) => setScript({ ...script, script_clean: updated })}
          />
        )}

        {activeTab === 'refine' && (
          <div>
            <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Describe what you want improved and the AI will regenerate the script, archive the current version, and update the SSML voice direction.
            </p>
            <ChatRefinement
              scriptId={scriptId}
              onRefined={(updated) => {
                setScript(updated);
                setActiveTab('view');
              }}
            />
          </div>
        )}

        {activeTab === 'ssml' && (
          <div>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              SSML voice script sent to ElevenLabs. Uses prosody and break tags for cinematic pacing.
            </p>
            <pre
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '1rem',
                overflow: 'auto',
                fontSize: '0.8rem',
                lineHeight: 1.6,
                color: 'var(--text)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {script.ssml_voice_script}
            </pre>
          </div>
        )}

        {activeTab === 'versions' && (
          <div>
            {!script.versions || script.versions.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No previous versions. Versions are saved when you use AI Refine.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {script.versions.map((v) => (
                  <div key={v.id} className="card" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        Version {v.versionNumber}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(v.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hook:</p>
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>
                      {(v.script_clean as ScriptClean).hook}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
