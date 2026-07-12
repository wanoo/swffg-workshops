/** Weapon crafting — lightsaber (hilt + crystal + accessories) via the native attachment engine.
 *  No hardcoded profile: parts inject Weapon Stat attributes, the system computes damage/crit. */
import { t, sym, pips, myActor } from "../util.mjs";
import { skillPool, rollCraft } from "../lib/roll.mjs";
import { loadAttachmentData, listFor, applyAttachments } from "../lib/attach.mjs";

export default async function run(scope = {}) {
  const actor = (scope.actor && game.actors.get(scope.actor)) || myActor();
  if (!actor) { ui.notifications.warn(t("common.assignCharacter")); return; }
  const loc = n => (n ?? 0).toLocaleString(game.i18n.lang);
  const stripQ = n => n.replace(/^Qualité\s+/i, "").replace(/\s+Quality$/i, "");
  const data = await loadAttachmentData();
  const nameOf = key => t(`attach.name.${key}`);

  // ---- hilts (chassis): lightsaber weapons from the compendium, INCLUDING bare Dmg-0 hulls ----
  const wpnPack = game.packs.get("world.oggdudeweapons");
  const hilts = [];
  for (const e of wpnPack.index.contents) {
    const d = await wpnPack.getDocument(e._id);
    if (d.type !== "weapon" || d.system.skill?.value !== "Lightsaber") continue;
    hilts.push({ name: d.name, dmg: Number(d.system.damage?.value) || 0, crit: Number(d.system.crit?.value) || 0,
      hp: Number(d.system.hardpoints?.value) || 0, enc: Number(d.system.encumbrance?.value) || 1,
      price: Number(d.system.price?.value) || 0, rarity: Number(d.system.rarity?.value) || 0, obj: d.toObject() });
  }
  hilts.sort((a, b) => b.hp - a.hp || a.name.localeCompare(b.name));

  const owned = actor.items.filter(i => i.type === "weapon" && i.system?.skill?.value === "Lightsaber");

  // ---- dynamic crystals & accessories (dataset, lightsaber-filtered) ----
  const saberTarget = { system: { skill: { value: "Lightsaber" } } };
  const crystals = await listFor(saberTarget, "weapon", { crystal: true, lightsaber: true });
  const accessories = await listFor(saberTarget, "weapon", { crystal: false, lightsaber: true });

  // display profile for a crystal (from a 0 base — DAMSET/CRITSET set it)
  const crysProfile = a => computePreviewSync({ damage: 0, crit: 0 }, a);
  function computePreviewSync(base, a) {
    const out = { ...base };
    for (const m of a.baseMods) {
      const map = data.modMap[m.descriptor]; if (!map) continue;
      const f = { damage: "damage", critical: "crit" }[map.mod] || map.mod;
      if (map.kind === "set") out[f] = map.fixed ?? m.count;
      else out[f] = (out[f] || 0) + (map.fixed ?? m.count) * (map.sign ?? 1);
    }
    out.crit = Math.max(1, out.crit || 0);
    return out;
  }
  const usedOf = a => a.hp;

  const priceSuf = p => p ? t("saber.opt.priceSuffix", { price: p }) : "";
  const modeOpts = (owned.length ? `<option value="recustom">${t("saber.mode.recustom")}</option>` : "") + `<option value="new">${t("saber.mode.new")}</option>`;
  const hiltOpts = hilts.map((h, i) => `<option value="${i}">${t("saber.opt.hilt", { name: h.name, dmg: h.dmg, crit: h.crit, hp: h.hp, price: priceSuf(h.price) })}</option>`).join("");
  const ownedOpts = owned.map((w, i) => `<option value="${i}">${t("saber.opt.owned", { name: w.name, hp: w.system.hardpoints?.value ?? 0 })}</option>`).join("");
  const crysOpts = crystals.map((c, i) => { const p = crysProfile(c); return `<option value="${i}">${t("saber.opt.crystal", { name: nameOf(c.key), dmg: p.damage, crit: p.crit, price: priceSuf(c.price), rarity: c.rarity })}</option>`; }).join("");
  const accRows = accessories.map((a, i) => `<label style="display:flex;gap:6px;align-items:flex-start;margin:2px 0"><input type="checkbox" class="acc" data-i="${i}"><span><b>${nameOf(a.key)}</b> <span style="opacity:.7">${t("saber.opt.accMeta", { hp: a.hp, price: a.price, rarity: a.rarity })}</span></span></label>`).join("");

  const content = `<div style="font-size:13px;max-height:72vh;overflow:auto">
    <p style="margin:.2em 0 .5em">${t("saber.intro", { name: actor.name })}</p>
    <div class="form-group"><label><b>${t("saber.lbl.mode")}</b></label><select id="mode" style="width:100%">${modeOpts}</select></div>
    <div class="form-group" id="hiltRow"><label><b>${t("saber.lbl.hilt")}</b></label><select id="hilt" style="width:100%">${hiltOpts}</select></div>
    <div class="form-group" id="ownRow" style="display:none"><label><b>${t("saber.lbl.own")}</b></label><select id="own" style="width:100%">${ownedOpts}</select></div>
    <div class="form-group"><label><b>${t("saber.lbl.crystal")}</b> ${t("saber.lbl.crystalHint")}</label><select id="crys" style="width:100%">${crysOpts}</select></div>
    <div class="form-group"><label><b>${t("saber.lbl.acc")}</b></label><div style="border:1px solid #0002;border-radius:4px;padding:6px;max-height:150px;overflow:auto">${accRows}</div></div>
    <hr><div id="sum" style="background:#0001;border-radius:6px;padding:8px;line-height:1.5"></div></div>`;

  new Dialog({
    title: t("saber.title"), content,
    buttons: {
      make: { icon: '<i class="fas fa-hammer"></i>', label: t("saber.btn.make"), callback: h => finish(h, true) },
      chat: { icon: '<i class="fas fa-scroll"></i>', label: t("saber.btn.sheetOnly"), callback: h => finish(h, false) },
      cancel: { icon: '<i class="fas fa-times"></i>', label: t("common.cancel") },
    },
    default: "make",
    render: (html) => {
      const $ = s => html[0].querySelector(s);
      const getSel = () => {
        const mode = $("#mode").value;
        const chassis = mode === "recustom"
          ? (() => { const w = owned[+$("#own").value]; return { name: w.name, enc: Number(w.system.encumbrance?.value) || 1, hp: Number(w.system.hardpoints?.value) || 0 }; })()
          : hilts[+$("#hilt").value];
        const crys = crystals[+$("#crys").value];
        const accs = [...html[0].querySelectorAll(".acc:checked")].map(e => accessories[+e.dataset.i]);
        return { mode, chassis, crys, accs };
      };
      const rec = () => {
        const mode = $("#mode").value;
        $("#hiltRow").style.display = mode === "recustom" ? "none" : "block";
        $("#ownRow").style.display  = mode === "recustom" ? "block" : "none";
        const { chassis, crys, accs } = getSel();
        const keys = [crys, ...accs];
        // preview: base enc from hilt, damage/crit from parts
        let p = { damage: 0, crit: 0, encumbrance: chassis.enc || 1 };
        for (const a of keys) p = computePreviewSync(p, a);
        const usedHP = keys.reduce((s, a) => s + usedOf(a), 0);
        const totHP = chassis.hp || 0;
        const over = usedHP > totHP;
        const price = (chassis.price || 0) + keys.reduce((s, a) => s + (a.price || 0), 0);
        const rarity = Math.max(0, ...keys.map(a => a.rarity || 0));
        $("#sum").innerHTML = `
          <div>${t("saber.sum.profile", { dmg: p.damage, crit: p.crit, enc: p.encumbrance })}</div>
          <div><b>${t("saber.sum.slots")}</b> : <span style="color:${over ? '#c0392b' : '#27ae60'};font-weight:bold">${usedHP}/${totHP}</span>${over ? t("saber.sum.over") : ""}</div>
          <div>${t("saber.sum.cost", { price: loc(price), rarity })}</div>
          <div style="margin-top:4px">${t("saber.sum.test", { d3: pips(3), d2: pips(2) })}
            <br><span style="opacity:.85;font-size:12px">${t("saber.sum.testHint", { force: sym('force') })}</span></div>`;
      };
      html[0].querySelectorAll("#mode,#hilt,#own,#crys,.acc").forEach(e => e.addEventListener("change", rec)); rec();
    },
  }, { width: 560 }).render(true);

  async function finish(html, roll) {
    const $ = s => html[0].querySelector(s);
    const mode = $("#mode").value;
    const crys = crystals[+$("#crys").value];
    const accs = [...html[0].querySelectorAll(".acc:checked")].map(e => accessories[+e.dataset.i]);
    const keys = [crys.key, ...accs.map(a => a.key)];
    const chassis = mode === "recustom" ? owned[+$("#own").value] : hilts[+$("#hilt").value];
    const totHP = mode === "recustom" ? (Number(chassis.system.hardpoints?.value) || 0) : chassis.hp;
    const usedHP = crys.hp + accs.reduce((s, a) => s + a.hp, 0);
    if (usedHP > totHP && !await Dialog.confirm({ title: t("saber.confirm.overTitle"), content: `<p>${t("saber.confirm.overBody", { used: usedHP, tot: totHP })}</p>` })) return;

    // ---- 1) roll first: success gates the crafting ----
    let res = null;
    if (roll) {
      res = await rollCraft(skillPool(actor, 3), { flavor: t("saber.roll.flavor", { crystal: nameOf(crys.key) }), actor });
      if (!res.succeeded) {
        await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }),
          content: `<div style="border:1px solid #c0392b;border-radius:6px;padding:8px;font-size:13px">
            <h3 style="margin:.1em 0;color:#c0392b">${t("saber.fail.title", { crystal: nameOf(crys.key) })}</h3>
            <div>${t("saber.fail.body")} ${res.des ? t("saber.fail.despair") : ""}</div>
            <div style="font-size:12px;opacity:.8;margin-top:3px">${t("saber.fail.hint")}</div></div>` });
        ui.notifications.warn(t("saber.fail.notify", { crystal: nameOf(crys.key) }));
        return;
      }
    }

    // ---- 2) build parts (native): numeric mods + qualities on the weapon, minimal attachments ----
    const target = mode === "recustom" ? chassis : { type: "weapon", system: { skill: { value: "Lightsaber" } } };
    const { weaponMods, attachments, baseZero } = await applyAttachments(target, keys, { family: "weapon" });

    const shortCrys = nameOf(crys.key)
      .replace(/^Cristal (d[e’']|de |kyber )?/i, "").replace(/^Gemme (de |)/i, "").replace(/^Perle de dragon /i, "")
      .replace(/^Bille de /i, "").replace(/^Pierre de /i, "").replace(/\s+(Crystal|Gem|Gemstone|Stone|Ingot|Pearl)$/i, "")
      .replace(/^(Cracked|Corrupted|Unstable|Tainted)\s+/i, "");
    const label = t("saber.item.name", { crystal: shortCrys });

    let it;
    if (mode === "recustom") {
      await chassis.update({ name: /sabre|saber/i.test(chassis.name) ? chassis.name : label,
        "system.itemmodifier": weaponMods, "system.itemattachment": attachments, ...baseZero });
      it = chassis;
    } else {
      // build a clean weapon from the hilt's safe fields (cloning the full doc breaks native calc)
      const S = chassis.obj.system;
      const weap = { name: label, type: "weapon", img: chassis.obj.img, system: {
        skill: S.skill, characteristic: S.characteristic,
        damage: { value: 0 }, crit: { value: 0 },
        hardpoints: { value: chassis.hp }, encumbrance: { value: chassis.enc },
        price: { value: chassis.price }, rarity: { value: chassis.rarity },
        range: S.range, special: S.special, ammo: S.ammo,
        itemmodifier: [...(S.itemmodifier || []), ...weaponMods], itemattachment: attachments,
      } };
      for (const [k, v] of Object.entries(baseZero)) foundry.utils.setProperty(weap, k, v);
      [it] = await actor.createEmbeddedDocuments("Item", [weap]);
    }
    const dmg = it.system.damage?.adjusted ?? it.system.damage?.value;
    const crit = it.system.crit?.adjusted ?? it.system.crit?.value;
    const quals = (it.system.itemmodifier || []).filter(m => m.system?.rank_current > 0 && /Qualit|Quality/i.test(m.name)).map(m => stripQ(m.name) + (m.system.rank_current > 1 ? ` ${m.system.rank_current}` : ""));

    const resLine = res
      ? `<div style="margin-top:4px;font-size:12px">${t("saber.res.success", { pips: pips(res.netSucc, 'suc'), n: res.netSucc })}${res.adv ? ` · ${pips(res.adv, 'adv')} ${t("saber.res.adv")}` : ""}${res.tri ? ` · ${sym('tri')} ${t("saber.res.tri")}` : ""}${res.thr ? ` · ${pips(res.thr, 'thr')} ${t("saber.res.thr")}` : ""}${res.des ? ` · ${sym('des')} ${t("saber.res.des")}` : ""}.</div>`
      : `<div style="margin-top:4px;font-size:11px;opacity:.7">${t("saber.res.noRoll")}</div>`;
    const recap = `<div style="border:1px solid #8888;border-radius:6px;padding:8px;font-size:13px">
      <h3 style="margin:.1em 0">⚔️ ${mode === "recustom" ? t("saber.recap.recustom") : t("saber.recap.forge")} — ${nameOf(crys.key)}</h3>
      <div><b>${mode === "recustom" ? t("saber.recap.weapon") : t("saber.recap.hilt")}</b> : ${chassis.name}${accs.length ? ` · <b>${t("saber.recap.accs")}</b> : ${accs.map(a => nameOf(a.key)).join(", ")}` : ""}</div><hr>
      <div>${t("saber.recap.profile", { dmg, crit, enc: it.system.encumbrance?.value ?? 1 })}</div>
      <div>${t("saber.sum.quals", { list: quals.join(", ") || "—" })}</div>
      <div>${t("saber.recap.meta", { used: usedHP, tot: totHP, price: loc(it.system.price?.value), rarity: it.system.rarity?.value ?? 0 })}</div>
      ${resLine}
    </div>`;
    await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: recap });
    await it.update({ "system.description": `<p><b>${t("saber.item.forgedBy", { name: actor.name })}</b></p>` + recap });
    ui.notifications.info(t(mode === "recustom" ? "saber.done.recustom" : "saber.done.forge", { name: it.name, actor: actor.name, dmg, crit }));
    it?.sheet?.render(true);
  }
}
