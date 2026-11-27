import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { createIdAllocator, isValidCellId } = require('../../electron/lib/converter/ids');
const { joinSource, splitSource } = require('../../electron/lib/converter/sourceText');
const { isObject } = require('../../electron/lib/converter/validate');

describe('converter helpers', () => {
  it('joins and splits multiline source', () => {
    expect(joinSource(['a\n', 'b'])).toBe('a\nb');
    expect(joinSource(undefined)).toBe('');
    expect(splitSource('a\n\nb\n')).toEqual(['a\n', '\n', 'b\n']);
    expect(splitSource('')).toEqual([]);
  });

  it('validates and allocates ids', () => {
    expect(isValidCellId('ok_1-a')).toBe(true);
    expect(isValidCellId('has space')).toBe(false);
    const allocate = createIdAllocator(['cell-1']);
    expect(allocate('bad id', 'cell')).toBe('cell-2');
    expect(allocate('keep', 'cell')).toBe('keep');
    expect(allocate('keep', 'cell')).toBe('cell-3');
  });

  it('recognizes plain objects', () => {
    expect([isObject({}), isObject([]), isObject(null)]).toEqual([true, false, false]);
  });
});
