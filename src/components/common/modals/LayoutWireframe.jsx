import { getWireframeBox } from '../../../lib/layouts/wireframe.js';

const LayoutWireframe = ({ layout }) => (
  <span aria-hidden="true" className="relative block aspect-video w-full rounded border border-slate-300 bg-white">
    {layout.slots.map((slot) => (
      <span
        key={slot.id}
        className={`absolute rounded-sm border border-slate-400 ${slot.bold ? 'bg-slate-300' : 'bg-slate-100'}`}
        style={getWireframeBox(slot.box)}
      />
    ))}
  </span>
);

export default LayoutWireframe;
