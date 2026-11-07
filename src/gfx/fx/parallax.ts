// Parallax maths and colour cycling: plain functions, so they can be tested.

/**
 * Where to start drawing a repeating layer of width `w` (px, at or left of 0)
 * when the camera is at `cameraX` and the layer moves at `speed` times the
 * level (plus `drift` px it has moved on its own).
 */
export function layerStart(cameraX: number, speed: number, w: number, drift = 0): number {
  const offset = (cameraX * speed + drift) % w;
  return -(offset < 0 ? offset + w : offset);
}

/** Which colour from a cycle of `n` shows in slot `slot` at time `t` (s), stepping `speed` times a second. */
export function cycleIndex(slot: number, t: number, speed: number, n: number): number {
  return (((slot + Math.floor(t * speed)) % n) + n) % n;
}
