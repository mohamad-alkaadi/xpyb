import { useState } from 'react';
import { useSlide } from '../../context/SlideContext.jsx';
import RenderedText from './RenderedText.jsx';
import TextEditor from './TextEditor.jsx';

const TextSlot = ({ slot, cell }) => {
  const { isEditable } = useSlide();
  const [isEditing, setIsEditing] = useState(false);
  const source = cell?.source || '';

  const startEditing = (event) => {
    event.preventDefault();
    setIsEditing(true);
  };

  if (!isEditable) return <RenderedText source={source} />;
  if (isEditing) {
    return <TextEditor slot={slot} source={source} onClose={() => setIsEditing(false)} />;
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Edit ${slot.label}`}
      className="flex min-h-full cursor-text flex-col [justify-content:inherit]"
      onClick={startEditing}
      onKeyDown={(event) => event.key === 'Enter' && startEditing(event)}
    >
      {source ? (
        <RenderedText source={source} />
      ) : (
        <p className="p-2 opacity-40">{`Click to add ${slot.label.toLowerCase()}`}</p>
      )}
    </div>
  );
};

export default TextSlot;
