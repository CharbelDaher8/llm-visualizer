import { useState, useCallback } from 'react';
import { parseConfig } from './core/configParser';
import { buildArchitectureGraph } from './core/architectureMapper';
import { layoutGraph } from './core/layoutEngine';
import { estimateParameters, formatParams } from './core/parameterEstimator';
import { useFetchConfig } from './hooks/useFetchConfig';
import { Header } from './components/Header/Header';
import { Canvas } from './components/Canvas/Canvas';
import { Sidebar } from './components/Sidebar/Sidebar';
import type { ArchitectureGraph, ModelConfig, ModelMetadata, GraphNode } from './core/types';
import styles from './App.module.css';

export default function App() {
  const [graph, setGraph] = useState<ArchitectureGraph | null>(null);
  const [metadata, setMetadata] = useState<ModelMetadata | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const processConfig = useCallback((raw: Record<string, unknown>, name: string) => {
    const config = parseConfig(raw);
    const g = buildArchitectureGraph(config);
    layoutGraph(g);
    setGraph(g);
    setMetadata(buildMetadata(config, name));
    setSelectedNodeId(null);
  }, []);

  const { loading, error, fetchByModelName, parseJsonInput } = useFetchConfig(processConfig);

  const handlePreset = useCallback((config: Record<string, unknown>, name: string) => {
    processConfig(config, name);
  }, [processConfig]);

  const selectedNode: GraphNode | null =
    graph?.nodes.find(n => n.id === selectedNodeId) ?? null;

  return (
    <div className={styles.app}>
      <Header
        onFetch={fetchByModelName}
        onParseJson={parseJsonInput}
        onPreset={handlePreset}
        loading={loading}
        error={error}
      />
      <div className={styles.body}>
        <Canvas
          graph={graph}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
        />
        <Sidebar metadata={metadata} selectedNode={selectedNode} />
      </div>
    </div>
  );
}

function buildMetadata(config: ModelConfig, name: string): ModelMetadata {
  const params = estimateParameters(config);
  return {
    name,
    modelType: config.modelType,
    estimatedParams: `~${formatParams(params)}`,
    vocabSize: config.vocabSize,
    hiddenSize: config.hiddenSize,
    numLayers: config.numHiddenLayers,
    numHeads: config.numAttentionHeads,
    numKVHeads: config.numKeyValueHeads,
    intermediateSize: config.intermediateSize,
    maxSeqLen: config.maxPositionEmbeddings,
    normType: config.normType,
    activation: config.activationFunction,
    isMoE: config.isMoE,
    numExperts: config.numExperts || undefined,
    numExpertsPerToken: config.numExpertsPerToken || undefined,
  };
}
