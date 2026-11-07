// Pip's 16 colours (an original design: island courier with a satchel, a sun
// badge and a short orange bandana). Lit from the top left.

export const PIP_PALETTE = {
  o: '#2a1610', // outline: deep brown, never pure black (also the eye)
  s: '#b8743e', // skin
  S: '#e2a46a', // skin, lit
  z: '#7e4626', // skin, shade (the far arm and leg)
  h: '#2c1c16', // hair
  r: '#e8641e', // bandana
  R: '#ffa04e', // bandana, lit
  v: '#3e9ee0', // vest
  V: '#88d2ff', // vest, lit
  w: '#235f9e', // vest, shade
  t: '#f2eee2', // white tee (and shoe soles)
  k: '#d6bc7a', // khaki shorts (lighter than the skin, so they stand apart)
  K: '#8e7038', // khaki, shade (the far leg)
  e: '#d4383a', // red sneakers
  b: '#8a5226', // satchel and strap
  g: '#ffd03e', // the sun badge
} as const;
