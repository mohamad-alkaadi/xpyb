import { useState } from 'react';
import { useDeck } from '../../context/DeckContext.jsx';
import { getLayout } from '../../lib/layouts/schemas.js';
import LayoutPickerModal from '../common/modals/LayoutPickerModal.jsx';

const LayoutButton = () => {
  const { activeSlide, updateSlide } = useDeck();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (layout) => {
    updateSlide(activeSlide.id, { layout });
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className="cursor-pointer rounded border border-slate-300 px-2 py-1 hover:bg-slate-100 disabled:cursor-default disabled:opacity-40"
        disabled={!activeSlide}
        onClick={() => setIsOpen(true)}
      >
        Layout
      </button>
      {isOpen && activeSlide && (
        <LayoutPickerModal
          selectedId={getLayout(activeSlide.layout).id}
          onSelect={handleSelect}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default LayoutButton;
