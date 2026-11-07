// Builds a Pip frame from parts: a hand-drawn head, then a torso, arms and legs
// placed by a pose. One builder for every frame keeps the character consistent,
// and Big Pip is the same parts with a longer body (not a stretched copy).

import type { PixelMap } from '../../pixels';
import { PixelGrid } from '../draw';
import { PIP_PALETTE } from './palette';

/** Hand-drawn head, facing right (hair at the back, face at the front). 10 x 10. */
const HEAD = [
  '..hhhhh...',
  '.hhhhhhhh.',
  'rRRRRRRRr.',
  'hhsSSSSSs.',
  'hsSSSSoSs.',
  'hsSSSSoSSs',
  'hssSSSSSs.',
  '.ssSSSzs..',
  '..sssss...',
  '...zz.....',
];
/** The same head with the eye shut (blinking, hurt). */
const HEAD_SHUT = HEAD.map((row, y) => (y === 4 ? 'hsSSSSSSs.' : y === 5 ? 'hsSSSooSSs' : row));

/** One limb: angles in degrees from pointing straight down; positive swings forward (toward the facing side). */
export interface Limb {
  upper: number; // thigh or upper arm
  lower: number; // shin or forearm, relative to straight down as well
}

export interface Pose {
  bob?: number; // px the whole body moves down (breathing, landing)
  lean?: number; // px the shoulders and head shift forward (+) or back (-)
  crouch?: number; // px the hips drop, with the knees bending to match
  frontLeg: Limb;
  backLeg: Limb;
  frontArm: Limb;
  backArm: Limb;
  eyesShut?: boolean;
  /** Bandana tails: hanging, streaming back (running), or flying up (falling). */
  tails?: 'hang' | 'flow' | 'up';
  /** Holding the slingshot (Sling form) in the front hand. */
  sling?: boolean;
}

/** Body sizes in px: small Pip (24 x 32) and Big Pip (24 x 40). */
export interface BodySize {
  h: number;
  thigh: number;
  shin: number;
  torso: number;
  upperArm: number;
  forearm: number;
}
export const SMALL_BODY: BodySize = { h: 32, thigh: 5, shin: 5, torso: 7, upperArm: 4, forearm: 4 };
export const BIG_BODY: BodySize = { h: 40, thigh: 7, shin: 7, torso: 10, upperArm: 5, forearm: 5 };

const W = 24;
const HIP_X = 11; // px, where the hips sit across the frame (facing right)

export function buildPip(pose: Pose, body: BodySize): PixelMap {
  const g = new PixelGrid(W, body.h);
  const ankleY = body.h - 3; // the shoe takes the bottom two rows
  const legLen = body.thigh + body.shin;
  const hipY = ankleY - legLen + (pose.crouch ?? 0) + (pose.bob ?? 0);
  const lean = pose.lean ?? 0;
  const shoulderX = HIP_X + lean;
  const shoulderY = hipY - body.torso;
  const crouch = pose.crouch ?? 0;
  // Crouching bends the knees: swing both shins back to keep the feet down.
  const bend = (l: Limb, sign: number): Limb => (crouch ? { upper: l.upper + crouch * 9 * sign, lower: l.lower - crouch * 9 * sign } : l);

  arm(g, shoulderX - 1, shoulderY + 1, pose.backArm, body, 'z', 'z');
  leg(g, HIP_X - 1, hipY, bend(pose.backLeg, 1), body, 'K', 'z');
  satchel(g, HIP_X - 5, hipY - 3);
  torso(g, HIP_X, hipY, lean, body.torso);
  g.rect(HIP_X - 3, hipY, 7, 2, 'k'); // the top of the shorts
  leg(g, HIP_X + 1, hipY, bend(pose.frontLeg, 1), body, 'k', 's');
  head(g, shoulderX - 4, shoulderY - 10, pose.eyesShut ?? false);
  tails(g, shoulderX - 5, shoulderY - 8, pose.tails ?? 'hang');
  const hand = arm(g, shoulderX + 1, shoulderY + 1, pose.frontArm, body, 's', 'S');
  if (pose.sling) slingshot(g, hand.x, hand.y);
  g.outline('o');
  return g.toMap({ ...PIP_PALETTE });
}

/** A point `len` px from (x, y) at `deg` degrees from straight down (positive = forward, to the right). */
function reach(x: number, y: number, deg: number, len: number): { x: number; y: number } {
  const a = (deg * Math.PI) / 180;
  return { x: x + Math.sin(a) * len, y: y + Math.cos(a) * len };
}

