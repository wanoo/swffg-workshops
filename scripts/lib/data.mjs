/** Data loader — caches the module's generated JSON (attachments, recipes). */
import { MOD } from "../util.mjs";

const cache = {};

async function loadJSON(name) {
  if (cache[name]) return cache[name];
  const url = `modules/${MOD}/scripts/data/${name}.json`;
  const resp = await fetch(foundry.utils.getRoute(url), { cache: "no-store" });
  if (!resp.ok) throw new Error(`[${MOD}] cannot load ${name}.json (${resp.status})`);
  cache[name] = await resp.json();
  return cache[name];
}

/** {version, modMap, qualities, attachments{KEY:…}} — see tools/build_attachments.py */
export const loadAttachmentData = () => loadJSON("attachments");

/** Crafting recipes for the equipment flow (gear/potions/talismans). */
export const loadRecipes = () => loadJSON("recipes");
