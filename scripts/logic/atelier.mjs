/** Workshop hub — pick who you craft for (PC or NPC), then route to the lightsaber forge,
 *  weapon/armor tuning, or equipment (potions & talismans) flows. */
import { MOD, t, myActor } from "../util.mjs";

export default async function run(scope = {}) {
  const api = game.modules.get(MOD).api;
  const me = myActor();
  // actors you can craft for: your own by default; the GM also sees every character/NPC
  const actors = game.actors
    .filter(a => (a.type === "character" || a.type === "minion" || a.type === "rival" || a.type === "nemesis")
      && (game.user.isGM || a.testUserPermission(game.user, "OWNER")))
    .sort((a, b) => (b.hasPlayerOwner - a.hasPlayerOwner) || a.name.localeCompare(b.name));
  const options = actors.map(a =>
    `<option value="${a.id}" ${a.id === me?.id ? "selected" : ""}>${a.name}${a.hasPlayerOwner ? "" : " — PNJ"}</option>`).join("");
  const selector = actors.length
    ? `<div class="form-group" style="margin:.2em 0 .6em"><label><b>${t("atelier.craftFor")}</b></label>
        <select id="who" style="width:100%">${options}</select></div>`
    : "";

  const withActor = (slug, html) => {
    const id = html?.[0]?.querySelector("#who")?.value;
    const actor = id ? game.actors.get(id) : null;
    if (actor) actor._sheet; // touch
    return api.run(slug, { actor: id || undefined });
  };

  new Dialog({
    title: t("atelier.title"),
    content: `<p style="font-size:13px">${t("atelier.intro")}</p>${selector}
      <ul style="font-size:12px;opacity:.85;margin:.3em 0 0 1em;padding:0">
        <li>${t("atelier.li.saber")}</li>
        <li>${t("atelier.li.tune")}</li>
        <li>${t("atelier.li.gear")}</li></ul>`,
    buttons: {
      saber: { icon: '<i class="fas fa-wand-sparkles"></i>', label: t("atelier.btn.saber"), callback: h => withActor("saber-forge", h) },
      tune:  { icon: '<i class="fas fa-screwdriver-wrench"></i>', label: t("atelier.btn.tune"), callback: h => withActor("tuning", h) },
      gear:  { icon: '<i class="fas fa-flask"></i>', label: t("atelier.btn.gear"), callback: h => withActor("potions", h) },
      cancel: { icon: '<i class="fas fa-times"></i>', label: t("common.cancel") },
    },
    default: "saber",
  }, { width: 480 }).render(true);
}
