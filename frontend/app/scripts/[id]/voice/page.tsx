'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, Script, VoiceProvider, VoiceOption, VoicesResponse } from '@/lib/api';
import AudioPlayer from '@/components/AudioPlayer';

// ─── Provider metadata ───────────────────────────────────────────────────────

const PROVIDER_INFO = {
  elevenlabs: {
    name: 'ElevenLabs',
    badge: 'SSML',
    badgeColor: '#6366f1',
    description:
      'Highly expressive, emotion-directed voices. Sends the full SSML voice script with prosody and pacing tags.',
    note: 'Uses: eleven_turbo_v2_5 · stability 0.35 · style 0.7 · speaker boost on',
    accentColor: '#6366f1',
    logo: '🎙',
  },
  deepgram: {
    name: 'Deepgram Aura',
    badge: 'FAST',
    badgeColor: '#22c55e',
    description:
      'Ultra-low latency neural TTS. Sends plain text — no SSML. Great for natural, conversational delivery.',
    note: 'Uses: Aura model · plain text (SSML tags auto-stripped)',
    accentColor: '#22c55e',
    logo: '⚡',
  },
} as const;

// ─── ProviderCard ─────────────────────────────────────────────────────────────

interface ProviderCardProps {
  provider: VoiceProvider;
  voices: VoiceOption[];
  selectedVoice: string;
  onVoiceChange: (v: string) => void;
  onGenerate: () => void;
  generating: boolean;
  disabled: boolean;
  isActive: boolean;        // currently selected provider
  onSelect: () => void;
  hasAudio: boolean;
  lastUsed: boolean;        // was this provider used for the existing audio?
}

