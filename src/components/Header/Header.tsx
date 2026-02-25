import { useState, type KeyboardEvent } from 'react';
import { presets } from '../../data/modelProfiles';
import styles from './Header.module.css';

interface HeaderProps {
  onFetch: (modelName: string) => void;
  onParseJson: (json: string) => void;
  onPreset: (config: Record<string, unknown>, name: string) => void;
  loading: boolean;
  error: string | null;
}

export function Header({ onFetch, onParseJson, onPreset, loading, error }: HeaderProps) {
  const [modelName, setModelName] = useState('');
  const [showPaste, setShowPaste] = useState(false);
  const [jsonInput, setJsonInput] = useState('');

  const handleFetch = () => {
    if (modelName.trim()) onFetch(modelName.trim());
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') handleFetch();
  };

  const handlePasteSubmit = () => {
    if (jsonInput.trim()) {
      onParseJson(jsonInput.trim());
      setShowPaste(false);
      setJsonInput('');
    }
  };

  return (
    <>
      <header className={styles.header}>
        <span className={styles.logo}>
          <span className={styles.logoAccent}>LLM</span> Architecture Visualizer
        </span>

        <div className={styles.divider} />

        <div className={styles.fetchGroup}>
          <input
            className={styles.input}
            placeholder="HuggingFace model name (e.g. meta-llama/Llama-3.1-8B)"
            value={modelName}
            onChange={e => setModelName(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className={styles.btnPrimary} onClick={handleFetch} disabled={loading || !modelName.trim()}>
            {loading ? 'Loading...' : 'Load'}
          </button>
          <button className={styles.btnSecondary} onClick={() => setShowPaste(!showPaste)}>
            Paste JSON
          </button>
        </div>

        <div className={styles.divider} />

        <div className={styles.presets}>
          <span className={styles.presetsLabel}>Presets</span>
          {presets.map(p => (
            <button
              key={p.name}
              className={styles.presetBtn}
              title={p.description}
              onClick={() => onPreset(p.config, p.name)}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className={styles.spacer} />
        {error && <span className={styles.error} title={error}>{error}</span>}
      </header>

      {showPaste && (
        <div style={{
          position: 'absolute', top: 48, left: 0, right: 0, zIndex: 100,
          background: 'white', borderBottom: '1px solid #e0e0e0',
          padding: '12px 16px', display: 'flex', gap: 8, alignItems: 'flex-start',
        }}>
          <textarea
            style={{
              flex: 1, height: 120, fontFamily: 'monospace', fontSize: 11,
              padding: 8, border: '1px solid #ddd', borderRadius: 4, resize: 'vertical',
            }}
            placeholder='Paste config.json contents here...'
            value={jsonInput}
            onChange={e => setJsonInput(e.target.value)}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button className={styles.btnPrimary} onClick={handlePasteSubmit}>
              Visualize
            </button>
            <button className={styles.btnSecondary} onClick={() => { setShowPaste(false); setJsonInput(''); }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
