/** Shared helpers — Crafting Workshops for Star Wars FFG (swffg-workshops) */
export const MOD = "swffg-workshops";

/** i18n: t("key") → localized; t("key",{a:1}) → formatted. Keys live under WKSH.* */
export const t = (k, data) => data ? game.i18n.format(`WKSH.${k}`, data) : game.i18n.localize(`WKSH.${k}`);

/** Native swffg dice symbols, inline-safe in chat (Foundry chat CSS forces display:block on imgs). */
const DICE = "systems/starwarsffg/images/dice/starwars/";
const SYM = { diff:"purple", adv:"advantage", thr:"threat", tri:"triumph", des:"despair",
  suc:"success", fail:"failure", force:"whiteHex", light:"lightpip", dark:"darkpip", boost:"blue", setback:"black" };
export const sym = n => `<img src="${DICE}${SYM[n]}.png" style="display:inline-block!important;height:1.05em;width:auto;vertical-align:-2px;margin:0 1px" alt="${n}">`;
export const pips = (n, k="diff") => n > 0 ? sym(k).repeat(n) : "—";

/** swffg roll API (game.ffg.DiceHelpers is empty; this is the working path). */
export const RollFFG = () => CONFIG.Dice.rolls.find(r => r.name === "RollFFG") ?? game.ffg?.RollFFG;

/** Resolve the acting character — community-safe (no hardcoded names). */
export const myActor = () => game.user.character ?? canvas.tokens?.controlled?.[0]?.actor ?? null;

/** Find a macro created by this module (role flag). */
export const findMacro = role => game.macros.find(m => m.flags?.[MOD]?.role === role) ?? null;

/** Auto-height for Dialog v1 once images load ("this" is NOT bound in options.render). */
export function autoHeight(html) {
  const el = html[0]?.closest?.(".app");
  const app = el ? ui.windows[el.dataset.appid] : null;
  if (!app) return;
  el.querySelectorAll("img").forEach(i => i.addEventListener("load", () => app.setPosition({ height: "auto" })));
  app.setPosition({ height: "auto" });
}
