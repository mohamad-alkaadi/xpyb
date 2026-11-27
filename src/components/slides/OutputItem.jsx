const OutputItem = ({ item }) => {
  if (item.kind === 'image') {
    return <img alt="Cell output" className="max-h-full max-w-full self-start object-contain" src={item.src} />;
  }
  if (item.kind === 'html') {
    return <div className="slide-text" dangerouslySetInnerHTML={{ __html: item.html }} />;
  }

  return (
    <pre className={`whitespace-pre-wrap font-mono ${item.kind === 'error' ? 'text-red-500' : ''}`}>
      {item.text}
    </pre>
  );
};

export default OutputItem;
