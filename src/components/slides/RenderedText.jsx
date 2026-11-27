import { useMemo } from 'react';
import { renderMarkdown } from '../../lib/slides/markdown.js';

const RenderedText = ({ source }) => {
  const html = useMemo(() => renderMarkdown(source), [source]);

  return <div className="slide-text p-2" dangerouslySetInnerHTML={{ __html: html }} />;
};

export default RenderedText;
