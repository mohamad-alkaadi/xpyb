import { describe, expect, it } from 'vitest';
import { LAYOUTS } from '../../src/lib/layouts/schemas.js';
import { getSlotMode, mapSlots } from '../../src/lib/layouts/slotMapper.js';
import { codeCell, makeSlide, textCell } from './fixtures.js';

const ids = ({ slots }) =>
  Object.fromEntries(Object.entries(slots).map(([slot, cell]) => [slot, cell?.id ?? null]));

const columns = makeSlide('s', 'twoColumns', [
  textCell('r', 'Right', { slot: 'right' }),
  textCell('t', 'Heading', { slot: 'title' }),
  codeCell('l', 'x = 1', { slot: 'left' }),
]);

describe('mapSlots', () => {
  it('honors stored slots regardless of cell order', () => {
    expect(ids(mapSlots(columns))).toEqual({ title: 't', left: 'l', right: 'r' });
  });

  it('keeps every cell visible or hidden in every layout without mutating the slide', () => {
    const before = structuredClone(columns);
    LAYOUTS.forEach(({ id }) => {
      const { slots, hidden } = mapSlots({ ...columns, layout: id });
      const placed = [...Object.values(slots).filter(Boolean), ...hidden];
      expect(placed.map((cell) => cell.id).sort()).toEqual(['l', 'r', 't']);
    });
    expect(columns).toEqual(before);
  });

  it('restores positions after a round trip through another layout', () => {
    expect(mapSlots({ ...columns, layout: 'blank' }).hidden).toHaveLength(3);
    expect(ids(mapSlots({ ...columns, layout: 'twoColumns' }))).toEqual(ids(mapSlots(columns)));
  });

  it('places unassigned headings in the title and other content in the body', () => {
    const slide = (cell) => makeSlide('s', 'default', [cell]);
    expect(ids(mapSlots(slide(textCell('h', '# Hi'))))).toEqual({ title: 'h', body: null });
    expect(ids(mapSlots(slide(textCell('p', '# Hi\nBody'))))).toEqual({ title: null, body: 'p' });
    expect(ids(mapSlots(slide(codeCell('c', 'x'))))).toEqual({ title: null, body: 'c' });
  });

  it('sends a second cell assigned to one slot to a free slot', () => {
    const slide = makeSlide('s', 'titleAndBody', [
      textCell('a', 'A', { slot: 'body' }),
      textCell('b', 'B', { slot: 'body' }),
    ]);
    expect(ids(mapSlots(slide))).toEqual({ title: 'b', body: 'a' });
  });

  it('tolerates slides without cells', () => {
    expect(mapSlots({}).hidden).toEqual([]);
  });
});

describe('getSlotMode', () => {
  it('uses the stored mode, then the cell type', () => {
    expect(getSlotMode(null)).toBe('text');
    expect(getSlotMode(codeCell('c', ''))).toBe('code');
    expect(getSlotMode(codeCell('c', '', { mode: 'output' }))).toBe('output');
    expect(getSlotMode(textCell('t', '', { mode: 'bogus' }))).toBe('text');
  });
});
