import { describe, expect, it } from 'vitest';
import {
  computeStageTransform,
  STAGE_HEIGHT,
  STAGE_WIDTH,
} from '../../src/lib/layouts/viewportScale.js';

describe('computeStageTransform', () => {
  it('keeps the logical stage 16:9', () => {
    expect(STAGE_WIDTH / STAGE_HEIGHT).toBe(16 / 9);
  });

  it('is the identity for an exact fit', () => {
    expect(computeStageTransform(1280, 720)).toEqual({ scale: 1, offsetX: 0, offsetY: 0 });
  });

  it('letterboxes tall containers and pillarboxes wide ones', () => {
    expect(computeStageTransform(640, 720)).toEqual({ scale: 0.5, offsetX: 0, offsetY: 180 });
    expect(computeStageTransform(3000, 1440)).toEqual({ scale: 2, offsetX: 220, offsetY: 0 });
  });

  it.each([[375, 812], [768, 400], [1920, 1080], [1024, 1366], [3440, 1440]])(
    'never clips a %ix%i container',
    (width, height) => {
      const { scale, offsetX, offsetY } = computeStageTransform(width, height);
      expect(offsetX).toBeGreaterThanOrEqual(-1e-9);
      expect(offsetY).toBeGreaterThanOrEqual(-1e-9);
      expect(offsetX * 2 + STAGE_WIDTH * scale).toBeCloseTo(width);
      expect(offsetY * 2 + STAGE_HEIGHT * scale).toBeCloseTo(height);
    },
  );

  it('hides the stage in an empty container', () => {
    expect(computeStageTransform(0, 500)).toEqual({ scale: 0, offsetX: 0, offsetY: 0 });
  });
});
