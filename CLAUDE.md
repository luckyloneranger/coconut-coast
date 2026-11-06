# CLAUDE.md — Coconut Coast

Source of truth: `SPEC.md`. Phase progress: `PROGRESS.md`.

## Working rules for Claude Code

Work one phase at a time, plan before coding, and stop for the user after every phase.

1. Read `SPEC.md` in full before starting. Re-read the relevant sections at the start of each phase.
2. Before coding a phase, give a short plan (files, open questions, risks) and wait for the user's OK.
3. Build the smallest playable version first. Plain boxes before art.
4. Put every tunable number in `src/game/tuning.ts`, with units in a comment.
5. Keep logic (`update`) separate from drawing (`render`) so it can be unit-tested.
6. Ask before adding any npm package. No network requests while the game runs. No analytics or tracking.
7. Original assets only. Never copy or imitate sprites, levels, music, sounds, characters or names from existing games (in particular Super Mario and Adventure Island). Fonts only under open licences.
8. At the end of each phase, meet the definition of done in SPEC section 10, then stop and wait.
9. When the user reports a feel problem, suggest specific tuning changes with before and after values before rewriting any system.
10. If the spec is unclear or contradicts itself, ask. When the user changes a decision, update `SPEC.md`.
11. Assume the user is not a professional game developer. Keep files small, names clear and comments short. Explain any command the user needs to run.
