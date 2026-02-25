import type { ModelMetadata, GraphNode } from '../../core/types';
import { nodeColors } from '../../styles/theme';
import styles from './Sidebar.module.css';

interface SidebarProps {
  metadata: ModelMetadata | null;
  selectedNode: GraphNode | null;
}

export function Sidebar({ metadata, selectedNode }: SidebarProps) {
  return (
    <aside className={styles.sidebar}>
      {metadata ? (
        <>
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Model</div>
            <div className={styles.modelName}>{metadata.name}</div>
            <div className={styles.modelType}>
              {metadata.modelType}
              {' '}
              <span className={metadata.isMoE ? styles.badgeMoE : styles.badgeDense}>
                {metadata.isMoE ? 'MoE' : 'Dense'}
              </span>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Architecture</div>
            <Row label="Est. parameters" value={metadata.estimatedParams} />
            <Row label="Hidden size" value={fmt(metadata.hiddenSize)} />
            <Row label="Layers" value={fmt(metadata.numLayers)} />
            <Row label="Attention heads" value={fmt(metadata.numHeads)} />
            <Row label="KV heads" value={fmt(metadata.numKVHeads)} />
            <Row label="Intermediate size" value={fmt(metadata.intermediateSize)} />
            <Row label="Vocab size" value={fmt(metadata.vocabSize)} />
            <Row label="Max seq. length" value={fmt(metadata.maxSeqLen)} />
            <Row label="Norm type" value={metadata.normType} />
            <Row label="Activation" value={metadata.activation} />
            {metadata.isMoE && (
              <>
                <Row label="Num experts" value={fmt(metadata.numExperts ?? 0)} />
                <Row label="Experts/token" value={fmt(metadata.numExpertsPerToken ?? 0)} />
              </>
            )}
          </div>
        </>
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
