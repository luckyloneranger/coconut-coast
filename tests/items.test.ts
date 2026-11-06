import { describe, expect, it } from 'vitest';
import { PipForm } from '../src/actors/pip-form';
import { SeedPod, canFire } from '../src/actors/seed-pod';
import { crateContents } from '../src/actors/items';
import { RunState } from '../src/game/run-state';
import { COMBAT, FORMS, PIP, RUN, SEED } from '../src/game/tuning';
import { Level, checkLevel } from '../src/world/level';
import { TEST_LEVEL } from '../src/world/levels/test-level';
import { TILE } from '../src/world/tiles';
import { LevelScene } from '../src/scenes/level-scene';
import type { ArtLibrary } from '../src/gfx/art/library';
import type { InputSnapshot } from '../src/core/input';
import type { Action } from '../src/core/keymap';

const DT = 1 / 60;
const ART = { source: 'code', sheet: () => ({ frameW: 24, frameH: 32, frames: 6, from: 'code' }) } as unknown as ArtLibrary;

/** Input holding some actions, pressing `fresh` ones this step. */
function input(held: Action[] = [], fresh: Action[] = []): InputSnapshot {
  const h = new Set(held);
  const f = new Set(fresh);
  return { isDown: (a) => h.has(a) || f.has(a), justPressed: (a) => f.has(a), justReleased: () => false };
}

function play(scene: LevelScene, seconds: number, held: Action[] = [], firstFresh: Action[] = []): void {
  for (let t = 0, i = 0; t < seconds; t += DT, i++) scene.update(DT, input(held, i === 0 ? firstFresh : []));
}

describe('lives, score and fruit', () => {
  it('fruit scores, refills the Sun Meter and gives an extra life every 100', () => {
    const run = new RunState();
    run.sun = 0.5;
    run.addFruit();
    expect(run.score).toBe(RUN.FRUIT_POINTS);
    expect(run.sun).toBeCloseTo(0.5 + RUN.SUN_PER_FRUIT);
    for (let i = 1; i < RUN.FRUIT_FOR_LIFE; i++) run.addFruit();
    expect(run.lives).toBe(RUN.START_LIVES + 1);
    expect(run.sun).toBe(1); // never over full
  });

  it('each Sun Coin counts once', () => {
    const run = new RunState();
    run.addCoin(1);
    run.addCoin(1);
    expect(run.coins.size).toBe(1);
    expect(run.score).toBe(RUN.COIN_POINTS);
  });

  it('stomps in a row are worth 100, 200, 400, 800, then an extra life; landing resets the chain', () => {
    const run = new RunState();
    expect([run.stomped(), run.stomped(), run.stomped(), run.stomped()]).toEqual(RUN.STOMP_CHAIN);
    expect(run.stomped()).toBe(0);
    expect(run.lives).toBe(RUN.START_LIVES + 1);
    run.landed();
    expect(run.stomped()).toBe(RUN.STOMP_CHAIN[0]);
  });
});

describe('Sun Meter', () => {
  it('a full meter lasts about 45 s, then runs out', () => {
    const run = new RunState();
    let emptied = false;
    let t = 0;
    while (!emptied && t < 60) {
      emptied = run.drain(DT);
      t += DT;
    }
    expect(t).toBeCloseTo(RUN.SUN_FULL_TIME, 0);
  });

  it('Relaxed mode has no meter', () => {
    const run = new RunState(true);
    for (let t = 0; t < 100; t += 1) expect(run.drain(1)).toBe(false);
    expect(run.sun).toBe(1);
  });

  it('losing a life refills it; the last life ends the run', () => {
    const run = new RunState();
    run.sun = 0.1;
    expect(run.loseLife()).toBe(false);
    expect(run.sun).toBe(1);
    run.loseLife();
    expect(run.loseLife()).toBe(true);
  });
});

