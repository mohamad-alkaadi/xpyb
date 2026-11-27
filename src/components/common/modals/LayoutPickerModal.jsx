import { useEffect, useRef } from 'react';
import { LAYOUTS } from '../../../lib/layouts/schemas.js';
import LayoutWireframe from './LayoutWireframe.jsx';

const LayoutPickerModal = ({ selectedId, onSelect, onClose }) => {
  const dialogRef = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    dialogRef.current.focus();
    return () => previous?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Choose a layout"
        tabIndex={-1}
        className="max-h-full w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-4 text-slate-900 shadow-xl outline-none"
        onKeyDown={(event) => event.key === 'Escape' && onClose()}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Choose a layout</h2>
          <button type="button" className="cursor-pointer rounded px-2 py-1 hover:bg-slate-100" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2 md:gap-3">
          {LAYOUTS.map((layout) => (
            <button
              key={layout.id}
              type="button"
              aria-pressed={layout.id === selectedId}
              className="flex min-w-0 cursor-pointer flex-col gap-1 rounded-md border-2 border-transparent p-1 text-center hover:bg-sky-50 aria-pressed:border-sky-600"
              onClick={() => onSelect(layout.id)}
            >
              <LayoutWireframe layout={layout} />
              <span className="break-words text-[11px] leading-tight md:text-xs">{layout.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LayoutPickerModal;
