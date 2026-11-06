# Coconut Coast — Build Spec for Claude Code

Nov 6, 2026 · Harendra Prasad · Draft 1, waiting for approval

## 1. How to use this spec

Claude Code builds the game in short phases. Each phase ends with something you can play, and you check it before the next one starts. It works the same way as Pixel Summer Games:

1. Say "Plan Phase N". Claude Code replies with a short plan.
2. Approve or adjust the plan.
3. When the phase is done, run `npm run dev` and play it in your browser.
4. Give feedback in plain words ("the jump feels floaty"). Every gameplay number lives in `src/game/tuning.ts`.
5. Say "Phase N approved" to move on.

**For Claude Code:** this file is the source of truth. When the user changes a decision, update this file to match.

## 2. Game overview and design pillars

**Coconut Coast** (working title) is a retro 8-bit side-scrolling platformer for the browser. A young island courier named **Pip** runs, jumps and stomps across a chain of tropical islands to deliver the Sun Shell back to the lighthouse before the islands fall into an endless night.

It belongs to the same family as the 1980s console platformers (run right, jump on enemies, find secrets, beat a boss at the end of each world), but every character, level, sprite, tune and name is new.

**Design pillars**

1. **The jump is everything.** Tight, responsive controls: a jump that goes higher the longer you hold, a little air steering, and forgiving timing (coyote time and jump buffering). If the jump feels good, the game feels good.
2. **Momentum.** Walking is safe; running is fast and risky. Levels reward players who learn to keep moving.
3. **Short, readable levels.** Each level takes 2 to 4 minutes. Hazards are clear at a glance, and nothing kills you that you couldn't see coming.
4. **Secrets for the curious.** Hidden fruit, bonus rooms and shortcuts, but nothing required to finish.
5. **Authentic retro look and sound.** Low resolution, a limited palette, chiptune music, all generated in code and all original.
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
| Duck / enter pipe-style doors | ↓ or S | Down | Down pad |
| Jump (hold for higher) | Space, Z or W/↑ | A | JUMP button (right thumb) |
| Run (hold) / throw | X or Shift | B or X | RUN button; throw is a tap |
| Pause | Esc or P | Start | Pause icon |

Menus use the arrows, Enter or Space to confirm and Esc to go back (pad: A and B; touch: on-screen arrows, OK and BACK).

### Movement (the feel)

All values are starting points in `tuning.ts`, in pixels and seconds at 60 steps per second.

- **Walk** top speed about 80 px/s; **run** (button held) about 140 px/s. Speeding up and slowing down take a moment, so Pip has weight. Turning around while running skids briefly.
- **Variable jump:** a press gives a strong upward push. Letting go early cuts the rise short, so a tap is a hop and a hold reaches about 4 tiles high (5 when running).
- **Coyote time:** you can still jump for about 0.08 s after running off a ledge.
- **Jump buffer:** a jump pressed up to about 0.1 s before landing still happens on landing.
- **Air control:** you can steer in the air, a little less than on the ground.
- **Fall speed** is capped so long drops stay readable.
- **Stomp:** landing on most enemies from above defeats them and bounces Pip up; holding Jump makes the bounce higher.
- **Collision** is tile-based with axis-separated movement (move X then resolve, then Y then resolve). One-way platforms can be jumped through from below.

### Health and lives

- Small Pip dies from one hit. A **Mango** makes Pip **Big** (taller sprite, can break cracked stone blocks with a head-butt). A hit while Big shrinks Pip back to small with a short invincible blink.
- The **Slingshot** lets Pip fire seed pods in an arc (two on screen at most) that defeat most enemies. A hit removes the Slingshot first.
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

- Tiles are 16 × 16 px; a screen shows 20 × 11 tiles. Levels are up to about 200 tiles long and 11 to 30 tiles tall.
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

All graphics and sound are generated in code, so the game needs no image or audio files.

### Visuals

- **Resolution:** 320 × 180 (16:9) on an offscreen canvas, scaled by the largest whole number that fits, image smoothing off, so the pixels stay crisp.
- **Palette:** one fixed palette of about 32 original colours, chosen for bright tropical daytime, a swampy green, a volcanic red and a stormy blue. Blend with dithering, not see-through colours.
- **Sprites:** pixel maps in code (strings, one character per colour), built once into canvases with an outline and top-edge highlights.
- **Pip:** small form 16 × 16, Big form 16 × 24. Frames: stand, walk (4), run (4), skid, jump up, fall, duck, throw, hurt, victory, and a death spin. Pip's look is original: a satchel, a sun-shaped badge, a short bandana. No cap, no overalls, no grass skirt.
- **Backgrounds:** two or three parallax layers per world (far sky and clouds, distant islands or mountains, near foliage), with animated water and waving palms.
- **Font:** an original 8 × 8 bitmap font in code, plus a small 3 × 5 font for numbers.
- **Game feel:** dust when you skid or land, a squash and stretch on landing, a short screen shake on a boss hit, sparkles on fruit, a pop on stomped enemies. Shake and flashing can be reduced in Options.

### Audio

- A small chiptune synthesiser in code (Web Audio): square, triangle and noise channels.
- Original tunes: title, world map, one per world, boss, invincible, level clear, game over.
- Effects: jump, stomp, fruit, power-up, hurt, crate bump, throw, checkpoint, extra life, goal.
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
| 5 | **Art pass:** palette, Pip's sprites, tiles, Palm Beach backgrounds, effects | It looks like the game |
| 6 | **Audio:** synthesiser, effects, Palm Beach tune | It sounds like the game |
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

- A steady 60 frames a second on a mid-range laptop and a recent phone. No new objects every frame in the hot loop.
- Download under 500 KB compressed.
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
| Hero | Pip, a young island courier | Your own character idea |
| Screen shape | 320 × 180 widescreen | 256 × 240, the squarer classic-console look |
| Sun Meter | On, with Relaxed mode to turn it off | Off by default, or removed |
| Lives | 3 lives, extra life every 100 fruit | Unlimited lives with checkpoints only |
| Worlds in v1 | 4 worlds × 3 levels + bosses | Start smaller: 2 worlds |
| Engine | None (Canvas 2D + TypeScript) | Phaser 3 |
| Repository | New GitHub repo `coconut-coast`, private until v1 | Public from the start |
| Hosting | GitHub Pages | Netlify, Vercel |
