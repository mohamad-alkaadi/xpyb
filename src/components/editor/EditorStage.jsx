import { useDeck } from '../../context/DeckContext.jsx';
import { mapSlots } from '../../lib/layouts/slotMapper.js';
import SlideCanvas from '../slides/SlideCanvas.jsx';
import SlideStage from '../slides/SlideStage.jsx';

const EditorStage = () => {
  const { activeSlide } = useDeck();

  if (!activeSlide) {
    return <p className="m-auto p-4 text-center">This deck has no slides. Use Add to create one.</p>;
  }
  const hiddenCount = mapSlots(activeSlide).hidden.length;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="min-h-0 flex-1">
        <SlideStage label="Slide editor">
          <SlideCanvas key={activeSlide.id} slide={activeSlide} isEditable />
        </SlideStage>
      </div>
      {hiddenCount > 0 && (
        <p className="bg-amber-100 px-4 py-1 text-center text-sm text-amber-900">
          {`Content blocks not shown in this layout: ${hiddenCount}. They are kept in the deck.`}
        </p>
      )}
    </div>
  );
};

export default EditorStage;
