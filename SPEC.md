# Coconut Coast — Build Spec for Claude Code

Nov 6, 2026 · Harendra Prasad · Approved (draft 2, 16-bit look)

## 1. How to use this spec

Claude Code builds the game in short phases. Each phase ends with something you can play, and you check it before the next one starts. It works the same way as Pixel Summer Games:

1. Say "Plan Phase N". Claude Code replies with a short plan.
2. Approve or adjust the plan.
3. When the phase is done, run `npm run dev` and play it in your browser.
4. Give feedback in plain words ("the jump feels floaty"). Every gameplay number lives in `src/game/tuning.ts`.
5. Say "Phase N approved" to move on.

**For Claude Code:** this file is the source of truth. When the user changes a decision, update this file to match.

## 2. Game overview and design pillars

**Coconut Coast** (working title) is a 16-bit-style side-scrolling platformer for the browser. A young island courier named **Pip** runs, jumps and stomps across a chain of tropical islands to deliver the Sun Shell back to the lighthouse before the islands fall into an endless night.

It belongs to the same family as the console platformers of the late 1980s and early 1990s, in the style of the 16-bit era: bigger, more detailed sprites, rich colour, deep parallax backgrounds and lush music. The gameplay follows the classic formula (run right, jump on enemies, find secrets, beat a boss at the end of each world), but every character, level, sprite, tune and name is new.

**Design pillars**

1. **The jump is everything.** Tight, responsive controls: a jump that goes higher the longer you hold, a little air steering, and forgiving timing (coyote time and jump buffering). If the jump feels good, the game feels good.
2. **Momentum.** Walking is safe; running is fast and risky. Levels reward players who learn to keep moving.
3. **Short, readable levels.** Each level takes 2 to 4 minutes. Hazards are clear at a glance, and nothing kills you that you couldn't see coming.
4. **Secrets for the curious.** Hidden fruit, bonus rooms and shortcuts, but nothing required to finish.
5. **A rich 16-bit look and sound.** Detailed, smoothly animated sprites, hundreds of colours, layered parallax scenery, see-through water and light, and warm synth music with echo. All generated in code and all original.
6. **Runs anywhere.** Desktop browsers with keyboard or gamepad, phones and tablets with on-screen buttons. No install, no login, no server.

**Original work only.** Do not copy, trace or closely imitate the characters, sprites, levels, music, sounds, names or logos of any existing game, including Nintendo's *Super Mario* series or Hudson Soft's *Adventure Island*. The genre and its general ideas (running, jumping, stomping enemies, power-ups, worlds and bosses) are shared by many games and are fine. The specific look and content must be our own.

## 3. Scope

| Area | In v1 | Later (backlog, rough priority order) |
| --- | --- | --- |
| Worlds | 4 worlds × 3 levels, plus a boss arena per world (16 stages) | A fifth secret world, time-trial mode |
| Hero | Pip, with 3 forms: small, Big (after a Mango) and Sling (after a Slingshot) | A rideable animal friend, a second playable character |
| Modes | Story (world map, lives, saves), Level Select for finished levels | Time Trial with ghost runs, 2-player co-op |
| Controls | Keyboard, gamepad, on-screen touch buttons | Key remapping (v1 has fixed defaults plus WASD and arrow options) |
| Saving | Progress, best times, fruit counts and settings in the browser (localStorage) | — |
| Tools | Levels written as text maps in code | A simple in-browser level editor |

**Not in v1:** online play, accounts, a backend server, ads or payments, 3D, licensed music.

## 4. Controls and core mechanics

### Controls

| Action | Keyboard | Gamepad | Touch (landscape) |
| --- | --- | --- | --- |
| Move | ← → or A D | D-pad or left stick | Left and right pads (left thumb) |
| Duck / enter pipe-style doors | ↓ or S | Down (a firm, mostly downward push on the stick) | Down pad |
| Jump (hold for higher) | Space, Z, W or ↑ | A | JUMP button (right thumb) |
| Run (hold) | Shift or X | RB or RT | RUN button |
| Throw a seed pod (Sling Pip) | C | B or X | THROW button |
| Pause | Esc or P | Start | Pause icon |

