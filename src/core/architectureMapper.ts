import type { ModelConfig, GraphNode, GraphEdge, GraphGroup, ArchitectureGraph, NodeType } from './types';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 48;
const MOE_EXPERT_WIDTH = 140;
const MOE_EXPERT_HEIGHT = 36;

let idCounter = 0;
function nextId(prefix: string): string {
  return `${prefix}_${++idCounter}`;
}

function makeNode(
  type: NodeType,
  label: string,
  sublabel: string | undefined,
  details: Record<string, string | number>,
): GraphNode {
  const isExpert = type === 'moe_expert';
  const isIO = type === 'input' || type === 'output';
  const isResidual = type === 'residual';
  return {
    id: nextId(type),
    type,
    label,
    sublabel,
    details,
    x: 0,
    y: 0,
    width: isExpert ? MOE_EXPERT_WIDTH : isIO ? 160 : isResidual ? 32 : NODE_WIDTH,
    height: isExpert ? MOE_EXPERT_HEIGHT : isIO ? 32 : isResidual ? 32 : NODE_HEIGHT,
  };
}

function makeEdge(from: string, to: string, label?: string, dashed?: boolean): GraphEdge {
  return { id: nextId('edge'), from, to, label, dashed };
}

function fmtDim(...dims: number[]): string {
  return dims.join(' × ');
}

