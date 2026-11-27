import OutputItem from '../../slides/OutputItem.jsx';

const CellOutput = ({ items, isRunning }) => {
  if (isRunning) return <p role="status">Running…</p>;

  return items.map((item, index) => <OutputItem key={index} item={item} />);
};

export default CellOutput;
