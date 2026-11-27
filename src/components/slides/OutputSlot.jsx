import { useDeck } from '../../context/DeckContext.jsx';
import { useKernel } from '../../context/KernelContext.jsx';
import { useSlide } from '../../context/SlideContext.jsx';
import { getCodeAppearance } from '../../lib/slides/codeStyle.js';
import { findBoundCell, normalizeOutputs } from '../../lib/slides/outputs.js';
import CodeSurface from '../common/code/CodeSurface.jsx';
import OutputBinding from './OutputBinding.jsx';
import OutputItem from './OutputItem.jsx';

const OutputSlot = ({ slot, cell }) => {
  const { deck } = useDeck();
  const { results } = useKernel();
  const { slide, isEditable } = useSlide();
  const bound = findBoundCell(deck, cell);
  const result = bound && results[bound.id];
  const items = normalizeOutputs((result || bound)?.outputs);
  const isRunning = result?.status === 'running';

  return (
    <CodeSurface appearance={getCodeAppearance(slide)}>
      <div className="flex h-full flex-col gap-2 overflow-auto p-2 text-left font-normal" style={{ fontSize: Math.min(slot.fontSize, 24) }}>
        {isEditable && <OutputBinding slot={slot} boundId={bound?.id || ''} />}
        {isRunning && <p role="status">Running…</p>}
        {!isRunning && items.map((item, index) => <OutputItem key={index} item={item} />)}
        {isEditable && !isRunning && items.length === 0 && (
          <p className="opacity-40">{bound ? 'No output yet.' : 'Choose a code cell to show its output.'}</p>
        )}
      </div>
    </CodeSurface>
  );
};

export default OutputSlot;
