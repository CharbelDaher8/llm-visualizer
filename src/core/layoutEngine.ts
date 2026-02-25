import type { ArchitectureGraph, GraphNode, GraphGroup } from './types';

const VERTICAL_GAP = 28;
const GROUP_PADDING_X = 30;
const GROUP_PADDING_TOP = 36;
const GROUP_PADDING_BOTTOM = 20;
const MOE_EXPERT_GAP = 12;
const CANVAS_MARGIN = 60;

/**
 * Assigns x,y positions to all nodes in a top-down linear layout.
 * MoE expert nodes are spread horizontally side-by-side.
 * All coordinates are centered at x=0, so the SVG transform handles centering.
 * Mutates the graph in place and returns it with totalWidth/totalHeight set.
 */
export function layoutGraph(graph: ArchitectureGraph): ArchitectureGraph {
  const { nodes, groups } = graph;
  const nodeMap = new Map<string, GraphNode>();
  for (const n of nodes) nodeMap.set(n.id, n);

  const expertNodeIds = new Set(
    nodes.filter(n => n.type === 'moe_expert').map(n => n.id)
  );

  let cursorY = 40;

  let i = 0;
  while (i < nodes.length) {
    const node = nodes[i];

    if (expertNodeIds.has(node.id)) {
      const experts: GraphNode[] = [];
      while (i < nodes.length && expertNodeIds.has(nodes[i].id)) {
        experts.push(nodes[i]);
        i++;
      }

      const totalExpertsWidth =
        experts.reduce((sum, e) => sum + e.width, 0) +
        (experts.length - 1) * MOE_EXPERT_GAP;

      const startX = -totalExpertsWidth / 2;
      let ex = startX;
      for (const expert of experts) {
        expert.x = ex + expert.width / 2;
        expert.y = cursorY;
        ex += expert.width + MOE_EXPERT_GAP;
      }

      cursorY += experts[0].height + VERTICAL_GAP;
    } else {
      node.x = 0;
      node.y = cursorY;
      cursorY += node.height + VERTICAL_GAP;
      i++;
    }
  }

  // Position groups around their contained nodes
  for (const group of groups) {
    layoutGroup(group, nodeMap);
  }

  // Compute bounding box of all nodes + groups
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (const n of nodes) {
    minX = Math.min(minX, n.x - n.width / 2);
    maxX = Math.max(maxX, n.x + n.width / 2);
    minY = Math.min(minY, n.y - n.height / 2);
    maxY = Math.max(maxY, n.y + n.height / 2);
  }
  for (const g of groups) {
    minX = Math.min(minX, g.x - g.width / 2);
    maxX = Math.max(maxX, g.x + g.width / 2);
    minY = Math.min(minY, g.y);
    maxY = Math.max(maxY, g.y + g.height);
  }

  // Shift all coordinates so the graph starts near (MARGIN, MARGIN)
  const offsetX = -minX + CANVAS_MARGIN;
  const offsetY = -minY + CANVAS_MARGIN;

  for (const n of nodes) {
    n.x += offsetX;
    n.y += offsetY;
  }
  for (const g of groups) {
    g.x += offsetX;
    g.y += offsetY;
  }

  graph.totalWidth = (maxX - minX) + CANVAS_MARGIN * 2;
  graph.totalHeight = (maxY - minY) + CANVAS_MARGIN * 2;

  return graph;
}

function layoutGroup(group: GraphGroup, nodeMap: Map<string, GraphNode>) {
  const groupNodes = group.nodeIds
    .map(id => nodeMap.get(id))
    .filter((n): n is GraphNode => n !== undefined);

  if (groupNodes.length === 0) return;

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (const n of groupNodes) {
    minX = Math.min(minX, n.x - n.width / 2);
    maxX = Math.max(maxX, n.x + n.width / 2);
    minY = Math.min(minY, n.y - n.height / 2);
    maxY = Math.max(maxY, n.y + n.height / 2);
  }

  group.x = (minX + maxX) / 2;
  group.y = minY - GROUP_PADDING_TOP;
  group.width = (maxX - minX) + GROUP_PADDING_X * 2;
  group.height = (maxY - minY) + GROUP_PADDING_TOP + GROUP_PADDING_BOTTOM;
}
