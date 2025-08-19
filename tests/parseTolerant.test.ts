import { describe, it, expect } from 'vitest';
import { parseJson } from '../src/core/parse.js';

describe('parseJson tolerant mode', () => {
  it('removes comments and trailing commas', () => {
    const src = '{\n  // comentario\n  "a": 1,\n  "b": 2,\n}\n';
    const r = parseJson(src, { tolerant: true });
    expect(r.error).toBeUndefined();
    expect(r.data).toEqual({ a:1, b:2 });
  });

  it('provides suggestion on common error', () => {
    const bad = '{ "a": 1,, }';
    const r = parseJson(bad, { tolerant: false });
    expect(r.error).toBeDefined();
    expect(r.error?.suggestion).toBeTruthy();
  });
});
