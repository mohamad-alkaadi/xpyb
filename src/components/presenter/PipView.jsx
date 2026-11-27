import { usePairedCell } from '../../context/PairedCellContext.jsx';
import { useCellView } from '../../context/useCellView.js';
import { otherView, PIP_SIZE } from '../../lib/presentation/modes.js';
import PairedPane from './PairedPane.jsx';
import PipCard from './PipCard.jsx';

// Moves the Run button of unlocked code to the left of the card so the card never covers it.
const RUN_OFFSET = { '--run-right': `${PIP_SIZE.width + 8}px` };

const PipView = () => {
  const { cell } = usePairedCell();
  const { view } = useCellView(cell.id);

  return (
    <div className="relative h-full min-h-0 w-full">
      <div data-testid="pip-primary" data-view={view} className="h-full overflow-auto" style={RUN_OFFSET}>
        <PairedPane view={view} />
      </div>
      <PipCard view={otherView(view)} />
    </div>
  );
};

export default PipView;
