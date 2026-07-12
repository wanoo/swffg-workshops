/** Native attachment engine — recovers the dataset's numeric mods (stripped by the OggDude import)
 *  and expresses them as itemmodifiers on the BASE item (weapon/armor) so the system computes the
 *  profile natively. Physical parts (crystal/accessories) are attached minimally for hard-point
 *  budget, traceability and Step-2 mod activation. No hardcoded profile, no compendium mutation.
 *
 *  Why numeric mods live on the base item and not on the attachment: injecting Weapon/Armor Stat
 *  attributes on an attachment only aggregates while that attachment's itemmodifier list is empty —
 *  adding real qualities to it silently zeroes its own attributes. Putting the attributes on the
 *  base item's itemmodifier (path a) is reliable. (Verified live, swffg v2.0.3.) */
import { MOD, t } from "../util.mjs";
import { loadAttachmentData } from "./data.mjs";

export { loadAttachmentData };

const FAMILY_MODTYPE = { weapon: "Weapon Stat", armor: "Armor Stat", gear: null };
const FAMILY_ITEMTYPE = { weapon: "weapon", armor: "armour", gear: "gear" };
const MOD_PACKS = ["world.oggdudeweaponmods", "world.oggdudegenericmods", "world.oggdudearmormods"];
const uid = () => foundry.utils.randomID();

// Foundry mod key → item base-stat field
const STAT_FIELD = { damage: "damage", critical: "crit", soak: "soak", defence: "defence",
  encumbrance: "encumbrance", hardpoints: "hardpoints" };
const statField = mod => STAT_FIELD[mod] || mod;

const familyOf = item =>
  (item.type === "armour" || item.type === "armor") ? "armor" : item.type === "weapon" ? "weapon" : "gear";

let _qualIndex = null;
async function qualIndex() {
  if (_qualIndex) return _qualIndex;
  _qualIndex = new Map();
  for (const pid of MOD_PACKS) {
    const p = game.packs.get(pid); if (!p) continue;
    for (const e of p.index.contents) if (!_qualIndex.has(e.name)) _qualIndex.set(e.name, { pack: pid, id: e._id });
  }
  return _qualIndex;
}

/** Clone a real quality itemmodifier by compendium name (fallback: minimal). */
async function makeQual(compendiumName, rank, rankCurrent, itemType) {
  const idx = await qualIndex();
  const ref = idx.get(compendiumName);
  if (!ref) {
    return { name: compendiumName, type: "itemmodifier",
      system: { description: `<p>${compendiumName}</p>`, attributes: {}, type: itemType,
        rank, rank_current: rankCurrent, itemmodifier: [], adjusteditemmodifer: [] } };
  }
  const o = (await game.packs.get(ref.pack).getDocument(ref.id)).toObject();
  o.system.rank = rank; o.system.rank_current = rankCurrent;
  return o;
}

// a numeric mod expressed as an itemmodifier carrying a Weapon/Armor Stat attribute
function attrMod(name, mod, modtype, value, itemType, active) {
  return { name, type: "itemmodifier",
    system: { active, rank: 1, rank_current: active ? 1 : 0, description: "", type: itemType,
      attributes: { [uid()]: { isCheckbox: false, mod, modtype, value } }, itemmodifier: [], adjusteditemmodifer: [] } };
}

function noteMod(label, rank, active, itemType) {
  return { name: (label || "Mod").slice(0, 40), type: "itemmodifier",
    system: { description: `<p>${label || ""}</p>`, attributes: {}, type: itemType,
      rank: rank || 1, rank_current: active ? (rank || 1) : 0, itemmodifier: [], adjusteditemmodifer: [] } };
}

/**
 * Build one part: mods that go on the BASE item, a minimal attachment for the part, and set-stats.
 * @returns {Promise<{weaponMods:object[], attachment:object, setStats:Object<string,number>}>}
 */