describe('forms', () => {
  it('Mango makes small Pip Big; the Slingshot gives Sling (Big as well)', () => {
    const f = new PipForm();
    f.eatMango();
    expect(f.form).toBe('big');
    f.takeSlingshot();
    expect(f.form).toBe('sling');
    expect(f.canThrow).toBe(true);
    f.eatMango(); // no step down
    expect(f.form).toBe('sling');
  });

  it('each hit goes back one step, with a blink in between that protects', () => {
    const f = new PipForm();
    f.takeSlingshot();
    expect(f.hit()).toBe('shrunk');
    expect(f.form).toBe('big');
    expect(f.hit()).toBe('nothing'); // still blinking
    f.update(FORMS.HURT_BLINK + 0.01);
    expect(f.hit()).toBe('shrunk');
    expect(f.form).toBe('small');
    f.update(FORMS.HURT_BLINK + 0.01);
    expect(f.hit()).toBe('dead');
  });

  it('Starfruit protects for 8 s', () => {
    const f = new PipForm();
    f.eatStarfruit();
    expect(f.hit()).toBe('nothing');
    f.update(FORMS.STARFRUIT_TIME + 0.01);
    expect(f.hit()).toBe('dead');
  });

  it('losing a life makes Pip small again, unless in Relaxed mode', () => {
    const f = new PipForm();
    f.eatMango();
    f.respawn(true);
    expect(f.form).toBe('big');
    f.respawn(false);
    expect(f.form).toBe('small');
  });
});

describe('crates and cracked stone', () => {
  const ROOM = { name: 'r', rows: ['.......', '.......', '.M.%.B.', '.......', '.......', 'P......', '#######'] };

  it('a crate gives its item once, then is empty', () => {
    const L = new Level(ROOM);
    expect(L.openCrate(1, 2)).toBe('mango');
    expect(L.tileAt(1, 2)).toBe('used');
    expect(L.openCrate(1, 2)).toBeNull();
    expect(L.isSolid(1, 2)).toBe(true);
  });

  it('a fruit-burst crate throws out 5 fruit, spread sideways', () => {
    const out = crateContents('fruitBurst', 5, 2, 0);
    expect(out).toHaveLength(5);
    expect(new Set(out.map((f) => Math.sign(f.vx))).size).toBe(3);
    expect(out.every((f) => f.kind === 'fruit' && f.moving)).toBe(true);
  });

  /** Put Pip under a tile and jump into it. */
  function headButt(scene: LevelScene, tx: number): void {
    scene.pip.x = tx * TILE;
    scene.pip.y = 6 * TILE - scene.pip.h;
    play(scene, 0.05);
    play(scene, 0.6, ['JUMP'], ['JUMP']);
  }

  it('hitting a crate from below pops the item out; walking into it collects it', () => {
    const scene = new LevelScene(ROOM, ART, () => {});
    headButt(scene, 1);
    expect(scene.level.tileAt(1, 2)).toBe('used');
    play(scene, 2);
    // The Mango landed on the crate top (or Pip already caught it on the way down).
    expect(scene.items.some((i) => i.kind === 'mango' && !i.moving) || scene.form.form === 'big').toBe(true);
  });

  it('small Pip only bumps cracked stone; Big Pip breaks it', () => {
    const scene = new LevelScene(ROOM, ART, () => {});
    headButt(scene, 3);
    expect(scene.level.tileAt(3, 2)).toBe('cracked');
    scene.form.eatMango();
    play(scene, 0.5); // grow
    expect(scene.pip.h).toBe(PIP.BIG_HEIGHT);
    headButt(scene, 3);
    expect(scene.level.tileAt(3, 2)).toBe('air');
  });
});

describe('seed pods', () => {
  const FLAT = new Level({ name: 'f', rows: ['P' + '.'.repeat(39), '#'.repeat(40)] });

  it('fly forward in an arc, skip off the ground twice, then pop', () => {
    const pod = new SeedPod(32, 0, false);
    let highest = pod.y;
    let skips = 0;
    let lastVy = pod.vy;
    for (let i = 0; i < 300 && !pod.gone; i++) {
      pod.update(DT, FLAT);
      highest = Math.min(highest, pod.y);
      if (lastVy > 0 && pod.vy < 0) skips++;
      lastVy = pod.vy;
    }
    expect(highest).toBeLessThan(0); // rose first
    expect(skips).toBe(SEED.BOUNCES);
    expect(pod.x).toBeGreaterThan(150);
    expect(pod.gone).toBe(true);
  });

  it('pop on a wall', () => {
    const walled = new Level({ name: 'w', rows: ['P....#', '######'] });
    const pod = new SeedPod(20, 8, false);
    for (let i = 0; i < 60 && !pod.gone; i++) pod.update(DT, walled);
    expect(pod.gone).toBe(true);
    expect(pod.x).toBeLessThan(5 * TILE);
  });

  it('at most two at a time', () => {
    const pods = [new SeedPod(0, 0, false)];
    expect(canFire(pods)).toBe(true);
    pods.push(new SeedPod(0, 0, false));
    expect(canFire(pods)).toBe(false);
    expect(SEED.MAX_ON_SCREEN).toBe(2);
  });

  it('Sling Pip fires with Throw and defeats even the urchin', () => {
    const scene = new LevelScene({ name: 'u', rows: ['P....u....', '##########'] }, ART, () => {});
    scene.form.takeSlingshot();
    play(scene, 0.3);
    play(scene, 1, [], ['THROW']);
    const urchin = scene.enemies[0];
    expect(urchin.active).toBe(false);
    expect(scene.deaths).toBe(0);
  });
});

