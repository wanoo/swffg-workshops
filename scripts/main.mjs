/** Crafting Workshops — entry point. Exposes the API and offers first-run content install. */
import { MOD, t, reportError } from "./util.mjs";
import { installContent } from "./installer.mjs";

const LOGIC = {
  "atelier":     () => import("./logic/atelier.mjs"), // unified hub
  "saber-forge": () => import("./logic/weapon.mjs"),  // v2: compendium-driven, native profile
  "potions":     () => import("./logic/potions.mjs"),
  "tuning":      () => import("./logic/tuning.mjs"),
  "enrich":      () => import("./logic/enrich.mjs"),
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
  game.settings.registerMenu(MOD, "enrichMenu", {
    name: "WKSH.settings.enrich.name", label: "WKSH.settings.enrich.label",
    hint: "WKSH.settings.enrich.hint", icon: "fas fa-wand-magic-sparkles", restricted: true,
    type: class extends FormApplication {
      async render() { import("./logic/enrich.mjs").then(m => m.default()); return this; }
    },
  });
});

Hooks.once("ready", async () => {
  const mod = game.modules.get(MOD);
  mod.api = {
    run: async (slug, scope = {}) => {
      const loader = LOGIC[slug];
      if (!loader) return ui.notifications.error(`[${MOD}] unknown action: ${slug}`);
      try { const { default: fn } = await loader(); return await fn(scope); }
      catch (err) { reportError(err, `run("${slug}")`); }
    },
    install: installContent,
    reportError,
  };
  // catch errors bubbling out of dialog callbacks whose stack points at this module
  const fromModule = e => String(e?.stack || "").includes(MOD);
  window.addEventListener("unhandledrejection", ev => { if (fromModule(ev.reason)) reportError(ev.reason, "async"); });
  window.addEventListener("error", ev => { if (fromModule(ev.error)) reportError(ev.error, "runtime"); });
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
