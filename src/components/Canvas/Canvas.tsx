import { useRef, useEffect, useCallback } from 'react';
import type { ArchitectureGraph } from '../../core/types';
import { useCanvasTransform } from '../../hooks/useCanvasTransform';
import { GraphNodeComponent } from './GraphNode';
import { GraphEdgeComponent } from './GraphEdge';
import { GraphGroupComponent } from './GraphGroup';
import styles from './Canvas.module.css';

interface CanvasProps {
  graph: ArchitectureGraph | null;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
}

export function Canvas({ graph, selectedNodeId, onSelectNode }: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { transform, handleWheel, onMouseDown, onMouseMove, onMouseUp, fitToScreen } =
    useCanvasTransform(containerRef);

  const handleFit = useCallback(() => {
    if (!graph || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    fitToScreen(graph.totalWidth, graph.totalHeight, rect.width, rect.height);
  }, [graph, fitToScreen]);

  // Register wheel event with passive: false
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Auto-fit when graph changes
  useEffect(() => {
    if (graph) {
      requestAnimationFrame(handleFit);
    }
  }, [graph, handleFit]);

  const nodeMap = new Map(graph?.nodes.map(n => [n.id, n]) ?? []);

  return (
    <div
      ref={containerRef}
      className={styles.canvas}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onClick={() => onSelectNode(null)}
    >
      {!graph ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>&#9881;</div>
          <div className={styles.emptyTitle}>No model loaded</div>
          <div className={styles.emptyHint}>
            Enter a HuggingFace model name, paste a config.json, or choose a preset to visualize the architecture.
          </div>
        </div>
      ) : (
        <svg className={styles.svg}>
          <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
            {graph.groups.map(g => (
              <GraphGroupComponent key={g.id} group={g} />
            ))}
            {graph.edges.map(e => {
              const from = nodeMap.get(e.from);
              const to = nodeMap.get(e.to);
              if (!from || !to) return null;
              return (
                <GraphEdgeComponent key={e.id} edge={e} fromNode={from} toNode={to} />
              );
            })}
            {graph.nodes.map(n => (
              <GraphNodeComponent
                key={n.id}
                node={n}
                selected={n.id === selectedNodeId}
                onSelect={onSelectNode}
              />
            ))}
          </g>
        </svg>
      )}

      {graph && (
        <div className={styles.controls}>
          <button className={styles.controlBtn} onClick={handleFit} title="Fit to screen">
            &#8690;
          </button>
        </div>
      )}
    </div>
  );
}
