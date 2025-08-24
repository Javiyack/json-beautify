import { describe, it, expect } from 'vitest';
import { generateScala } from '../src/generate/scalaGen.js';

describe('generateScala', () => {
  it('generates simple case class for object', () => {
    const json = { id: 1, name: 'X', active: true };
    const code = generateScala(json, 'User');
    expect(code).toContain('case class User');
    expect(code).toMatch(/id: Int/);
    expect(code).toMatch(/name: String/);
    expect(code).toMatch(/active: Boolean/);
    expect(code).toContain('implicit val userDecoder');
  });

  it('handles array root', () => {
    const json = [{ id: 1, value: 2.5 }];
    const code = generateScala(json, 'Items');
    expect(code).toMatch(/List\[/);
  });
});