export function buildArchitectureGraph(config: ModelConfig): ArchitectureGraph {
  idCounter = 0;
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const groups: GraphGroup[] = [];

  const h = config.hiddenSize;
  const ff = config.intermediateSize;
  const V = config.vocabSize;
  const nH = config.numAttentionHeads;
  const nKV = config.numKeyValueHeads;
  const headDim = config.headDim || Math.floor(h / nH);
  const normLabel = config.normType === 'rms_norm' ? 'RMSNorm' : 'LayerNorm';

  // --- Input ---
  const inputNode = makeNode('input', 'Token Input', 'token ids', {});
  nodes.push(inputNode);

  // --- Embedding ---
  const embNode = makeNode('embedding', 'Token Embedding', fmtDim(V, h), {
    'Vocab size': V,
    'Embedding dim': h,
    'Parameters': V * h,
  });
  nodes.push(embNode);
  edges.push(makeEdge(inputNode.id, embNode.id));

  // --- Transformer Block (single representative) ---
  const blockNodeIds: string[] = [];

  // Pre-attention norm
  const preAttnNorm = makeNode('norm', `Pre-Attention ${normLabel}`, fmtDim(h), {
    'Type': config.normType,
    'Normalized shape': h,
  });
  nodes.push(preAttnNorm);
  blockNodeIds.push(preAttnNorm.id);
  edges.push(makeEdge(embNode.id, preAttnNorm.id));

  // Multi-Head Attention
  const gqa = nKV < nH ? ` (GQA ${nH}/${nKV})` : nKV === 1 ? ' (MQA)' : '';
  const attnNode = makeNode('attention', `Multi-Head Attention${gqa}`, `${nH} heads, dim ${headDim}`, {
    'Num heads': nH,
    'Num KV heads': nKV,
    'Head dim': headDim,
    'Q proj': fmtDim(h, nH * headDim),
    'K proj': fmtDim(h, nKV * headDim),
    'V proj': fmtDim(h, nKV * headDim),
    'O proj': fmtDim(nH * headDim, h),
  });
  nodes.push(attnNode);
  blockNodeIds.push(attnNode.id);
  edges.push(makeEdge(preAttnNorm.id, attnNode.id));

  // Residual connection marker (post-attention)
  const residual1 = makeNode('residual', 'Add (residual)', undefined, {});
  nodes.push(residual1);
  blockNodeIds.push(residual1.id);
  edges.push(makeEdge(attnNode.id, residual1.id));
  edges.push(makeEdge(preAttnNorm.id, residual1.id, 'residual', true));

  // Post-attention / pre-MLP norm
  const preMlpNorm = makeNode('norm', `Post-Attention ${normLabel}`, fmtDim(h), {
    'Type': config.normType,
    'Normalized shape': h,
  });
  nodes.push(preMlpNorm);
  blockNodeIds.push(preMlpNorm.id);
  edges.push(makeEdge(residual1.id, preMlpNorm.id));

  let lastBlockNodeId: string;

  if (config.isMoE) {
    // --- MoE Block ---
    const routerNode = makeNode('moe_router', 'MoE Router (Gate)', `top-${config.numExpertsPerToken} of ${config.numExperts}`, {
      'Num experts': config.numExperts,
      'Experts per token': config.numExpertsPerToken,
      'Gate proj': fmtDim(h, config.numExperts),
    });
    nodes.push(routerNode);
    blockNodeIds.push(routerNode.id);
    edges.push(makeEdge(preMlpNorm.id, routerNode.id));

    // Show representative experts: [0, 1, ..., N-1] if N > 3
    const expertNodes: GraphNode[] = [];
    const expertIndices = config.numExperts <= 3
      ? Array.from({ length: config.numExperts }, (_, i) => i)
      : [0, 1, -1, config.numExperts - 1]; // -1 = ellipsis placeholder

    for (const idx of expertIndices) {
      if (idx === -1) {
        // Ellipsis placeholder node
        const ellipsis = makeNode('moe_expert', `... ${config.numExperts - 2} more`, '', {
          'Total experts': config.numExperts,
        });
        nodes.push(ellipsis);
        expertNodes.push(ellipsis);
        blockNodeIds.push(ellipsis.id);
        edges.push(makeEdge(routerNode.id, ellipsis.id));
        continue;
      }
      const expert = makeNode('moe_expert', `Expert ${idx}`, fmtDim(h, ff), {
        'Up proj': fmtDim(h, ff),
        'Down proj': fmtDim(ff, h),
        'Activation': config.activationFunction,
      });
      nodes.push(expert);
      expertNodes.push(expert);
      blockNodeIds.push(expert.id);
      edges.push(makeEdge(routerNode.id, expert.id));
    }

    // Combine node after experts
    const combine = makeNode('residual', 'Weighted Sum', undefined, {
      'Experts per token': config.numExpertsPerToken,
    });
    nodes.push(combine);
    blockNodeIds.push(combine.id);
    for (const expert of expertNodes) {
      edges.push(makeEdge(expert.id, combine.id));
    }

    // Residual connection (post-MLP)
    const residual2 = makeNode('residual', 'Add (residual)', undefined, {});
    nodes.push(residual2);
    blockNodeIds.push(residual2.id);
    edges.push(makeEdge(combine.id, residual2.id));
    edges.push(makeEdge(preMlpNorm.id, residual2.id, 'residual', true));

    // Group
    groups.push({
      id: nextId('group'),
      label: `Transformer Block`,
      nodeIds: [...blockNodeIds],
      repeatCount: config.numHiddenLayers,
      x: 0, y: 0, width: 0, height: 0,
    });

    // Link last block node to final norm
    lastBlockNodeId = residual2.id;
  } else {
    // --- Dense MLP ---
    const isGated = config.activationFunction === 'silu' ||
      config.activationFunction === 'swiglu' ||
      config.activationFunction === 'gelu_pytorch_tanh' ||
      config.modelType === 'llama' || config.modelType === 'mistral' ||
      config.modelType === 'gemma' || config.modelType === 'gemma2' ||
      config.modelType === 'phi3';
    const mlpSublabel = isGated ? `${fmtDim(h, ff)} (gated)` : fmtDim(h, ff);
    const mlpNode = makeNode('mlp', 'Feed-Forward (MLP)', mlpSublabel, {
      'Up proj': fmtDim(h, ff),
      'Down proj': fmtDim(ff, h),
      ...(isGated ? { 'Gate proj': fmtDim(h, ff) } : {}),
      'Activation': config.activationFunction,
    });
    nodes.push(mlpNode);
    blockNodeIds.push(mlpNode.id);
    edges.push(makeEdge(preMlpNorm.id, mlpNode.id));

    // Residual connection (post-MLP)
    const residual2 = makeNode('residual', 'Add (residual)', undefined, {});
    nodes.push(residual2);
    blockNodeIds.push(residual2.id);
    edges.push(makeEdge(mlpNode.id, residual2.id));
    edges.push(makeEdge(preMlpNorm.id, residual2.id, 'residual', true));

    groups.push({
      id: nextId('group'),
      label: `Transformer Block`,
      nodeIds: [...blockNodeIds],
      repeatCount: config.numHiddenLayers,
      x: 0, y: 0, width: 0, height: 0,
    });

    lastBlockNodeId = residual2.id;
  }

  // --- Final Norm ---
  const finalNorm = makeNode('norm', `Final ${normLabel}`, fmtDim(h), {
    'Type': config.normType,
    'Normalized shape': h,
  });
  nodes.push(finalNorm);
  edges.push(makeEdge(lastBlockNodeId, finalNorm.id));

  // --- LM Head ---
  const lmHeadNode = makeNode('lm_head', 'LM Head (Linear)', fmtDim(h, V), {
    'Input': h,
    'Output': V,
    'Tied weights': config.tieWordEmbeddings ? 'Yes' : 'No',
  });
  nodes.push(lmHeadNode);
  edges.push(makeEdge(finalNorm.id, lmHeadNode.id));

  // --- Output ---
  const outputNode = makeNode('output', 'Output Logits', `vocab ${V}`, {});
  nodes.push(outputNode);
  edges.push(makeEdge(lmHeadNode.id, outputNode.id));

  return { nodes, edges, groups, totalWidth: 0, totalHeight: 0 };
}
