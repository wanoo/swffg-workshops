/** Content installer — creates the crafting macros and the rules journal in the world's language.
 *  Re-runnable: existing module-flagged documents are kept. */
import { MOD, t, findMacro } from "./util.mjs";
import { JOURNALS } from "./data/journals.mjs";

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

  await game.settings.set(MOD, "installedVersion", game.modules.get(MOD).version ?? "0.1.0");
  ui.notifications.info(t("install.done", { n: done.length }));
  return done;
}
