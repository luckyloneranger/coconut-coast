// Colours shared by the whole game. Each sprite also has its own small palette
// (16-bit style); these are the common ones for the screen, text and UI.

export const UI = {
  BLACK: '#000000',
  INK: '#1a1428', // text shadow, outlines on UI
  WHITE: '#f8f4ec',
  YELLOW: '#ffd84a',
  GREEN: '#5ce06c',
  GREY: '#8a8aa0',
  SKY_TOP: '#3a7ee0',
  SKY_MID: '#5aa8f0',
  SKY_LOW: '#9ad8f8',
  SAND: '#f0d08a',
  SAND_DARK: '#c89c58',
  GRASS: '#48b848',
  GRASS_DARK: '#2a7a3a',
} as const;
