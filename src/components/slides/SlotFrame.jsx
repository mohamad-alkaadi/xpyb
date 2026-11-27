import { useSlide } from '../../context/SlideContext.jsx';
import { getTitleAlign, TITLE_SLOT_ID } from '../../lib/layouts/schemas.js';
import { getSlotMode, mapSlots } from '../../lib/layouts/slotMapper.js';
import SlotContent from './SlotContent.jsx';
import SlotModeSwitcher from './SlotModeSwitcher.jsx';

const VERTICAL = { start: 'flex-start', center: 'center', end: 'flex-end' };

const SlotFrame = ({ slot }) => {
  const { slide, isEditable } = useSlide();
  const cell = mapSlots(slide).slots[slot.id];
  const { x, y, width, height } = slot.box;
  const isTitle = slot.id === TITLE_SLOT_ID;
  const mode = getSlotMode(cell);
  // A text title is clamped to two lines, and its ellipsis may reach just past the slot.
  const overflow = isTitle && mode === 'text' ? 'overflow-visible' : 'overflow-auto';

  return (
    <div
      data-slot={slot.id}
      // Focusable so that tapping a slot on touch screens reveals its controls.
      tabIndex={isEditable ? -1 : undefined}
      className={`group absolute ${isEditable ? 'outline-1 outline-dashed outline-current/20 hover:outline-sky-500 focus-within:outline-sky-500' : ''}`}
      style={{ left: x, top: y, width, height }}
    >
      <div
        className={`flex h-full w-full flex-col ${overflow}`}
        style={{
          justifyContent: `safe ${VERTICAL[slot.valign]}`,
          textAlign: isTitle ? getTitleAlign(slide) : slot.align,
          fontSize: slot.fontSize,
          fontWeight: slot.bold ? 700 : 400,
        }}
      >
        <SlotContent slot={slot} cell={cell} />
      </div>
      {isEditable && <SlotModeSwitcher slot={slot} mode={mode} />}
    </div>
  );
};

export default SlotFrame;
