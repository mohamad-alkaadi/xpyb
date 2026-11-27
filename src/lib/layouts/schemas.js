/**
 * Builds a slot definition in 1280x720 logical coordinates.
 * @param {string} id Slot id, shared across layouts so content follows its role.
 * @param {string} label Placeholder label.
 * @param {number[]} box Position and size as [x, y, width, height].
 * @param {object} [text] Text style overrides.
 * @returns {object} Slot definition.
 */
const slot = (id, label, [x, y, width, height], text = {}) => ({
  id,
  label,
  box: { x, y, width, height },
  fontSize: 28,
  align: 'left',
  valign: 'start',
  bold: false,
  ...text,
});

/** Horizontal alignments a slide may store in its optional `titleAlign` property. */
export const TITLE_ALIGNMENTS = Object.freeze(['left', 'center', 'right']);

/** Id of the slot that holds the slide title in every layout that has one. */
export const TITLE_SLOT_ID = 'title';

const centered = { align: 'center', valign: 'center' };
const heading = { fontSize: 48, bold: true, valign: 'end' };
const topTitle = slot('title', 'Title', [80, 32, 1120, 158], heading);

/** The 11 slide layouts, in picker order. */
export const LAYOUTS = Object.freeze([
  {
    id: 'title',
    name: 'Title slide',
    slots: [
      slot('title', 'Title', [80, 170, 1120, 230], { ...heading, fontSize: 72, align: 'center' }),
      slot('subtitle', 'Subtitle', [160, 430, 960, 130], { fontSize: 32, align: 'center' }),
    ],
  },
  {
    id: 'sectionHeader',
    name: 'Section header',
    slots: [slot('title', 'Section title', [80, 240, 1120, 240], { ...centered, fontSize: 60, bold: true })],
  },
  {
    id: 'titleAndBody',
    name: 'Title and body',
    slots: [topTitle, slot('body', 'Body', [80, 206, 1120, 480])],
  },
  {
    id: 'twoColumns',
    name: 'Title and two columns',
    slots: [
      topTitle,
      slot('left', 'Left column', [80, 206, 540, 480], { fontSize: 24 }),
      slot('right', 'Right column', [660, 206, 540, 480], { fontSize: 24 }),
    ],
  },
  { id: 'titleOnly', name: 'Title only', slots: [topTitle] },
  {
    id: 'oneColumn',
    name: 'One column text',
    slots: [
      slot('title', 'Title', [80, 60, 480, 170], { ...heading, fontSize: 40 }),
      slot('body', 'Body', [80, 260, 480, 400], { fontSize: 22 }),
    ],
  },
  {
    id: 'mainPoint',
    name: 'Main point',
    slots: [slot('title', 'Main point', [120, 120, 1040, 480], { ...centered, fontSize: 80, bold: true })],
  },
  {
    id: 'sectionDescription',
    name: 'Section title and description',
    slots: [
      slot('title', 'Section title', [80, 150, 480, 230], { ...heading, align: 'center' }),
      slot('subtitle', 'Subtitle', [80, 410, 480, 150], { fontSize: 26, align: 'center' }),
      slot('body', 'Description', [680, 100, 520, 520], { fontSize: 26, valign: 'center' }),
    ],
  },
  {
    id: 'caption',
    name: 'Caption',
    slots: [slot('body', 'Caption', [80, 580, 1120, 100], { ...centered, fontSize: 24 })],
  },
  {
    id: 'bigNumber',
    name: 'Big number',
    slots: [
      slot('title', 'Big number', [80, 10, 1120, 480], { ...centered, valign: 'end', fontSize: 160, bold: true }),
      slot('body', 'Description', [160, 500, 960, 170], { fontSize: 30, align: 'center' }),
    ],
  },
  { id: 'blank', name: 'Blank', slots: [] },
]);

/** Layout used for slides without a recognised layout, such as converted notebooks. */
export const DEFAULT_LAYOUT_ID = 'titleAndBody';

/**
 * Looks up a layout, falling back to the default one.
 * @param {string} [layoutId] Layout id stored on a slide.
 * @returns {object} Layout schema.
 */
export const getLayout = (layoutId) =>
  LAYOUTS.find((layout) => layout.id === layoutId) ||
  LAYOUTS.find((layout) => layout.id === DEFAULT_LAYOUT_ID);

/**
 * Reads the alignment of a slide title; a slide without a valid choice follows its layout.
 * @param {object} [slide] Deck slide.
 * @returns {'left'|'center'|'right'|null} Alignment, or null when the layout has no title.
 */
export const getTitleAlign = (slide) => {
  const title = getLayout(slide?.layout).slots.find((item) => item.id === TITLE_SLOT_ID);
  if (!title) return null;
  return TITLE_ALIGNMENTS.includes(slide?.titleAlign) ? slide.titleAlign : title.align;
};
