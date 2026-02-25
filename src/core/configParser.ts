import type { ModelConfig } from './types';

/**
 * Normalizes a HuggingFace config.json into a uniform ModelConfig.
 * Handles field name differences across model families (GPT-2, Llama, Falcon, Phi, etc.)
 */
export function parseConfig(raw: Record<string, unknown>): ModelConfig {
  const str = (key: string, fallback = ''): string =>
    typeof raw[key] === 'string' ? (raw[key] as string) : fallback;
  const num = (key: string, fallback = 0): number =>
    typeof raw[key] === 'number' ? (raw[key] as number) : fallback;
  const bool = (key: string, fallback = false): boolean =>
    typeof raw[key] === 'boolean' ? (raw[key] as boolean) : fallback;
  const arr = (key: string): string[] =>
    Array.isArray(raw[key]) ? (raw[key] as string[]) : [];

  const modelType = str('model_type', 'unknown');

  const hiddenSize =
    num('hidden_size') || num('n_embd') || num('d_model') || 768;

  const intermediateSize =
    num('intermediate_size') || num('n_inner') || num('d_ff') || hiddenSize * 4;

  const numHiddenLayers =
    num('num_hidden_layers') || num('n_layer') || num('num_layers') || 12;

  const numAttentionHeads =
    num('num_attention_heads') || num('n_head') || num('num_heads') || 12;

  const numKeyValueHeads =
    num('num_key_value_heads') || num('n_head_kv') || num('num_kv_heads') || numAttentionHeads;

  const vocabSize = num('vocab_size', 50257);
  const maxPositionEmbeddings =
    num('max_position_embeddings') || num('n_positions') || num('max_seq_len') || 2048;

  // Detect norm type
  let normType: 'layer_norm' | 'rms_norm' = 'layer_norm';
  if (
    str('rms_norm_eps') || raw['rms_norm_eps'] !== undefined ||
    modelType === 'llama' || modelType === 'mistral' || modelType === 'mixtral' ||
    modelType === 'qwen2' || modelType === 'qwen2_moe' || modelType === 'gemma' ||
    modelType === 'gemma2' || modelType === 'phi3' || modelType === 'deepseek_v2'
  ) {
    normType = 'rms_norm';
  }

  const activationFunction =
    str('hidden_act') || str('activation_function') || str('hidden_activation') || 'gelu';

  const tieWordEmbeddings = bool('tie_word_embeddings', true);

  // MoE detection
  const numExperts =
    num('num_local_experts') || num('num_experts') || num('n_routed_experts') || 0;
  const numExpertsPerToken =
    num('num_experts_per_tok') || num('num_selected_experts') || num('num_experts_per_token') || (numExperts > 0 ? 2 : 0);
  const isMoE = numExperts > 1;

  return {
    modelType,
    architectures: arr('architectures'),
    hiddenSize,
    intermediateSize,
    numHiddenLayers,
    numAttentionHeads,
    numKeyValueHeads,
    vocabSize,
    maxPositionEmbeddings,
    normType,
    activationFunction,
    tieWordEmbeddings,
    isMoE,
    numExperts,
    numExpertsPerToken,
    headDim: num('head_dim') || undefined,
    ropeTheta: num('rope_theta') || undefined,
    slidingWindow: raw['sliding_window'] as number | null | undefined ?? undefined,
    raw,
  };
}
