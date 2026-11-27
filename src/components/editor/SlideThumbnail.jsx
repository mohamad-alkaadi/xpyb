import { useDeck } from '../../context/DeckContext.jsx';
import SlideCanvas from '../slides/SlideCanvas.jsx';
import SlideStage from '../slides/SlideStage.jsx';

const SlideThumbnail = ({ slide, number }) => {
  const { activeSlide, selectSlide } = useDeck();
  const isActive = slide === activeSlide;

  return (
    <li className="flex w-32 shrink-0 items-start gap-1 md:w-full">
      <span className="w-5 shrink-0 text-right text-xs text-slate-500">{number}</span>
      <div
        className={`relative aspect-video min-w-0 flex-1 rounded border-2 ${isActive ? 'border-sky-600' : 'border-slate-300'}`}
      >
        <div aria-hidden="true" inert className="pointer-events-none h-full w-full">
          <SlideStage>
            <SlideCanvas slide={slide} />
          </SlideStage>
        </div>
        <button
          type="button"
          aria-label={`Slide ${number}`}
          aria-current={isActive ? 'true' : undefined}
          className="absolute inset-0 cursor-pointer"
          onClick={() => selectSlide(slide.id)}
        />
      </div>
    </li>
  );
};

export default SlideThumbnail;
