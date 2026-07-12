/** Item tuning assistant — install attachments and activate their mods on a character's weapon/armor (swffg). */
import { t, sym, pips, RollFFG, myActor } from "../util.mjs";

export default async function run(scope = {}) {
  const actor = myActor();
  if (!actor) { ui.notifications.warn(t("common.assignCharacter")); return; }
  const Roll = RollFFG();
  const loc = n => n.toLocaleString(game.i18n.lang);

  const items = actor.items.filter(i => ["weapon", "armour"].includes(i.type) && (i.system?.hardpoints?.value ?? 0) >= 0);
  if (!items.length) { ui.notifications.warn(t("tuning.warn.noItems", { name: actor.name })); return; }

  // hard points already used = sum of installed attachments' HP
  const usedHP = it => (it.system?.itemattachment ?? []).reduce((s, a) => s + (Number(a.system?.hardpoints?.value ?? a.system?.hardpoints ?? 0) || 0), 0);

  // attachment names/notes via i18n (notes may embed dice symbols)
  const ATTACH = [
    { id: "custGrip",   hp: 1, price: 500,  r: 6, sym: { setback: sym('setback') } },
    { id: "balStock",   hp: 2, price: 1500, r: 5, sym: {} },
    { id: "telescope",  hp: 1, price: 1000, r: 4, sym: { setback: sym('setback') } },
    { id: "magazine",   hp: 1, price: 250,  r: 4, noNote: true },
    { id: "bipod",      hp: 1, price: 100,  r: 2, sym: { diff: sym('diff') } },
    { id: "laserSight", hp: 1, price: 400,  r: 3, sym: { boost: sym('boost') } },
    { id: "cortosis",   hp: 1, price: 8000, r: 8, sym: {} },
    { id: "plating",    hp: 2, price: 2500, r: 5, sym: {} },
    { id: "custom",     hp: 1, price: 0,    r: 0, noNote: true },
  ].map(a => ({ ...a, n: t(`tuning.att.${a.id}.n`), note: a.noNote ? undefined : t(`tuning.att.${a.id}.note`, a.sym) }));

  // difficulty labels (index = difficulty + 1, like the original DLABEL)
  const DLABEL = ["", ...[0, 1, 2, 3, 4, 5].map(i => t(`tuning.diff.${i}`) + " ")];

  // install difficulty (◆) from rarity, + the character's Mechanics dice pool
  const diffOf = a => a.r >= 6 ? 3 : a.r >= 4 ? 2 : 1;
  const buildPool = (difficulty) => {
    let ability = 0, proficiency = 0;
    const sk = actor?.system?.skills?.["Mechanics"];
    if (sk) {
      const cv = actor.system.characteristics?.[sk.characteristic]?.value ?? 0;
      const rank = sk.rank ?? 0;
      proficiency = Math.min(cv, rank);
      ability = Math.max(cv, rank) - proficiency;
    }
    return new DicePoolFFG({ ability, proficiency, difficulty });
  };

  const itOpts = items.map((it, i) => `<option value="${i}">${t("tuning.opt.item", { name: it.name, used: usedHP(it), total: it.system.hardpoints.value })}</option>`).join("");
  const attOpts = ATTACH.map((a, i) => `<option value="${i}">${t("tuning.opt.att", { name: a.n, hp: a.hp, price: a.price, rarity: a.r })}</option>`).join("");

  const content = `<div style="font-size:13px">
    <div class="form-group"><label><b>${t("tuning.lbl.item")}</b></label><select id="obj" style="width:100%">${itOpts}</select></div>
    <div class="form-group"><label><b>${t("tuning.lbl.att")}</b></label><select id="att" style="width:100%">${attOpts}</select>
      <div id="note" style="opacity:.7;font-size:11px;margin-top:2px"></div></div>
    <hr><div id="sum" style="background:#0001;border-radius:6px;padding:8px;line-height:1.5"></div></div>`;

  // ---- mode choice ----
  new Dialog({
    title: t("tuning.title"),
    content: `<p style="font-size:13px">${t("tuning.mode.intro", { name: actor.name })}</p>
      <ul style="font-size:12px;opacity:.85;margin:.3em 0 0 1em;padding:0">
        <li>${t("tuning.mode.install")}</li>
        <li>${t("tuning.mode.mod")}</li></ul>`,
    buttons: {
      install: { icon: '<i class="fas fa-wrench"></i>', label: t("tuning.btn.install"), callback: () => installFlow() },
      mod: { icon: '<i class="fas fa-sliders-h"></i>', label: t("tuning.btn.mod"), callback: () => modFlow() },
      cancel: { icon: '<i class="fas fa-times"></i>', label: t("common.cancel") },
    },
    default: "install",
  }, { width: 460 }).render(true);

  function installFlow() {
    new Dialog({
      title: t("tuning.install.title"),
      content,
      buttons: {
        ok: { icon: '<i class="fas fa-wrench"></i>', label: t("tuning.btn.installRoll"), callback: h => apply(h, true) },
        note: { icon: '<i class="fas fa-pen"></i>', label: t("tuning.btn.noRoll"), callback: h => apply(h, false) },
        cancel: { icon: '<i class="fas fa-times"></i>', label: t("common.cancel") },
      },
      default: "ok",
      render: (html) => {
        const $ = s => html[0].querySelector(s);
        const rec = () => {
          const it = items[+$("#obj").value], a = ATTACH[+$("#att").value];
          const free = it.system.hardpoints.value - usedHP(it);
          const over = a.hp > free;
          $("#note").innerHTML = a.note || "";
          const d = diffOf(a);
          $("#sum").innerHTML = `<div>${t("tuning.sum.free", { name: it.name, free: `<b style="color:${over ? '#c0392b' : '#27ae60'}">${free}</b>` })}</div>
            <div>${t("tuning.sum.att", { name: a.n, hp: a.hp, price: loc(a.price), rarity: a.r })}</div>
            ${over ? `<div style="color:#c0392b">${t("tuning.sum.notEnough")}</div>` : ""}
            <div style="margin-top:4px">${t("tuning.sum.test", { diff: DLABEL[d + 1] + pips(d), price: a.price })}</div>`;
        };
        html[0].querySelectorAll("#obj,#att").forEach(e => e.addEventListener("change", rec)); rec();
      },
    }, { width: 480 }).render(true);
  }

  async function apply(html, roll) {
    const $ = s => html[0].querySelector(s);
    const it = items[+$("#obj").value], a = ATTACH[+$("#att").value];
    const free = it.system.hardpoints.value - usedHP(it);
    if (a.hp > free && !await Dialog.confirm({ title: t("tuning.confirm.title"), content: `<p>${t("tuning.confirm.body", { name: a.n, hp: a.hp, free })}</p>` })) return;

    // ---- 1) roll first (if requested): success gates the installation ----
    let res = null;
    if (roll) {
      const pool = buildPool(diffOf(a));
      const r = new Roll(pool.renderDiceExpression());
      await r.evaluate();
      await r.toMessage({ flavor: t("tuning.roll.install", { att: a.n, item: it.name }), speaker: ChatMessage.getSpeaker({ actor }) });
      const f = r.ffg;
      const netSucc = (f.success + f.triumph) - (f.failure + f.despair);
      res = { succeeded: netSucc > 0, netSucc, adv: Math.max(0, f.advantage - f.threat), thr: Math.max(0, f.threat - f.advantage), tri: f.triumph, des: f.despair };
      if (!res.succeeded) {
        await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }),
          content: `<div style="border:1px solid #c0392b;border-radius:6px;padding:8px;font-size:13px">
            <h3 style="margin:.1em 0;color:#c0392b">${t("tuning.fail.title", { att: a.n })}</h3>
            <div>${t("tuning.fail.body", { item: it.name })} ${res.des ? t("tuning.fail.despair") : ""}</div>
            <div style="font-size:12px;opacity:.8;margin-top:3px">${t("tuning.fail.hint")}</div></div>` });
        ui.notifications.warn(t("tuning.fail.notify", { att: a.n }));
        return;
      }
    }

    // ---- 2) install (test passed, or "note without a check") ----
    const resLine = res
      ? `<div style="margin-top:4px;font-size:12px">${t("tuning.res.success", { pips: sym('suc').repeat(res.netSucc), n: res.netSucc })}${res.adv ? ` · ${sym('adv').repeat(res.adv)} ${t("tuning.res.adv")}` : ""}${res.tri ? ` · ${sym('tri')} ${t("tuning.res.tri")}` : ""}${res.thr ? ` · ${sym('thr').repeat(res.thr)} ${t("tuning.res.thr")}` : ""}${res.des ? ` · ${sym('des')} ${t("tuning.res.des")}` : ""}.</div>`
      : `<div style="margin-top:4px;font-size:11px;opacity:.7">${t("tuning.res.noRoll")}</div>`;
    const card = `<div style="border:1px solid #8888;border-radius:6px;padding:8px;font-size:13px">
      <h3 style="margin:.1em 0">${t("tuning.card.title", { item: it.name })}</h3>
      <div>${t("tuning.card.installed", { att: a.n })} ${a.note ? `— <i>${a.note}</i>` : ""}</div>
      <div>${t("tuning.card.meta", { used: usedHP(it) + a.hp, total: it.system.hardpoints.value, price: loc(a.price), rarity: a.r })}</div>
      ${resLine}</div>`;
    await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: card });
    // trace in the item's description
    const desc = (it.system.description || "") + `<p>${t("tuning.trace", { att: a.n, hp: a.hp })}${a.note ? ` ${a.note}` : ""}</p>`;
    await it.update({ "system.description": desc });
    ui.notifications.info(t("tuning.done.install", { att: a.n, item: it.name }));
  }

  // ======== MODE: activate a mod on an already-installed attachment ========
  // Book rule: base Average (◆◆), +1 difficulty per mod ALREADY activated on THIS attachment.
  // The counter is native: rank_current of the attachment's itemmodifier entries (visible on the sheet).
  function listAttachments() {
    const out = [];
    for (const it of actor.items) {
      const atts = it.system?.itemattachment || [];
      atts.forEach((att, ai) => {
        const mods = (att.system?.itemmodifier || []).map((m, mi) => ({ mi, n: m.name || t("tuning.mod.fallbackName"), rank: Number(m.system?.rank) || 0, cur: Number(m.system?.rank_current) || 0 }));
        const total = mods.reduce((s, m) => s + m.rank, 0);
        const active = mods.reduce((s, m) => s + m.cur, 0);
        if (total > 0) out.push({ it, ai, name: att.name || att.system?.originalName || t("tuning.mod.fallbackAtt"), mods, total, active });
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
      title: t("tuning.mod.title"),
      content,
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
          const avail = a.mods.filter(m => m.cur < m.rank);
          $("#mod").innerHTML = avail.length
            ? avail.map(m => `<option value="${m.mi}">${m.n}${m.rank > 1 ? ` (${m.cur}/${m.rank})` : ""}</option>`).join("")
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
        const pool = buildPool(diff);
        const r = new Roll(pool.renderDiceExpression());
        await r.evaluate();
        await r.toMessage({ flavor: t("tuning.roll.mod", { n: a.active + 1, mod: modName, att: a.name, diff: DLABEL[diff + 1] }), speaker: ChatMessage.getSpeaker({ actor }) });
        const f = r.ffg;
        const net = (f.success + f.triumph) - (f.failure + f.despair);
        res = { ok: net > 0, net, adv: Math.max(0, f.advantage - f.threat), thr: Math.max(0, f.threat - f.advantage), tri: f.triumph, des: f.despair };
        if (!res.ok) {
          await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }),
            content: `<div style="border:1px solid #c0392b;border-radius:6px;padding:8px;font-size:13px">
              <h3 style="margin:.1em 0;color:#c0392b">${t("tuning.modFail.title", { mod: modName })}</h3>
              <div>${t("tuning.modFail.body", { att: a.name })} ${res.des ? t("tuning.modFail.despair") : ""}</div>
              <div style="font-size:12px;opacity:.8;margin-top:3px">${t("tuning.modFail.hint")}</div></div>` });
          ui.notifications.warn(t("tuning.modFail.notify", { mod: modName, att: a.name }));
          return;
        }
      }
      // increment rank_current on this attachment mod (native counter, visible on the sheet)
      const atts = foundry.utils.duplicate(a.it.system.itemattachment || []);
      const mod = atts[a.ai].system.itemmodifier[mi];
      mod.system.rank_current = (Number(mod.system.rank_current) || 0) + 1;
      const update = { "system.itemattachment": atts };
      // an attachment's own mods are NOT summed into the profile by the system → mirror the mod's
      // functional attribute onto the base item's itemmodifier (which IS summed) so the profile updates.
      let fnAttrs = Object.values(mod.system?.attributes || {}).filter(x => x && /Weapon Stat|Armor Stat|Stat/i.test(x.modtype || ""));
      if (!fnAttrs.length) { // legacy mods carry no attribute → derive from the mod name
        const num = /([+-]?\d+)/.exec(modName);
        if (num) {
          let value = parseInt(num[1], 10);
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
          system: { active: true, rank: 1, rank_current: 1, description: "",
            type: a.it.type === "armour" ? "armour" : "weapon", attributes, itemmodifier: [], adjusteditemmodifer: [] } });
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
