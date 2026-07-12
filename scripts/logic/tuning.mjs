/** Item tuning — install attachments (compendium-driven, native profile) and activate their mods
 *  on a character's weapon or armor. Works for both families via the shared attachment engine. */
import { t, sym, pips, myActor } from "../util.mjs";
import { skillPool, rollCraft } from "../lib/roll.mjs";
import { listFor, applyAttachments, loadAttachmentData } from "../lib/attach.mjs";

export default async function run(scope = {}) {
  const actor = (scope.actor && game.actors.get(scope.actor)) || myActor();
  if (!actor) { ui.notifications.warn(t("common.assignCharacter")); return; }
  const loc = n => (n ?? 0).toLocaleString(game.i18n.lang);
  const nameOf = k => t(`attach.name.${k}`);
  const familyOf = it => it.type === "armour" ? "armor" : "weapon";
  const usedHP = it => (it.system?.itemattachment ?? []).reduce((s, a) => s + (Number(a.system?.hardpoints?.value ?? a.system?.hardpoints ?? 0) || 0), 0);
  const diffOf = r => r >= 6 ? 3 : r >= 4 ? 2 : 1;
  const DLABEL = ["", ...[0, 1, 2, 3, 4, 5].map(i => t(`tuning.diff.${i}`) + " ")];

  const items = actor.items.filter(i => ["weapon", "armour"].includes(i.type) && (i.system?.hardpoints?.value ?? 0) >= 0);

  new Dialog({
    title: t("tuning.title"),
    content: `<p style="font-size:13px">${t("tuning.mode.intro", { name: actor.name })}</p>
      <ul style="font-size:12px;opacity:.85;margin:.3em 0 0 1em;padding:0">
        <li>${t("tuning.mode.install")}</li><li>${t("tuning.mode.mod")}</li></ul>`,
    buttons: {
      install: { icon: '<i class="fas fa-wrench"></i>', label: t("tuning.btn.install"), callback: () => installFlow() },
      mod: { icon: '<i class="fas fa-sliders-h"></i>', label: t("tuning.btn.mod"), callback: () => modFlow() },
      cancel: { icon: '<i class="fas fa-times"></i>', label: t("common.cancel") },
    },
    default: "install",
  }, { width: 460 }).render(true);

  // ======== MODE: install attachments (dynamic, native) ========
  const STAT_FIELD = { damage: "damage", critical: "crit", soak: "soak", defence: "defence", encumbrance: "encumbrance", hardpoints: "hardpoints" };
  async function installFlow() {
    if (!items.length) { ui.notifications.warn(t("tuning.warn.noItems", { name: actor.name })); return; }
    const data = await loadAttachmentData();
    // synchronous profile preview from a base + selected dataset parts
    const preview = (base, sel, field) => {
      let v = base[field] || 0;
      for (const a of sel) for (const mm of a.baseMods) {
        const map = data.modMap[mm.descriptor]; if (!map || STAT_FIELD[map.mod] !== field) continue;
        v = map.kind === "set" ? (map.fixed ?? mm.count) : v + (map.fixed ?? mm.count) * (map.sign ?? 1);
      }
      return v;
    };
    const itOpts = items.map((it, i) => `<option value="${i}">${t("tuning.opt.item", { name: it.name, used: usedHP(it), total: it.system.hardpoints.value })}</option>`).join("");
    const content = `<div style="font-size:13px;max-height:72vh;overflow:auto">
      <div class="form-group"><label><b>${t("tuning.lbl.item")}</b></label><select id="obj" style="width:100%">${itOpts}</select></div>
      <div class="form-group"><label><b>${t("tuning.lbl.att")}</b></label><div id="attBox" style="border:1px solid #0002;border-radius:4px;padding:6px;max-height:200px;overflow:auto"></div></div>
      <hr><div id="sum" style="background:#0001;border-radius:6px;padding:8px;line-height:1.5"></div></div>`;
    new Dialog({
      title: t("tuning.install.title"), content,
      buttons: {
        ok: { icon: '<i class="fas fa-wrench"></i>', label: t("tuning.btn.installRoll"), callback: h => apply(h, true) },
        note: { icon: '<i class="fas fa-pen"></i>', label: t("tuning.btn.noRoll"), callback: h => apply(h, false) },
        cancel: { icon: '<i class="fas fa-times"></i>', label: t("common.cancel") },
      },
      default: "ok",
      render: (html) => {
        const $ = s => html[0].querySelector(s);
        let avail = [];
        const fillAtt = async () => {
          const it = items[+$("#obj").value];
          avail = await listFor(it, familyOf(it));
          $("#attBox").innerHTML = avail.length
            ? avail.map((a, i) => `<label style="display:flex;gap:6px;align-items:flex-start;margin:2px 0"><input type="checkbox" class="acc" data-i="${i}"><span><b>${nameOf(a.key)}</b> <span style="opacity:.7">${t("saber.opt.accMeta", { hp: a.hp, price: a.price, rarity: a.rarity })}</span></span></label>`).join("")
            : `<div style="opacity:.7;font-size:12px">${t("tuning.install.noParts")}</div>`;
          html[0].querySelectorAll(".acc").forEach(e => e.addEventListener("change", rec));
          rec();
        };
        const rec = () => {
          const it = items[+$("#obj").value];
          const sel = [...html[0].querySelectorAll(".acc:checked")].map(e => avail[+e.dataset.i]);
          const base = it.type === "armour"
            ? { soak: it.system.soak?.value || 0, defence: it.system.defence?.value || 0 }
            : { damage: it.system.damage?.value || 0, crit: it.system.crit?.value || 0 };
          const addHP = sel.reduce((s, a) => s + a.hp, 0);
          const free = it.system.hardpoints.value - usedHP(it) - addHP;
          const over = free < 0;
          const price = sel.reduce((s, a) => s + a.price, 0);
          const rarity = Math.max(0, ...sel.map(a => a.rarity));
          const d = diffOf(rarity);
          const profileLine = it.type === "armour"
            ? t("tuning.sum.armorProfile", { soak: preview(base, sel, "soak"), def: preview(base, sel, "defence") })
            : t("tuning.sum.weaponProfile", { dmg: preview(base, sel, "damage"), crit: Math.max(1, preview(base, sel, "crit")) });
          $("#sum").innerHTML = `<div><b>${it.name}</b></div>
            ${sel.length ? `<div>${profileLine}</div>` : ""}
            <div>${t("tuning.sum.slotsUsed")} <b style="color:${over ? '#c0392b' : '#27ae60'}">${usedHP(it) + addHP}/${it.system.hardpoints.value}</b>${over ? ` ${t("tuning.sum.notEnough")}` : ""}</div>
            ${sel.length ? `<div>${t("tuning.sum.cost", { price: loc(price), rarity })}</div>
            <div style="margin-top:4px">${t("tuning.sum.testDyn", { diff: DLABEL[d + 1] + pips(d) })}</div>` : `<div style="opacity:.7">${t("tuning.install.pick")}</div>`}`;
        };
        $("#obj").addEventListener("change", fillAtt);
        fillAtt();
      },
    }, { width: 520 }).render(true);
  }

  async function apply(html, roll) {
    const $ = s => html[0].querySelector(s);
    const it = items[+$("#obj").value];
    const fam = familyOf(it);
    const avail = await listFor(it, fam);
    const sel = [...html[0].querySelectorAll(".acc:checked")].map(e => avail[+e.dataset.i]);
    if (!sel.length) { ui.notifications.warn(t("tuning.install.pick")); return; }
    const addHP = sel.reduce((s, a) => s + a.hp, 0);
    const free = it.system.hardpoints.value - usedHP(it) - addHP;
    if (free < 0 && !await Dialog.confirm({ title: t("tuning.confirm.title"), content: `<p>${t("tuning.confirm.body", { name: sel.map(a => nameOf(a.key)).join(", "), hp: addHP, free: it.system.hardpoints.value - usedHP(it) })}</p>` })) return;
    const rarity = Math.max(0, ...sel.map(a => a.rarity));

    // ---- 1) roll first (success gates the installation) ----
    let res = null;
    if (roll) {
      res = await rollCraft(skillPool(actor, diffOf(rarity)), { flavor: t("tuning.roll.install", { att: sel.map(a => nameOf(a.key)).join(", "), item: it.name }), actor });
      if (!res.succeeded) {
        await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }),
          content: `<div style="border:1px solid #c0392b;border-radius:6px;padding:8px;font-size:13px">
            <h3 style="margin:.1em 0;color:#c0392b">${t("tuning.fail.title", { att: sel.map(a => nameOf(a.key)).join(", ") })}</h3>
            <div>${t("tuning.fail.body", { item: it.name })} ${res.des ? t("tuning.fail.despair") : ""}</div>
            <div style="font-size:12px;opacity:.8;margin-top:3px">${t("tuning.fail.hint")}</div></div>` });
        ui.notifications.warn(t("tuning.fail.notify", { att: sel.map(a => nameOf(a.key)).join(", ") }));
        return;
      }
    }

    // ---- 2) install: weapons compute natively from itemmodifier; armor stats don't → write base values ----
    const { weaponMods, attachments, baseZero } = await applyAttachments(it, sel.map(a => a.key), { family: fam });
    const update = { "system.itemattachment": [...(it.system.itemattachment || []), ...attachments] };
    if (fam === "armor") {
      const data = await loadAttachmentData();
      const finalOf = (field, statMod) => {
        let v = it.system[field]?.value || 0;
        for (const a of sel) for (const mm of a.baseMods) { const map = data.modMap[mm.descriptor]; if (!map || map.mod !== statMod) continue; v = map.kind === "set" ? (map.fixed ?? mm.count) : v + (map.fixed ?? mm.count) * (map.sign ?? 1); }
        return v;
      };
      update["system.soak.value"] = finalOf("soak", "soak");
      update["system.defence.value"] = finalOf("defence", "defence");
      update["system.encumbrance.value"] = finalOf("encumbrance", "encumbrance");
      const quals = weaponMods.filter(w => !Object.values(w.system.attributes || {}).some(x => /Stat/i.test(x.modtype || "")));
      if (quals.length) update["system.itemmodifier"] = [...(it.system.itemmodifier || []), ...quals];
    } else {
      update["system.itemmodifier"] = [...(it.system.itemmodifier || []), ...weaponMods];
      Object.assign(update, baseZero);
    }
    await it.update(update);
    const fresh = actor.items.get(it.id);
    const profileLine = fam === "armor"
      ? t("tuning.card.armorProfile", { soak: fresh.system.soak?.value, def: fresh.system.defence?.value })
      : t("tuning.card.weaponProfile", { dmg: fresh.system.damage?.adjusted ?? fresh.system.damage?.value, crit: fresh.system.crit?.adjusted ?? fresh.system.crit?.value });
    const resLine = res
      ? `<div style="margin-top:4px;font-size:12px">${t("tuning.res.success", { pips: sym('suc').repeat(res.netSucc), n: res.netSucc })}${res.adv ? ` · ${sym('adv').repeat(res.adv)} ${t("tuning.res.adv")}` : ""}${res.tri ? ` · ${sym('tri')} ${t("tuning.res.tri")}` : ""}${res.thr ? ` · ${sym('thr').repeat(res.thr)} ${t("tuning.res.thr")}` : ""}${res.des ? ` · ${sym('des')} ${t("tuning.res.des")}` : ""}.</div>`
      : `<div style="margin-top:4px;font-size:11px;opacity:.7">${t("tuning.res.noRoll")}</div>`;
    await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }),
      content: `<div style="border:1px solid #8888;border-radius:6px;padding:8px;font-size:13px">
        <h3 style="margin:.1em 0">${t("tuning.card.title", { item: it.name })}</h3>
        <div>${t("tuning.card.installed", { att: sel.map(a => nameOf(a.key)).join(", ") })}</div>
        <div>${profileLine}</div>
        <div>${t("tuning.card.meta", { used: usedHP(fresh), total: fresh.system.hardpoints.value, price: loc(sel.reduce((s, a) => s + a.price, 0)), rarity })}</div>
        ${resLine}</div>` });
    ui.notifications.info(t("tuning.done.install", { att: sel.map(a => nameOf(a.key)).join(", "), item: it.name }));
    fresh?.sheet?.render(true);
  }

  // ======== MODE: activate a mod on an already-installed attachment ========
  // Book rule: base Average (◆◆), +1 difficulty per mod ALREADY activated on THIS attachment.
  function listAttachments() {
    const out = [];
    for (const it of actor.items) {
      const atts = it.system?.itemattachment || [];
      atts.forEach((att, ai) => {
        const mods = (att.system?.itemmodifier || []).map((m, mi) => ({ mi, n: m.name || t("tuning.mod.fallbackName"), rank: Number(m.system?.rank) || 0, cur: Number(m.system?.rank_current) || 0 }));
        const total = mods.reduce((s, m) => s + m.rank, 0);
        const active = mods.reduce((s, m) => s + m.cur, 0);
        if (total > 0) out.push({ it, ai, name: att.name || t("tuning.mod.fallbackAtt"), mods, total, active });
      });
    }
    return out;
  }

  async function modFlow() {
    const list = listAttachments();
    if (!list.length) { ui.notifications.warn(t("tuning.warn.noAttach", { name: actor.name })); return; }
    const attOpts = list.map((a, i) => `<option value="${i}">${t("tuning.opt.attMod", { item: a.it.name, att: a.name, active: a.active, total: a.total })}</option>`).join("");
    const content = `<div style="font-size:13px">
      <div class="form-group"><label><b>${t("tuning.lbl.attInstalled")}</b></label><select id="att" style="width:100%">${attOpts}</select></div>
      <div class="form-group"><label><b>${t("tuning.lbl.mod")}</b></label><select id="mod" style="width:100%"></select></div>
      <hr><div id="sum" style="background:#0001;border-radius:6px;padding:8px;line-height:1.5"></div></div>`;
    new Dialog({
      title: t("tuning.mod.title"), content,
      buttons: {
        ok: { icon: '<i class="fas fa-dice-d20"></i>', label: t("tuning.btn.modRoll"), callback: h => activate(h, true) },
        note: { icon: '<i class="fas fa-pen"></i>', label: t("tuning.btn.modNoRoll"), callback: h => activate(h, false) },
        cancel: { icon: '<i class="fas fa-times"></i>', label: t("common.cancel") },
      },
      default: "ok",
      render: (html) => {
        const $ = s => html[0].querySelector(s);
        const fillMods = () => {
          const a = list[+$("#att").value];
          const av = a.mods.filter(m => m.cur < m.rank);
          $("#mod").innerHTML = av.length
            ? av.map(m => `<option value="${m.mi}">${m.n}${m.rank > 1 ? ` (${m.cur}/${m.rank})` : ""}</option>`).join("")
            : `<option value="-1">${t("tuning.mod.noneLeft")}</option>`;
        };
        const rec = () => {
          const a = list[+$("#att").value];
          const diff = Math.min(5, 2 + a.active);
          const remaining = a.total - a.active;
          $("#sum").innerHTML = `<div><b>${a.it.name} ▸ ${a.name}</b></div>
            <div>${t("tuning.mod.count", { active: a.active, total: a.total })}${remaining <= 0 ? ` — <span style="color:#c0392b">${t("tuning.mod.exhausted")}</span>` : ""}</div>
            <div style="margin-top:4px">${t("tuning.mod.testLine", { n: a.active + 1, diff: DLABEL[diff + 1] + pips(diff) })}</div>
            <div style="font-size:11px;opacity:.75;margin-top:2px">${t("tuning.mod.hint", { pips: pips(2) })}</div>`;
        };
        $("#att").addEventListener("change", () => { fillMods(); rec(); });
        fillMods(); rec();
      },
    }, { width: 520 }).render(true);

    async function activate(html, roll) {
      const $ = s => html[0].querySelector(s);
      const a = list[+$("#att").value];
      const mi = +$("#mod").value;
      if (mi < 0 || a.active >= a.total) { ui.notifications.warn(t("tuning.mod.noneWarn")); return; }
      const diff = Math.min(5, 2 + a.active);
      const modName = a.mods.find(m => m.mi === mi)?.n || t("tuning.mod.fallbackName");
      let res = null;
      if (roll) {
        res = await rollCraft(skillPool(actor, diff), { flavor: t("tuning.roll.mod", { n: a.active + 1, mod: modName, att: a.name, diff: DLABEL[diff + 1] }), actor });
        if (!res.succeeded) {
          await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }),
            content: `<div style="border:1px solid #c0392b;border-radius:6px;padding:8px;font-size:13px">
              <h3 style="margin:.1em 0;color:#c0392b">${t("tuning.modFail.title", { mod: modName })}</h3>
              <div>${t("tuning.modFail.body", { att: a.name })} ${res.des ? t("tuning.modFail.despair") : ""}</div>
              <div style="font-size:12px;opacity:.8;margin-top:3px">${t("tuning.modFail.hint")}</div></div>` });
          ui.notifications.warn(t("tuning.modFail.notify", { mod: modName, att: a.name }));
          return;
        }
      }
      // increment rank_current on the attachment mod (native counter, visible on the sheet)
      const atts = foundry.utils.duplicate(a.it.system.itemattachment || []);
      const mod = atts[a.ai].system.itemmodifier[mi];
      mod.system.rank_current = (Number(mod.system.rank_current) || 0) + 1;
      const update = { "system.itemattachment": atts };
      // the system never sums an attachment's own mods → mirror the mod's functional attribute onto
      // the base item's itemmodifier (which IS summed) so the profile updates.
      let fnAttrs = Object.values(mod.system?.attributes || {}).filter(x => x && /Weapon Stat|Armor Stat|Stat/i.test(x.modtype || ""));
      if (!fnAttrs.length) {
        const num = /([+-]?\d+)/.exec(modName);
        if (num) {
          const value = parseInt(num[1], 10);
          const mt = a.it.type === "armour" ? "Armor Stat" : "Weapon Stat";
          if (/critique|\bcrit/i.test(modName)) fnAttrs = [{ mod: "critical", modtype: mt, value: /réduit|reduce|-|sub/i.test(modName) ? -Math.abs(value) : value, isCheckbox: false }];
          else if (/d[ée]g[âa]ts?|damage/i.test(modName)) fnAttrs = [{ mod: "damage", modtype: mt, value: Math.abs(value), isCheckbox: false }];
          else if (/encaissement|soak/i.test(modName)) fnAttrs = [{ mod: "soak", modtype: "Armor Stat", value: Math.abs(value), isCheckbox: false }];
          else if (/d[ée]fense|defen/i.test(modName)) fnAttrs = [{ mod: "defence", modtype: "Armor Stat", value: Math.abs(value), isCheckbox: false }];
        }
      }
      if (fnAttrs.length) {
        const wmods = foundry.utils.duplicate(a.it.system.itemmodifier || []);
        const attributes = {};
        for (const x of fnAttrs) attributes[foundry.utils.randomID()] = { ...x };
        wmods.push({ name: `${modName} (${a.name})`, type: "itemmodifier",
          system: { active: true, rank: 1, rank_current: 1, description: "", type: a.it.type === "armour" ? "armour" : "weapon", attributes, itemmodifier: [], adjusteditemmodifer: [] } });
        update["system.itemmodifier"] = wmods;
      }
      await a.it.update(update);
      const nowActive = a.active + 1;
      const spendLine = res && (res.adv || res.tri || res.thr || res.des)
        ? `<div style="font-size:12px;margin-top:3px">${res.adv ? `${sym('adv').repeat(res.adv)} ${t("tuning.modCard.adv")} ` : ""}${res.tri ? `${sym('tri')} ${t("tuning.modCard.tri")} ` : ""}${res.thr ? `${sym('thr').repeat(res.thr)} ${t("tuning.modCard.thr")} ` : ""}${res.des ? `${sym('des')} ${t("tuning.modCard.des")}` : ""}</div>` : "";
      await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }),
        content: `<div style="border:1px solid #8888;border-radius:6px;padding:8px;font-size:13px">
          <h3 style="margin:.1em 0">${t("tuning.modCard.title", { item: a.it.name, att: a.name })}</h3>
          <div>${t("tuning.modCard.activated", { mod: modName })} ${res ? `— <b style="color:#27ae60">${t("tuning.modCard.ok")}</b> (${sym('suc').repeat(res.net)} ${res.net})` : t("tuning.modCard.noRoll")}</div>
          <div>${t("tuning.modCard.next", { now: nowActive, total: a.total, diff: DLABEL[Math.min(5, 2 + nowActive) + 1] + pips(Math.min(5, 2 + nowActive)) })}</div>
          ${spendLine}</div>` });
      ui.notifications.info(t("tuning.done.mod", { mod: modName, att: a.name, now: nowActive, total: a.total }));
    }
  }
}
