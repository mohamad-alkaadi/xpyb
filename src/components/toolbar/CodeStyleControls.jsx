import { useDeck } from '../../context/DeckContext.jsx';
import { getCodeSettings } from '../../lib/slides/codeStyle.js';
import AutoContrastToggle from './AutoContrastToggle.jsx';
import BackdropSlider from './BackdropSlider.jsx';
import TintSelect from './TintSelect.jsx';

const CodeStyleControls = () => {
  const { activeSlide, updateSlide } = useDeck();

  if (!activeSlide) return null;
  const { opacity, tint, autoContrast } = getCodeSettings(activeSlide);
  const change = (changes) => updateSlide(activeSlide.id, changes);

  return (
    <div role="group" aria-label="Code block style" className="flex flex-wrap items-center gap-3">
      <BackdropSlider value={opacity} onChange={(codeBackdrop) => change({ codeBackdrop })} />
      <TintSelect value={tint} onChange={(codeTint) => change({ codeTint })} />
      <AutoContrastToggle checked={autoContrast} onChange={(value) => change({ autoContrast: value })} />
    </div>
  );
};

export default CodeStyleControls;
