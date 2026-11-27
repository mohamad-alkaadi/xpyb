// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { getCodeFontSize, getCodeTheme } from '../../src/lib/slides/codeTheme.js';
import { isDarkColor, normalizeHex } from '../../src/lib/slides/contrast.js';
import { renderMarkdown } from '../../src/lib/slides/markdown.js';
import { findBoundCell, listOutputSources, normalizeOutputs } from '../../src/lib/slides/outputs.js';
import { codeCell, makeDeck, makeSlide, textCell } from './fixtures.js';

describe('contrast helpers', () => {
  it('normalizes hex colors', () => {
    expect(normalizeHex('#ABC', '#000000')).toBe('#aabbcc');
    expect(normalizeHex('#A1B2C3', '#000000')).toBe('#a1b2c3');
    expect(normalizeHex('red', '#000000')).toBe('#000000');
  });

  it('picks the highlight style by background tone', () => {
    expect(isDarkColor('#0f172a')).toBe(true);
    expect(isDarkColor('#fef3c7')).toBe(false);
    expect(getCodeTheme('#000000', { light: 'l', dark: 'd' })).toBe('d');
    expect(getCodeFontSize({ fontSize: 180 })).toBe(24);
    expect(getCodeFontSize({ fontSize: 22 })).toBe(22);
  });
});

describe('renderMarkdown', () => {
  it('renders rich text', () => {
    expect(renderMarkdown('**bold**')).toContain('<strong>bold</strong>');
  });

  it('strips active content', () => {
    const html = renderMarkdown(
      '<script>x()</script><img src=x onerror=x()><style>a{}</style><p style="color:red">p</p>',
    );
    expect(html).not.toMatch(/script|onerror|style/);
  });
});

describe('outputs', () => {
  it('normalizes notebook and kernel outputs alike', () => {
    const items = normalizeOutputs([
      { output_type: 'stream', name: 'stdout', text: ['a\n', 'b'] },
      { output_type: 'error', traceback: ['\u001b[31mBoom\u001b[0m'] },
      { output_type: 'execute_result', data: { 'text/plain': '2' } },
      { output_type: 'display_data', data: { 'image/png': 'AAAA\n' } },
      { type: 'stderr', text: 'warn' },
      { type: 'image', mime: 'image/png', data: 'BBBB' },
      { type: 'html', html: '<b>x</b><script></script>' },
      { type: 'unknown' },
    ]);
    expect(items).toEqual([
      { kind: 'text', text: 'a\nb' },
      { kind: 'error', text: 'Boom' },
      { kind: 'text', text: '2' },
      { kind: 'image', src: 'data:image/png;base64,AAAA' },
      { kind: 'error', text: 'warn' },
      { kind: 'image', src: 'data:image/png;base64,BBBB' },
      { kind: 'html', html: '<b>x</b>' },
    ]);
  });

  it('lists code cells and resolves bindings', () => {
    const deck = makeDeck([makeSlide('s', 'blank', [textCell('t', 'x'), codeCell('c', 'a = 1\nb')])]);
    const [text, code] = deck.slides[0].cells;
    expect(listOutputSources(deck)).toEqual([{ id: 'c', label: 'Slide 1: a = 1' }]);
    expect(findBoundCell(deck, code)).toBe(code);
    expect(findBoundCell(deck, textCell('o', '', { outputOf: 'c' }))).toBe(code);
    expect(findBoundCell(deck, text)).toBeNull();
    expect(findBoundCell(deck, null)).toBeNull();
  });
});
