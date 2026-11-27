import { getWireframeBox } from '../../../lib/layouts/wireframe.js';

const LayoutWireframe = ({ layout }) => (
  <span aria-hidden="true" className="relative block aspect-video w-full rounded border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800">
    {layout.slots.map((slot) => (
      <span
        key={slot.id}
        className={`absolute rounded-sm border border-slate-400 dark:border-slate-500 ${slot.bold ? 'bg-slate-300 dark:bg-slate-500' : 'bg-slate-100 dark:bg-slate-700'}`}
        style={getWireframeBox(slot.box)}
      />
    ))}
  </span>
);

export default LayoutWireframe;
