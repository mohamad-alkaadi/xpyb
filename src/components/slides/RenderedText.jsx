import { useMemo } from 'react';
import { renderMarkdown } from '../../lib/slides/markdown.js';

const RenderedText = ({ source, isTitle = false }) => {
  const html = useMemo(() => renderMarkdown(source), [source]);

  return (
    <div className="p-2">
      <div
        className={`slide-text ${isTitle ? 'slide-title line-clamp-2' : ''}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};

export default RenderedText;
