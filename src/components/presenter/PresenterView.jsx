import { useDeck } from '../../context/DeckContext.jsx';
import { usePresentation } from '../../context/PresentationContext.jsx';
import DeckStatus from '../common/status/DeckStatus.jsx';
import KernelError from '../common/status/KernelError.jsx';
import SlideStage from '../slides/SlideStage.jsx';
import CompileProgress from './CompileProgress.jsx';
import PresentationSlide from './PresentationSlide.jsx';

const PresenterView = () => {
  const { deck } = useDeck();
  const { progress } = usePresentation();

  return (
    <main
      aria-label="Presentation"
      className="relative flex h-full items-center justify-center bg-black text-center text-white"
    >
      {deck ? (
        <SlideStage label="Presentation slide" backdropClass="bg-black">
          {progress.isReady ? <PresentationSlide /> : <CompileProgress />}
        </SlideStage>
      ) : (
        <DeckStatus />
      )}
      <div className="absolute inset-x-0 bottom-0 flex justify-center px-4">
        <KernelError />
      </div>
    </main>
  );
};

export default PresenterView;
