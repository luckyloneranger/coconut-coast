import { describe, expect, it } from 'vitest';
import { touchEnemy, touchesHazard } from '../src/actors/combat';
import { Crab } from '../src/actors/enemies/crab';
import { Gull } from '../src/actors/enemies/gull';
import { makeEnemy } from '../src/actors/enemies';
import { PipPhysics } from '../src/actors/pip-physics';
import type { Box } from '../src/actors/solids';
import { COMBAT, CRAB, GULL, PIP } from '../src/game/tuning';
import { Level } from '../src/world/level';
import { TILE } from '../src/world/tiles';
import { LevelScene } from '../src/scenes/level-scene';
import { TEST_LEVEL } from '../src/world/levels/test-level';
import type { ArtLibrary } from '../src/gfx/art/library';
import type { InputSnapshot } from '../src/core/input';
import type { Action } from '../src/core/keymap';

const DT = 1 / 60;

function stepEnemy(e: Crab | Gull, level: Level, seconds: number, pip = { x: -9999, y: -9999 }): void {
  for (let t = 0; t < seconds; t += DT) e.update(DT, { level, pipX: pip.x, pipY: pip.y });
}

describe('crab', () => {
  it('turns round at a wall', () => {
    const L = new Level({ name: 'w', rows: ['#.c..P', '######'] });
    const crab = new Crab(L.enemies[0]);
    crab.reset();
    stepEnemy(crab, L, 2);
    expect(crab.facingLeft).toBe(false); // walked left into the wall, now heading right
    expect(crab.x).toBeGreaterThanOrEqual(TILE);
  });

  it('turns round at a ledge instead of walking off', () => {
    const L = new Level({ name: 'l', rows: ['.....c..P', '...######'] });
    const crab = new Crab(L.enemies[0]);
    crab.reset();
    stepEnemy(crab, L, 4);
    expect(crab.x).toBeGreaterThanOrEqual(3 * TILE - 1);
    expect(crab.y + CRAB.HEIGHT).toBe(TILE); // still on the ground
  });

  it('falls onto the ground if placed in the air', () => {
    const L = new Level({ name: 'f', rows: ['.c..P', '.....', '.....', '#####'] });
    const crab = new Crab(L.enemies[0]);
    crab.reset();
    stepEnemy(crab, L, 1);
    expect(crab.y + CRAB.HEIGHT).toBe(3 * TILE);
  });
});

describe('gull', () => {
  const SKY = new Level({ name: 's', rows: ['....g.....', '..........', '..........', '..........', 'P.........', '##########'] });

  it('glides, then swoops down toward Pip when close, and climbs back', () => {
    const gull = new Gull(SKY.enemies[0]);
    gull.reset();
    const startY = gull.y;
    stepEnemy(gull, SKY, 0.5); // Pip far away: just gliding
    expect(gull.swooping).toBe(false);
    const pip = { x: gull.x + 40, y: 5 * TILE };
    stepEnemy(gull, SKY, DT, pip);
    expect(gull.swooping).toBe(true);
    let lowest = gull.y;
    for (let t = 0; t < GULL.SWOOP_TIME; t += DT) {
      gull.update(DT, { level: SKY, pipX: pip.x, pipY: pip.y });
      lowest = Math.max(lowest, gull.y);
    }
    expect(lowest).toBeGreaterThan(startY + 3 * TILE); // came down near Pip
    stepEnemy(gull, SKY, 0.1, pip);
    expect(gull.swooping).toBe(false); // cooling down before the next swoop
    expect(gull.y).toBeCloseTo(startY, 0);
  });
});

describe('stomp or hurt', () => {
  const enemy: Box = { x: 100, y: 100, w: 20, h: 14 };
  const pipAt = (y: number): Box => ({ x: 102, y, w: PIP.WIDTH, h: PIP.HEIGHT });

  it('landing on top is a stomp; walking into the side hurts', () => {
    expect(touchEnemy(pipAt(100 - PIP.HEIGHT + 3), 200, 100 - 1, enemy, true)).toBe('stomp');
    expect(touchEnemy(pipAt(90), 0, 118, enemy, true)).toBe('hurt');
    expect(touchEnemy(pipAt(10), 200, 30, enemy, true)).toBe('none');
  });

  it('a little grace: feet slightly below the top still count as landing on it', () => {
    expect(touchEnemy(pipAt(100 - PIP.HEIGHT + 5), 200, 100 + COMBAT.STOMP_GRACE, enemy, true)).toBe('stomp');
    expect(touchEnemy(pipAt(100 - PIP.HEIGHT + 9), 200, 100 + COMBAT.STOMP_GRACE + 4, enemy, true)).toBe('hurt');
  });

  it('rising into an enemy from below hurts, and the urchin hurts even from above', () => {
    expect(touchEnemy(pipAt(105), -200, 133, enemy, true)).toBe('hurt');
    expect(touchEnemy(pipAt(100 - PIP.HEIGHT + 3), 200, 99, enemy, false)).toBe('hurt');
  });

  it('a stomp bounce goes higher with Jump held', () => {
    const peak = (held: boolean) => {
      const p = new PipPhysics(0, 0);
      p.bounce(held);
      let top = 0;
      for (let i = 0; i < 60; i++) {
        p.update(DT, { left: false, right: false, down: false, run: false, jumpPressed: false, jumpHeld: held }, []);
        top = Math.min(top, p.y);
      }
      return -top;
    };
    expect(peak(true)).toBeGreaterThan(peak(false) * 2);
    expect(peak(true)).toBeCloseTo(COMBAT.STOMP_BOUNCE_HELD, -1);
  });
});

