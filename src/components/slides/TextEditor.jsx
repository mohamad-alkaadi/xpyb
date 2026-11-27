import { useDeck } from '../../context/DeckContext.jsx';
import { useSlide } from '../../context/SlideContext.jsx';

const TextEditor = ({ slot, source, onClose }) => {
  const { setSlotSource } = useDeck();
  const { slide } = useSlide();

  const handleChange = (event) => {
    const target = { slideId: slide.id, slotId: slot.id, mode: 'text' };
    setSlotSource(target, event.target.value);
  };

  return (
    <textarea
      autoFocus
      aria-label={`${slot.label} text`}
      className="h-full w-full resize-none bg-transparent p-2 outline-none [font:inherit] [text-align:inherit]"
      value={source}
      onChange={handleChange}
      onBlur={onClose}
      onKeyDown={(event) => event.key === 'Escape' && onClose()}
    />
  );
};

export default TextEditor;
