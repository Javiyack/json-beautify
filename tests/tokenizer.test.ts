import { describe, it, expect } from 'vitest';
import { tokenize } from '../src/highlight/tokenizer.js';

describe('tokenize', () => {
  it('clasifica claves y valores', () => {
    const json = '{\n  "a": 1,\n  "b": true\n}';
    const tokens = tokenize(json);
    const keyTokens = tokens.filter(t => t.type === 'key');
    expect(keyTokens.length).toBe(2);
    const number = tokens.find(t => t.type === 'number');
    expect(number?.value).toBe('1');
  });
});
