import { useDeck } from '../../context/DeckContext.jsx';
import { useSlide } from '../../context/SlideContext.jsx';
import { useCellOutput } from '../../context/useCellOutput.js';
import { getCodeAppearance } from '../../lib/slides/codeStyle.js';
import { findBoundCell } from '../../lib/slides/outputs.js';
import CellOutput from '../common/code/CellOutput.jsx';
import CodeSurface from '../common/code/CodeSurface.jsx';
import OutputBinding from './OutputBinding.jsx';

const OutputSlot = ({ slot, cell }) => {
  const { deck } = useDeck();
  const { slide, isEditable } = useSlide();
  const bound = findBoundCell(deck, cell);
  const { items, isRunning } = useCellOutput(bound);

  return (
    <CodeSurface appearance={getCodeAppearance(slide)}>
      <div className="flex h-full flex-col gap-2 overflow-auto p-2 text-left font-normal" style={{ fontSize: Math.min(slot.fontSize, 24) }}>
        {isEditable && <OutputBinding slot={slot} boundId={bound?.id || ''} />}
        <CellOutput items={items} isRunning={isRunning} />
        {isEditable && !isRunning && items.length === 0 && (
          <p className="opacity-40">{bound ? 'No output yet.' : 'Choose a code cell to show its output.'}</p>
        )}
      </div>
    </CodeSurface>
  );
};

export default OutputSlot;
