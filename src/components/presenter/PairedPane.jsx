import { usePairedCell } from '../../context/PairedCellContext.jsx';
import CodeSlot from '../slides/CodeSlot.jsx';
import OutputPane from './OutputPane.jsx';

const PairedPane = ({ view }) => {
  const { slot, cell } = usePairedCell();

  if (view === 'code') return <CodeSlot slot={slot} cell={cell} />;

  return <OutputPane fontSize={Math.min(slot.fontSize, 24)} />;
};

export default PairedPane;
