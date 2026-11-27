import DeckStatus from '../common/status/DeckStatus.jsx';

const IntroScreen = () => (
  <main className="flex flex-1 items-center justify-center bg-white p-4 text-center text-[#0f172a]">
    <div className="w-full max-w-md rounded-xl border border-slate-200 px-8 py-10 text-lg font-semibold">
      <DeckStatus />
    </div>
  </main>
);

export default IntroScreen;
