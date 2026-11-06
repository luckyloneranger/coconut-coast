import type { InputSnapshot } from '../core/input';

/** What Pip is told to do this step. */
export interface PipControls {
  left: boolean;
  right: boolean;
  run: boolean; // Run held
  jumpPressed: boolean; // Jump pressed this step
  jumpHeld: boolean;
}

export const NO_CONTROLS: PipControls = { left: false, right: false, run: false, jumpPressed: false, jumpHeld: false };

export function readControls(input: InputSnapshot): PipControls {
  return {
    left: input.isDown('LEFT'),
    right: input.isDown('RIGHT'),
    run: input.isDown('RUN'),
    jumpPressed: input.justPressed('JUMP'),
    jumpHeld: input.isDown('JUMP'),
  };
}
