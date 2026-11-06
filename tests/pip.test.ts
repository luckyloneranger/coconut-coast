import { describe, expect, it } from 'vitest';
import { NO_CONTROLS, type PipControls } from '../src/actors/controls';
import { PipPhysics, approach, jumpSpeedFor } from '../src/actors/pip-physics';
import type { Box } from '../src/actors/solids';
import { PIP } from '../src/game/tuning';

const DT = 1 / 60;
const FLOOR_Y = 200;
const FLOOR: Box[] = [{ x: -1000, y: FLOOR_Y, w: 4000, h: 50 }];

function standing(solids: Box[] = FLOOR, x = 0): PipPhysics {
  const p = new PipPhysics(x, FLOOR_Y - PIP.HEIGHT);
  p.update(DT, NO_CONTROLS, solids); // settle onto the ground
  return p;
}

function run(p: PipPhysics, seconds: number, c: Partial<PipControls>, solids: Box[] = FLOOR): void {
  for (let t = 0; t < seconds; t += DT) p.update(DT, { ...NO_CONTROLS, ...c }, solids);
}

/** Jump, holding Jump for `holdSteps` steps, and return the peak height in px. */
function jumpHeight(p: PipPhysics, holdSteps: number, extra: Partial<PipControls> = {}): number {
  const startFeet = p.feetY;
  let peak = 0;
  for (let i = 0; i < 120; i++) {
    p.update(DT, { ...NO_CONTROLS, ...extra, jumpPressed: i === 0, jumpHeld: i < holdSteps }, FLOOR);
    peak = Math.max(peak, startFeet - p.feetY);
    if (i > 2 && p.onGround) break;
  }
  return peak;
}

describe('walking and running', () => {
  it('reaches walking speed in about 0.17 s and running speed with Run held', () => {
    const p = standing();
    run(p, 0.1, { right: true });
    expect(p.vx).toBeLessThan(PIP.WALK_SPEED);
    run(p, 0.1, { right: true });
    expect(p.vx).toBe(PIP.WALK_SPEED);
    run(p, 0.6, { right: true, run: true });
    expect(p.vx).toBe(PIP.RUN_SPEED);
    expect(p.pose).toBe('run');
  });

  it('eases back to walking speed when Run is let go, and stops when nothing is held', () => {
    const p = standing();
    run(p, 1, { right: true, run: true });
    run(p, 0.5, { right: true });
    expect(p.vx).toBe(PIP.WALK_SPEED);
    run(p, 0.2, {});
    expect(p.vx).toBe(0);
    expect(p.pose).toBe('stand');
  });

  it('skids when pushing the other way at speed, then turns round', () => {
    const p = standing();
    run(p, 1, { right: true, run: true });
    p.update(DT, { ...NO_CONTROLS, left: true }, FLOOR);
    expect(p.pose).toBe('skid');
    expect(p.facingLeft).toBe(true);
    run(p, 0.5, { left: true });
    expect(p.vx).toBeLessThan(0);
  });

  it('stops at walls', () => {
    const wall: Box = { x: 60, y: 0, w: 16, h: FLOOR_Y };
    const p = standing([...FLOOR, wall]);
    run(p, 2, { right: true }, [...FLOOR, wall]);
    expect(p.x + PIP.WIDTH).toBe(60);
    expect(p.vx).toBe(0);
  });
});

describe('jumping', () => {
  it('a tap is a hop of about 1 tile', () => {
    const h = jumpHeight(standing(), 1);
    expect(h).toBeGreaterThan(10);
    expect(h).toBeLessThan(22);
  });

  it('holding Jump reaches about 4 tiles, and 5 at full run', () => {
    const still = jumpHeight(standing(), 999);
    expect(still).toBeGreaterThanOrEqual(PIP.JUMP_HEIGHT);
    expect(still).toBeLessThan(PIP.JUMP_HEIGHT + 1);
    const runner = standing();
    run(runner, 1, { right: true, run: true });
    const running = jumpHeight(runner, 999, { right: true, run: true });
    expect(running).toBeGreaterThanOrEqual(PIP.RUN_JUMP_HEIGHT);
    expect(running).toBeLessThan(PIP.RUN_JUMP_HEIGHT + 1);
  });

  it('falls faster than it rises (snappy, not floaty)', () => {
    const p = standing();
    let up = 0;
    let down = 0;
    for (let i = 0; i < 120; i++) {
      p.update(DT, { ...NO_CONTROLS, jumpPressed: i === 0, jumpHeld: true }, FLOOR);
      if (p.vy < 0) up++;
      else if (!p.onGround) down++;
      if (i > 2 && p.onGround) break;
    }
    expect(down).toBeLessThan(up);
  });

  it('bumps its head on a ceiling', () => {
    const ceiling: Box = { x: -100, y: FLOOR_Y - PIP.HEIGHT - 20, w: 300, h: 10 };
    const solids = [...FLOOR, ceiling];
    const p = standing(solids);
    let top = p.y;
    for (let i = 0; i < 60; i++) {
      p.update(DT, { ...NO_CONTROLS, jumpPressed: i === 0, jumpHeld: true }, solids);
      top = Math.min(top, p.y);
    }
    expect(top).toBe(ceiling.y + ceiling.h);
  });
});

