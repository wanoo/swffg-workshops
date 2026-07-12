/** Content installer — creates the crafting macros and the rules journal in the world's language.
 *  Re-runnable: existing module-flagged documents are kept. */
import { MOD, t, findMacro } from "./util.mjs";
import { JOURNALS } from "./data/journals.mjs";
import { SCENES } from "./data/scenes.mjs";

const asset = p => p.startsWith("icons/") || p.startsWith("systems/") ? p : `modules/${MOD}/${p}`;

// build a Monk's Active Tiles clickable tile that runs a module macro (by role)
function activeTile(tl) {
  const mac = findMacro(tl.macro);
  return {
    texture: { src: asset(tl.texture), anchorX: 0.5, anchorY: 0.5, fit: "fill", scaleX: 1, scaleY: 1, tint: "#ffffff", alphaThreshold: 0.75 },
    x: tl.x, y: tl.y, width: tl.w, height: tl.h, elevation: 0, sort: 100, rotation: 0, alpha: 1, hidden: false, locked: false,
    flags: { "monks-active-tiles": {
      active: true, record: false, restriction: "all", controlled: "all", trigger: ["click"], allowpaused: true,
      usealpha: false, pointer: true, pertoken: false, minrequired: 0, chance: 100, fileindex: 0, files: [],
      actions: mac ? [{ action: "runmacro", data: { entity: { id: `Macro.${mac.id}`, name: mac.name }, args: "", runasgm: "player" }, id: foundry.utils.randomID() }] : [],
    } },
  };
}

const MACROS = [
  { role: "atelier",     img: "icons/tools/smithing/anvil.webp" },
  { role: "saber-forge", img: "icons/weapons/swords/sword-laser-red.webp" },
  { role: "potions",     img: "icons/consumables/potions/bottle-round-corked-red.webp" },
  { role: "tuning",      img: "icons/tools/smithing/hammer-and-anvil.webp" },
];

export async function installContent({ force = false } = {}) {
  if (!game.user.isGM) return ui.notifications.warn(t("install.gmOnly"));
  const done = [];
  const folder = game.folders.find(f => f.type === "Macro" && f.name === t("folders.craft") && !f.folder)
    ?? await Folder.create({ name: t("folders.craft"), type: "Macro" });
  for (const m of MACROS) {
    if (findMacro(m.role)) continue;
    await Macro.create({
      name: t(`macros.${m.role}`), type: "script", img: m.img, folder: folder.id,
      command: `game.modules.get("${MOD}").api.run("${m.role}");`,
      ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER },
      flags: { [MOD]: { role: m.role } },
    });
    done.push(t(`macros.${m.role}`));
  }

  // rules journal (bilingual pages), created once
  for (const j of JOURNALS) {
    if (game.journal.find(x => x.flags?.[MOD]?.role === j.role)) continue;
    await JournalEntry.create({
      name: t(`journals.${j.role}`), flags: { [MOD]: { role: j.role } },
      ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER },
      pages: j.pages.map((p, i) => ({ name: p.name, type: "text", sort: i * 10,
        text: { content: p.content, format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML } })),
    });
    done.push(t(`journals.${j.role}`));
  }

  // immersive scenes with clickable tiles (only if Monk's Active Tiles is present)
  const hasMAT = game.modules.get("monks-active-tiles")?.active;
  for (const s of SCENES) {
    if (game.scenes.find(x => x.flags?.[MOD]?.role === s.role)) continue; // already module-managed
    // adopt an existing same-named world scene (yours) instead of creating a duplicate
    const existing = game.scenes.getName(t(`scenes.${s.role}`));
    if (existing) { await existing.setFlag(MOD, "role", s.role); done.push(t(`scenes.${s.role}`)); continue; }
    await Scene.create({
      name: t(`scenes.${s.role}`), width: s.width, height: s.height, padding: s.padding,
      grid: { type: s.grid.type, size: s.grid.size }, background: { src: asset(s.background) },
      backgroundColor: "#000000", tokenVision: false, environment: { globalLight: { enabled: true }, darknessLevel: 0 },
      flags: { [MOD]: { role: s.role } },
      tiles: hasMAT ? s.tiles.map(activeTile) : [],
    });
    done.push(t(`scenes.${s.role}`));
  }

  await game.settings.set(MOD, "installedVersion", game.modules.get(MOD).version ?? "0.1.0");
  ui.notifications.info(t("install.done", { n: done.length }));
  return done;
}
