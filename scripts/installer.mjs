/** Content installer — creates the crafting macro folder and the three workshop macros
 *  in the world's language. Re-runnable: existing module-flagged macros are kept. */
import { MOD, t, findMacro } from "./util.mjs";

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
  await game.settings.set(MOD, "installedVersion", game.modules.get(MOD).version ?? "0.1.0");
  ui.notifications.info(t("install.done", { n: done.length }));
  return done;
}
