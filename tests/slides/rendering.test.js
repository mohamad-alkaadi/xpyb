// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { canRun } from '../../src/lib/kernel/results.js';
import { dataUrlToBlob } from '../../src/lib/slides/blobs.js';
import { highlightPython } from '../../src/lib/slides/highlight.js';
import { HIGHLIGHT_STYLES } from '../../src/lib/slides/codeTheme.js';
import { renderMarkdown } from '../../src/lib/slides/markdown.js';
import { renderLatex } from '../../src/lib/slides/math.js';
import { normalizeOutputs } from '../../src/lib/slides/outputs.js';

const parse = (html) => {
  const node = document.createElement('div');
  node.innerHTML = html;
  return node;
};

describe('math in markdown', () => {
  it('renders inline and block math with KaTeX, keeping its styles', () => {
    const node = parse(renderMarkdown('Area $\\pi r^2$\n\n$$\nE = mc^2\n$$'));
    expect(node.querySelectorAll('.katex')).toHaveLength(2);
    expect(node.querySelectorAll('.katex-display')).toHaveLength(1);
    expect(node.querySelector('.katex-html [style]')).toBeTruthy();
  });

  it('leaves prices, escaped dollars and code alone', () => {
    const node = parse(renderMarkdown('Costs $5 and $10, \\$x\\$, `$a$`'));
    expect(node.querySelector('.katex')).toBeNull();
    expect(node.textContent).toContain('Costs $5 and $10, $x$, $a$');
  });

  it('does not let math smuggle in active content', () => {
    const html = renderMarkdown(
      '$\\href{javascript:x()}{a}$ $<img src=x onerror=x()>$ <span data-math="inline"><img src=x onerror=x()></span>',
    );
    const node = parse(html);
    expect(node.querySelector('img, script, a')).toBeNull();
  });

  it('shows invalid TeX instead of throwing', () => {
    expect(renderLatex('$\\frac{$')).toContain('katex-error');
  });
});

describe('rich outputs', () => {
  it('renders LaTeX from notebooks and the kernel', () => {
    const items = normalizeOutputs([
      { output_type: 'execute_result', data: { 'text/latex': '$$x^2$$', 'text/plain': 'x**2' } },
      { type: 'latex', latex: '$y$' },
    ]);
    expect(items.map((item) => item.kind)).toEqual(['latex', 'latex']);
    expect(items[0].html).toContain('katex-display');
  });

  it('keeps pandas tables and drops their scripts and styles', () => {
    const [item] = normalizeOutputs([
      {
        type: 'html',
        html: '<style scoped>td{}</style><table class="dataframe"><tr style="text-align: right;"><td>1</td></tr></table><script>x()</script>',
      },
    ]);
    expect(parse(item.html).querySelector('table.dataframe td').textContent).toBe('1');
    expect(item.html).not.toMatch(/style|script/);
  });

  it('strips terminal color codes from streams', () => {
    const items = normalizeOutputs([{ type: 'stderr', text: '\u001b[33mcareful\u001b[0m' }]);
    expect(items).toEqual([{ kind: 'error', text: 'careful' }]);
  });
});

describe('data URLs', () => {
  it('decodes base64 and percent-encoded images into blobs', async () => {
    const png = dataUrlToBlob(`data:image/png;base64,${btoa('png')}`);
    expect(png).toMatchObject({ type: 'image/png', size: 3 });
    const svg = dataUrlToBlob(`data:image/svg+xml,${encodeURIComponent('<svg/>')}`);
    expect(svg).toMatchObject({ type: 'image/svg+xml', size: 6 });
  });

  it('rejects malformed input', () => {
    expect(dataUrlToBlob('http://x/a.png')).toBeNull();
    expect(dataUrlToBlob('data:image/png;base64,***')).toBeNull();
  });
});

describe('code helpers', () => {
  it('highlights Python without losing text', () => {
    const code = 'def f(x):\n    return "a"';
    const tokens = highlightPython(code, HIGHLIGHT_STYLES.light);
    expect(tokens.map((token) => token.text).join('')).toBe(code);
    expect(tokens.find((token) => token.text === 'def').className).toBeTruthy();
  });

  it('runs only non-empty idle cells', () => {
    expect(canRun('1', undefined)).toBe(true);
    expect(canRun('1', { status: 'ok' })).toBe(true);
    expect(canRun('  ', undefined)).toBe(false);
    expect(canRun('1', { status: 'running' })).toBe(false);
  });
});
