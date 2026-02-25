export const colors = {
  attention: '#4a90d9',
  mlp: '#e8913a',
  norm: '#5cb85c',
  embedding: '#8e6cbf',
  moe: '#9b59b6',
  io: '#777777',
  nodeBg: '#ffffff',
  nodeBorder: '#cccccc',
  edgeColor: '#999999',
  groupBorder: '#bbbbbb',
  canvasBg: '#f0f0f0',
  selection: '#4a90d9',
} as const;

export const nodeColors: Record<string, string> = {
  attention: colors.attention,
  mlp: colors.mlp,
  norm: colors.norm,
  embedding: colors.embedding,
  moe_router: colors.moe,
  moe_expert: colors.mlp,
  lm_head: colors.io,
  input: colors.io,
  output: colors.io,
  residual: colors.io,
};
