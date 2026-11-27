import { python } from '@codemirror/lang-python';
import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { oneDarkHighlightStyle } from '@codemirror/theme-one-dark';
import CodeMirror from '@uiw/react-codemirror';
import { useDeck } from '../../context/DeckContext.jsx';
import { useSlide } from '../../context/SlideContext.jsx';
import { getCodeFontSize, getCodeTheme } from '../../lib/slides/codeTheme.js';

const SETUP = { foldGutter: false, highlightActiveLine: false, highlightActiveLineGutter: false };

const CodeSlot = ({ slot, cell }) => {
  const { setSlotSource } = useDeck();
  const { slide, isEditable } = useSlide();
  const source = cell?.source || '';
  const fontSize = getCodeFontSize(slot);

  if (!isEditable) {
    return (
      <pre className="h-full whitespace-pre-wrap p-2 text-left font-mono font-normal" style={{ fontSize }}>
        {source}
      </pre>
    );
  }

  const highlight = getCodeTheme(slide.backgroundColor, {
    light: defaultHighlightStyle,
    dark: oneDarkHighlightStyle,
  });

  return (
    <CodeMirror
      aria-label={`${slot.label} code`}
      className="slide-code h-full text-left font-normal"
      style={{ fontSize }}
      height="100%"
      theme="none"
      placeholder="# Python code"
      basicSetup={SETUP}
      extensions={[python(), syntaxHighlighting(highlight)]}
      value={source}
      onChange={(value) =>
        setSlotSource({ slideId: slide.id, slotId: slot.id, mode: 'code' }, value)
      }
    />
  );
};

export default CodeSlot;
