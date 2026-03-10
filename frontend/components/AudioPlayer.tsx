'use client';

import { useRef, useState, useEffect } from 'react';

interface Props {
  src: string;
  scriptId: string;
}

export default function AudioPlayer({ src, scriptId }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  // Construct full URL for audio file
  const audioSrc = src.startsWith('http') ? src : `${API_URL}${src}`;

  // Attach persistent event listeners once
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration);
    const onEnded = () => setPlaying(false);
    const onError = () => setError('Failed to load audio file');

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, []);

  // When src changes (e.g. audio regenerated), reset state and force reload
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setError('');
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    audio.pause();
    audio.load(); // forces browser to re-fetch the new URL
  }, [audioSrc]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play().catch(() => setError('Playback failed'));
    }
    setPlaying(!playing);
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Number(e.target.value);
  }

  function formatTime(seconds: number): string {
    if (!isFinite(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  return (
    <div
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '1.25rem',
      }}
    >
      <audio ref={audioRef} src={audioSrc} preload="metadata" />

      {error ? (
        <p style={{ color: 'var(--danger)', fontSize: '0.875rem', margin: 0 }}>{error}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: '36px' }}>
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              style={{ flex: 1, accentColor: 'var(--accent)' }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: '36px', textAlign: 'right' }}>
              {formatTime(duration)}
            </span>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={togglePlay}
              style={{ minWidth: '90px' }}
            >
              {playing ? '⏸ Pause' : '▶ Play'}
            </button>

            <a
              href={audioSrc}
              download={`script-${scriptId}.mp3`}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem' }}
            >
              ↓ Download MP3
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
