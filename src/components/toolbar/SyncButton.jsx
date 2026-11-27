import { useState } from 'react';
import { useDeck } from '../../context/DeckContext.jsx';
import { useKernel } from '../../context/KernelContext.jsx';
import { describeSync } from '../../lib/deck/syncSummary.js';

const SyncButton = () => {
  const { deck, syncNotebook } = useDeck();
  const { clearResults } = useKernel();
  const [isBusy, setIsBusy] = useState(false);
  const [report, setReport] = useState(null);

  const handleClick = async () => {
    setIsBusy(true);
    setReport(null);
    try {
      const summary = await syncNotebook();
      clearResults(summary.changedIds);
      setReport({ text: describeSync(summary) });
    } catch (failure) {
      setReport({ text: failure.message, isError: true });
    }
    setIsBusy(false);
  };

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <button
        type="button"
        title={deck.sourceNotebook || 'This deck has no source notebook.'}
        className="cursor-pointer rounded border border-slate-300 px-2 py-1 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700 disabled:cursor-default disabled:opacity-40"
        disabled={!deck.sourceNotebook || isBusy}
        onClick={handleClick}
      >
        {isBusy ? 'Syncing…' : 'Sync from .ipynb'}
      </button>
      {report && (
        <p
          role={report.isError ? 'alert' : 'status'}
          className={`min-w-0 break-words ${report.isError ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}
        >
          {report.text}
        </p>
      )}
    </div>
  );
};

export default SyncButton;
