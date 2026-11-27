import { usePresentation } from '../../context/PresentationContext.jsx';
import EditorView from '../editor/EditorView.jsx';
import PresenterView from './PresenterView.jsx';

const ViewSwitch = () => {
  const { isPresenting } = usePresentation();

  return isPresenting ? <PresenterView /> : <EditorView />;
};

export default ViewSwitch;
