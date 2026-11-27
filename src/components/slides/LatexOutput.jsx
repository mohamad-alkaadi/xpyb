const LatexOutput = ({ item }) => (
  // KaTeX builds this HTML with trust disabled.
  <div className="output-latex" dangerouslySetInnerHTML={{ __html: item.html }} />
);

export default LatexOutput;
