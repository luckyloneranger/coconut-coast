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

/** Phase 0 test box (replaced by Pip's real movement in Phase 1). */
export const TEST_BOX = {
  WALK_SPEED: 100, // px/s
  RUN_SPEED: 180, // px/s while Run is held
  FLOOR_Y: 230, // px, top of the floor
};

/** External sprites (see gfx/art). */
export const ART = {
  MAGENTA_TOLERANCE: 40, // 0-255: how far from pure #FF00FF a pixel can be and still turn see-through
};

/** Debug overlay. */
export const DEBUG = {
  FPS_SAMPLE_PERIOD: 0.5, // s between FPS readings
};
