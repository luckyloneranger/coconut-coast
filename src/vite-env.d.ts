/// <reference types="vite/client" />

/** File names of the PNGs in public/art (see vite.config.ts). */
declare module 'virtual:art-manifest' {
  const files: string[];
  export default files;
}
