import { useSlide } from '../../context/SlideContext.jsx';
import { getSlotMode, mapSlots } from '../../lib/layouts/slotMapper.js';
import SlotContent from './SlotContent.jsx';
import SlotModeSwitcher from './SlotModeSwitcher.jsx';

const VERTICAL = { start: 'flex-start', center: 'center', end: 'flex-end' };

const SlotFrame = ({ slot }) => {
  const { slide, isEditable } = useSlide();
  const cell = mapSlots(slide).slots[slot.id];
  const { x, y, width, height } = slot.box;

  return (
    <div
      data-slot={slot.id}
      // Focusable so that tapping a slot on touch screens reveals its controls.
      tabIndex={isEditable ? -1 : undefined}
      className={`group absolute ${isEditable ? 'outline-1 outline-dashed outline-current/20 hover:outline-sky-500 focus-within:outline-sky-500' : ''}`}
      style={{ left: x, top: y, width, height }}
    >
      <div
        className="flex h-full w-full flex-col overflow-auto"
        style={{
          justifyContent: `safe ${VERTICAL[slot.valign]}`,
          textAlign: slot.align,
          fontSize: slot.fontSize,
          fontWeight: slot.bold ? 700 : 400,
        }}
      >
        <SlotContent slot={slot} cell={cell} />
      </div>
      {isEditable && <SlotModeSwitcher slot={slot} mode={getSlotMode(cell)} />}
    </div>
  );
};

export default SlotFrame;
