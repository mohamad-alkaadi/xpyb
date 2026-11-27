import EditorView from './components/editor/EditorView.jsx';
import PresenterView from './components/presenter/PresenterView.jsx';
import DeckProvider from './context/DeckContext.jsx';
import KernelProvider from './context/KernelContext.jsx';
import { parseLaunchRequest } from './lib/app/launchRequest.js';

const App = () => {
  const { mode, filePath } = parseLaunchRequest(window.location.search);

  return (
    <DeckProvider initialPath={filePath}>
      <KernelProvider>{mode === 'present' ? <PresenterView /> : <EditorView />}</KernelProvider>
    </DeckProvider>
  );
};

export default App;