function ProviderCard({
  provider,
  voices,
  selectedVoice,
  onVoiceChange,
  onGenerate,
  generating,
  disabled,
  isActive,
  onSelect,
  hasAudio,
  lastUsed,
}: ProviderCardProps) {
  const info = PROVIDER_INFO[provider];

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: `2px solid ${isActive ? info.accentColor : 'var(--border)'}`,
        borderRadius: '10px',
        padding: '1.25rem',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxShadow: isActive ? `0 0 0 1px ${info.accentColor}22` : 'none',
        flex: 1,
        minWidth: '280px',
      }}
      onClick={!disabled ? onSelect : undefined}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.6rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.2rem' }}>{info.logo}</span>
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{info.name}</span>
          <span
            style={{
              padding: '1px 6px',
              borderRadius: '4px',
              fontSize: '0.65rem',
              fontWeight: 700,
              background: `${info.badgeColor}22`,
              color: info.badgeColor,
              letterSpacing: '0.05em',
            }}
          >
            {info.badge}
          </span>
          {lastUsed && hasAudio && (
            <span
              style={{
                padding: '1px 6px',
                borderRadius: '4px',
                fontSize: '0.65rem',
                fontWeight: 600,
                background: 'rgba(34,197,94,0.12)',
                color: 'var(--success)',
              }}
            >
              last used
            </span>
          )}
        </div>

        {/* Radio indicator */}
        <div
          style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            border: `2px solid ${isActive ? info.accentColor : 'var(--border)'}`,
            background: isActive ? info.accentColor : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.15s',
          }}
        >
          {isActive && (
            <div
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#fff',
              }}
            />
          )}
        </div>
      </div>

      <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
        {info.description}
      </p>

      {/* Voice selector */}
      <div style={{ marginBottom: '1rem' }} onClick={(e) => e.stopPropagation()}>
        <label
          style={{
            display: 'block',
            fontSize: '0.72rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.35rem',
          }}
        >
          Voice
        </label>
        <select
          className="select"
          value={selectedVoice}
          onChange={(e) => {
            onSelect();
            onVoiceChange(e.target.value);
          }}
          disabled={disabled}
          style={{ fontSize: '0.85rem' }}
        >
          {voices.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
              {v.gender ? ` (${v.gender})` : ''} — {v.style}
            </option>
          ))}
        </select>
      </div>

      {/* Note */}
      <p style={{ margin: '0 0 1rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
        {info.note}
      </p>

      {/* Generate button */}
      <button
        type="button"
        className="btn btn-primary"
        style={{
          background: isActive ? info.accentColor : 'var(--surface-2)',
          color: isActive ? '#fff' : 'var(--text-muted)',
          border: `1px solid ${isActive ? info.accentColor : 'var(--border)'}`,
          width: '100%',
          justifyContent: 'center',
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
          onGenerate();
        }}
        disabled={disabled || generating}
      >
        {generating && isActive ? (
          <><span className="spinner" /> Generating...</>
        ) : hasAudio && lastUsed ? (
          `↺ Regenerate with ${info.name}`
        ) : (
          `▶ Generate with ${info.name}`
        )}
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function VoicePage() {
  const params = useParams();
  const scriptId = params.id as string;

  const [script, setScript] = useState<Script | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Voice options loaded from backend
  const [voices, setVoices] = useState<VoicesResponse>({ elevenlabs: [], deepgram: [] });

  // Provider selection state
  const [activeProvider, setActiveProvider] = useState<VoiceProvider>('elevenlabs');
  const [selectedVoice, setSelectedVoice] = useState<Record<VoiceProvider, string>>({
    elevenlabs: '21m00Tcm4TlvDq8ikWAM',  // Rachel default
    deepgram: 'aura-2-asteria-en',          // Asteria default
  });

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [lastUsedProvider, setLastUsedProvider] = useState<VoiceProvider | null>(null);

  // Transcription state
  const [transcribing, setTranscribing] = useState(false);
  const [transcribeDone, setTranscribeDone] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const [s, v] = await Promise.all([
          api.scripts.get(scriptId),
          api.voice.listVoices(),
        ]);

        setScript(s);
        setVoices(v);

        if (s.audio?.filePath) {
          // Append timestamp to bypass browser cache for pre-existing audio
          setAudioUrl(`/storage/audio/${scriptId}.mp3?t=${Date.now()}`);
        }
        if (s.transcription) {
          setTranscribeDone(true);
        }

        // Set defaults to first voice in each list
        if (v.elevenlabs.length > 0) {
          setSelectedVoice((prev) => ({ ...prev, elevenlabs: v.elevenlabs[0].id }));
        }
        if (v.deepgram.length > 0) {
          setSelectedVoice((prev) => ({ ...prev, deepgram: v.deepgram[0].id }));
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [scriptId]);

  async function handleGenerateVoice() {
    setGenerating(true);
    setError('');
    try {
      const result = await api.voice.generate(
        scriptId,
        activeProvider,
        selectedVoice[activeProvider]
      );
      // Append timestamp to force browser to reload the new audio file
      // (browser caches by URL — same path would play the old file)
      setAudioUrl(`${result.audioUrl}?t=${Date.now()}`);
      setLastUsedProvider(result.provider);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Voice generation failed');
    } finally {
      setGenerating(false);
    }
  }

  async function handleTranscribe() {
    setTranscribing(true);
    setError('');
    try {
      await api.transcription.transcribe(scriptId);
      setTranscribeDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Transcription failed');
    } finally {
      setTranscribing(false);
    }
  }

  if (loading) {
    return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading...</div>;
  }

  if (!script) {
    return (
      <div className="card" style={{ color: 'var(--danger)' }}>
        {error || 'Script not found'}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '860px' }}>
      <a
        href={`/scripts/${scriptId}`}
        style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none' }}
      >
        ← Back to script
      </a>

      <div style={{ margin: '0.75rem 0 2rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem' }}>Voice Generation</h1>
        <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          {script.topic}
        </p>
      </div>

      {/* Approval gate */}
      {!script.approved && (
        <div
          style={{
            padding: '1rem',
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
          }}
        >
          <strong style={{ color: 'var(--warning)' }}>Script not approved.</strong>{' '}
          You must approve the script before generating voice.{' '}
          <Link href={`/scripts/${scriptId}`} style={{ color: 'var(--accent)' }}>
            Go approve it →
          </Link>
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

      {/* Provider selector heading */}
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ margin: '0 0 0.25rem', fontSize: '1rem' }}>Choose Voice Provider</h2>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Select a provider, pick a voice, then generate. You can switch providers and regenerate at any time.
        </p>
      </div>

      {/* Dual provider cards */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        {(['elevenlabs', 'deepgram'] as VoiceProvider[]).map((provider) => (
          <ProviderCard
            key={provider}
            provider={provider}
            voices={voices[provider]}
            selectedVoice={selectedVoice[provider]}
            onVoiceChange={(v) =>
              setSelectedVoice((prev) => ({ ...prev, [provider]: v }))
            }
            onGenerate={handleGenerateVoice}
            generating={generating}
            disabled={!script.approved}
            isActive={activeProvider === provider}
            onSelect={() => setActiveProvider(provider)}
            hasAudio={!!audioUrl}
            lastUsed={lastUsedProvider === provider}
          />
        ))}
      </div>

      {/* Audio player — shown after generation */}
      {audioUrl && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: '1rem' }}>Generated Audio</h2>
              {lastUsedProvider && (
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Generated with{' '}
                  <span style={{ color: PROVIDER_INFO[lastUsedProvider].accentColor, fontWeight: 600 }}>
                    {PROVIDER_INFO[lastUsedProvider].name}
                  </span>
                  {' · '}
                  {selectedVoice[lastUsedProvider] &&
                    voices[lastUsedProvider].find((v) => v.id === selectedVoice[lastUsedProvider])?.label}
                </p>
              )}
            </div>
          </div>
          <AudioPlayer src={audioUrl} scriptId={scriptId} />
        </div>
      )}

      {/* Deepgram transcription (only once audio exists) */}
      {audioUrl && (
        <div className="card">
          <h2 style={{ margin: '0 0 0.4rem', fontSize: '1rem' }}>Deepgram Transcription + SRT</h2>
          <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Transcribes your audio with nova-2 and generates an SRT subtitle file with word-level timestamps.
          </p>

          {transcribeDone ? (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--success)' }}>✓ Transcription complete</span>
              <Link href={`/scripts/${scriptId}/subs`} className="btn btn-secondary">
                View Subtitles →
              </Link>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleTranscribe}
                disabled={transcribing}
                style={{ fontSize: '0.8rem' }}
              >
                {transcribing ? <><span className="spinner" /> Transcribing...</> : '↺ Re-transcribe'}
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleTranscribe}
              disabled={transcribing}
            >
              {transcribing ? (
                <><span className="spinner" /> Transcribing with Deepgram...</>
              ) : (
                'Transcribe Audio'
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
