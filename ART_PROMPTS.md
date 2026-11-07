# Art prompts — Coconut Coast

Prompts for making the game's sprites with an image generator (Gemini, ChatGPT, Midjourney or similar). If the results don't work out, the game falls back to art drawn in code (SPEC section 7).

## How to get usable sprites

Image generators make pictures that look like pixel art, but the "pixels" are rarely a perfect grid and the colours drift. That's fine: we clean them up afterwards (the game's art tool shrinks each image onto the real pixel grid and snaps the colours to the palette). These habits make the cleanup easy:

1. **Make Pip first, then reuse the design.** Generate the character sheet (prompt 1). When you like one, upload it as a reference image with every later Pip prompt and say "same character as the reference". This keeps Pip looking the same across animations.
2. **Ask for a flat magenta background (#FF00FF).** Most generators can't do real transparency. Magenta never appears in the art, so the tool can cut it out cleanly.
3. **One thing per image.** One character sheet, one animation, one enemy or one tile set at a time. Big "everything" sheets come out muddled.
4. **Square images, frames in a row, evenly spaced.** Say how many frames you want and ask for equal gaps.
5. **Generate several, keep the best.** Expect to try 3 to 5 times per asset.
6. **Save as PNG** (not JPG, which smudges pixels) into the project's `art/raw/` folder, named like the headings below (for example `pip-run.png`).
7. **Don't name other games or their characters in the prompts.** It risks copying protected art, and the game must be original.

## The style block (paste at the start of every prompt)

> 16-bit era console pixel art, crisp hard-edged pixels with no anti-aliasing, no blur, no gradients except stepped pixel shading. Limited palette of about 16 colours per sprite with 3 to 4 shades per colour, light coming from the top left. Dark coloured outlines (deep brown, deep teal or deep purple, never pure black). Bright, warm tropical colours. Clean readable silhouette. Side view (facing right) unless stated. Flat solid magenta background (#FF00FF), nothing else in the background, no text, no shadows on the background, no border.

## 1. Pip, character sheet (do this first) — `pip-sheet.png`

> [style block] Character design sheet for an original video game hero named Pip: a cheerful young island courier, about 12 years old, short and nimble, warm brown skin, messy dark hair tied with a short orange bandana, a sleeveless sky-blue vest over a white tee, a brown leather satchel worn across the body with a round golden sun-shaped badge on the strap, knee-length khaki shorts, red sneakers with white soles. Show four poses in a row, evenly spaced: standing facing right, standing facing the viewer, walking mid-stride, jumping with arms up. The character is roughly 24 pixels wide and 32 pixels tall at true pixel scale, shown enlarged so each pixel is a clear square block.

## 2. Pip animations (upload the chosen Pip sheet as a reference each time)

Add this line to each: *"Same character as the reference image, identical colours and proportions, about 24 × 32 pixels at true scale, frames in a single row, evenly spaced, facing right."*

| File | Prompt (after the style block) |
| --- | --- |
| `pip-idle.png` | 4 frames of a gentle breathing idle: shoulders rise and fall slightly, blink on the last frame. |
| `pip-walk.png` | 8-frame walk cycle, relaxed pace, arms swinging opposite to legs, the satchel bouncing slightly. |
| `pip-run.png` | 8-frame run cycle, body leaning forward, long strides, bandana tails flapping behind. |
| `pip-jump.png` | 4 frames: crouch before take-off, rising with one knee up, the top of the jump with arms out, falling with legs reaching down. |
| `pip-misc.png` | 6 frames: skid (leaning back, dust at feet), duck, look up, throwing a seed with a slingshot, hurt (knocked back, eyes shut), victory (both fists in the air). |
| `pip-big.png` | The same 4 poses as the character sheet, but Pip is taller and stronger after eating a magic mango: about 24 × 40 pixels, a faint golden glow on the outline. |

## 3. Enemies — one image each, 4 frames in a row

| File | Prompt (after the style block) |
| --- | --- |
| `enemy-crab.png` | A small red beach crab with big snapping claws and googly eyes on stalks, about 24 × 16 pixels, 4-frame sideways walk cycle with claws opening and closing. |
| `enemy-urchin.png` | A round purple sea urchin covered in pointed spikes, about 16 × 16 pixels, 4 frames of spikes slowly pulsing. |
| `enemy-gull.png` | A grumpy white-and-grey seagull with a yellow beak, about 24 × 20 pixels, 4-frame flying cycle with wings flapping. |
| `enemy-monkey.png` | A mischievous little brown monkey sitting on a palm frond holding a coconut, about 24 × 24 pixels, 4 frames: sitting, lifting the coconut, throwing, laughing. |
| `enemy-frog.png` | A plump green swamp frog with orange spots, about 24 × 20 pixels, 4 frames: sitting, crouching, leaping, landing. |
| `enemy-firebat.png` | A small bat made of glowing embers and dark rock, orange and red, about 24 × 16 pixels, 4-frame wing flap. |

## 4. Items — one image, all items in a row — `items.png`

> [style block] A row of 8 collectible items, each about 16 × 16 pixels, evenly spaced: a banana bunch, a red berry cluster, a pineapple, a ripe mango (power-up, slightly glowing), a wooden slingshot, a golden starfruit with sparkles, a shiny gold coin with a sun face, a wooden supply crate stamped with a simple sun symbol.

## 5. Tiles — Palm Beach — `tiles-beach.png`

> [style block, but use a flat magenta background only between tiles] A tile set for a side-scrolling platformer on a tropical beach, laid out on a grid of 16 × 16 pixel tiles with 1 pixel gaps: grassy sand ground top edge, left and right corners, plain sand fill, sandstone blocks, a thin wooden plank platform (left end, middle, right end), a palm tree trunk segment, palm fronds, a rock pool water surface, spikes made of sharp coral. Seamless where tiles join.

## 6. Backgrounds — Palm Beach (wide images, no magenta)

Ask for a wide image (16:9 or wider). These are layers that scroll at different speeds, so each must be a separate image.

| File | Prompt |
| --- | --- |
| `bg-beach-sky.png` | 16-bit era pixel art background, a bright tropical sky with stepped colour bands from deep blue at the top to pale turquoise at the horizon, a few fluffy pixel clouds, a warm sun. No ground, no objects. Seamless left to right. |
| `bg-beach-far.png` | 16-bit era pixel art, distant tropical islands and a calm turquoise sea along the bottom third, soft blue-green tones, the top two thirds flat magenta (#FF00FF). Seamless left to right. |
| `bg-beach-near.png` | 16-bit era pixel art, a row of palm trees and leafy bushes along the bottom half, rich greens and warm browns, the top half flat magenta (#FF00FF). Seamless left to right. |

## 7. Bosses (later phases)

| File | Prompt (after the style block) |
| --- | --- |
| `boss-shelly.png` | A giant hermit crab boss living in a huge spiral seashell decorated with barnacles and seaweed, angry eyes, one oversized claw, about 96 × 80 pixels. 3 poses in a row: standing, charging with claw forward, hiding inside the shell. |
| `boss-gale.png` | An original villain: a stout, scheming storm-bird captain with ruffled grey feathers, a long blue coat with gold buttons, a tricorn hat with a lightning-bolt feather, standing on the deck rail of a small wooden airship. About 64 × 64 pixels. 3 poses: standing, flapping and laughing, swooping down. |

## Pip's sheets in the game (for lining up generated frames)

The game's Pip sheets are one row of 37 frames each, in this order (frame numbers start at 0):

| Frames | Animation |
| --- | --- |
| 0-3 | idle (breathing, blink on the last) |
| 4-7 | bored (foot tap, a yawn and stretch) |
| 8-15 | walk |
| 16-23 | run |
| 24 | skid |
| 25 | rise (jumping up) |
| 26 | the turn at the top of a jump |
| 27-28 | fall |
| 29 | land (squash) |
| 30 | duck |
| 31-32 | throw (wind-up, release) |
| 33 | hurt |
| 34-35 | victory |
| 36 | death |

- `pip.png`: small Pip, 24 × 32 per frame (888 × 32 in all).
- `pip-big.png`: Big Pip, 24 × 40 (888 × 40).
- `pip-sling.png`: Big Pip holding the slingshot, 24 × 40.

Any frame you don't have yet can be copied from the nearest one. The sprite viewer (`?sprites=1`) shows the code-drawn version of every frame to compare against.

## What to send back

The game already has a switch for this: art drawn in code is the default, and external PNGs in `public/art/` replace it asset by asset (press T in the game, or add `?art=external` to the address).

- **Straight from the image tool:** put the PNGs in `art/raw/` (or attach them in chat). They'll be the wrong size, so I'll run them through the cleanup step, which shrinks them onto the real pixel grid and cuts them into frames, and then put the results in `public/art/`.
- **Already the exact size** (for example, after you fix them up in a pixel editor): put them straight into `public/art/` with the asset's file name. The frame sizes are listed in `src/gfx/art/assets.ts`; frames sit side by side in one row. The game uses the file as soon as you reload.

Either way, we compare each asset with the code-drawn version and keep whichever looks better.

**About rights:** check the terms of the image tool you use, so you're allowed to use its output in your game. Most allow it, but they differ.
