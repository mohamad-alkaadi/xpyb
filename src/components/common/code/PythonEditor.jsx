import { python } from '@codemirror/lang-python';
import { syntaxHighlighting } from '@codemirror/language';
import { Prec } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import CodeMirror from '@uiw/react-codemirror';
import { useMemo } from 'react';
import { getRunKeymap } from '../../../lib/slides/runKeymap.js';
import { getTransparentTheme, HIGHLIGHT_STYLES } from '../../../lib/slides/codeTheme.js';

const SETUP = { foldGutter: false, highlightActiveLine: false, highlightActiveLineGutter: false };

const PythonEditor = ({ label, value, isDark, fontSize, onChange, onRun }) => {
  const extensions = useMemo(
    () => [
      Prec.highest(keymap.of(getRunKeymap(onRun))),
      python(),
      syntaxHighlighting(HIGHLIGHT_STYLES[isDark ? 'dark' : 'light']),
    ],
    [isDark, onRun],
  );

  return (
    <CodeMirror
      aria-label={label}
      className="h-full text-left font-normal"
      style={{ fontSize }}
      height="100%"
      theme={getTransparentTheme(isDark)}
      placeholder="# Python code"
      basicSetup={SETUP}
      extensions={extensions}
      value={value}
      onChange={onChange}
    />
  );
};

export default PythonEditor;
