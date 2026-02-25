import { useRef, useEffect, useCallback, useState, type DragEvent } from 'react';
import type { LoadedModel } from '../../core/types';
import { useCanvasTransform } from '../../hooks/useCanvasTransform';
import { GraphNodeComponent } from './GraphNode';
import { GraphEdgeComponent } from './GraphEdge';
import { GraphGroupComponent } from './GraphGroup';
import { exportSVG, exportPNG } from '../../utils/exportGraph';
import styles from './Canvas.module.css';

const MODEL_GAP = 100;
const LABEL_HEIGHT = 32;

const MODEL_COLORS = [
  '#4a90d9', '#e8913a', '#5cb85c', '#9b59b6',
  '#e74c3c', '#1abc9c', '#f39c12', '#3498db',
];

interface CanvasProps {
  models: LoadedModel[];
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  onAddPreset: (presetIndex: number) => void;
  onRemoveModel: (modelId: string) => void;
}

interface ModelLayout {
  model: LoadedModel;
  offsetX: number;
  color: string;
}

function computeLayout(models: LoadedModel[]): { layouts: ModelLayout[]; totalWidth: number; totalHeight: number } {
  if (models.length === 0) return { layouts: [], totalWidth: 0, totalHeight: 0 };

  const layouts: ModelLayout[] = [];
  let offsetX = 0;
  let maxHeight = 0;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    layouts.push({
      model,
      offsetX,
      color: MODEL_COLORS[i % MODEL_COLORS.length],
    });
    offsetX += model.graph.totalWidth + MODEL_GAP;
    maxHeight = Math.max(maxHeight, model.graph.totalHeight);
  }

  return {
    layouts,
    totalWidth: offsetX - MODEL_GAP,
    totalHeight: maxHeight + LABEL_HEIGHT,
  };
}

export function Canvas({ models, selectedNodeId, onSelectNode, onAddPreset, onRemoveModel }: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { transform, handleWheel, onMouseDown, onMouseMove, onMouseUp, fitToScreen } =
    useCanvasTransform(containerRef);
  const [dragOver, setDragOver] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const { layouts, totalWidth, totalHeight } = computeLayout(models);

  const handleFit = useCallback(() => {
    if (models.length === 0 || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    fitToScreen(totalWidth, totalHeight, rect.width, rect.height);
  }, [models.length, totalWidth, totalHeight, fitToScreen]);

  // Register wheel event with passive: false
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Auto-fit when models change
  useEffect(() => {
    if (models.length > 0) {
      requestAnimationFrame(handleFit);
    }
  }, [models, handleFit]);

  // Close export menu on outside click
  useEffect(() => {
    if (!showExportMenu) return;
    const close = () => setShowExportMenu(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [showExportMenu]);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (typeof data.presetIndex === 'number') {
        onAddPreset(data.presetIndex);
      }
    } catch {
      // ignore invalid drag data
    }
  }, [onAddPreset]);

  const handleExport = useCallback((format: 'svg' | 'png') => {
    const svg = svgRef.current;
    if (!svg || models.length === 0) return;
    const name = models.length === 1
      ? models[0].metadata.name.replace(/[^a-zA-Z0-9_-]/g, '_')
      : 'architecture_comparison';
    if (format === 'svg') {
      exportSVG(svg, totalWidth, totalHeight, name);
    } else {
      exportPNG(svg, totalWidth, totalHeight, name);
    }
    setShowExportMenu(false);
  }, [models, totalWidth, totalHeight]);

  const hasModels = models.length > 0;

  return (
    <div
      ref={containerRef}
      className={`${styles.canvas} ${dragOver ? styles.dragOver : ''}`}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onClick={() => onSelectNode(null)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {!hasModels ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>&#9881;</div>
          <div className={styles.emptyTitle}>No model loaded</div>
          <div className={styles.emptyHint}>
            Enter a HuggingFace model name, paste a config.json, or drag a preset here to visualize the architecture.
          </div>
        </div>
      ) : (
        <svg ref={svgRef} className={styles.svg}>
          <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
            {layouts.map(({ model, offsetX, color }) => {
              const nodeMap = new Map(model.graph.nodes.map(n => [n.id, n]));
              const showLabel = models.length > 1;
              return (
                <g key={model.id} transform={`translate(${offsetX}, ${showLabel ? LABEL_HEIGHT : 0})`}>
                  {/* Model label (only in multi-model view) */}
                  {showLabel && (
                    <g transform={`translate(${model.graph.totalWidth / 2}, -${LABEL_HEIGHT - 4})`}>
                      <rect
                        x={-80}
                        y={-12}
                        width={160}
                        height={24}
                        rx={4}
                        fill="var(--model-label-bg)"
                        stroke={color}
                        strokeWidth={1.5}
                      />
                      <text
                        x={0}
                        y={1}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={11}
                        fontWeight={600}
                        fill={color}
                      >
                        {model.metadata.name.length > 22
                          ? model.metadata.name.slice(0, 20) + '...'
                          : model.metadata.name}
                      </text>
                      {/* Remove button */}
                      <g
                        style={{ cursor: 'pointer' }}
                        onClick={e => { e.stopPropagation(); onRemoveModel(model.id); }}
                      >
                        <circle cx={88} cy={0} r={8} fill="var(--node-stroke)" opacity={0.6} />
                        <text
                          x={88} y={1}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={10}
                          fontWeight={700}
                          fill="var(--node-body-bg)"
                        >
                          x
                        </text>
                      </g>
                    </g>
                  )}
                  {model.graph.groups.map(g => (
                    <GraphGroupComponent key={g.id} group={g} />
                  ))}
                  {model.graph.edges.map(e => {
                    const from = nodeMap.get(e.from);
                    const to = nodeMap.get(e.to);
                    if (!from || !to) return null;
                    return (
                      <GraphEdgeComponent key={e.id} edge={e} fromNode={from} toNode={to} />
                    );
                  })}
                  {model.graph.nodes.map(n => (
                    <GraphNodeComponent
                      key={n.id}
                      node={n}
                      selected={selectedNodeId === `${model.id}:${n.id}`}
                      onSelect={nodeId => onSelectNode(`${model.id}:${nodeId}`)}
                    />
                  ))}
                </g>
              );
            })}
          </g>
        </svg>
      )}

      {hasModels && (
        <div className={styles.controls}>
          <button className={styles.controlBtn} onClick={handleFit} title="Fit to screen">
            &#8690;
          </button>
          <div style={{ position: 'relative' }}>
            <button
              className={styles.controlBtn}
              onClick={e => { e.stopPropagation(); setShowExportMenu(prev => !prev); }}
              title="Export graph"
            >
              &#8615;
            </button>
            {showExportMenu && (
              <div className={styles.exportMenu} onClick={e => e.stopPropagation()}>
                <button className={styles.exportBtn} onClick={() => handleExport('svg')}>
                  Export SVG
                </button>
                <button className={styles.exportBtn} onClick={() => handleExport('png')}>
                  Export PNG
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {dragOver && (
        <div className={styles.dropOverlay}>
          <div className={styles.dropText}>Drop to add model</div>
        </div>
      )}
    </div>
  );
}
