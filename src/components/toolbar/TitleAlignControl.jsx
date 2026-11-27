import { useDeck } from '../../context/DeckContext.jsx';
import { getTitleAlign, TITLE_ALIGNMENTS } from '../../lib/layouts/schemas.js';

const LABELS = { left: 'Left', center: 'Middle', right: 'Right' };

const TitleAlignControl = () => {
  const { activeSlide, updateSlide } = useDeck();

  if (!activeSlide) return null;
  const current = getTitleAlign(activeSlide);

  return (
    <div role="group" aria-label="Title alignment" className="flex items-center gap-1">
      <span>Title</span>
      <div className="flex overflow-hidden rounded border border-slate-300 dark:border-slate-600">
        {TITLE_ALIGNMENTS.map((titleAlign) => (
          <button
            key={titleAlign}
            type="button"
            aria-pressed={titleAlign === current}
            className="cursor-pointer px-2 py-1 hover:bg-slate-100 aria-pressed:bg-sky-600 aria-pressed:text-white disabled:cursor-default disabled:opacity-40 dark:hover:bg-slate-700 dark:aria-pressed:bg-sky-600"
            disabled={!current}
            onClick={() => updateSlide(activeSlide.id, { titleAlign })}
          >
            {LABELS[titleAlign]}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TitleAlignControl;
