'use client';

import { useState } from 'react';
import { api, ApiError, ScriptClean } from '@/lib/api';

interface Props {
  scriptId: string;
  initialScript: ScriptClean;
  onSaved: (updated: ScriptClean) => void;
}

export default function ScriptEditor({ scriptId, initialScript, onSaved }: Props) {
  const [script, setScript] = useState<ScriptClean>(JSON.parse(JSON.stringify(initialScript)));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  function updateHook(value: string) {
    setScript((s) => ({ ...s, hook: value }));
  }

  function updateBody(index: number, field: 'section' | 'text', value: string) {
    setScript((s) => {
      const body = [...s.body];
      body[index] = { ...body[index], [field]: value };
      return { ...s, body };
    });
  }

  function addSection() {
    setScript((s) => ({
      ...s,
      body: [...s.body, { section: 'New Section', text: '' }],
    }));
  }

  function removeSection(index: number) {
    setScript((s) => {
      const body = s.body.filter((_, i) => i !== index);
      return { ...s, body };
    });
  }

  function updateCta(value: string) {
    setScript((s) => ({ ...s, cta: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await api.scripts.update(scriptId, { script_clean: script });
      onSaved(script);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {error && (
        <div
          style={{
            padding: '0.5rem 0.75rem',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '6px',
            color: 'var(--danger)',
            fontSize: '0.8rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Hook */}
      <div>
        <label className="label">Hook</label>
        <textarea
          className="textarea"
          value={script.hook}
          onChange={(e) => updateHook(e.target.value)}
          rows={3}
          style={{ fontWeight: 600 }}
        />
      </div>

      {/* Body sections */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.5rem',
          }}
        >
          <label className="label" style={{ marginBottom: 0 }}>Body Sections</label>
          {script.body.length < 10 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={addSection}
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
            >
              + Add section
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {script.body.map((section, i) => (
            <div
              key={i}
              className="card"
              style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
            >
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  className="input"
                  type="text"
                  value={section.section}
                  onChange={(e) => updateBody(i, 'section', e.target.value)}
                  placeholder="Section name"
                  style={{ flex: 1, fontWeight: 600, fontSize: '0.8rem' }}
                />
                {script.body.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeSection(i)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      padding: '0 4px',
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
              <textarea
                className="textarea"
                value={section.text}
                onChange={(e) => updateBody(i, 'text', e.target.value)}
                rows={3}
                placeholder="Section script text..."
              />
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div>
        <label className="label">Call to Action</label>
        <textarea
          className="textarea"
          value={script.cta}
          onChange={(e) => updateCta(e.target.value)}
          rows={2}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <><span className="spinner" /> Saving...</> : 'Save Changes'}
        </button>
        {saved && (
          <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Saved!</span>
        )}
      </div>
    </div>
  );
}
