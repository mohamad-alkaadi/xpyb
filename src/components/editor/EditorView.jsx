import { useDeck } from '../../context/DeckContext.jsx';
import DeckStatus from '../common/status/DeckStatus.jsx';
import EditorToolbar from '../toolbar/EditorToolbar.jsx';
import EditorStage from './EditorStage.jsx';
import SlideSidebar from './SlideSidebar.jsx';

const EditorView = () => {
  const { deck } = useDeck();

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden bg-slate-50 text-slate-900">
      <EditorToolbar />
      {deck ? (
        <div className="flex min-h-0 flex-1 flex-col-reverse md:flex-row">
          <SlideSidebar />
          <main className="flex min-h-0 min-w-0 flex-1">
            <EditorStage />
          </main>
        </div>
      ) : (
        <main className="flex flex-1 items-center justify-center p-4 text-center">
          <DeckStatus />
        </main>
      )}
    </div>
  );
};

export default EditorView;
