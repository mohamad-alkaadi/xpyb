import { usePresentation } from '../../context/PresentationContext.jsx';
import SlideCanvas from '../slides/SlideCanvas.jsx';

const PresentationSlide = () => {
  const { slide, liveCellId } = usePresentation();

  if (!slide) {
    return (
      <p className="flex h-full items-center justify-center text-4xl text-white">
        This deck has no slides.
      </p>
    );
  }

  return <SlideCanvas key={slide.id} slide={slide} isPresenting liveCellId={liveCellId} />;
};

export default PresentationSlide;
