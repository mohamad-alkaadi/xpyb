import { useDeck } from '../../context/DeckContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import EditorToolbar from '../toolbar/EditorToolbar.jsx';
import EditorStage from './EditorStage.jsx';
import IntroScreen from './IntroScreen.jsx';
import SlideSidebar from './SlideSidebar.jsx';

const EditorView = () => {
  const { deck } = useDeck();
  const { theme } = useTheme();

  return (
    <div
      data-theme={theme}
      className="flex h-full min-w-0 flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100"
    >
      <EditorToolbar />
      {deck ? (
        <div className="flex min-h-0 flex-1 flex-col-reverse md:flex-row">
          <SlideSidebar />
          <main className="flex min-h-0 min-w-0 flex-1">
            <EditorStage />
          </main>
        </div>
      ) : (
        <IntroScreen />
      )}
    </div>
  );
};

export default EditorView;
