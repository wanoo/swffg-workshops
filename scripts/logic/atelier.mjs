/** Workshop hub — one entry point routing to the lightsaber forge, weapon/armor tuning,
 *  and equipment (potions & talismans) flows. */
import { MOD, t } from "../util.mjs";

export default async function run(scope = {}) {
  const api = game.modules.get(MOD).api;
  new Dialog({
    title: t("atelier.title"),
    content: `<p style="font-size:13px">${t("atelier.intro")}</p>
      <ul style="font-size:12px;opacity:.85;margin:.3em 0 0 1em;padding:0">
        <li>${t("atelier.li.saber")}</li>
        <li>${t("atelier.li.tune")}</li>
        <li>${t("atelier.li.gear")}</li></ul>`,
    buttons: {
      saber: { icon: '<i class="fas fa-wand-sparkles"></i>', label: t("atelier.btn.saber"), callback: () => api.run("saber-forge") },
      tune:  { icon: '<i class="fas fa-screwdriver-wrench"></i>', label: t("atelier.btn.tune"), callback: () => api.run("tuning") },
      gear:  { icon: '<i class="fas fa-flask"></i>', label: t("atelier.btn.gear"), callback: () => api.run("potions") },
      cancel: { icon: '<i class="fas fa-times"></i>', label: t("common.cancel") },
    },
    default: "saber",
  }, { width: 480 }).render(true);
}
