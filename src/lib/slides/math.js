import katex from 'katex';

const BLOCK_MATH = /^\$\$([\s\S]+?)\$\$(?:\n+|$)/;
// Dollar amounts such as "$5 and $10" are not math: no inner edge spaces, no digit after.
const INLINE_MATH = /^(\${1,2})(?![\s$])((?:\\[\s\S]|[^\\$`\n])+?)(?<!\s)\1(?!\d)/;

/**
 * Renders TeX to HTML. Invalid input is shown as highlighted source instead of failing.
 * @param {string} tex TeX source without delimiters.
 * @param {boolean} displayMode True for a centered block.
 * @returns {string} KaTeX HTML.
 */
export const renderTex = (tex, displayMode) =>
  katex.renderToString(tex, { displayMode, throwOnError: false, trust: false });

/**
 * Renders a `text/latex` output, which may carry dollar delimiters.
 * @param {string} source LaTeX from the kernel or notebook.
 * @returns {string} KaTeX HTML.
 */
export const renderLatex = (source) =>
  renderTex(source.trim().replace(/^(\${1,2})([\s\S]*)\1$/, '$2'), true);

const escapeHtml = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const placeholder = ({ tag, mode, tex }) =>
  `<${tag} data-math="${mode}">${escapeHtml(tex)}</${tag}>`;

const blockMath = {
  name: 'blockMath',
  level: 'block',
  start: (src) => src.match(/\$\$/)?.index,
  tokenizer: (src) => {
    const match = BLOCK_MATH.exec(src);
    if (!match) return undefined;
    return { type: 'blockMath', raw: match[0], tag: 'div', mode: 'block', tex: match[1].trim() };
  },
  renderer: placeholder,
};

const inlineMath = {
  name: 'inlineMath',
  level: 'inline',
  start: (src) => src.match(/(?<!\\)\$/)?.index,
  tokenizer: (src) => {
    const match = INLINE_MATH.exec(src);
    if (!match) return undefined;
    const mode = match[1] === '$$' ? 'block' : 'inline';
    return { type: 'inlineMath', raw: match[0], tag: 'span', mode, tex: match[2] };
  },
  renderer: placeholder,
};

/** Marked extensions that turn dollar math into placeholders. */
export const MATH_EXTENSIONS = Object.freeze([blockMath, inlineMath]);

/**
 * Replaces math placeholders in sanitized HTML with KaTeX output.
 * This runs after sanitizing because KaTeX needs inline styles.
 * @param {string} html Sanitized HTML.
 * @returns {string} HTML with rendered math.
 */
export const typesetMath = (html) => {
  if (!html.includes('data-math')) return html;
  const template = document.createElement('template');
  template.innerHTML = html;
  template.content.querySelectorAll('[data-math]').forEach((node) => {
    node.innerHTML = renderTex(node.textContent, node.dataset.math === 'block');
  });
  return template.innerHTML;
};
