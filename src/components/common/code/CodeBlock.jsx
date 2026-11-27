import { useEffect, useMemo } from 'react';
import { StyleModule } from 'style-mod';
import { HIGHLIGHT_STYLES } from '../../../lib/slides/codeTheme.js';
import { highlightPython } from '../../../lib/slides/highlight.js';

const CodeBlock = ({ code, isDark, fontSize }) => {
  const style = HIGHLIGHT_STYLES[isDark ? 'dark' : 'light'];
  const tokens = useMemo(() => highlightPython(code, style), [code, style]);

  useEffect(() => {
    StyleModule.mount(document, style.module);
  }, [style]);

  return (
    <pre className="h-full whitespace-pre-wrap p-2 text-left font-mono font-normal" style={{ fontSize }}>
      {tokens.map((token, index) => (
        <span key={index} className={token.className}>
          {token.text}
        </span>
      ))}
    </pre>
  );
};

export default CodeBlock;
