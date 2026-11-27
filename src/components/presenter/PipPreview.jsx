import { usePairedCell } from '../../context/PairedCellContext.jsx';
import { useSlide } from '../../context/SlideContext.jsx';
import { getCodeAppearance } from '../../lib/slides/codeStyle.js';
import CodeBlock from '../common/code/CodeBlock.jsx';
import CodeSurface from '../common/code/CodeSurface.jsx';
import OutputPane from './OutputPane.jsx';

const PREVIEW_FONT_SIZE = 12;

const PipPreview = ({ view }) => {
  const { cell } = usePairedCell();
  const { slide } = useSlide();
  const appearance = getCodeAppearance(slide);

  if (view === 'output') return <OutputPane fontSize={PREVIEW_FONT_SIZE} />;

  return (
    <CodeSurface appearance={appearance}>
      <CodeBlock code={cell.source || ''} isDark={appearance.isDark} fontSize={PREVIEW_FONT_SIZE} />
    </CodeSurface>
  );
};

export default PipPreview;
