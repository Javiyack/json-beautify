import type { TreeNode } from './treeBuilder.js';
import { CollapseState } from './collapseState.js';

export interface RenderTreeOptions {
  collapse: CollapseState;
  maxDepth?: number;
}

export function renderTree(root: TreeNode, opts: RenderTreeOptions): string {
  const lines: string[] = [];
  const stack: Array<{ node: TreeNode; depth: number }> = [{ node: root, depth: 0 }];
  while (stack.length) {
    const { node, depth } = stack.pop()!;
    const indent = '&nbsp;'.repeat(depth * 2);
    const collapsible = node.kind !== 'value' && node.size && node.size > 0;
    const collapsed = collapsible && opts.collapse.isCollapsed(node.path);
    const toggle = collapsible ? `<span class="tw-toggle" data-path="${node.path}">${collapsed ? '▶' : '▼'}</span>` : '<span class="tw-spacer"></span>';
    const keyPart = node.key !== undefined ? `<span class="tw-key">${escapeHtml(node.key)}</span>: ` : '';
    const meta = node.kind === 'value' ? formatValue(node.value) : `<span class="tw-meta">${node.typeLabel}</span>${collapsed ? '' : ''}`;
    lines.push(`<div class="tw-line" data-path="${node.path}" style="--depth:${depth}">${indent}${toggle}${keyPart}${meta}</div>`);
    if (collapsible && !collapsed && node.children) {
      for (let i = node.children.length - 1; i >= 0; i--) {
        stack.push({ node: node.children[i], depth: depth + 1 });
      }
    }
  }
  return `<div class="tree-view">${lines.join('')}<div class="tw-end"></div></div>`;
}

function formatValue(v: unknown): string {
  if (v === null) return '<span class="tw-null">null</span>';
  switch (typeof v) {
    case 'string': return `<span class="tw-string">${escapeHtml(JSON.stringify(v))}</span>`;
    case 'number': return `<span class="tw-number">${v}</span>`;
    case 'boolean': return `<span class="tw-boolean">${v}</span>`;
    default: return `<span>${escapeHtml(String(v))}</span>`;
  }
}

function escapeHtml(str: string): string {
  return str.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));
}
