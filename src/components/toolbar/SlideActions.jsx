import { useDeck } from '../../context/DeckContext.jsx';
import { getSlideButtons } from '../../lib/slides/toolbarActions.js';

const SlideActions = () => {
  const deck = useDeck();

  return (
    <div role="group" aria-label="Slide actions" className="flex flex-wrap gap-1">
      {getSlideButtons(deck).map((button) => (
        <button
          key={button.label}
          type="button"
          aria-label={`${button.label} slide`}
          className="cursor-pointer rounded border border-slate-300 px-2 py-1 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700 disabled:cursor-default disabled:opacity-40"
          disabled={button.disabled}
          onClick={button.run}
        >
          {button.label}
        </button>
      ))}
    </div>
  );
};

export default SlideActions;
