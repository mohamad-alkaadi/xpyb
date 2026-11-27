import PairedCellProvider from '../../context/PairedCellContext.jsx';
import { useSlide } from '../../context/SlideContext.jsx';
import { getSlotMode } from '../../lib/layouts/slotMapper.js';
import PresentedCode from '../presenter/PresentedCode.jsx';
import CodeSlot from './CodeSlot.jsx';
import OutputSlot from './OutputSlot.jsx';
import TextSlot from './TextSlot.jsx';

const VIEWS = { text: TextSlot, code: CodeSlot, output: OutputSlot };

const SlotContent = ({ slot, cell }) => {
  const { isPresenting } = useSlide();
  const mode = getSlotMode(cell);
  const View = VIEWS[mode];

  if (isPresenting && mode === 'code') {
    return (
      <PairedCellProvider slot={slot} cell={cell}>
        <PresentedCode />
      </PairedCellProvider>
    );
  }

  return <View slot={slot} cell={cell} />;
};

export default SlotContent;
