import { getCellView } from '../lib/presentation/modes.js';
import { usePresentation } from './PresentationContext.jsx';

/**
 * Provides the view of one presented code cell.
 * @param {string} cellId Code cell id.
 * @returns {{view: ('code'|'output'), show: (view: string) => void}} Active view and switcher.
 */
export const useCellView = (cellId) => {
  const { views, showView } = usePresentation();
  const show = (view) => showView(cellId, view);
  return { view: getCellView(views, cellId), show };
};