/** A thick line of `ch` from a to b (`w` px wide). */
function thick(g: PixelGrid, a: { x: number; y: number }, b: { x: number; y: number }, w: number, ch: string): void {
  const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * 2));
  for (let i = 0; i <= steps; i++) {
    const x = a.x + ((b.x - a.x) * i) / steps;
    const y = a.y + ((b.y - a.y) * i) / steps;
    g.rect(Math.round(x - (w - 1) / 2), Math.round(y - (w - 1) / 2), w, w, ch);
  }
}

function leg(g: PixelGrid, x: number, y: number, l: Limb, body: BodySize, shorts: string, skin: string): void {
  const knee = reach(x, y, l.upper, body.thigh);
  const ankle = reach(knee.x, knee.y, l.lower, body.shin);
  // Shorts cover the top 60% of the thigh; bare leg below, so they read as shorts, not trousers.
  const hem = { x: x + (knee.x - x) * 0.6, y: y + (knee.y - y) * 0.6 };
  thick(g, hem, knee, 2, skin);
  thick(g, knee, ankle, 2, skin);
  thick(g, { x, y }, hem, 3, shorts);
  // Sneaker pointing forward: red upper, white sole.
  const fx = Math.round(ankle.x) - 1;
  const fy = Math.round(ankle.y) + 1;
  g.rect(fx, fy - 1, 4, 1, 'e');
  g.rect(fx, fy, 5, 1, 'e');
  g.rect(fx, fy + 1, 5, 1, 't');
}

/** Draws an arm and returns where the hand is. */
function arm(g: PixelGrid, x: number, y: number, l: Limb, body: BodySize, skin: string, lit: string): { x: number; y: number } {
  const elbow = reach(x, y, l.upper, body.upperArm);
  const hand = reach(elbow.x, elbow.y, l.lower, body.forearm);
  thick(g, { x, y }, elbow, 2, skin);
  thick(g, elbow, hand, 2, skin);
  g.set(Math.round(x), Math.round(y), lit); // a lit shoulder
  g.rect(Math.round(hand.x) - 1, Math.round(hand.y) - 1, 2, 2, skin);
  return { x: Math.round(hand.x), y: Math.round(hand.y) };
}

/** The vest over the tee, leaning with the shoulders; the satchel strap and sun badge across it. */
function torso(g: PixelGrid, hipX: number, hipY: number, lean: number, len: number): void {
  for (let i = 0; i < len; i++) {
    const y = hipY - 1 - i;
    const shift = Math.round((lean * i) / Math.max(1, len - 1));
    const left = hipX - 3 + shift;
    g.rect(left, y, 6, 1, 'v');
    g.set(left, y, 'w'); // the back, in shade
    g.set(left + 5, y, 't'); // the tee showing at the open front
    if (i === len - 1) g.rect(left + 1, y, 4, 1, 'V'); // lit shoulders
    // The strap runs from the front shoulder (top) down to the back hip (bottom).
    g.set(left + Math.round((4 * i) / Math.max(1, len - 1)), y, 'b');
  }
  const badgeY = hipY - Math.ceil(len * 0.6);
  const badgeX = hipX + Math.round((lean * 0.6)) + 1;
  g.rect(badgeX, badgeY, 2, 2, 'g');
}

/** The bag at the back hip. */
function satchel(g: PixelGrid, x: number, y: number): void {
  g.rect(x, y, 4, 4, 'b');
  g.rect(x, y, 4, 1, 'k'); // the flap's light edge
}

function head(g: PixelGrid, x: number, y: number, shut: boolean): void {
  const rows = shut ? HEAD_SHUT : HEAD;
  rows.forEach((row, dy) => {
    for (let dx = 0; dx < row.length; dx++) if (row[dx] !== '.') g.set(x + dx, y + dy, row[dx]);
  });
}

/** The two short bandana tails at the back of the head. */
function tails(g: PixelGrid, x: number, y: number, how: 'hang' | 'flow' | 'up'): void {
  const pts =
    how === 'flow'
      ? [[-1, 0], [-2, 0], [-3, 1], [-1, 1], [-2, 2]]
      : how === 'up'
        ? [[-1, 0], [-2, -1], [-3, -1], [-1, -1], [-2, -2]] // streaming back and up while falling
        : [[-1, 0], [-1, 1], [-1, 2], [0, 1], [0, 2]];
  for (const [dx, dy] of pts) g.set(x + dx, y + dy, dy === 0 && dx === -1 ? 'R' : 'r');
}

/** A small wooden slingshot held up in the front hand. */
function slingshot(g: PixelGrid, x: number, y: number): void {
  g.rect(x, y - 1, 1, 3, 'b');
  g.set(x - 1, y - 3, 'b');
  g.set(x - 1, y - 2, 'b');
  g.set(x + 1, y - 3, 'b');
  g.set(x + 1, y - 2, 'b');
  g.set(x, y - 3, 't'); // the band
}
