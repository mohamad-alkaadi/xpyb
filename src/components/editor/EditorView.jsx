import { useDeck } from '../../context/DeckContext.jsx';
import DeckStatus from '../common/status/DeckStatus.jsx';

const EditorView = () => {
  const { filePath } = useDeck();

  return (
    <div className="flex h-full min-w-0 flex-col bg-slate-50 text-slate-900">
      <header className="flex min-w-0 flex-col gap-1 border-b border-slate-200 px-4 py-3 md:flex-row md:items-center md:gap-4">
        <h1 className="text-lg font-semibold">xpyb</h1>
        {filePath && <p className="min-w-0 truncate text-sm text-slate-600">{filePath}</p>}
      </header>
      <main className="flex flex-1 items-center justify-center p-4 text-center">
        <DeckStatus />
      </main>
    </div>
  );
};

export default EditorView;
