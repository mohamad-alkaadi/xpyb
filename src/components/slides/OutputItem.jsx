import ErrorOutput from './ErrorOutput.jsx';
import HtmlOutput from './HtmlOutput.jsx';
import ImageOutput from './ImageOutput.jsx';
import LatexOutput from './LatexOutput.jsx';
import StreamOutput from './StreamOutput.jsx';

const RENDERERS = {
  text: StreamOutput,
  error: ErrorOutput,
  html: HtmlOutput,
  image: ImageOutput,
  latex: LatexOutput,
};

const OutputItem = ({ item }) => {
  const Renderer = RENDERERS[item.kind];

  return <Renderer item={item} />;
};

export default OutputItem;
