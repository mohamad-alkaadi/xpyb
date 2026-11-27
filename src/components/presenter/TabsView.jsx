import { useId } from 'react';
import { usePairedCell } from '../../context/PairedCellContext.jsx';
import { useCellView } from '../../context/useCellView.js';
import { VIEW_LABELS } from '../../lib/presentation/modes.js';
import PairedPane from './PairedPane.jsx';
import ViewTab from './ViewTab.jsx';

const TabsView = () => {
  const { cell } = usePairedCell();
  const { view } = useCellView(cell.id);
  const panelId = useId();

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div role="tablist" aria-label="Code and output" className="flex shrink-0 gap-1 border-b border-current/25 font-sans">
        {Object.keys(VIEW_LABELS).map((option) => (
          <ViewTab key={option} view={option} panelId={panelId} />
        ))}
      </div>
      <div id={panelId} role="tabpanel" aria-label={VIEW_LABELS[view]} className="min-h-0 flex-1 overflow-auto">
        <PairedPane view={view} />
      </div>
    </div>
  );
};

export default TabsView;
