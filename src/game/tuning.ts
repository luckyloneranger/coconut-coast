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
  STICK: 0.5, // how far (0-1) the left stick must be pushed sideways to count as left or right
  STICK_VERTICAL: 0.75, // ...and up or down (only when pushed more up/down than sideways, so a tilted run isn't 'down')
};

/** Pip's movement. 16 px = 1 tile. Speeds in px/s, accelerations in px/s². */
export const PIP = {
  WIDTH: 16, // px, collision box (the sprite is 24 x 32 and drawn centred on it)
  HEIGHT: 28, // px
  BIG_HEIGHT: 36, // px when Big (the sprite is 24 x 40)
  DUCK_HEIGHT: 20, // px while ducking (small)
  BIG_DUCK_HEIGHT: 26, // px while ducking (Big): fits under a 2-tile gap
  WALK_SPEED: 100, // top speed walking
  RUN_SPEED: 180, // top speed with Run held
  ACCEL: 600, // speeding up to walking speed (0 -> 100 in about 0.17 s)
  RUN_ACCEL: 250, // speeding up from walking to running speed (about 0.32 s more)
  DECEL: 800, // slowing down with no direction held (walking speed to a stop in about 0.12 s)
  SKID_DECEL: 1600, // braking when pushing the other way
  SKID_MIN_SPEED: 60, // only skid (lean and dust) above this speed
  AIR_CONTROL: 0.65, // share of ground acceleration (speeding up) you get in the air
  AIR_BRAKE: 1.0, // share of ground braking (stopping, turning round) you get in the air
  APEX_SPEED: 60, // px/s: rising slower than this with Jump held counts as the top of the jump...
  APEX_GRAVITY_SCALE: 0.5, // ...where gravity is this much lighter (a little hang; heights stay exact)
  CORNER_NUDGE: 4, // px: a head that clips a ceiling corner by this much slides past it
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

/** Pip's animation. */
export const ANIM = {
  BORED_AFTER: 5, // s standing still before the bored animation starts
  WALK_STRIDE: 6, // px travelled per walk frame
  RUN_STRIDE: 9, // px travelled per run frame
  APEX_SPEED: 70, // px/s: rising or falling slower than this shows the turn at the top of a jump
  THROW_TIME: 0.2, // s the throw poses show after firing a pod
  HURT_TIME: 0.4, // s the hurt pose shows after a hit
  FLASH_TIME: 0.12, // s of white flash when hit
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

/** Lives, score and the Sun Meter. */
export const RUN = {
  START_LIVES: 3,
  FRUIT_FOR_LIFE: 100, // an extra life every this many fruit
  FRUIT_POINTS: 10,
  COIN_POINTS: 1000,
  STOMP_CHAIN: [100, 200, 400, 800], // points for each stomp in a row without landing; the next is an extra life
  SUN_FULL_TIME: 45, // s a full Sun Meter lasts
  SUN_PER_FRUIT: 0.125, // share of the meter each fruit refills
  SUN_LOW: 0.25, // below this share the meter blinks as a warning
};

/** Pip's forms and power-ups. */
export const FORMS = {
  HURT_BLINK: 1.5, // s of blinking (can't be hurt) after a hit shrinks Pip
  STARFRUIT_TIME: 8, // s of invincibility from a Starfruit
  STARFRUIT_ENDING: 2, // s before it runs out that the flashing slows (a warning)
};

/** Crates and items. */
export const ITEMS = {
  POP_SPEED: 160, // px/s an item jumps up out of a crate
  POP_GRAVITY: 600, // px/s² pulling it back onto the crate top
  BURST_FRUIT: 5, // fruit from a fruit-burst crate
  BURST_SPREAD: 70, // px/s sideways spread of burst fruit
  PICKUP_REACH: 4, // px of extra reach when collecting (feels fair)
  BIG_STOMP_SPEED: 150, // px/s: Big Pip landing this fast on a crate opens it
};

/** Seed pods from the Slingshot. */
export const SEED = {
  SPEED_X: 220, // px/s forward
  SPEED_Y: -120, // px/s up at launch (an arc)
  GRAVITY: 700, // px/s²
  BOUNCES: 2, // times a pod skips off the ground before popping (so it can hit low enemies)
  BOUNCE_KEEP: 0.7, // share of its downward speed it bounces back up with
  MAX_ON_SCREEN: 2,
  SIZE: 6, // px, collision box
  LIFE: 1.6, // s before a pod disappears if it hits nothing
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
  SWOOP_TIME: 1.5, // s for one swoop, down to Pip's height and back up (1.1 felt too fast, 2.0 too slow)
  COOLDOWN: 1.5, // s gliding before it can swoop again
  FRAME_TIME: 0.12, // s per wing frame
};

/** External sprites (see gfx/art). */
export const ART = {
  MAGENTA_TOLERANCE: 40, // 0-255: how far from pure #FF00FF a pixel can be and still turn see-through
};

/** Particles and screen effects. */
export const FX = {
  MAX_PARTICLES: 220, // the oldest are dropped past this
  DUST_EVERY: 0.05, // s between dust puffs while skidding
  LAND_DUST_SPEED: 220, // px/s: landing faster than this kicks up dust
  SPARKLE_EVERY: 0.6, // s between sparkles on each fruit or coin (on average)
  STOMP_FREEZE: 0.05, // s the game pauses on a stomp, for punch
  SHAKE_TIME: 0.25, // s of screen shake on a big impact
  SHAKE_SIZE: 2, // px the screen moves at most while shaking
  AFTERIMAGE_SPEED: 175, // px/s: running at least this fast leaves after-images
  AFTERIMAGES: 3, // how many trail behind
  AFTERIMAGE_GAP: 0.05, // s between them
};

/** Parallax: how fast each background layer scrolls compared with the level (1 = with it). */
export const PARALLAX = {
  FAR: 0.1,
  CLOUDS: 0.2,
  CLOUD_DRIFT: 6, // px/s the clouds drift on their own
  MID_FAR: 0.25, // the hazy far row of palms
  MID: 0.45,
  FRONT: 1.2, // in front of Pip, a little faster than the level
  FRONT_EVERY: 960, // px of level between foreground pieces
  FRONT_ALPHA: 0.8, // foreground palms are a little see-through, so nothing in play is ever hidden
  SWAY_TIME: 0.6, // s per palm sway frame
};

/** Sea water. */
export const WATER = {
  SINK: 6, // px Pip's feet go below the surface before it costs a life
  ALPHA: 0.6, // how solid the water looks (Pip shows through)
  CYCLE_SPEED: 4, // colour steps per second on the rippling surface
};

/** Debug overlay. */
export const DEBUG = {
  FPS_SAMPLE_PERIOD: 0.5, // s between FPS readings
};
