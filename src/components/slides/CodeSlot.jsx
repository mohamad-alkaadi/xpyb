import { useDeck } from '../../context/DeckContext.jsx';
import { useSlide } from '../../context/SlideContext.jsx';
import { useRunCell } from '../../context/useRunCell.js';
import { canRun } from '../../lib/kernel/results.js';
import { getCodeAppearance } from '../../lib/slides/codeStyle.js';
import { getCodeFontSize } from '../../lib/slides/codeTheme.js';
import CodeBlock from '../common/code/CodeBlock.jsx';
import CodeSurface from '../common/code/CodeSurface.jsx';
import PythonEditor from '../common/code/PythonEditor.jsx';
import RunButton from './RunButton.jsx';

const CodeSlot = ({ slot, cell }) => {
  const { setSlotSource } = useDeck();
  const { slide, isEditable, liveCellId } = useSlide();
  const { result, run } = useRunCell(cell?.id);
  const source = cell?.source || '';
  const appearance = getCodeAppearance(slide);
  const shared = { isDark: appearance.isDark, fontSize: getCodeFontSize(slot) };

  const handleChange = (value) =>
    setSlotSource({ slideId: slide.id, slotId: slot.id, mode: 'code' }, value);

  return (
    <CodeSurface appearance={appearance}>
      {isEditable || liveCellId ? (
        <>
          <PythonEditor
            {...shared}
            label={`${slot.label} code`}
            autoFocus={Boolean(liveCellId) && cell?.id === liveCellId}
            value={source}
            onChange={handleChange}
            onRun={run}
          />
          <RunButton
            label={slot.label}
            isRunning={result?.status === 'running'}
            disabled={!canRun(source, result)}
            onClick={() => run(source)}
          />
        </>
      ) : (
        <CodeBlock {...shared} code={source} />
      )}
    </CodeSurface>
  );
};

export default CodeSlot;
