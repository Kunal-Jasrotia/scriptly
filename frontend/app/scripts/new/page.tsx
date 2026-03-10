import ScriptForm from '@/components/ScriptForm';

export default function NewScriptPage() {
  return (
    <div style={{ maxWidth: '680px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <a
          href="/"
          style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none' }}
        >
          ← Back to scripts
        </a>
        <h1 style={{ margin: '0.5rem 0 0.25rem', fontSize: '1.5rem' }}>Generate New Script</h1>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          AI will research your topic and generate a high-retention short-form video script with emotional SSML voice direction.
        </p>
      </div>

      <div className="card">
        <ScriptForm />
      </div>
    </div>
  );
}
