import DOMPurify from 'dompurify';
import { Marked } from 'marked';
import { MATH_EXTENSIONS, typesetMath } from './math.js';

const parser = new Marked({ extensions: [...MATH_EXTENSIONS] });

const SANITIZE_OPTIONS = Object.freeze({
  FORBID_TAGS: ['style', 'form', 'input', 'button', 'textarea', 'select'],
  FORBID_ATTR: ['style'],
});

/**
 * Removes scripts and other active content from HTML.
 * @param {string} html Untrusted HTML.
 * @returns {string} Safe HTML.
 */
export const sanitizeHtml = (html) => DOMPurify.sanitize(html, SANITIZE_OPTIONS);

/**
 * Renders markdown with dollar math to safe HTML.
 * @param {string} source Markdown text.
 * @returns {string} Safe HTML.
 */
export const renderMarkdown = (source) =>
  typesetMath(sanitizeHtml(parser.parse(source || '', { async: false })));
