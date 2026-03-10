import { api, ScriptListItem } from '@/lib/api';
import Link from 'next/link';

async function getScripts(): Promise<ScriptListItem[]> {
  try {
    return await api.scripts.list();
  } catch {
    return [];
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default async function HomePage() {
  const scripts = await getScripts();

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Scripts</h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {scripts.length} script{scripts.length !== 1 ? 's' : ''} generated
          </p>
        </div>
        <Link href="/scripts/new" className="btn btn-primary">
          + New Script
        </Link>
      </div>

      {scripts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No scripts yet</p>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            Generate your first high-retention short-form video script
          </p>
          <Link href="/scripts/new" className="btn btn-primary">
            Generate your first script
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {scripts.map((script) => (
            <Link
              key={script.id}
              href={`/scripts/${script.id}`}
              className="script-card-link"
            >
              {/* CSS hover handled via .script-card in globals.css — no JS events needed */}
              <div
                className="card script-card"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '1rem',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.25rem',
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                      {script.topic}
                    </h3>
                    <span
                      className={`badge ${script.approved ? 'badge-approved' : 'badge-pending'}`}
                    >
                      {script.approved ? 'Approved' : 'Draft'}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {script.audience} · {script.tone} · {formatDuration(script.duration)} ·{' '}
                    {script._count.versions} version{script._count.versions !== 1 ? 's' : ''}
                  </p>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {timeAgo(script.createdAt)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
