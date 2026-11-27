import { usePresentation } from '../../context/PresentationContext.jsx';
import HoverToggleView from './HoverToggleView.jsx';
import PipView from './PipView.jsx';
import TabsView from './TabsView.jsx';

const VIEWS = { 'hover-toggle': HoverToggleView, tabs: TabsView, pip: PipView };

const PresentedCode = () => {
  const { displayMode } = usePresentation();
  const View = VIEWS[displayMode];

  return <View />;
};

export default PresentedCode;