Changed after a controls review in Phase 4: Run and Throw used to share a button, so starting a run as Sling Pip wasted a pod. Throw now has its own button, and Run never throws. On a pad, Run moved to the shoulder buttons, so it can be held while the thumb presses A or B.

Menus use the arrows, Enter or Space to confirm and Esc to go back (pad: A and B; touch: on-screen arrows, OK and BACK).

### Movement (the feel)

All values are starting points in `tuning.ts`, in pixels and seconds at 60 steps per second, at the game's 480 × 270 resolution with 16 px tiles.

- **Walk** top speed about 100 px/s; **run** (button held) about 180 px/s. Speeding up and slowing down take a moment, so Pip has weight. Turning around while running skids briefly.
- **Variable jump:** a press gives a strong upward push. Letting go early cuts the rise short, so a tap is a hop and a hold reaches about 4 tiles high (5 when running).
- **Coyote time:** you can still jump for about 0.08 s after running off a ledge.
- **Jump buffer:** a jump pressed up to about 0.1 s before landing still happens on landing.
- **Air control:** you can steer in the air. Speeding up is weaker than on the ground (65%), but braking and turning round are just as strong, so a misjudged jump can be corrected (decided after the controls review).
- **Jump peak:** with Jump held, gravity is half as strong for the last moment before the top (rising slower than 60 px/s), for a little hang. Jump heights stay exactly 4 and 5 tiles.
- **Corner nudge:** a head that clips the corner of a block above by 4 px or less slides past it instead of stopping the jump.
- **Fall speed** is capped so long drops stay readable.
- **Stomp:** landing on most enemies from above defeats them and bounces Pip up; holding Jump makes the bounce higher.
- **Collision** is tile-based with axis-separated movement (move X then resolve, then Y then resolve). One-way platforms can be jumped through from below.

### Health and lives

- Small Pip dies from one hit. A **Mango** makes Pip **Big** (taller sprite, can break cracked stone blocks with a head-butt). A hit while Big shrinks Pip back to small with a short invincible blink.
- The **Slingshot** lets Pip fire seed pods in an arc (two on screen at most) that defeat every enemy. The pods skip off the ground twice, so they can hit low enemies (decided in Phase 4). Picking up the Slingshot also makes small Pip Big, so the forms go small → Big → Sling, and each hit goes back one step (decided in Phase 4).
- Falling into a pit or the sea, or touching lava or spikes, costs a life whatever your form.
- 3 lives at the start; every 100 fruit gives an extra life. A **checkpoint flag** halfway through each level is where you restart. Losing every life sends you back to the world map with your progress kept but the level restarted.

### The Sun Meter (on by default, can be turned off)

A nod to the island-platformer genre, done our own way: a meter at the top of the screen slowly drains as Pip travels, and fruit tops it up. When it empties, Pip loses a life. It keeps players moving and gives fruit a purpose. Options → **Relaxed mode** turns the meter off for younger or newer players.

### Collectibles and power-ups

- **Fruit** (bananas, berries, pineapples): score and Sun Meter.
- **Mango:** become Big. **Slingshot:** throw seed pods. **Starfruit:** about 8 s of invincibility, with an extra tune.
- **Sun Coins:** three hidden in each level, for 100% completion. They unlock the bonus world later (backlog).
- **Item crates:** hit from below (or stomp when Big) to release an item.

## 5. World and level specs

### Story

The Sun Shell keeps the islands warm and bright. A greedy storm-bird, **Captain Gale**, steals it and splits it into four pieces, one guarded on each island. Pip, the island's fastest courier, sets off to bring it home.

### Worlds

| World | Theme | New ideas | Boss |
| --- | --- | --- | --- |
| 1. Palm Beach | Sand, palm trees, rock pools | Basic jumping, crabs, crates, the first Mango | **Big Shelly**, a giant hermit crab that charges and hides in its shell |
| 2. Mangrove Maze | Tangled roots, swamp water, fireflies | Swinging vines, moving logs, frogs that leap at you | **Old Croaker**, a toad that sinks into the swamp and leaps up |
| 3. Ember Peak | Volcano, lava, falling rocks | Crumbling platforms, rising lava, fire bats | **Magmaw**, a rock golem that throws lava balls |
| 4. Cloud Reef | Floating islands in a stormy sky, wind | Wind gusts that push Pip, cloud platforms that fade | **Captain Gale** in his airship |

