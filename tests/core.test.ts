import { describe, expect, it } from 'vitest';
import { FixedStepClock } from '../src/core/loop';
import { Input } from '../src/core/input';
import { DEFAULT_KEYMAP } from '../src/core/keymap';
import { computeScale } from '../src/core/renderer';
import { DISPLAY } from '../src/game/tuning';

describe('fixed-step clock', () => {
  it('turns frame time into whole 60 Hz steps and keeps the remainder', () => {
    const c = new FixedStepClock(60, 0.25);
    expect(c.advance(1 / 60)).toBe(1);
    expect(c.advance(1 / 120)).toBe(0);
    expect(c.advance(1 / 120)).toBe(1);
  });
  it("doesn't try to catch up a huge pause all at once", () => {
    expect(new FixedStepClock(60, 0.25).advance(5)).toBe(15);
  });
});

describe('input', () => {
  it('keyboard and gamepad reach the same actions', () => {
    const input = new Input(DEFAULT_KEYMAP);
    input.keyDown('Space');
    input.beginStep();
    expect(input.justPressed('JUMP')).toBe(true);
    input.keyUp('Space');
    input.keyDown('PadA');
    input.beginStep();
    expect(input.justPressed('JUMP')).toBe(true);
    input.keyDown('PadB');
    input.beginStep();
    expect(input.isDown('RUN')).toBe(true);
  });
  it('a tap between two steps is never lost', () => {
    const input = new Input(DEFAULT_KEYMAP);
    input.keyDown('KeyZ');
    input.keyUp('KeyZ');
    input.beginStep();
    expect(input.justPressed('JUMP')).toBe(true);
  });
});

describe('screen scaling', () => {
  const { WIDTH: W, HEIGHT: H } = DISPLAY;
  it('uses whole numbers on big screens (1080p is exactly 4x)', () => {
    expect(computeScale(1920, 1080, W, H)).toBe(4);
    expect(computeScale(1366, 768, W, H)).toBe(2);
  });
  it('fills a phone screen at a fractional scale instead of leaving it tiny', () => {
    const s = computeScale(844, 390, W, H);
    expect(s).toBeGreaterThan(1.4);
    expect(s).toBeLessThan(2);
    expect(Math.round(H * s)).toBeLessThanOrEqual(390);
  });
});
