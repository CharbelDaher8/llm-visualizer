/** Normalized model configuration from any HuggingFace config.json */
export interface ModelConfig {
  modelType: string;
  architectures: string[];
  hiddenSize: number;
  intermediateSize: number;
  numHiddenLayers: number;
  numAttentionHeads: number;
  numKeyValueHeads: number;
  vocabSize: number;
  maxPositionEmbeddings: number;
  normType: 'layer_norm' | 'rms_norm';
  activationFunction: string;
  tieWordEmbeddings: boolean;
  // MoE fields
  isMoE: boolean;
  numExperts: number;
  numExpertsPerToken: number;
  // Optional extras
  headDim?: number;
  ropeTheta?: number;
  slidingWindow?: number | null;
  // Raw config for display
  raw: Record<string, unknown>;
}

export type NodeType =
  | 'input'
  | 'embedding'
  | 'norm'
  | 'attention'
  | 'mlp'
  | 'moe_router'
  | 'moe_expert'
  | 'lm_head'
  | 'output'
  | 'residual';

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  sublabel?: string;
  details: Record<string, string | number>;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
}

export interface GraphGroup {
  id: string;
  label: string;
  nodeIds: string[];
  repeatCount: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ArchitectureGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  groups: GraphGroup[];
  totalWidth: number;
  totalHeight: number;
}

export interface ModelMetadata {
  name: string;
  modelType: string;
  estimatedParams: string;
  vocabSize: number;
  hiddenSize: number;
  numLayers: number;
  numHeads: number;
  numKVHeads: number;
  intermediateSize: number;
  maxSeqLen: number;
  normType: string;
  activation: string;
  isMoE: boolean;
  numExperts?: number;
  numExpertsPerToken?: number;
}

export interface LoadedModel {
  id: string;
  graph: ArchitectureGraph;
  metadata: ModelMetadata;
}
