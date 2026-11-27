import { createContext, useContext } from 'react';

const PairedCellContext = createContext(null);

/**
 * Reads the presented code cell and the slot that shows it.
 * @returns {{slot: object, cell: object}} Slot schema and code cell.
 */
export const usePairedCell = () => {
  const value = useContext(PairedCellContext);
  if (!value) throw new Error('usePairedCell must be used inside PairedCellProvider.');
  return value;
};

const PairedCellProvider = ({ slot, cell, children }) => (
  <PairedCellContext.Provider value={{ slot, cell }}>{children}</PairedCellContext.Provider>
);

export default PairedCellProvider;
