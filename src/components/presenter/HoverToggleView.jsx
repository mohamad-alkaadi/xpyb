import { usePairedCell } from '../../context/PairedCellContext.jsx';
import { useCellView } from '../../context/useCellView.js';
import { otherView, VIEW_LABELS } from '../../lib/presentation/modes.js';
import PairedPane from './PairedPane.jsx';

const HoverToggleView = () => {
  const { cell } = usePairedCell();
  const { view, show } = useCellView(cell.id);
  const target = otherView(view);

  return (
    <div className="group/paired relative h-full min-h-0 w-full">
      <div className="h-full overflow-auto">
        <PairedPane view={view} />
      </div>
      <button
        type="button"
        className="pointer-events-none absolute right-2 top-2 z-20 origin-top-right cursor-pointer whitespace-nowrap rounded-full bg-slate-900/85 px-3 py-1 font-sans text-xs font-semibold text-white opacity-0 shadow-lg ring-1 ring-white/30 transition-opacity hover:bg-sky-600 focus-visible:pointer-events-auto focus-visible:opacity-100 group-hover/paired:pointer-events-auto group-hover/paired:opacity-100"
        style={{ scale: 'min(2.5, calc(1 / var(--stage-scale, 1)))' }}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => show(target)}
      >
        {`Show ${VIEW_LABELS[target]}`}
      </button>
    </div>
  );
};

export default HoverToggleView;
