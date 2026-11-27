import { useDeck } from '../../context/DeckContext.jsx';
import { usePresentation } from '../../context/PresentationContext.jsx';

const PresentButton = () => {
  const { deck } = useDeck();
  const { present } = usePresentation();

  return (
    <button
      type="button"
      title="Present in full screen"
      className="cursor-pointer rounded bg-sky-600 px-3 py-1 font-medium text-white hover:bg-sky-700 disabled:cursor-default disabled:opacity-40"
      disabled={deck.slides.length === 0}
      onClick={present}
    >
      Present
    </button>
  );
};

export default PresentButton;
