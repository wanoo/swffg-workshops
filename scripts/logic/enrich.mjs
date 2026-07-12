/** GM utility — retrofit existing world weapons/armor whose attachments were built before the
 *  workshop or dragged from the compendium: backfill readable attachment descriptions and (where the
 *  attachment is a known dataset part) ensure its numeric mods work via the base item's itemmodifier
 *  (the only path swffg 2.0.3 sums into the profile — an attachment's own mods are never summed).
 *  Idempotent, backs up originals, fully revertible. */
import { MOD, t } from "../util.mjs";
import { loadAttachmentData } from "../lib/attach.mjs";

function targets() {
  const out = [];
  for (const a of game.actors)
    for (const it of a.items)
      if ((it.type === "weapon" || it.type === "armour") && (it.system?.itemattachment?.length))
        out.push(it);
  return out;
}

/** Restore an item from its enrich backup. */
async function revertItem(it) {
  const bk = it.getFlag(MOD, "enrichBackup");
  if (!bk) return false;
  await it.update({ "system.itemmodifier": bk.itemmodifier, "system.itemattachment": bk.itemattachment,
    "system.damage.value": bk.damage, "system.crit.value": bk.crit,
    [`flags.${MOD}.-=enrichBackup`]: null, [`flags.${MOD}.-=enriched`]: null });
  return true;
}

/**
 * Non-destructive enrich of one item: backfill missing attachment descriptions from the dataset,
 * and mirror already-activated numeric attachment mods onto the base item (the system never sums an
 * attachment's own mods into the profile). Never rebuilds the whole item. Idempotent.
 */
async function enrichItem(it, nameToKey, { dryRun }) {
  const atts = foundry.utils.duplicate(it.system.itemattachment || []);
  const known = atts.some(a => nameToKey.get(a.name));
  if (!known) return null;

  let descs = 0;
  const mirrors = [];
  for (const a of atts) {
    const key = nameToKey.get(a.name); if (!key) continue;
    if (!a.system.description) { const d = t(`attach.desc.${key}`); if (d && !d.startsWith("WKSH.")) { a.system.description = d; descs++; } }
    for (const nm of a.system.itemmodifier || []) {
      const attrs = Object.values(nm.system?.attributes || {}).filter(x => /Weapon Stat|Armor Stat|Stat/i.test(x?.modtype || ""));
      const rc = Number(nm.system?.rank_current) || 0;
      const mirrorName = `${nm.name} (${a.name})`;
      // already mirrored (idempotent) → skip
      const already = (it.system.itemmodifier || []).filter(m => m.name === mirrorName).length;
      for (let r = already; r < rc; r++)
        if (attrs.length) { mirrors.push({ name: mirrorName, type: "itemmodifier",
          system: { active: true, rank: 1, rank_current: 1, description: "", type: it.type,
            attributes: Object.fromEntries(attrs.map(x => [foundry.utils.randomID(), { ...x }])), itemmodifier: [], adjusteditemmodifer: [] } }); }
    }
  }
  if (!descs && !mirrors.length) return null;
  if (dryRun) return { name: (it.actor?.name || "?") + " · " + it.name, descs, mods: mirrors.length };

  if (!it.getFlag(MOD, "enrichBackup"))
    await it.setFlag(MOD, "enrichBackup", { itemmodifier: it.system.itemmodifier, itemattachment: it.system.itemattachment,
      damage: it.system.damage?.value, crit: it.system.crit?.value });
  const upd = { "system.itemattachment": atts, [`flags.${MOD}.enriched`]: game.modules.get(MOD).version };
  if (mirrors.length) upd["system.itemmodifier"] = [...(it.system.itemmodifier || []), ...mirrors];
  await it.update(upd);
  return { name: (it.actor?.name || "?") + " · " + it.name, descs, mods: mirrors.length, done: true };
}

export async function enrichItems({ dryRun = false, revert = false } = {}) {
  if (!game.user.isGM) return ui.notifications.warn(t("install.gmOnly"));
  const items = targets();
  if (revert) {
    let n = 0; for (const it of items) if (await revertItem(it)) n++;
    ui.notifications.info(t("enrich.reverted", { n }));
    return;
  }
  const data = await loadAttachmentData();
  const nameToKey = new Map(Object.keys(data.attachments).map(k => [t(`attach.name.${k}`), k]));
  const rows = [];
  for (const it of items) { const r = await enrichItem(it, nameToKey, { dryRun }); if (r) rows.push(r); }
  if (dryRun) {
    const body = rows.length
      ? `<ul style="margin:.3em 0 0;padding-left:18px;font-size:12px">${rows.map(r => `<li>${r.name} — ${t("enrich.rowDetail", { descs: r.descs, mods: r.mods })}</li>`).join("")}</ul>`
      : `<p>${t("enrich.nothing")}</p>`;
    new Dialog({ title: t("enrich.dryTitle"), content: `<p>${t("enrich.dryLead", { n: rows.length })}</p>${body}`,
      buttons: { apply: { icon: '<i class="fas fa-wand-magic-sparkles"></i>', label: t("enrich.apply"), callback: () => enrichItems({}) },
        close: { icon: '<i class="fas fa-times"></i>', label: t("common.close") } }, default: "apply" }, { width: 480 }).render(true);
    return;
  }
  ui.notifications.info(t("enrich.done", { n: rows.filter(r => r.done).length }));
}

export default async function run() {
  if (!game.user.isGM) return ui.notifications.warn(t("common.gmOnly"));
  new Dialog({
    title: t("enrich.title"),
    content: `<p style="font-size:13px">${t("enrich.intro")}</p>
      <p style="font-size:12px;opacity:.8">${t("enrich.note")}</p>`,
    buttons: {
      dry: { icon: '<i class="fas fa-magnifying-glass"></i>', label: t("enrich.dryRun"), callback: () => enrichItems({ dryRun: true }) },
      apply: { icon: '<i class="fas fa-wand-magic-sparkles"></i>', label: t("enrich.apply"), callback: () => enrichItems({}) },
      revert: { icon: '<i class="fas fa-rotate-left"></i>', label: t("enrich.revert"), callback: () => enrichItems({ revert: true }) },
      cancel: { icon: '<i class="fas fa-times"></i>', label: t("common.cancel") },
    },
    default: "dry",
  }, { width: 460 }).render(true);
}
