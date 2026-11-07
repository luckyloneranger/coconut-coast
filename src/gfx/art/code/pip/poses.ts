// Every Pip animation as a list of poses, and where each lands in the sheet.

import type { Limb, Pose } from './build';

const L = (upper: number, lower: number): Limb => ({ upper, lower });

/** Walking: legs swing about 25°, arms swing the other way. 8 frames. */
function walk(i: number): Pose {
  const a = Math.sin((i / 8) * Math.PI * 2);
  return {
    bob: Math.abs(Math.cos((i / 8) * Math.PI * 2)) < 0.4 ? 1 : 0,
    frontLeg: L(25 * a, 25 * a - (a < 0 ? 20 : 0)),
    backLeg: L(-25 * a, -25 * a - (a > 0 ? 20 : 0)),
    frontArm: L(-20 * a, -20 * a + 15),
    backArm: L(20 * a, 20 * a + 15),
  };
}

/** Running: longer strides, a forward lean, bent arms, the bandana streaming. 8 frames. */
function run(i: number): Pose {
  const a = Math.sin((i / 8) * Math.PI * 2);
  return {
    lean: 2,
    bob: Math.abs(Math.cos((i / 8) * Math.PI * 2)) < 0.4 ? 0 : 1,
    frontLeg: L(42 * a, 42 * a - (a < 0 ? 55 : 10)),
    backLeg: L(-42 * a, -42 * a - (a > 0 ? 55 : 10)),
    frontArm: L(-35 * a + 10, -35 * a + 85),
    backArm: L(35 * a + 10, 35 * a + 85),
    tails: 'flow',
  };
}

const STAND: Pose = { frontLeg: L(4, 4), backLeg: L(-4, -4), frontArm: L(6, 10), backArm: L(-6, 4) };

/** The animations in sheet order. `fps` is the speed for looping ones (walk and run go by distance instead). */
export const PIP_ANIMS = {
  idle: { fps: 3, poses: [STAND, { ...STAND, bob: 0 }, { ...STAND, bob: 1 }, { ...STAND, bob: 1, eyesShut: true }] as Pose[] },
  bored: {
    fps: 4,
    poses: [
      { ...STAND, frontLeg: L(20, -10) }, // foot raised: tapping
      STAND,
      { ...STAND, frontLeg: L(20, -10) },
      { ...STAND, frontArm: L(150, 175), eyesShut: true }, // a yawn and a stretch
    ] as Pose[],
  },
  walk: { fps: 0, poses: Array.from({ length: 8 }, (_, i) => walk(i)) },
  run: { fps: 0, poses: Array.from({ length: 8 }, (_, i) => run(i)) },
  skid: { fps: 0, poses: [{ lean: -2, frontLeg: L(35, 40), backLeg: L(-10, -25), frontArm: L(-50, -30), backArm: L(-70, -40), tails: 'flow' }] as Pose[] },
  // Jumping up: pushing off, the front knee driving up, the back leg trailing, the near arm reaching up in front of the face.
  rise: { fps: 0, poses: [{ lean: 2, frontLeg: L(75, 15), backLeg: L(-20, -40), frontArm: L(135, 155), backArm: L(-50, -30), tails: 'hang' }] as Pose[] },
  // The top of the jump: a tuck, knees up (the feet leave the bottom of the frame), arms out for balance.
  apex: { fps: 0, poses: [{ frontLeg: L(80, 20), backLeg: L(45, -30), frontArm: L(80, 110), backArm: L(-80, -100), tails: 'flow' }] as Pose[] },
  // Falling: legs reaching down and apart for the landing, arms up and out (the near one forward, clear of the face).
  fall: {
    fps: 8,
    poses: [
      { frontLeg: L(20, 30), backLeg: L(-25, -10), frontArm: L(115, 135), backArm: L(-125, -145), tails: 'up' },
      { frontLeg: L(15, 20), backLeg: L(-20, -5), frontArm: L(105, 125), backArm: L(-115, -135), tails: 'up' },
    ] as Pose[],
  },
  land: { fps: 0, poses: [{ crouch: 3, frontLeg: L(10, 10), backLeg: L(-10, -10), frontArm: L(40, 60), backArm: L(-40, -20) }] as Pose[] },
  duck: { fps: 0, poses: [{ crouch: 6, lean: 1, frontLeg: L(10, 10), backLeg: L(-10, -10), frontArm: L(50, 70), backArm: L(-20, 0) }] as Pose[] },
  throw: {
    fps: 0,
    poses: [
      { ...STAND, lean: -1, frontArm: L(-120, -160), backArm: L(20, 40) }, // wind up
      { ...STAND, lean: 2, frontArm: L(95, 90), backArm: L(-30, -10) }, // release
    ] as Pose[],
  },
  hurt: { fps: 0, poses: [{ lean: -3, frontLeg: L(30, 10), backLeg: L(-5, -20), frontArm: L(-150, -130), backArm: L(-130, -110), eyesShut: true, tails: 'flow' }] as Pose[] },
  victory: {
    fps: 3,
    poses: [
      { ...STAND, frontArm: L(170, 175), backArm: L(-170, -175) },
      { ...STAND, bob: -2, frontLeg: L(15, -20), backLeg: L(-15, -30), frontArm: L(160, 180), backArm: L(-160, -180) },
    ] as Pose[],
  },
  death: { fps: 0, poses: [{ frontLeg: L(25, 15), backLeg: L(-25, -15), frontArm: L(160, 160), backArm: L(-160, -160), eyesShut: true, tails: 'up' }] as Pose[] },
} as const;

export type PipAnim = keyof typeof PIP_ANIMS;
export const PIP_ANIM_ORDER = Object.keys(PIP_ANIMS) as PipAnim[];

/** Where each animation starts in the sheet, and how many frames it has. */
export const PIP_FRAMES: Record<PipAnim, { start: number; count: number; fps: number }> = (() => {
  const out = {} as Record<PipAnim, { start: number; count: number; fps: number }>;
  let start = 0;
  for (const name of PIP_ANIM_ORDER) {
    const a = PIP_ANIMS[name];
    out[name] = { start, count: a.poses.length, fps: a.fps };
    start += a.poses.length;
  }
  return out;
})();

/** All the poses in sheet order. */
export const ALL_PIP_POSES: readonly Pose[] = PIP_ANIM_ORDER.flatMap((name) => PIP_ANIMS[name].poses);
export const PIP_FRAME_COUNT = ALL_PIP_POSES.length;
