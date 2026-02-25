import { useState, type KeyboardEvent, type DragEvent as ReactDragEvent } from 'react';
import { presets } from '../../data/modelProfiles';
import styles from './Header.module.css';

interface HeaderProps {
  onFetch: (modelName: string) => void;
  onParseJson: (json: string) => void;
  onAddPreset: (presetIndex: number) => void;
  onClearModels: () => void;
  loading: boolean;
  error: string | null;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  hasModels: boolean;
}

export function Header({
  onFetch, onParseJson, onAddPreset, onClearModels,
  loading, error, theme, onToggleTheme, hasModels,
}: HeaderProps) {
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

  const handlePresetDragStart = (e: ReactDragEvent, index: number) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ presetIndex: index }));
    e.dataTransfer.effectAllowed = 'copy';
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
          <span className={styles.presetsLabel}>Presets (drag or click)</span>
          {presets.map((p, i) => (
            <button
              key={p.name}
              className={styles.presetBtn}
              title={`${p.description} — Click to add, or drag onto canvas`}
              onClick={() => onAddPreset(i)}
              draggable
              onDragStart={e => handlePresetDragStart(e, i)}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className={styles.spacer} />

        {error && <span className={styles.error} title={error}>{error}</span>}

        {hasModels && (
          <button
            className={styles.btnSecondary}
            onClick={onClearModels}
            title="Remove all loaded models"
          >
            Clear All
          </button>
        )}

        <button
          className={styles.themeBtn}
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '\u263E' : '\u2600'}
        </button>
      </header>

      {showPaste && (
        <div className={styles.pastePanel}>
          <textarea
            className={styles.pasteTextarea}
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