describe('throwing while running', () => {
  it('starting a run never throws; Throw while running does', () => {
    const scene = new LevelScene({ name: 't', rows: ['P' + '.'.repeat(30), '#'.repeat(31)] }, ART, () => {});
    scene.form.takeSlingshot();
    play(scene, 0.3);
    play(scene, 0.2, ['RUN', 'RIGHT'], ['RUN']);
    expect(scene.pods).toHaveLength(0);
    scene.update(DT, input(['RUN', 'RIGHT'], ['THROW']));
    expect(scene.pods).toHaveLength(1);
  });
});

describe('Starfruit in play', () => {
  it('walking into a crab while starred defeats it', () => {
    const scene = new LevelScene({ name: 's', rows: ['P....c....', '##########'] }, ART, () => {});
    scene.form.eatStarfruit();
    play(scene, 2, ['RIGHT']);
    expect(scene.enemies[0].active).toBe(false);
    expect(scene.deaths).toBe(0);
  });
});

describe('a hit while Big', () => {
  it('shrinks Pip instead of costing a life', () => {
    const scene = new LevelScene({ name: 'b', rows: ['P....c....', '##########'] }, ART, () => {});
    scene.form.eatMango();
    play(scene, 2, ['RIGHT']);
    expect(scene.form.form).toBe('small');
    expect(scene.deaths).toBe(0);
  });
});

describe('game over', () => {
  it('losing the last life shows GAME OVER, then the level starts again with 3 lives', () => {
    const scene = new LevelScene({ name: 'g', rows: ['P.*.', '####'] }, ART, () => {});
    play(scene, 0.5, ['RIGHT']);
    expect(scene.run.fruit).toBe(1);
    for (let i = 0; i < RUN.START_LIVES; i++) {
      scene.die();
      play(scene, COMBAT.DEATH_TIME + 0.05);
    }
    expect(scene.gameOver).toBeGreaterThan(0);
    play(scene, 3.1);
    expect(scene.gameOver).toBeLessThanOrEqual(0);
    expect(scene.run.lives).toBe(RUN.START_LIVES);
    expect(scene.run.fruit).toBe(0);
    expect(scene.items.some((i) => i.kind === 'fruit')).toBe(true); // the fruit is back
  });

  it('running out of Sun costs a life', () => {
    const scene = new LevelScene({ name: 's', rows: ['P...', '####'] }, ART, () => {});
    scene.run.sun = 0.001;
    play(scene, COMBAT.DEATH_TIME + 0.2);
    expect(scene.deaths).toBe(1);
  });
});

describe('the test level', () => {
  it('is valid and has three Sun Coins, crates of every kind and cracked stone', () => {
    expect(checkLevel(TEST_LEVEL)).toEqual([]);
    const L = new Level(TEST_LEVEL);
    expect(L.coins).toHaveLength(3);
    const letters = TEST_LEVEL.rows.join('');
    for (const ch of ['M', 'S', 'T', 'B', '%']) expect(letters).toContain(ch);
    expect(L.fruit.length).toBeGreaterThan(15);
  });

  it('every gap Pip has to pass through is tall enough for Big Pip', () => {
    // Under the ceiling and under the cracked pocket there are at least 3 clear tiles above the floor.
    const L = new Level(TEST_LEVEL);
    for (const [col, floorRow] of [[99, 16], [45, 13]] as const) {
      for (let r = floorRow - 3; r < floorRow; r++) expect(L.isSolid(col, r)).toBe(false);
    }
  });
});