Each world has three levels and a boss arena. Level 3 of each world is the hardest and adds a twist (for example an auto-scrolling level).

### Enemies (start of the list)

| Enemy | Behaviour | Defeat |
| --- | --- | --- |
| Snapper crab | Walks back and forth, turns at walls and ledges | Stomp, seed pod |
| Spiny urchin | Sits still or rolls slowly | Seed pod only (spikes on top) |
| Gull | Swoops down in a curve when Pip comes near | Stomp, seed pod |
| Coconut monkey | Sits in a palm tree and drops coconuts | Seed pod |
| Jumping frog | Hops toward Pip every 2 s | Stomp, seed pod |
| Fire bat | Flies in a wave pattern | Seed pod; stomp only when Big |
| Rock roller | Rolls downhill, bounces off walls | Avoid, or seed pod |

### Level format

- Tiles are 16 × 16 px; a screen shows 30 × about 17 tiles. Levels are up to about 250 tiles long and 17 to 40 tiles tall. Tiles come in sets with edge and corner pieces, so ground looks hand-built rather than blocky; the level text uses one character per kind of tile and the game picks the right edge piece by looking at its neighbours (auto-tiling).
- Levels are written as **text maps in code** (one character per tile), with a legend for ground, platforms, hazards, crates, enemies, fruit, checkpoints and the goal. This keeps levels easy to read, change and test without an editor.
- Each level ends at a **goal hut**: walking in finishes the level, with a bonus for remaining Sun Meter and time.

## 6. Modes, scoring and screen flow

### Modes

- **Story:** the world map (Pip walks between level dots). Finished levels stay open. Three save slots.
- **Level Select:** replay any finished level to chase coins and best times.

### Scoring

Fruit 10, enemies 100 (more in a chain of stomps without landing: 100, 200, 400, 800, then an extra life), Sun Coins 1000, and a time bonus at the goal. Score matters for bragging rights; progress depends only on finishing levels.

### Screen flow

Title → Save slot → World map → Level intro card ("1-1 PALM BEACH") → Level → Goal tally → World map. Pause menu: resume, restart level, world map, options. Options: sound and music volume, Relaxed mode, reduce flashing and shake, controls guide.

## 7. Art and audio direction

Sound is generated in code. The art has two sources, and the game can use either (decided after spec approval):

- **Default: art drawn in code**, as pixel maps in TypeScript. The game always has a complete set of these, so it never depends on outside files.
- **Option: external sprites.** Any asset can be replaced by a PNG in `public/art/` with the asset's file name and exact frame size (listed in `src/gfx/art/assets.ts`). The game switches with the art option: `?art=external` in the address, the T key for now, and Options → Art in Phase 8. The choice is saved. Assets without a usable file (missing, broken or the wrong size) quietly use the code version, so external art can arrive one asset at a time. Pure magenta pixels become see-through.

Where the external images come from:

1. **Images from an image generator.** The user generates sprite sheets, tiles and backgrounds with an AI image tool, using the prompts in `ART_PROMPTS.md`, and saves them as PNGs in `art/raw/`. A cleanup tool (built in the art phase) shrinks each image onto the true pixel grid, cuts out the magenta background, snaps colours to that asset's palette and slices the frames. The cleaned sheets go in `public/art/` and load at start-up. They must still follow every rule below (sizes, palettes, original designs).
2. Or hand-drawn sheets from a pixel editor, if wanted later.

The art switch never blocks the gameplay phases. The sprite viewer (art phase) shows both versions side by side so the user can choose per asset.

### Visuals (16-bit style)

