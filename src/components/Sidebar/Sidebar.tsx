import type { LoadedModel, GraphNode } from '../../core/types';
import { nodeColors } from '../../styles/theme';
import styles from './Sidebar.module.css';

const MODEL_COLORS = [
  '#4a90d9', '#e8913a', '#5cb85c', '#9b59b6',
  '#e74c3c', '#1abc9c', '#f39c12', '#3498db',
];

interface SidebarProps {
  models: LoadedModel[];
  selectedNodeId: string | null;
  onRemoveModel: (modelId: string) => void;
}

export function Sidebar({ models, selectedNodeId, onRemoveModel }: SidebarProps) {
  // Find the selected node across all models
  let selectedNode: GraphNode | null = null;
  let selectedModelName = '';
  if (selectedNodeId) {
    const colonIdx = selectedNodeId.indexOf(':');
    if (colonIdx !== -1) {
      const modelId = selectedNodeId.substring(0, colonIdx);
      const nodeId = selectedNodeId.substring(colonIdx + 1);
      const model = models.find(m => m.id === modelId);
      if (model) {
        selectedNode = model.graph.nodes.find(n => n.id === nodeId) ?? null;
        selectedModelName = model.metadata.name;
      }
    }
  }

  return (
    <aside className={styles.sidebar}>
      {models.length > 0 ? (
        models.map((model, i) => {
          const color = MODEL_COLORS[i % MODEL_COLORS.length];
          const meta = model.metadata;
          return (
            <div key={model.id} className={styles.section}>
              <div className={styles.modelHeader}>
                <div className={styles.sectionTitle}>
                  {models.length > 1 && (
                    <span className={styles.modelDot} style={{ background: color }} />
                  )}
                  Model
                </div>
                {models.length > 1 && (
                  <button
                    className={styles.removeBtn}
                    onClick={() => onRemoveModel(model.id)}
                    title="Remove this model"
                  >
                    x
                  </button>
                )}
              </div>
              <div className={styles.modelName}>{meta.name}</div>
              <div className={styles.modelType}>
                {meta.modelType}
                {' '}
                <span className={meta.isMoE ? styles.badgeMoE : styles.badgeDense}>
                  {meta.isMoE ? 'MoE' : 'Dense'}
                </span>
              </div>
              <div className={styles.archDetails}>
                <Row label="Est. parameters" value={meta.estimatedParams} />
                <Row label="Hidden size" value={fmt(meta.hiddenSize)} />
                <Row label="Layers" value={fmt(meta.numLayers)} />
                <Row label="Attention heads" value={fmt(meta.numHeads)} />
                <Row label="KV heads" value={fmt(meta.numKVHeads)} />
                <Row label="Intermediate size" value={fmt(meta.intermediateSize)} />
                <Row label="Vocab size" value={fmt(meta.vocabSize)} />
                <Row label="Max seq. length" value={fmt(meta.maxSeqLen)} />
                <Row label="Norm type" value={meta.normType} />
                <Row label="Activation" value={meta.activation} />
                {meta.isMoE && (
                  <>
                    <Row label="Num experts" value={fmt(meta.numExperts ?? 0)} />
                    <Row label="Experts/token" value={fmt(meta.numExpertsPerToken ?? 0)} />
                  </>
                )}
              </div>
            </div>
          );
        })
      ) : (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Model</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            Load a model to see details
          </div>
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Selected Node</div>
        {selectedNode ? (
          <>
            {models.length > 1 && selectedModelName && (
              <div className={styles.selectedModelLabel}>{selectedModelName}</div>
            )}
            <div className={styles.nodeHeader}>
              <div
                className={styles.nodeColorDot}
                style={{ background: nodeColors[selectedNode.type] || '#999' }}
              />
              <div>
                <div className={styles.nodeLabel}>{selectedNode.label}</div>
                <div className={styles.nodeType}>{selectedNode.type}</div>
              </div>
            </div>
            {selectedNode.sublabel && (
              <Row label="Dimensions" value={selectedNode.sublabel} />
            )}
            {Object.entries(selectedNode.details).map(([k, v]) => (
              <Row key={k} label={k} value={String(v)} />
            ))}
          </>
        ) : (
          <div className={styles.emptySelection}>Click a node to see details</div>
        )}
      </div>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowValue}>{value}</span>
    </div>
  );
}

function fmt(n: number): string {
  return n.toLocaleString();
}
