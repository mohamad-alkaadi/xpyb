import ViewSwitch from './components/presenter/ViewSwitch.jsx';
import DeckProvider from './context/DeckContext.jsx';
import KernelProvider from './context/KernelContext.jsx';
import PresentationProvider from './context/PresentationContext.jsx';
import ThemeProvider from './context/ThemeContext.jsx';
import { parseLaunchRequest } from './lib/app/launchRequest.js';

const App = () => {
  const { mode, filePath } = parseLaunchRequest(window.location.search);

  return (
    <ThemeProvider>
      <DeckProvider initialPath={filePath}>
        <KernelProvider>
          <PresentationProvider startPresenting={mode === 'present'}>
            <ViewSwitch />
          </PresentationProvider>
        </KernelProvider>
      </DeckProvider>
    </ThemeProvider>
  );
};

export default App;