- **Resolution:** 480 × 270 (16:9) on an offscreen canvas. It scales exactly ×4 to a 1080p screen, ×2 to 960 × 540, and ×1.5 to 720p. On desktop it scales by whole numbers with smoothing off, so the pixels stay crisp. On phones a whole-number scale would leave the game tiny, so it fills the screen at the nearest size with smoothing still off. That makes a few pixel rows slightly uneven, which is barely visible at phone sizes.
- **Colour:** up to 256 colours on screen, organised like 16-bit consoles: each sprite or tile set uses its own small palette of up to 16 colours (including several shades of each hue). Swapping a palette recolours a sprite, for enemy variants, a hit flash or night versions of a level.
- **Palette effects:** colour cycling for water shimmer, lava glow and waterfalls (the colours rotate, so the art stays still but appears to flow).
- **See-through effects (new compared with 8-bit):** water you can see Pip through, soft light shafts in the mangrove, fog banks, glows around fire and the Starfruit, and fades between screens. Use canvas alpha sparingly and from fixed values so it stays fast.
- **Sprites:** cleaned-up PNG sheets, or pixel maps in code (strings, one character per colour from that sprite's palette); either way built once into canvases. Shading is drawn into the maps (light from the top left, 3 to 4 shades per colour, darker outlines that pick up the colour next to them rather than flat black). No automatic outline: 16-bit sprites are shaded by hand.
- **Pip:** 24 × 32 small, 24 × 40 Big (Phase 5: drawn in code from a hand-drawn head and shaded body parts placed by a pose table; Big Pip has a longer body, not a stretched copy; Sling Pip holds the slingshot). Animation with in-between frames: stand (with a breathing idle and a bored animation after 5 s), walk (8), run (8, leaning forward), skid, jump rising, the turn at the top of a jump, fall, land squash, duck, look up, throw, hurt, victory, and a death spin. Pip's look is original: a satchel, a sun-shaped badge, a short bandana. No cap, no overalls, no grass skirt.
- **Enemies and bosses:** 24 to 32 px enemies with 4 to 8 frames each; bosses up to 96 × 96, built from several parts that move separately (a crab's claws, a golem's arms).
- **Backgrounds:** 4 to 5 parallax layers per world (sky gradient, far clouds or mountains, mid islands, near foliage, and a foreground layer that passes in front of Pip now and then). Some layers move on their own: drifting clouds, swaying palms, rolling waves, falling ash.
- **Lighting and weather:** time of day per level (dawn, day, sunset, night) by swapping palettes; fireflies and glowing mushrooms at night; rain and wind in Cloud Reef.
- **Fonts:** an original 8 × 8 bitmap font with a shaded, outlined title style for headings, plus a small 5 × 7 font for HUD numbers.
- **Game feel:** dust and splash particles, squash and stretch, after-images when running at top speed, a screen shake on big impacts, a short freeze frame on a stomp, sparkles on fruit, an enemy pop with flying stars. Shake and flashing can be reduced in Options.
- **Art budget:** 16-bit art takes far more pixels than 8-bit. To keep files manageable, each sprite's map lives in its own small file under `gfx/sprites/`, and a debug sprite viewer (`?sprites=1`) shows every sprite and animation so the art can be checked without playing.

### Audio (16-bit style)

- A synthesiser in code (Web Audio) with 8 voices, closer to 16-bit consoles than to 8-bit chiptune: simple FM and wavetable instruments (bass, plucked strings, marimba, steel drum, brass stabs, pads), a noise drum kit, and a shared echo and reverb, which was the signature of 16-bit music.
- Original tunes: title, world map, one per world (a laid-back steel-drum beach tune, a swampy groove, a driving volcano theme, an airy sky theme), boss, invincible, level clear, game over. Tunes loop cleanly.
- Effects: jump, stomp, fruit, power-up, hurt, crate bump, throw, checkpoint, extra life, goal, splash, plus ambient loops (waves, swamp frogs, rumbling lava, wind).
- Music and effects volumes are separate, plus mute.

## 8. Technical architecture

### Stack

- TypeScript (strict), Vite, Canvas 2D. No game engine.
- Vitest for logic tests, Playwright for one browser smoke test.
- GitHub Pages for hosting (a GitHub Actions workflow builds and deploys).

### Game loop

A fixed 60 Hz update step with an accumulator, drawing once per browser frame. Logic (`update`) is kept apart from drawing (`render`) so the physics, collision and enemy rules can be unit-tested without a browser.

### Modules

- `core/`: loop, input (keyboard, gamepad, touch → logical actions), renderer, scenes, storage, random numbers.
- `world/`: tile map parsing, collision, camera, level data.
- `actors/`: Pip, enemies, items, projectiles; each with `update` and `render`.
- `game/`: `tuning.ts`, scoring, lives, Sun Meter, save data.
- `gfx/`: palette, font, sprite builder, sprites, backgrounds, effects.
- `audio/`: synthesiser, sound effects, music.
- `scenes/`: title, save slots, world map, level, pause, tally, options.
- `ui/`: HUD, menus, touch controls.

### Debug tools

`?debug=1` or the backtick key shows collision boxes, Pip's speed and state, and the frame time. Keys to jump to the next checkpoint and to slow the game down.

## 9. Build phases

Each phase ends with something playable.

| Phase | Goal | Playable result |
| --- | --- | --- |
| 0 | Project setup: Vite, TypeScript, the fixed-step loop, scaled canvas, input, a test | A coloured box you can move |
| 1 | **Movement and jumping:** walk, run, variable jump, coyote time, jump buffer, on a flat test floor | A box that feels good to control |
| 2 | **Tiles and camera:** text-map levels, tile collision, one-way platforms, a scrolling camera with a dead zone, pits | A box running through a test level |
| 3 | **Enemies and stomping:** crab, urchin, gull; hits, deaths, respawn at the checkpoint | A level with danger |
| 4 | **Items and forms:** fruit, crates, Mango (Big), Slingshot, Starfruit, Sun Meter, lives, HUD | The full core loop, still in boxes |
| 5 | **Art pass, part 1:** palette system, sprite viewer, Pip's full animation set, Palm Beach tile set with auto-tiling | Pip and the ground look finished |
| 5b | **Art pass, part 2:** parallax backgrounds, colour cycling, see-through water, particles, enemy sprites | Palm Beach looks like a 16-bit game |
| 6 | **Audio:** the 8-voice synth with echo, effects, Palm Beach tune | It sounds like the game |
| 7 | **World 1 content:** levels 1-1 to 1-3, Big Shelly boss, goal hut, tally | One full world |
| 8 | **Screens and saving:** title, save slots, world map, pause, options, Relaxed mode | A real game from start to the end of World 1 |
| 9 | **Touch and gamepad:** on-screen buttons, pad support, phone layout | Playable on a phone |
| 10 | **Worlds 2 to 4** with their enemies, mechanics and bosses, one world at a time (10a to 10c) | The whole adventure |
| 11 | **Polish and release:** ending, credits, balancing, performance, deploy to GitHub Pages | v1 |

## 10. Testing, quality and definition of done

### Definition of done (every phase)

- [ ] `npm run build` finishes with no TypeScript errors.
- [ ] `npm test` passes.
- [ ] No errors in the browser console during normal play.
- [ ] Any new gameplay numbers live in `tuning.ts`.
- [ ] `PROGRESS.md` updated: what's done, known issues, what's next.
- [ ] 3 to 5 things for the user to play-test, plus the tuning values most likely to need adjusting.
- [ ] Committed to Git as "Phase N: short summary".

### Tests

- **Unit tests (Vitest):** jump height for a tap and a hold, coyote time, jump buffer, tile collision (walls, ceilings, one-way platforms, slopes if added), stomp versus side hit, enemy turning at ledges, item effects, Sun Meter drain and refill, extra lives, level parsing (every level has one start and one goal, and every enemy and item is on a known tile), save-data loading.
- **Smoke test (Playwright):** load the page, start a new game, play the first screen of 1-1 with scripted inputs, reach the checkpoint, no console errors.

### Performance and compatibility

- A steady 60 frames a second on a mid-range laptop and a recent phone. No new objects every frame in the hot loop. Draw only what's on screen, and pre-draw static layers and tile chunks into canvases.
- Download under 1.5 MB compressed. Generated art arrives as small, palette-reduced PNG sheets; there are still no audio files.
- Current Chrome, Edge, Firefox and Safari on desktop; Safari on iPhone and Chrome on Android in landscape. Pauses when the tab is hidden.

### Accessibility

- Relaxed mode (no Sun Meter, and checkpoints keep your form).
- Reduce flashing and shake.
- Hazards shown by shape and animation, not colour alone.
- Text readable at 1× scale.

## 11. Working rules for Claude Code

1. Read `SPEC.md` in full before starting. Re-read the relevant sections at the start of each phase.
2. Before coding a phase, give a short plan (files, open questions, risks) and wait for the user's OK.
3. Build the smallest playable version first. Plain boxes before art.
4. Put every tunable number in `src/game/tuning.ts`, with units in a comment.
5. Keep logic (`update`) separate from drawing (`render`) so it can be unit-tested.
6. Ask before adding any npm package. No network requests while the game runs. No analytics or tracking.
7. Original assets only. Never copy or imitate sprites, levels, music, sounds, characters or names from existing games (in particular *Super Mario* and *Adventure Island*). Fonts only under open licences.
8. At the end of each phase, meet the definition of done in section 10, then stop and wait.
9. When the user reports a feel problem, suggest specific tuning changes with before and after values before rewriting any system.
10. If the spec is unclear or contradicts itself, ask. When the user changes a decision, update `SPEC.md`.
11. Assume the user is not a professional game developer. Keep files small, names clear and comments short. Explain any command the user needs to run.

## 12. Open decisions

Every decision has a default, so work can start straight away. Change any of them before Phase 0, or later.

| Decision | Default | Alternatives |
| --- | --- | --- |
| Game name | Coconut Coast | Any original name |
| Slopes | None in v1: flat ground and steps (decided in Phase 2) | Add slopes later if a world needs them |
| Drop through one-way platforms | Down + Jump (decided in Phase 2) | — |
| Enemies after a death | All come back to their starting places (decided in Phase 3) | Defeated enemies stay gone |
| Sun Meter speed | A full meter lasts 45 s; each fruit refills an eighth (decided in Phase 4) | Any values in `RUN` in `tuning.ts` |
| Game over before the world map exists | The level starts again with 3 lives (Phase 4, until Phase 8) | — |
| Ducking | Down on the ground ducks: the collision box gets shorter (Big Pip fits under 2-tile gaps) and Pip can't walk while ducked (decided in Phase 5) | Pose only |
| Look up | Not a control, because Up is also Jump on the keyboard; the frame is kept for cutscenes (decided in Phase 5) | — |
| Cleanup tool for generated images | A page in the game (`?art-tool=1`), built in Phase 5b | — |
| Water | Deadly sea water in pits (`~`), see-through with a rippling surface (decided in Phase 5b) | Shallow rock pools to wade through (could come later, e.g. the mangrove world) |
| Foreground layer | Sparse palms pass in front of Pip, never over the display at the top (Phase 5b) | Everything behind Pip |
| Calm mode before Options | `?calm=1`: no screen shake, no white flash, slow Starfruit shimmer (Phase 5b, until Phase 8) | — |
| Hero | Pip, a young island courier | Your own character idea |
| Look and resolution | 16-bit style at 480 × 270 widescreen | 384 × 216 (a little chunkier, less art to draw), or 8-bit at 320 × 180 |
| Art made in | **Decided:** drawn in code by default; external PNG sprites as an option, per asset (the user is trying an AI image generator with `ART_PROMPTS.md`) | Hand-drawn sheets from a pixel editor such as Aseprite |
| Sun Meter | On, with Relaxed mode to turn it off | Off by default, or removed |
| Lives | 3 lives, extra life every 100 fruit | Unlimited lives with checkpoints only |
| Worlds in v1 | 4 worlds × 3 levels + bosses | Start smaller: 2 worlds |
| Engine | None (Canvas 2D + TypeScript) | Phaser 3 |
| Repository | New GitHub repo `coconut-coast`, private until v1 | Public from the start |
| Hosting | GitHub Pages | Netlify, Vercel |
