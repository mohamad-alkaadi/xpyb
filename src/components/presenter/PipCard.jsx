import { usePairedCell } from '../../context/PairedCellContext.jsx';
import { useSlide } from '../../context/SlideContext.jsx';
import { useCellView } from '../../context/useCellView.js';
import { DEFAULT_COLORS } from '../../lib/deck/slideActions.js';
import { PIP_SIZE, VIEW_LABELS } from '../../lib/presentation/modes.js';
import PipPreview from './PipPreview.jsx';

const PipCard = ({ view }) => {
  const { cell } = usePairedCell();
  const { slide } = useSlide();
  const { show } = useCellView(cell.id);

  return (
    <div
      data-testid="pip-card"
      data-view={view}
      className="absolute bottom-0 right-0 z-20 flex max-h-full max-w-full flex-col overflow-hidden rounded-lg border border-current/40 shadow-2xl hover:border-sky-500"
      style={{
        ...PIP_SIZE,
        backgroundColor: slide.backgroundColor || DEFAULT_COLORS.backgroundColor,
        color: slide.textColor || DEFAULT_COLORS.textColor,
      }}
    >
      <p className="shrink-0 border-b border-current/25 px-2 text-left font-sans text-xs font-semibold">
        {VIEW_LABELS[view]}
      </p>
      {/* Inert so that links and scrolling inside the preview never swallow the swap click. */}
      <div inert className="min-h-0 flex-1 overflow-hidden">
        <PipPreview view={view} />
      </div>
      <button
        type="button"
        aria-label={`Enlarge ${VIEW_LABELS[view]}`}
        title={`Enlarge ${VIEW_LABELS[view]}`}
        className="absolute inset-0 cursor-pointer"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => show(view)}
      />
    </div>
  );
};

export default PipCard;
