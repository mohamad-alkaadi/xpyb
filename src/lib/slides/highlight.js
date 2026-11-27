import { pythonLanguage } from '@codemirror/lang-python';
import { highlightCode } from '@lezer/highlight';

/**
 * Splits Python source into styled tokens for display without an editor.
 * @param {string} code Python source.
 * @param {object} style CodeMirror highlight style.
 * @returns {{text: string, className: string}[]} Tokens, including line breaks.
 */
export const highlightPython = (code, style) => {
  const tokens = [];
  const add = (text, className = '') => tokens.push({ text, className });
  const tree = pythonLanguage.parser.parse(code);
  highlightCode(code, tree, style, add, () => add('\n'));
  return tokens;
};
