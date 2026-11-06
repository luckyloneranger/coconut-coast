import { describe, expect, it } from 'vitest';
import { NO_CONTROLS, type PipControls } from '../src/actors/controls';
import { PipPhysics } from '../src/actors/pip-physics';
import { CAMERA, PIP } from '../src/game/tuning';
import { Camera } from '../src/world/camera';
import { Level, checkLevel } from '../src/world/level';
import { TEST_LEVEL } from '../src/world/levels/test-level';
import { TILE } from '../src/world/tiles';

const DT = 1 / 60;

/** Run Pip in a level for `seconds` with these controls. */
function play(level: Level, p: PipPhysics, seconds: number, c: Partial<PipControls> = {}, first: Partial<PipControls> = {}): void {
  for (let t = 0, i = 0; t < seconds; t += DT, i++) {
    const { solids, oneWays } = level.boxesNear(p.box);
    p.update(DT, { ...NO_CONTROLS, ...c, ...(i === 0 ? first : {}) }, solids, oneWays);
  }
}

function pipAt(level: Level): PipPhysics {
  const p = new PipPhysics(level.start.x - PIP.WIDTH / 2, level.start.y - PIP.HEIGHT);
  play(level, p, DT);
  return p;
}

describe('reading levels', () => {
  it('the test level is valid, with its start and flag in place', () => {
    expect(checkLevel(TEST_LEVEL)).toEqual([]);
    const L = new Level(TEST_LEVEL);
    expect(L.cols).toBe(128);
    expect(L.rowsCount).toBe(20);
    expect(L.start).toEqual({ x: 3 * TILE + 8, y: 16 * TILE });
    expect(L.flag).not.toBeNull();
  });

  it('explains what is wrong with a broken map', () => {
    const problems = checkLevel({ name: 'bad', rows: ['..P', '.Q', '###'] });
    expect(problems.join(' ')).toMatch(/row 2 is 2 wide/);
    expect(problems.join(' ')).toMatch(/unknown letter 'Q'/);
    expect(checkLevel({ name: 'none', rows: ['...', '###'] }).join(' ')).toMatch(/exactly one start/);
    expect(() => new Level({ name: 'bad', rows: ['..', 'PP'] })).toThrow(/Level "bad"/);
  });

  it('the level edges are walls, and below the bottom is open (pits)', () => {
    const L = new Level(TEST_LEVEL);
    expect(L.tileAt(-1, 5)).toBe('ground');
    expect(L.tileAt(L.cols, 5)).toBe('ground');
    expect(L.tileAt(12, L.rowsCount + 3)).toBe('air');
  });
});

describe('tile collision', () => {
  const ROOM = new Level({
    name: 'room',
    rows: [
      '..........',
      '..........',
      '....##....',
      '..........',
      '.P.....#..',
      '##########',
    ],
  });

  it('stands on the floor, stops at a wall, bumps a ceiling', () => {
    const p = pipAt(ROOM);
    expect(p.onGround).toBe(true);
    expect(p.feetY).toBe(5 * TILE);
    play(ROOM, p, 2, { right: true });
    expect(p.x + PIP.WIDTH).toBe(7 * TILE);
    // Under the ceiling block: the jump stops at its underside.
    p.x = 4 * TILE;
    play(ROOM, p, 0.5);
    let top = p.y;
    for (let i = 0; i < 40; i++) {
      play(ROOM, p, DT, { jumpHeld: true }, i === 0 ? { jumpPressed: true } : {});
      top = Math.min(top, p.y);
    }
    expect(top).toBe(3 * TILE);
  });

  it('never slips through a floor, even at top fall speed', () => {
    const tall = new Level({ name: 'drop', rows: ['.P.', ...Array(30).fill('...'), '###'] });
    const p = new PipPhysics(TILE, 0);
    play(tall, p, 4);
    expect(p.onGround).toBe(true);
    expect(p.feetY).toBe(31 * TILE);
  });
});

