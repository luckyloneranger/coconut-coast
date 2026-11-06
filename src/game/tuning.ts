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
  DROP_THROUGH_TIME: 0.25, // s that one-way platforms let you fall through after Down + Jump
  LAND_SQUASH_TIME: 0.08, // s the landing squash shows
  STRIDE: 14, // px travelled per walk frame
};

/** The camera. Positions in px from the top-left of the screen. */
export const CAMERA = {
  DEAD_ZONE_W: 64, // px wide window in the middle where Pip moves without the camera following
  LOOK_AHEAD: 80, // px the view slides ahead of Pip at full running speed
  LOOK_AHEAD_RATE: 120, // px/s the look-ahead slides in or out
  EASE: 8, // how quickly the camera catches up (higher = snappier); 8 is about 1/8 s
  FEET_LINE: 0.72, // share of the screen height where Pip's feet sit on the ground
  TOP_MARGIN: 0.18, // share of the screen above which the camera follows a jump up
  BOTTOM_MARGIN: 0.88, // share of the screen below which the camera follows a fall straight away
};

/** Levels. */
export const LEVEL = {
  FALL_BELOW: 48, // px below the bottom of the level before a fall counts as lost
};

/** Stomping, getting hit and coming back. */
export const COMBAT = {
  STOMP_GRACE: 6, // px: feet this far below an enemy's top still count as landing on it
  STOMP_BOUNCE: 20, // px Pip bounces up off a stomped enemy
  STOMP_BOUNCE_HELD: 56, // px if Jump is held during the stomp (for chains)
  SQUASH_TIME: 0.35, // s a stomped enemy shows squashed before it pops
  DEATH_POP: 300, // px/s Pip is thrown up when hit
  DEATH_GRAVITY: 700, // px/s² pulling Pip down during the death spin
  DEATH_TIME: 1.2, // s from the hit to coming back
  WAKE_MARGIN: 64, // px outside the screen at which enemies start moving
};

/** Enemies. */
export const CRAB = {
  WIDTH: 20, // px, collision box (sprite 24 x 16)
  HEIGHT: 14,
  SPEED: 30, // px/s walking
  GRAVITY: 900, // px/s²
  FRAME_TIME: 0.15, // s per walk frame
};

export const URCHIN = {
  SIZE: 14, // px, collision box (sprite 16 x 16)
  FRAME_TIME: 0.3, // s per spike pulse frame
};

export const GULL = {
  WIDTH: 20, // px, collision box (sprite 24 x 20)
  HEIGHT: 12,
  PATROL: 48, // px it glides either side of where it started
  PATROL_SPEED: 40, // px/s
  TRIGGER: 120, // px: swoops when Pip is this close sideways (and below)
  WARNING: 0.4, // s it hovers and flaps fast before diving, so you can see it coming
  SWOOP_TIME: 2.0, // s for one swoop, down to Pip's height and back up (was 1.1: far too fast)
  COOLDOWN: 1.5, // s gliding before it can swoop again
  FRAME_TIME: 0.12, // s per wing frame
};

/** External sprites (see gfx/art). */
export const ART = {
  MAGENTA_TOLERANCE: 40, // 0-255: how far from pure #FF00FF a pixel can be and still turn see-through
};

/** Debug overlay. */
export const DEBUG = {
  FPS_SAMPLE_PERIOD: 0.5, // s between FPS readings
};
