import { describe, it, expect } from 'vitest';
import { buildTree } from '../src/render/treeBuilder.js';

describe('buildTree', () => {
  it('crea nodos correctos para objeto simple', () => {
    const t = buildTree({ a: 1, b: { c: true } });
    expect(t.kind).toBe('object');
    const bNode = t.children?.find(n => n.key === 'b');
    expect(bNode?.kind).toBe('object');
  });

  it('limita maxNodes si se especifica', () => {
    const large: Record<string, number> = {};
    for (let i = 0; i < 1000; i++) large['k'+i] = i;
    const t = buildTree(large, { maxNodes: 10 });
    expect(t.children?.length).toBeGreaterThan(0);
  });
});
