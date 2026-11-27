import { useDeck } from '../../../context/DeckContext.jsx';

const DeckStatus = () => {
  const { deck, status, error } = useDeck();

  if (error) {
    return (
      <p role="alert" className="break-words text-red-500">
        {error}
      </p>
    );
  }
  if (status === 'busy') return <p role="status">Loading…</p>;
  if (!deck) return <p>No deck open.</p>;
  const count = deck.slides.length;
  return <p>{`${count} ${count === 1 ? 'slide' : 'slides'}`}</p>;
};

export default DeckStatus;
