import SlideProvider from '../../context/SlideContext.jsx';
import { DEFAULT_COLORS } from '../../lib/deck/slideActions.js';
import { getLayout } from '../../lib/layouts/schemas.js';
import SlotFrame from './SlotFrame.jsx';

const SlideCanvas = ({ slide, isEditable = false, liveCellId = null }) => (
  <SlideProvider slide={slide} isEditable={isEditable} liveCellId={liveCellId}>
    <div
      data-testid="slide-canvas"
      className="relative h-full w-full"
      style={{
        backgroundColor: slide.backgroundColor || DEFAULT_COLORS.backgroundColor,
        color: slide.textColor || DEFAULT_COLORS.textColor,
      }}
    >
      {getLayout(slide.layout).slots.map((slot) => (
        <SlotFrame key={slot.id} slot={slot} />
      ))}
    </div>
  </SlideProvider>
);

export default SlideCanvas;