describe('spikes', () => {
  const L = new Level({ name: 'sp', rows: ['P.^..', '#####'] });
  const spikes = L.hazardsNear({ x: 0, y: 0, w: 80, h: 32 });

  it('hurt from the side and from above, but not from just beside them', () => {
    expect(spikes).toHaveLength(1);
    const s = spikes[0];
    expect(touchesHazard({ x: s.x - PIP.WIDTH + 1, y: TILE - PIP.HEIGHT, w: PIP.WIDTH, h: PIP.HEIGHT }, spikes)).toBe(true);
    expect(touchesHazard({ x: s.x, y: s.y - PIP.HEIGHT + 1, w: PIP.WIDTH, h: PIP.HEIGHT }, spikes)).toBe(true);
    expect(touchesHazard({ x: s.x - PIP.WIDTH - 1, y: TILE - PIP.HEIGHT, w: PIP.WIDTH, h: PIP.HEIGHT }, spikes)).toBe(false);
  });
});

/** Fake input that holds the given actions (and presses them on the first step). */
function holding(...actions: Action[]): InputSnapshot {
  const set = new Set(actions);
  return { isDown: (a) => set.has(a), justPressed: () => false, justReleased: () => false };
}
const NONE = holding();
const ART = { source: 'code', sheet: () => ({ frameW: 24, frameH: 32, frames: 6, from: 'code' }) } as unknown as ArtLibrary;

describe('dying and coming back', () => {
  it('a hit spins Pip away, then brings Pip back at the last checkpoint with enemies reset', () => {
    const scene = new LevelScene(TEST_LEVEL, ART, () => {});
    const cp = scene.level.checkpoints[0];
    // Stand just past the checkpoint.
    scene.pip.x = cp.x + 4;
    scene.pip.y = cp.y - PIP.HEIGHT;
    scene.update(DT, NONE);
    expect(scene.checkpointsReached).toBe(1);
    // Squash the crab nearest the start (far off-screen from the checkpoint), then get hit.
    const crab = scene.enemies.filter((e) => e.kind === 'crab').sort((a, b) => a.home.x - b.home.x)[0];
    crab.stomp(COMBAT.SQUASH_TIME);
    scene.die();
    for (let t = 0; t < COMBAT.DEATH_TIME + 0.1; t += DT) scene.update(DT, NONE);
    expect(scene.dying).toBe(0);
    expect(scene.deaths).toBe(1);
    expect(scene.pip.feetX).toBeCloseTo(cp.x, 0);
    expect(crab.squash).toBe(0);
    expect(crab.defeated).toBe(false);
    expect(crab.awake).toBe(false);
  });

  it('walking into a crab ends in a death; stomping it does not', () => {
    const L = { name: 'c', rows: ['P....c....', '##########'] };
    const walker = new LevelScene(L, ART, () => {});
    for (let t = 0; t < 3 && walker.deaths === 0; t += DT) walker.update(DT, holding('RIGHT'));
    expect(walker.deaths + (walker.dying > 0 ? 1 : 0)).toBeGreaterThan(0);

    const stomper = new LevelScene(L, ART, () => {});
    const crab = stomper.enemies[0];
    crab.awake = true;
    stomper.pip.x = crab.x + 2;
    stomper.pip.y = crab.y - PIP.HEIGHT - 20;
    for (let t = 0; t < 0.5; t += DT) stomper.update(DT, NONE);
    expect(stomper.dying).toBe(0);
    expect(stomper.deaths).toBe(0);
    expect(crab.active).toBe(false);
  });

  it('enemies only wake when they come near the screen', () => {
    const scene = new LevelScene(TEST_LEVEL, ART, () => {});
    scene.update(DT, NONE);
    const near = scene.enemies.filter((e) => e.x < 480 + COMBAT.WAKE_MARGIN);
    const far = scene.enemies.filter((e) => e.x > 480 + COMBAT.WAKE_MARGIN + 100);
    expect(near.every((e) => e.awake)).toBe(true);
    expect(far.length).toBeGreaterThan(0);
    expect(far.some((e) => e.awake)).toBe(false);
  });

  it('every enemy in the test level is a known kind and starts on its spot', () => {
    for (const e of new Level(TEST_LEVEL).enemies) {
      const enemy = makeEnemy(e.kind, e);
      expect(enemy.x + enemy.w / 2).toBe(e.x);
      expect(enemy.y + enemy.h).toBe(e.y);
    }
  });
});
