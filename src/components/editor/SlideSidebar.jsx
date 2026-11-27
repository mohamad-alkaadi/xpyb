import { useDeck } from '../../context/DeckContext.jsx';
import SlideThumbnail from './SlideThumbnail.jsx';

const SlideSidebar = () => {
  const { deck } = useDeck();

  return (
    <nav
      aria-label="Slides"
      className="shrink-0 overflow-auto border-t border-slate-200 bg-slate-100 p-2 md:w-44 md:border-r md:border-t-0 lg:w-60"
    >
      <ol className="flex gap-2 md:flex-col">
        {deck.slides.map((slide, index) => (
          <SlideThumbnail key={slide.id ?? index} slide={slide} number={index + 1} />
        ))}
      </ol>
    </nav>
  );
};

export default SlideSidebar;