export async function buildAttachmentObject(key, family) {
  const data = await loadAttachmentData();
  const a = data.attachments[key];
  if (!a) throw new Error(`[${MOD}] unknown attachment ${key}`);
  family = family || a.family;
  const modtypeOf = m => data.modMap[m]?.modtype || FAMILY_MODTYPE[family];
  const itemType = FAMILY_ITEMTYPE[family] || "weapon";
  const lang = game.i18n.lang;
  const qName = q => q.compendiumName[lang] || q.compendiumName.en;

  const weaponMods = [];   // numeric attributes + base qualities → on the base item
  const attMods = [];      // AddedMods (mod-able) + notes → on the attachment
  const setStats = {};
  let noteI = 0;

  for (const m of a.baseMods) {
    const map = data.modMap[m.descriptor];
    const q = data.qualities[m.descriptor];
    if (map) {
      const modtype = modtypeOf(m.descriptor); if (!modtype) continue;
      const magnitude = map.fixed ?? m.count;
      const value = map.kind === "set" ? magnitude : magnitude * (map.sign ?? 1);
      if (map.kind === "set") setStats[map.mod] = magnitude;
      weaponMods.push(attrMod(t(`mod.${m.descriptor}`, { n: Math.abs(value) }), map.mod, modtype, value, itemType, true));
    } else if (q) {
      weaponMods.push(await makeQual(qName(q), m.count, m.count, itemType));
    } else if (m.misc) {
      weaponMods.push(noteMod(t(`attach.note.${a.key}.${noteI++}`), m.count, true, itemType));
    }
  }
  for (const m of a.addedMods) {
    const map = data.modMap[m.descriptor];
    const q = data.qualities[m.descriptor];
    if (map) {
      const modtype = modtypeOf(m.descriptor); if (!modtype) continue;
      const magnitude = map.fixed ?? m.count;
      const value = map.kind === "set" ? magnitude : magnitude * (map.sign ?? 1);
      attMods.push(attrMod(t(`mod.${m.descriptor}`, { n: Math.abs(value) }), map.mod, modtype, value, itemType, false));
    } else if (q) {
      attMods.push(await makeQual(qName(q), m.count, 0, itemType));
    } else if (m.misc) {
      attMods.push(noteMod(t(`attach.note.${a.key}.${noteI++}`), m.count, false, itemType));
    }
  }

  const attachment = { name: t(`attach.name.${key}`), type: "itemattachment",
    system: { description: "", type: itemType, rank: 1,
      hardpoints: { value: a.hp }, price: { value: a.price }, rarity: { value: a.rarity },
      attributes: {}, itemmodifier: attMods, adjusteditemmodifer: [], itemattachment: [] } };
  return { weaponMods, attachment, setStats };
}

/**
 * Aggregate a set of parts onto a target item.
 * @returns {Promise<{weaponMods:object[], attachments:object[], baseZero:Object, setStats:Object}>}
 */
export async function applyAttachments(target, keys, { family } = {}) {
  const fam = family || familyOf(target);
  const weaponMods = [];
  const attachments = [];
  const setStats = {};
  for (const key of keys) {
    const part = await buildAttachmentObject(key, fam);
    weaponMods.push(...part.weaponMods);
    attachments.push(part.attachment);
    for (const [stat, v] of Object.entries(part.setStats)) setStats[stat] = v; // last wins
  }
  // set descriptors add from a 0 base → zero those base stats
  const baseZero = {};
  for (const stat of Object.keys(setStats)) baseZero[`system.${statField(stat)}.value`] = 0;
  return { weaponMods, attachments, baseZero, setStats };
}

/** List dataset descriptors compatible with a target/family. opts.crystal filters saber crystals. */
export async function listFor(target, family, opts = {}) {
  const data = await loadAttachmentData();
  const targetSkill = target?.system?.skill?.value;
  const isSaber = targetSkill === "Lightsaber" || opts.lightsaber;
  const out = [];
  for (const a of Object.values(data.attachments)) {
    if (a.family !== family) continue;
    const lim = a.limits;
    const lightsaberLimited = lim.category.includes("Lightsaber") || lim.type.includes("Lightsaber");
    if (family === "weapon") {
      if (opts.crystal === true && !a.isCrystal) continue;
      if (opts.crystal === false && a.isCrystal) continue;
      // saber accessories must be lightsaber-limited (not universal weapon mods)
      if (isSaber) { if (!a.isCrystal && !lightsaberLimited) continue; }
      else if (lightsaberLimited || a.isCrystal) continue; // hide saber-only parts from non-sabers
    }
    if (lim.item.length && target && !lim.item.includes(target.system?.originalKey) && !lim.item.includes(target.name)) continue;
    if (lim.skill.length && targetSkill && !lim.skill.includes(targetSkill)) continue;
    out.push(a);
  }
  out.sort((x, y) => x.hp - y.hp || t(`attach.name.${x.key}`).localeCompare(t(`attach.name.${y.key}`)));
  return out;
}

/** Preview the resulting profile (JS mirror of the additive native calc) for the UI. */
export async function computePreview(baseStats, keys) {
  const data = await loadAttachmentData();
  const out = { ...baseStats };
  for (const key of keys) {
    for (const m of data.attachments[key].baseMods) {
      const map = data.modMap[m.descriptor]; if (!map) continue;
      const field = statField(map.mod);
      if (map.kind === "set") out[field] = map.fixed ?? m.count;
      else out[field] = (out[field] || 0) + (map.fixed ?? m.count) * (map.sign ?? 1);
    }
  }
  if (out.crit != null) out.crit = Math.max(1, out.crit);
  return out;
}
