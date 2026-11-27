import { getSlotMode } from '../../lib/layouts/slotMapper.js';
import CodeSlot from './CodeSlot.jsx';
import OutputSlot from './OutputSlot.jsx';
import TextSlot from './TextSlot.jsx';

const VIEWS = { text: TextSlot, code: CodeSlot, output: OutputSlot };

const SlotContent = ({ slot, cell }) => {
  const View = VIEWS[getSlotMode(cell)];

  return <View slot={slot} cell={cell} />;
};

export default SlotContent;
