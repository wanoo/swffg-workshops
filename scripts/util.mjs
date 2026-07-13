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

export const REPO = "wanoo/swffg-workshops";

let _lastError = "";
/** On an unexpected error, offer to open a pre-filled GitHub issue with diagnostic context. */
export function reportError(err, context = "") {
  console.error(`[${MOD}]`, context, err);
  const msg = String(err?.message ?? err);
  const sig = context + msg;
  if (sig === _lastError) return; // avoid duplicate popups for the same error
  _lastError = sig; setTimeout(() => { if (_lastError === sig) _lastError = ""; }, 4000);

  const mod = game.modules.get(MOD);
  const diag = [
    `**Module:** ${MOD} ${mod?.version ?? "?"}`,
    `**Foundry:** ${game.version} · **System:** starwarsffg ${game.system?.version ?? "?"} · **Lang:** ${game.i18n.lang}`,
    `**Context:** ${context || "—"}`,
    "", "**Error:**", "```", String(err?.stack || msg).slice(0, 1600), "```",
    "", "**What I was doing:** _(please describe the steps that triggered this)_",
  ].join("\n");
  const url = `https://github.com/${REPO}/issues/new?labels=bug`
    + `&title=${encodeURIComponent(`[bug] ${context}: ${msg.slice(0, 80)}`)}`
    + `&body=${encodeURIComponent(diag)}`;

  const esc = s => s.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  new Dialog({
    title: t("error.title"),
    content: `<p style="font-size:13px">${t("error.body")}</p>
      <pre style="max-height:150px;overflow:auto;font-size:11px;background:#0002;padding:6px;border-radius:4px;white-space:pre-wrap">${esc(msg)}</pre>
      <p style="font-size:12px;opacity:.85">${t("error.ask")}</p>`,
    buttons: {
      issue: { icon: '<i class="fab fa-github"></i>', label: t("error.report"), callback: () => window.open(url, "_blank", "noopener") },
      copy: { icon: '<i class="fas fa-copy"></i>', label: t("error.copy"), callback: () => { game.clipboard.copyPlainText(diag); ui.notifications.info(t("error.copied")); } },
      close: { icon: '<i class="fas fa-times"></i>', label: t("common.close") },
    },
    default: "issue",
  }, { width: 520 }).render(true);
}

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
