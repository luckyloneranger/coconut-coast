// Logical actions and the keys, gamepad buttons and (later) touch buttons that trigger them.
// Gamepad codes come from core/gamepad.ts ("PadA", "PadLeft"...).

export type Action =
  | 'LEFT'
  | 'RIGHT'
  | 'UP'
  | 'DOWN'
  | 'JUMP'
  | 'RUN'
  | 'PAUSE'
  | 'CONFIRM'
  | 'BACK'
  | 'ART_TOGGLE'
  | 'DEBUG';

export type KeyMap = Record<Action, string[]>;

export const DEFAULT_KEYMAP: KeyMap = {
  LEFT: ['ArrowLeft', 'KeyA', 'PadLeft'],
  RIGHT: ['ArrowRight', 'KeyD', 'PadRight'],
  UP: ['ArrowUp', 'KeyW', 'PadUp'],
  DOWN: ['ArrowDown', 'KeyS', 'PadDown'],
  JUMP: ['Space', 'KeyZ', 'KeyW', 'ArrowUp', 'PadA'],
  RUN: ['KeyX', 'ShiftLeft', 'ShiftRight', 'PadB', 'PadX'],
  PAUSE: ['Escape', 'KeyP', 'PadStart'],
  CONFIRM: ['Enter', 'Space', 'PadA', 'PadStart'],
  BACK: ['Escape', 'PadB'],
  ART_TOGGLE: ['KeyT'], // switch between code-drawn and external sprites (until Options exists)
  DEBUG: ['Backquote'],
};

/** Keys whose browser default (page scrolling) we block. */
export const NO_SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);
