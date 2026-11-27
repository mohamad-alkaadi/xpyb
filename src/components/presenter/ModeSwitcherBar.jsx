import { usePresentation } from '../../context/PresentationContext.jsx';
import { useModeReveal } from '../../context/useModeReveal.js';
import { DISPLAY_MODES } from '../../lib/presentation/modes.js';

const ModeSwitcherBar = () => {
  const { displayMode, modeCue, setDisplayMode } = usePresentation();
  const { isRevealed, setIsHovered } = useModeReveal(modeCue);
  const visibility = isRevealed
    ? 'pointer-events-auto translate-y-0 opacity-100'
    : 'pointer-events-none -translate-y-full opacity-0';

  return (
    <div
      data-testid="mode-switcher"
      className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div data-testid="mode-hot-zone" className="pointer-events-auto absolute inset-x-0 top-0 h-6" />
      <div
        role="group"
        aria-label="Presentation display mode"
        data-revealed={isRevealed}
        className={`relative m-2 flex max-w-full flex-wrap justify-center gap-1 rounded-2xl bg-slate-900/90 p-1 text-sm font-medium text-slate-200 shadow-xl ring-1 ring-white/20 transition duration-200 focus-within:pointer-events-auto focus-within:translate-y-0 focus-within:opacity-100 ${visibility}`}
      >
        {DISPLAY_MODES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={id === displayMode}
            className="cursor-pointer rounded-xl px-3 py-1.5 hover:bg-white/10 aria-pressed:bg-sky-600 aria-pressed:text-white"
            // Keeping focus where it was lets Space and the arrows keep driving the slides.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setDisplayMode(id)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ModeSwitcherBar;
