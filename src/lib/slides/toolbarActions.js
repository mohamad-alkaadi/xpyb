/**
 * Describes the slide toolbar buttons for the active slide.
 * @param {object} deck Deck context value.
 * @returns {{label: string, disabled: boolean, run: Function}[]} Buttons.
 */
export const getSlideButtons = ({ deck, activeSlide, ...actions }) => {
  const index = deck.slides.indexOf(activeSlide);
  const id = activeSlide?.id;
  const last = deck.slides.length - 1;
  return [
    { label: 'Add', disabled: false, run: () => actions.addSlide() },
    { label: 'Duplicate', disabled: !activeSlide, run: () => actions.duplicateSlide(id) },
    { label: 'Delete', disabled: !activeSlide, run: () => actions.deleteSlide(id) },
    { label: 'Move up', disabled: index <= 0, run: () => actions.moveSlide(id, -1) },
    { label: 'Move down', disabled: index < 0 || index >= last, run: () => actions.moveSlide(id, 1) },
  ];
};
