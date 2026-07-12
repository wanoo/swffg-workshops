/** Immersive workshop scenes with clickable Monk's Active Tiles that launch the flows.
 *  Backgrounds live in assets/scenes/, chip icons in assets/chips/. Tiles reference macros by
 *  ROLE (@macro:<role>) — the installer rewires them to the freshly created macros. */
export const SCENES = [
  {
    role: "scene-atelier-mod",
    width: 1536, height: 1024, padding: 0.25, grid: { size: 100, type: 1 },
    background: "assets/scenes/atelier-mod.png",
    tiles: [
      { texture: "assets/chips/chip-forge.svg",     x: 1620, y: 1023, w: 100, h: 100, macro: "saber-forge" },
      { texture: "assets/chips/chip-reglage.svg",    x: 1005, y: 1113, w: 100, h: 100, macro: "tuning" },
      { texture: "assets/chips/chip-atelier.svg",  x: 1204, y: 994,  w: 100, h: 100, macro: "atelier" },
    ],
  },
  {
    role: "scene-atelier-potion",
    width: 1536, height: 1024, padding: 0.25, grid: { size: 100, type: 1 },
    background: "assets/scenes/atelier-potion.png",
    tiles: [
      { texture: "assets/chips/chip-alchimie.svg",   x: 608, y: 1013, w: 100, h: 100, macro: "potions" },
      { texture: "assets/chips/chip-atelier.svg",  x: 760, y: 1013, w: 100, h: 100, macro: "atelier" },
    ],
  },
];