describe('forgiving timing', () => {
  const LEDGE: Box[] = [{ x: -1000, y: FLOOR_Y, w: 1100, h: 50 }]; // ends at x = 100

  /** Walk off the ledge, wait `late` s after the feet leave it, then press Jump. */
  function lateJump(late: number): boolean {
    const p = standing(LEDGE, 40);
    let airborne = 0;
    for (let i = 0; i < 300; i++) {
      const press = !p.onGround && airborne >= late && airborne < late + DT;
      p.update(DT, { ...NO_CONTROLS, right: true, jumpPressed: press, jumpHeld: true }, LEDGE);
      if (press) return p.vy < 0;
      if (!p.onGround) airborne += DT;
    }
    return false;
  }

  it('a jump just after running off an edge still works (coyote time), a late one does not', () => {
    expect(lateJump(0.05)).toBe(true);
    expect(lateJump(PIP.COYOTE_TIME + 0.05)).toBe(false);
  });

  /** Drop from a height and press Jump `early` s before the landing. */
  function earlyPress(early: number): boolean {
    // How long the fall takes, measured first.
    const probe = new PipPhysics(0, FLOOR_Y - PIP.HEIGHT - 60);
    let fallSteps = 0;
    while (!probe.onGround && fallSteps < 300) {
      probe.update(DT, NO_CONTROLS, FLOOR);
      fallSteps++;
    }
    const p = new PipPhysics(0, FLOOR_Y - PIP.HEIGHT - 60);
    const pressAt = fallSteps - Math.round(early / DT);
    for (let i = 0; i < fallSteps + 3; i++) p.update(DT, { ...NO_CONTROLS, jumpPressed: i === pressAt, jumpHeld: true }, FLOOR);
    return p.vy < 0;
  }

  it('a jump pressed just before landing happens on landing (jump buffer), an early one is forgotten', () => {
    expect(earlyPress(0.06)).toBe(true);
    expect(earlyPress(PIP.JUMP_BUFFER + 0.1)).toBe(false);
  });
});

describe('control polish', () => {
  it('a head that clips a ceiling corner by a few px slides past it and keeps rising', () => {
    // A block whose right edge sticks 3 px into Pip's left side, 1 tile above the head.
    const block: Box = { x: -13, y: FLOOR_Y - PIP.HEIGHT - 20, w: 16, h: 16 };
    const solids = [...FLOOR, block];
    const p = standing(solids);
    let top = p.y;
    for (let i = 0; i < 60; i++) {
      p.update(DT, { ...NO_CONTROLS, jumpPressed: i === 0, jumpHeld: true }, solids);
      top = Math.min(top, p.y);
    }
    expect(top).toBeLessThan(block.y); // got past the block
    expect(p.x).toBeGreaterThanOrEqual(3); // nudged right
  });

  it('a real bump (more than a corner) still stops the jump', () => {
    const block: Box = { x: -8, y: FLOOR_Y - PIP.HEIGHT - 20, w: 16, h: 16 };
    const solids = [...FLOOR, block];
    const p = standing(solids);
    let top = p.y;
    for (let i = 0; i < 60; i++) {
      p.update(DT, { ...NO_CONTROLS, jumpPressed: i === 0, jumpHeld: true }, solids);
      top = Math.min(top, p.y);
    }
    expect(top).toBe(block.y + block.h);
  });

  it('braking in the air is as strong as on the ground', () => {
    const p = standing();
    run(p, 1, { right: true, run: true });
    p.update(DT, { ...NO_CONTROLS, right: true, run: true, jumpPressed: true, jumpHeld: true }, FLOOR);
    run(p, 0.25, { jumpHeld: true }); // let go of the direction in mid-air
    expect(p.onGround).toBe(false);
    expect(p.vx).toBe(0); // 180 px/s stopped within 0.25 s (it used to take about 0.35 s)
  });

  it('a stomp bounce right after leaving a ledge gives no extra jump', () => {
    const p = standing();
    p.update(DT, { ...NO_CONTROLS, right: true }, []); // step off into the air: coyote time starts
    p.bounce(false);
    p.update(DT, { ...NO_CONTROLS, jumpPressed: true, jumpHeld: true }, []);
    expect(p.vy).toBeGreaterThan(-PIP.APEX_SPEED * 6); // still the small bounce, not a fresh full jump
    expect(p.coyote).toBe(0);
  });
});

describe('jumpSpeedFor', () => {
  it('gives a bit more than the smooth formula, to make up for the 60 steps a second', () => {
    const smooth = Math.sqrt(2 * PIP.GRAVITY * 64);
    expect(jumpSpeedFor(64)).toBeGreaterThan(smooth);
    expect(jumpSpeedFor(64)).toBeLessThan(smooth * 1.05);
    expect(jumpSpeedFor(80)).toBeGreaterThan(jumpSpeedFor(64));
  });
});

describe('approach', () => {
  it('moves toward a target without overshooting', () => {
    expect(approach(0, 10, 3)).toBe(3);
    expect(approach(9, 10, 3)).toBe(10);
    expect(approach(5, -5, 20)).toBe(-5);
  });
});
