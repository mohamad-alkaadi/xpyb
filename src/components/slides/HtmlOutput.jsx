const HtmlOutput = ({ item }) => (
  // The HTML is sanitized by normalizeOutputs before it reaches this component.
  <div className="slide-text output-html max-w-full" dangerouslySetInnerHTML={{ __html: item.html }} />
);

export default HtmlOutput;
