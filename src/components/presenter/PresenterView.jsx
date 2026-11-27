import DeckStatus from '../common/status/DeckStatus.jsx';

const PresenterView = () => (
  <main
    aria-label="Presentation"
    className="flex h-full items-center justify-center bg-black p-4 text-center text-white"
  >
    <DeckStatus />
  </main>
);

export default PresenterView;
