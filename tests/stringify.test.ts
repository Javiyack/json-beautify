import { describe, it, expect } from 'vitest';
import { pretty, minify } from '../src/core/stringify.js';

describe('stringify', () => {
  it('pretty con indent 2', () => {
    const s = pretty({ a: 1, b: true });
    expect(s).toContain('\n');
  });
  it('minify sin espacios', () => {
    const s = minify({ a: 1, b: true });
    expect(s).toBe('{"a":1,"b":true}');
  });
});
