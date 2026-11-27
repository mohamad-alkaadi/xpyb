const RunButton = ({ label, isRunning, disabled, onClick }) => (
  <button
    type="button"
    aria-label={`Run ${label} code`}
    title="Run cell (Shift+Enter)"
    className="absolute bottom-1 right-1 z-10 origin-bottom-right cursor-pointer rounded-md border border-slate-300 bg-white px-2 py-1 font-sans text-xs font-medium text-slate-700 shadow-md hover:bg-sky-100 disabled:cursor-default disabled:opacity-40"
    style={{ scale: 'min(2.5, calc(1 / var(--stage-scale, 1)))' }}
    disabled={disabled}
    onClick={onClick}
  >
    {isRunning ? 'Running…' : '▶ Run'}
  </button>
);

export default RunButton;
