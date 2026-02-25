import { useState, useCallback } from 'react';
import { parseConfig } from './core/configParser';
import { buildArchitectureGraph } from './core/architectureMapper';
import { layoutGraph } from './core/layoutEngine';
import { estimateParameters, formatParams } from './core/parameterEstimator';
import { useFetchConfig } from './hooks/useFetchConfig';
import { useTheme } from './hooks/useTheme';
import { presets } from './data/modelProfiles';
import { Header } from './components/Header/Header';
import { Canvas } from './components/Canvas/Canvas';
import { Sidebar } from './components/Sidebar/Sidebar';
import type { ModelConfig, ModelMetadata, LoadedModel } from './core/types';
import styles from './App.module.css';

let nextId = 1;

export default function App() {
  const [models, setModels] = useState<LoadedModel[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();

  const addModel = useCallback((raw: Record<string, unknown>, name: string) => {
    const config = parseConfig(raw);
    const g = buildArchitectureGraph(config);
    layoutGraph(g);
    const meta = buildMetadata(config, name);
    const id = `m${nextId++}`;
    setModels(prev => [...prev, { id, graph: g, metadata: meta }]);
    setSelectedNodeId(null);
  }, []);

  const removeModel = useCallback((modelId: string) => {
    setModels(prev => prev.filter(m => m.id !== modelId));
    setSelectedNodeId(prev => {
      if (prev && prev.startsWith(modelId + ':')) return null;
      return prev;
    });
  }, []);

  const clearModels = useCallback(() => {
    setModels([]);
    setSelectedNodeId(null);
  }, []);

  const addPreset = useCallback((index: number) => {
    const p = presets[index];
    if (p) addModel(p.config, p.name);
  }, [addModel]);

  const { loading, error, fetchByModelName, parseJsonInput } = useFetchConfig(addModel);

  return (
    <div className={styles.app}>
      <Header
        onFetch={fetchByModelName}
        onParseJson={parseJsonInput}
        onAddPreset={addPreset}
        onClearModels={clearModels}
        loading={loading}
        error={error}
        theme={theme}
        onToggleTheme={toggleTheme}
        hasModels={models.length > 0}
      />
      <div className={styles.body}>
        <Canvas
          models={models}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
          onAddPreset={addPreset}
          onRemoveModel={removeModel}
        />
        <Sidebar
          models={models}
          selectedNodeId={selectedNodeId}
          onRemoveModel={removeModel}
        />
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
