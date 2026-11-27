import { describe, expect, it } from 'vitest';
import { getLayout, LAYOUTS } from '../../src/lib/layouts/schemas.js';
import { getWireframeBox } from '../../src/lib/layouts/wireframe.js';

const overlaps = (a, b) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

describe('layout schemas', () => {
  it('defines the 11 layouts', () => {
    expect(LAYOUTS.map((layout) => layout.name)).toEqual([
      'Title slide',
      'Section header',
      'Title and body',
      'Title and two columns',
      'Title only',
      'One column text',
      'Main point',
      'Section title and description',
      'Caption',
      'Big number',
      'Blank',
    ]);
    expect(new Set(LAYOUTS.map((layout) => layout.id)).size).toBe(11);
  });

  it.each(LAYOUTS.map((layout) => [layout.id, layout.slots]))(
    '%s keeps unique, non-overlapping slots inside the stage',
    (_, slots) => {
      expect(new Set(slots.map((slot) => slot.id)).size).toBe(slots.length);
      slots.forEach(({ box }, index) => {
        expect(box.x >= 0 && box.x + box.width <= 1280).toBe(true);
        expect(box.y >= 0 && box.y + box.height <= 720).toBe(true);
        expect(slots.slice(index + 1).some((other) => overlaps(box, other.box))).toBe(false);
      });
    },
  );

  it('falls back to title and body for unknown layouts', () => {
    expect(getLayout('default').id).toBe('titleAndBody');
    expect(getLayout(undefined).id).toBe('titleAndBody');
    expect(getLayout('blank').slots).toEqual([]);
  });

  it('converts boxes to wireframe percentages', () => {
    expect(getWireframeBox({ x: 640, y: 180, width: 320, height: 360 })).toEqual({
      left: '50%',
      top: '25%',
      width: '25%',
      height: '50%',
    });
  });
});
