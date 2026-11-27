// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { clampBackdrop, getCodeAppearance, getCodeSettings, TINTS } from '../../src/lib/slides/codeStyle.js';
import { blendColors, getContrastRatio, getLuminance } from '../../src/lib/slides/contrast.js';

const LEVELS = ['00', '33', '66', '77', '80', '99', 'cc', 'ff'];
const COLORS = LEVELS.flatMap((r) => LEVELS.flatMap((g) => LEVELS.map((b) => `#${r}${g}${b}`)));

describe('contrast math', () => {
  it('computes luminance and WCAG ratios', () => {
    expect(getLuminance('#000000')).toBe(0);
    expect(getLuminance('#ffffff')).toBeCloseTo(1);
    expect(getContrastRatio('#fff', '#000')).toBeCloseTo(21);
    expect(getContrastRatio('#000', '#fff')).toBeCloseTo(21);
  });

  it('blends a tint over a background', () => {
    expect(blendColors('#ffffff', '#000000', 0)).toBe('#ffffff');
    expect(blendColors('#ffffff', '#000000', 0.8)).toBe('#333333');
    expect(blendColors('#000000', '#ffffff', 0.5)).toBe('#808080');
  });
});

describe('code appearance', () => {
  it('defaults to a clear backdrop with auto-contrast', () => {
    expect(getCodeSettings({})).toEqual({ opacity: 0, tint: 'dark', autoContrast: true });
    expect(getCodeAppearance({ backgroundColor: '#ffffff' })).toEqual({
      isDark: false,
      backdrop: null,
      textColor: '#000000',
    });
  });

  it('limits the backdrop to 0-80 percent', () => {
    expect([-5, 40, 200, 'x', undefined].map(clampBackdrop)).toEqual([0, 40, 80, 0, 0]);
  });

  it('judges contrast against the tinted background', () => {
    const slide = { backgroundColor: '#ffffff', codeBackdrop: 70, codeTint: 'dark' };
    expect(getCodeAppearance(slide)).toEqual({
      isDark: true,
      backdrop: 'rgba(0, 0, 0, 0.7)',
      textColor: '#ffffff',
    });
    const light = { backgroundColor: '#000000', codeBackdrop: 80, codeTint: 'light' };
    expect(getCodeAppearance(light)).toMatchObject({ isDark: false, textColor: '#000000' });
  });

  it('inherits the slide text color when auto-contrast is off', () => {
    expect(getCodeAppearance({ autoContrast: false }).textColor).toBeUndefined();
  });

  it('keeps at least 4.5:1 text contrast on any background and backdrop', () => {
    const ratios = COLORS.flatMap((backgroundColor) =>
      ['dark', 'light'].flatMap((codeTint) =>
        [0, 40, 80].map((codeBackdrop) => {
          const slide = { backgroundColor, codeTint, codeBackdrop };
          const behind = blendColors(backgroundColor, TINTS[codeTint], codeBackdrop / 100);
          return getContrastRatio(getCodeAppearance(slide).textColor, behind);
        }),
      ),
    );
    expect(Math.min(...ratios)).toBeGreaterThanOrEqual(4.5);
  });
});
