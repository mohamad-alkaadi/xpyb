import { createRequire } from 'node:module';
import { describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const { createLineDecoder, encodeMessage, parseLine } = require('../../electron/lib/kernel/protocol');

describe('kernel protocol', () => {
  it('encodes one message per line', () => {
    expect(encodeMessage({ code: 'a\nb' })).toBe('{"code":"a\\nb"}\n');
  });

  it('ignores lines that are not protocol messages', () => {
    ['', 'warning', 'null', '1', '{"id":"1"}'].forEach((line) => expect(parseLine(line)).toBeNull());
  });

  it('reassembles messages split across chunks', () => {
    const onMessage = vi.fn();
    const decode = createLineDecoder(onMessage);
    ['{"type":', '"rea', 'dy"}\nnoise\n{"type":"a"}\n{"type"', ':"b"}\n'].forEach(decode);
    expect(onMessage.mock.calls.map(([message]) => message.type)).toEqual(['ready', 'a', 'b']);
  });
});
