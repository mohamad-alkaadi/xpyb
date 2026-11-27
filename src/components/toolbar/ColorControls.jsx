import { useDeck } from '../../context/DeckContext.jsx';
import { DEFAULT_COLORS } from '../../lib/deck/slideActions.js';
import { normalizeHex } from '../../lib/slides/contrast.js';
import ColorPicker from './ColorPicker.jsx';

const FIELDS = [
  { field: 'backgroundColor', label: 'Background' },
  { field: 'textColor', label: 'Text color' },
];

const ColorControls = () => {
  const { activeSlide, updateSlide } = useDeck();

  if (!activeSlide) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {FIELDS.map(({ field, label }) => (
        <ColorPicker
          key={field}
          label={label}
          value={normalizeHex(activeSlide[field], DEFAULT_COLORS[field])}
          onChange={(color) => updateSlide(activeSlide.id, { [field]: color })}
        />
      ))}
    </div>
  );
};

export default ColorControls;