describe('one-way platforms', () => {
  const STACK = new Level({
    name: 'stack',
    rows: [
      '......',
      '......',
      '..==..',
      '......',
      '.P....',
      '######',
    ],
  });

  it('you jump up through them and land on top', () => {
    const p = pipAt(STACK);
    p.x = 2 * TILE + 8;
    play(STACK, p, DT);
    play(STACK, p, 1.2, { jumpHeld: true }, { jumpPressed: true });
    expect(p.onGround).toBe(true);
    expect(p.feetY).toBe(2 * TILE);
  });

  it('Down + Jump drops through; on solid ground it is just a normal jump', () => {
    const p = pipAt(STACK);
    p.x = 2 * TILE + 8;
    p.y = 2 * TILE - PIP.HEIGHT;
    play(STACK, p, 0.1);
    expect(p.feetY).toBe(2 * TILE);
    play(STACK, p, 1, { down: true }, { jumpPressed: true });
    expect(p.feetY).toBe(5 * TILE); // back on the floor
    play(STACK, p, 0.2, { down: true }, { jumpPressed: true });
    expect(p.feetY).toBeLessThan(5 * TILE); // jumped up, didn't sink into the floor
    expect(p.y).toBeGreaterThan(0);
  });
});

describe('camera', () => {
  const W = 480;
  const H = 270;
  const L = new Level(TEST_LEVEL);

  it('starts on Pip and never shows past the level edges', () => {
    const p = pipAt(L);
    const cam = new Camera(W, H, L.widthPx, L.heightPx, p);
    expect(cam.x).toBe(0); // the start is near the left edge
    expect(cam.y).toBeLessThanOrEqual(L.heightPx - H);
    p.x = L.widthPx - 20;
    for (let i = 0; i < 200; i++) cam.update(DT, p);
    expect(cam.x).toBeCloseTo(L.widthPx - W, 0);
  });

  it('small steps inside the dead zone do not move it', () => {
    const p = pipAt(L);
    p.x = 400;
    const cam = new Camera(W, H, L.widthPx, L.heightPx, p);
    const x0 = cam.x;
    p.x += CAMERA.DEAD_ZONE_W / 2 - 4;
    for (let i = 0; i < 60; i++) cam.update(DT, p);
    expect(cam.x).toBe(x0);
  });

  it('looks ahead when running', () => {
    const p = pipAt(L);
    p.x = 400;
    const cam = new Camera(W, H, L.widthPx, L.heightPx, p);
    const fast = { feetX: p.feetX, feetY: p.feetY, onGround: true, vx: PIP.RUN_SPEED };
    for (let i = 0; i < 120; i++) cam.update(DT, fast);
    expect(cam.lookAhead).toBe(CAMERA.LOOK_AHEAD);
    expect(cam.x + W / 2).toBeGreaterThan(fast.feetX);
  });

  it('does not bob up and down during a normal jump', () => {
    const tall = new Level({ name: 'tall', rows: [...Array(40).fill('.'.repeat(60)), '.P' + '.'.repeat(58), '#'.repeat(60)] });
    const p = pipAt(tall);
    p.x = 400;
    const cam = new Camera(W, H, tall.widthPx, tall.heightPx, p);
    for (let i = 0; i < 30; i++) cam.update(DT, p);
    const y0 = cam.y;
    let moved = 0;
    for (let i = 0; i < 90; i++) {
      play(tall, p, DT, { jumpHeld: true }, i === 0 ? { jumpPressed: true } : {});
      cam.update(DT, p);
      moved = Math.max(moved, Math.abs(cam.y - y0));
    }
    expect(moved).toBeLessThan(1);
  });
});

describe('pits', () => {
  it('the test level has pits to fall into: nothing below the gaps', () => {
    const L = new Level(TEST_LEVEL);
    for (let ty = 0; ty < L.rowsCount; ty++) expect(L.tileAt(21, ty)).toBe('air');
  });
});
