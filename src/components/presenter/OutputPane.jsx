import { usePairedCell } from '../../context/PairedCellContext.jsx';
import { useSlide } from '../../context/SlideContext.jsx';
import { useCellOutput } from '../../context/useCellOutput.js';
import { getCodeAppearance } from '../../lib/slides/codeStyle.js';
import CellOutput from '../common/code/CellOutput.jsx';
import CodeSurface from '../common/code/CodeSurface.jsx';

const OutputPane = ({ fontSize }) => {
  const { cell } = usePairedCell();
  const { slide } = useSlide();
  const { items, isRunning } = useCellOutput(cell);

  return (
    <CodeSurface appearance={getCodeAppearance(slide)}>
      <div className="flex h-full flex-col gap-2 overflow-auto p-2 text-left font-normal" style={{ fontSize }}>
        <CellOutput items={items} isRunning={isRunning} />
        {!isRunning && items.length === 0 && <p className="opacity-40">No output.</p>}
      </div>
    </CodeSurface>
  );
};

export default OutputPane;
