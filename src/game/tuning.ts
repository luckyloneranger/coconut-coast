// Every tunable number in the game lives here, grouped by area, with units.
// Change values here to adjust the feel without touching game code.

/** Screen and game loop. */
export const DISPLAY = {
  WIDTH: 480, // px, drawing width (16:9); scales ×4 to 1080p
  HEIGHT: 270, // px, drawing height
  MIN_CRISP_SCALE: 2, // below this whole-number scale (phones), fill the screen at a fractional scale instead
};

export const LOOP = {
  STEPS_PER_SECOND: 60, // logic updates per second (fixed step)
  MAX_FRAME_TIME: 0.25, // s, longest frame we catch up on (stops a burst after a tab switch)
};

/** Gamepads. */
export const GAMEPAD = {
  STICK: 0.5, // how far (0-1) the left stick must be pushed to count as a d-pad press
};

/** Pip's movement. 16 px = 1 tile. Speeds in px/s, accelerations in px/s². */
export const PIP = {
  WIDTH: 16, // px, collision box (the sprite is 24 x 32 and drawn centred on it)
  HEIGHT: 28, // px
  WALK_SPEED: 100, // top speed walking
  RUN_SPEED: 180, // top speed with Run held
  ACCEL: 600, // speeding up to walking speed (0 -> 100 in about 0.17 s)
  RUN_ACCEL: 250, // speeding up from walking to running speed (about 0.32 s more)
  DECEL: 800, // slowing down with no direction held (walking speed to a stop in about 0.12 s)
  SKID_DECEL: 1600, // braking when pushing the other way
  SKID_MIN_SPEED: 60, // only skid (lean and dust) above this speed
  AIR_CONTROL: 0.65, // share of ground acceleration you get in the air
  GRAVITY: 800, // while rising: a full jump takes about 0.4 s to the top
  FALL_GRAVITY_SCALE: 1.6, // falling is heavier than rising, so jumps feel snappy
  MAX_FALL_SPEED: 400, // fall speed cap
  // Jump heights with Jump held (the take-off speed is worked out from these, see jumpSpeedFor).
  JUMP_HEIGHT: 64, // px (4 tiles) from standing or walking
  RUN_JUMP_HEIGHT: 80, // px (5 tiles) at full running speed; in between, it scales with speed
  JUMP_CUT: 0.4, // letting go of Jump while rising keeps this share of upward speed (a tap is about 1 tile)
  COYOTE_TIME: 0.08, // s after running off an edge that a jump still works
  JUMP_BUFFER: 0.1, // s before landing that a jump press is remembered
  LAND_SQUASH_TIME: 0.08, // s the landing squash shows
  STRIDE: 14, // px travelled per walk frame
};

/** Phase 1 movement lab. */
export const LAB = {
  FLOOR_Y: 230, // px, top of the floor
  START_X: 40, // px, where Pip starts (and comes back after a fall)
  FALL_LIMIT: 320, // px: below this, Pip has fallen in the gap and starts again
};

/** External sprites (see gfx/art). */
export const ART = {
  MAGENTA_TOLERANCE: 40, // 0-255: how far from pure #FF00FF a pixel can be and still turn see-through
};

/** Debug overlay. */
export const DEBUG = {
  FPS_SAMPLE_PERIOD: 0.5, // s between FPS readings
};
