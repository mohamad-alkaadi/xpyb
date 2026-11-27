import { useDeck } from '../../context/DeckContext.jsx';
import { useSlide } from '../../context/SlideContext.jsx';
import { listOutputSources } from '../../lib/slides/outputs.js';

const OutputBinding = ({ slot, boundId }) => {
  const { deck, bindSlotOutput } = useDeck();
  const { slide } = useSlide();

  return (
    <select
      aria-label={`${slot.label} output source`}
      className="pointer-events-none absolute bottom-1 right-1 max-w-[40%] origin-bottom-right rounded border border-slate-300 bg-white font-sans text-xs text-slate-700 opacity-0 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100"
      style={{ scale: 'min(2.5, calc(1 / var(--stage-scale, 1)))' }}
      value={boundId}
      onChange={(event) =>
        bindSlotOutput({ slideId: slide.id, slotId: slot.id }, event.target.value)
      }
    >
      <option value="" disabled>
        Choose code cell
      </option>
      {listOutputSources(deck).map((source) => (
        <option key={source.id} value={source.id}>
          {source.label}
        </option>
      ))}
    </select>
  );
};

export default OutputBinding;
