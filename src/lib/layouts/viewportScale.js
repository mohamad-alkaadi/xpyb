/** Logical slide width in pixels (16:9). */
export const STAGE_WIDTH = 1280;

/** Logical slide height in pixels (16:9). */
export const STAGE_HEIGHT = 720;

/**
 * Fits the 1280x720 slide inside a container with one uniform scale, centered.
 * @param {number} width Container width.
 * @param {number} height Container height.
 * @returns {{scale: number, offsetX: number, offsetY: number}} Stage transform.
 */
export const computeStageTransform = (width, height) => {
  const fits = width > 0 && height > 0;
  const scale = fits ? Math.min(width / STAGE_WIDTH, height / STAGE_HEIGHT) : 0;
  return {
    scale,
    offsetX: fits ? (width - STAGE_WIDTH * scale) / 2 : 0,
    offsetY: fits ? (height - STAGE_HEIGHT * scale) / 2 : 0,
  };
};
