import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Short Script Studio',
  description: 'Generate high-retention short-form video scripts with AI voice direction and Deepgram subtitles',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <header
            style={{
              background: 'var(--surface)',
              borderBottom: '1px solid var(--border)',
              padding: '0 2rem',
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'sticky',
              top: 0,
              zIndex: 100,
            }}
          >
            <a href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>Script Studio</span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    background: 'var(--accent)',
                    color: '#fff',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                  }}
                >
                  AI
                </span>
              </div>
            </a>
            <a href="/scripts/new" className="btn btn-primary" style={{ fontSize: '0.8rem' }}>
              + New Script
            </a>
          </header>

          <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
            {children}
          </main>

          <footer
            style={{
              textAlign: 'center',
              padding: '1rem',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              borderTop: '1px solid var(--border)',
            }}
          >
            AI Short Script Studio — Powered by OpenAI · ElevenLabs · Deepgram
          </footer>
        </div>
      </body>
    </html>
  );
}
