/** Crafting Workshops — entry point. Exposes the API and offers first-run content install. */
import { MOD, t } from "./util.mjs";
import { installContent } from "./installer.mjs";

const LOGIC = {
  "saber-forge": () => import("./logic/weapon.mjs"), // v2: compendium-driven, native profile
  "potions":     () => import("./logic/potions.mjs"),
  "tuning":      () => import("./logic/tuning.mjs"),
};

Hooks.once("init", () => {
  game.settings.register(MOD, "installedVersion", { scope: "world", config: false, type: String, default: "" });
  game.settings.registerMenu(MOD, "installMenu", {
    name: "WKSH.settings.install.name", label: "WKSH.settings.install.label",
    hint: "WKSH.settings.install.hint", icon: "fas fa-box-open", restricted: true,
    type: class extends FormApplication {
      async render() { installContent({ force: true }); return this; }
    },
  });
});

Hooks.once("ready", async () => {
  const mod = game.modules.get(MOD);
  mod.api = {
    run: async (slug, scope = {}) => {
      const loader = LOGIC[slug];
      if (!loader) return ui.notifications.error(`[${MOD}] unknown action: ${slug}`);
      const { default: fn } = await loader();
      return fn(scope);
    },
    install: installContent,
  };
  if (game.user.isGM && game.settings.get(MOD, "installedVersion") === "") {
    new Dialog({
      title: t("install.title"),
      content: `<p>${t("install.prompt")}</p><p style="font-size:12px;opacity:.8">${t("install.promptHint")}</p>`,
      buttons: {
        yes: { icon: '<i class="fas fa-box-open"></i>', label: t("install.yes"), callback: () => installContent({}) },
        later: { icon: '<i class="fas fa-clock"></i>', label: t("install.later"),
          callback: () => game.settings.set(MOD, "installedVersion", "declined") },
      },
      default: "yes",
    }).render(true);
  }
});
