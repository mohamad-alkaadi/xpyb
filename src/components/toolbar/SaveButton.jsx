import { useDeck } from '../../context/DeckContext.jsx';

const SaveButton = () => {
  const { isDirty, isSaving, saveDeck } = useDeck();

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        title="Save (Ctrl+S / Cmd+S)"
        className="cursor-pointer rounded border border-slate-300 px-2 py-1 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700 disabled:cursor-default disabled:opacity-40"
        disabled={!isDirty || isSaving}
        onClick={saveDeck}
      >
        {isSaving ? 'Saving…' : 'Save'}
      </button>
      <span aria-live="polite" className="text-amber-700 dark:text-amber-400">
        {isDirty ? '● Unsaved changes' : ''}
      </span>
    </div>
  );
};

export default SaveButton;
