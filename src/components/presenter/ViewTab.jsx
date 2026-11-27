import { usePairedCell } from '../../context/PairedCellContext.jsx';
import { useCellView } from '../../context/useCellView.js';
import { VIEW_LABELS } from '../../lib/presentation/modes.js';
import OutputBadge from './OutputBadge.jsx';

const ViewTab = ({ view, panelId }) => {
  const { cell } = usePairedCell();
  const { view: active, show } = useCellView(cell.id);

  return (
    <button
      type="button"
      role="tab"
      aria-selected={view === active}
      aria-controls={panelId}
      className="flex cursor-pointer items-center gap-2 border-b-2 border-transparent px-4 py-1 text-lg font-semibold opacity-60 hover:opacity-100 aria-selected:border-sky-500 aria-selected:opacity-100"
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => show(view)}
    >
      {VIEW_LABELS[view]}
      {view === 'output' && <OutputBadge />}
    </button>
  );
};

export default ViewTab;
