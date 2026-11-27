import { useDeck } from '../../context/DeckContext.jsx';
import DeckStatus from '../common/status/DeckStatus.jsx';
import CodeStyleControls from './CodeStyleControls.jsx';
import ColorControls from './ColorControls.jsx';
import KernelError from '../common/status/KernelError.jsx';
import InterpreterPicker from './InterpreterPicker.jsx';
import LayoutButton from './LayoutButton.jsx';
import PresentButton from './PresentButton.jsx';
import SaveButton from './SaveButton.jsx';
import SlideActions from './SlideActions.jsx';
import SyncButton from './SyncButton.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import TitleAlignControl from './TitleAlignControl.jsx';

const EditorToolbar = () => {
  const { deck, filePath } = useDeck();

  return (
    <header className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-900">
      <h1 className="text-lg font-semibold">xpyb</h1>
      {filePath && (
        <p className="min-w-0 max-w-full flex-1 basis-40 truncate text-sm text-slate-600 dark:text-slate-400">{filePath}</p>
      )}
      <ThemeToggle />
      {deck && (
        <div className="ml-auto flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <SaveButton />
          <PresentButton />
          <SlideActions />
          <LayoutButton />
          <TitleAlignControl />
          <ColorControls />
          <CodeStyleControls />
          <SyncButton key={filePath} />
          <InterpreterPicker />
          <DeckStatus />
          <KernelError />
        </div>
      )}
    </header>
  );
};

export default EditorToolbar;
