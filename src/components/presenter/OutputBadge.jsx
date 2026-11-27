import { usePairedCell } from '../../context/PairedCellContext.jsx';
import { useCellOutput } from '../../context/useCellOutput.js';
import { getOutputBadge } from '../../lib/presentation/modes.js';

const BADGES = {
  ready: { label: 'Output ready', color: 'bg-sky-500' },
  error: { label: 'Error ready', color: 'bg-red-500' },
};

const OutputBadge = () => {
  const { cell } = usePairedCell();
  const badge = BADGES[getOutputBadge(useCellOutput(cell))];

  if (!badge) return null;

  return <span role="img" aria-label={badge.label} className={`h-2.5 w-2.5 rounded-full ${badge.color}`} />;
};

export default OutputBadge;
