import { describe, expect, it } from 'vitest';
import { FixedStepClock } from '../src/core/loop';
import { Input } from '../src/core/input';
import { DEFAULT_KEYMAP } from '../src/core/keymap';
import { computeScale } from '../src/core/renderer';
import { heldCodes } from '../src/core/gamepad';
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
    input.keyDown('PadRB');
    input.beginStep();
    expect(input.isDown('RUN')).toBe(true);
    input.keyDown('PadB');
    input.beginStep();
    expect(input.justPressed('THROW')).toBe(true);
    expect(input.justPressed('RUN')).toBe(false); // starting a run never throws, and throwing never runs
  });

  it('on the keyboard, Run (Shift or X) and Throw (C) are separate', () => {
    const input = new Input(DEFAULT_KEYMAP);
    input.keyDown('ShiftLeft');
    input.beginStep();
    expect(input.justPressed('THROW')).toBe(false);
    input.keyDown('KeyC');
    input.beginStep();
    expect(input.justPressed('THROW')).toBe(true);
    expect(input.isDown('RUN')).toBe(true);
  });
  it('a second key for an action still counts as a press while the first is held (hold Shift, tap X)', () => {
    const input = new Input(DEFAULT_KEYMAP);
    input.keyDown('ShiftLeft');
    input.beginStep();
    expect(input.justPressed('RUN')).toBe(true);
    input.beginStep();
    expect(input.justPressed('RUN')).toBe(false);
    expect(input.isDown('RUN')).toBe(true);
    input.keyDown('KeyX');
    input.beginStep();
    expect(input.justPressed('RUN')).toBe(true); // the throw
    input.keyUp('KeyX');
    input.beginStep();
    expect(input.isDown('RUN')).toBe(true); // still running on Shift
    expect(input.justReleased('RUN')).toBe(false);
  });

  it('a tap between two steps is never lost', () => {
    const input = new Input(DEFAULT_KEYMAP);
    input.keyDown('KeyZ');
    input.keyUp('KeyZ');
    input.beginStep();
    expect(input.justPressed('JUMP')).toBe(true);
  });
});

describe('gamepad stick', () => {
  const stick = (x: number, y: number) => heldCodes({ buttons: [], axes: [x, y] });
  it('running with the stick tilted a little downward is not Down', () => {
    const held = stick(0.87, 0.5); // right, about 30 degrees down
    expect(held.has('PadRight')).toBe(true);
    expect(held.has('PadDown')).toBe(false);
  });
  it('a firm push mostly downward is Down', () => {
    expect(stick(0.2, 0.9).has('PadDown')).toBe(true);
    expect(stick(0.6, 0.65).has('PadDown')).toBe(false); // diagonal, not firm enough
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
