import { useDeck } from '../../context/DeckContext.jsx';
import { useSlide } from '../../context/SlideContext.jsx';
import { SLOT_MODES } from '../../lib/layouts/slotMapper.js';

const LABELS = { text: 'Text', code: 'Code', output: 'Output' };

const SlotModeSwitcher = ({ slot, mode }) => {
  const { setSlotMode } = useDeck();
  const { slide } = useSlide();

  return (
    <div
      role="group"
      aria-label={`${slot.label} content type`}
      className="pointer-events-none absolute right-1 top-1 z-10 flex origin-top-right overflow-hidden rounded-md border border-slate-300 bg-white font-sans text-xs font-medium text-slate-700 opacity-0 shadow-md group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100"
      style={{ scale: 'min(2.5, calc(1 / var(--stage-scale, 1)))' }}
    >
      {SLOT_MODES.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={option === mode}
          className="cursor-pointer px-2 py-1 hover:bg-sky-100 aria-pressed:bg-sky-600 aria-pressed:text-white"
          onClick={() => setSlotMode({ slideId: slide.id, slotId: slot.id }, option)}
        >
          {LABELS[option]}
        </button>
      ))}
    </div>
  );
};

export default SlotModeSwitcher;
