import { MAX_BACKDROP } from '../../lib/slides/codeStyle.js';

const BackdropSlider = ({ value, onChange }) => (
  <label className="flex items-center gap-1">
    <span>Code backdrop</span>
    <input
      type="range"
      className="w-24 cursor-pointer"
      min="0"
      max={MAX_BACKDROP}
      step="5"
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
    />
    <output className="w-9 tabular-nums">{`${value}%`}</output>
  </label>
);

export default BackdropSlider;
