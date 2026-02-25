import type { ModelConfig } from './types';

/** Estimate total parameter count from model config */
export function estimateParameters(config: ModelConfig): number {
  const { hiddenSize: h, intermediateSize: ff, numHiddenLayers: L,
    vocabSize: V, numAttentionHeads: nH, numKeyValueHeads: nKV,
    tieWordEmbeddings, isMoE, numExperts } = config;

  const headDim = config.headDim || Math.floor(h / nH);

  // Embedding: vocab_size * hidden_size
  const embedding = V * h;

  // Per-layer attention: Q, K, V projections + output projection
  const qSize = nH * headDim * h;
  const kSize = nKV * headDim * h;
  const vSize = nKV * headDim * h;
  const oSize = nH * headDim * h;
  const attnPerLayer = qSize + kSize + vSize + oSize;

  // Per-layer MLP: up + down (+ gate for SwiGLU-style)
  const isGated = config.activationFunction === 'silu' ||
    config.activationFunction === 'swiglu' ||
    config.activationFunction === 'gelu_pytorch_tanh' ||
    config.modelType === 'llama' || config.modelType === 'mistral' ||
    config.modelType === 'mixtral' || config.modelType === 'qwen2' ||
    config.modelType === 'qwen2_moe' || config.modelType === 'gemma' ||
    config.modelType === 'gemma2' || config.modelType === 'phi3' ||
    config.modelType === 'deepseek_v2';

  let mlpPerExpert = h * ff + ff * h; // up + down
  if (isGated) {
    mlpPerExpert += h * ff; // gate projection
  }

  let mlpPerLayer: number;
  if (isMoE) {
    // Router: hidden_size * num_experts
    const router = h * numExperts;
    mlpPerLayer = router + numExperts * mlpPerExpert;
  } else {
    mlpPerLayer = mlpPerExpert;
  }

  // Norms: 2 per layer (each is hidden_size params) + 1 final norm
  const normsPerLayer = 2 * h;
  const finalNorm = h;

  // Per layer total
  const perLayer = attnPerLayer + mlpPerLayer + normsPerLayer;

  // LM head
  const lmHead = tieWordEmbeddings ? 0 : V * h;

  const total = embedding + L * perLayer + finalNorm + lmHead;
  return total;
}

/** Format parameter count as human-readable string */
export function formatParams(count: number): string {
  if (count >= 1e12) return (count / 1e12).toFixed(1) + 'T';
  if (count >= 1e9) return (count / 1e9).toFixed(1) + 'B';
  if (count >= 1e6) return (count / 1e6).toFixed(0) + 'M';
  if (count >= 1e3) return (count / 1e3).toFixed(0) + 'K';
  return count.toString();
}
