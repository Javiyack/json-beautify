import { describe, it, expect } from 'vitest';
import { parseJson } from '../src/core/parse.js';

describe('parseJson', () => {
  it('parse válido', () => {
    const r = parseJson('{"a":1,"b":[true,null]}');
    expect(r.error).toBeUndefined();
    expect(r.data).toEqual({ a: 1, b: [true, null] });
    expect(r.metrics.depth).toBeGreaterThan(0);
  });

  it('detecta error', () => {
    const r = parseJson('{"a": }');
    expect(r.error).toBeDefined();
    expect(r.data).toBeUndefined();
  });
});
