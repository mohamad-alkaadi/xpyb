import { describe, expect, it } from 'vitest';
import { parseLaunchRequest } from '../../src/lib/app/launchRequest.js';

describe('parseLaunchRequest', () => {
  it('defaults to an empty editor', () => {
    expect(parseLaunchRequest('')).toEqual({ mode: 'editor', filePath: null });
  });

  it('reads present mode and encoded paths', () => {
    const search = `?${new URLSearchParams({ mode: 'present', file: '/a b/#1.xpyb' })}`;
    expect(parseLaunchRequest(search)).toEqual({ mode: 'present', filePath: '/a b/#1.xpyb' });
  });
});
