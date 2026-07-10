/** Lightsaber crafting / recustomization assistant — compendium-driven, official dataset BaseMods (swffg). */
import { t, sym, pips, RollFFG, myActor } from "../util.mjs";

export default async function run(scope = {}) {
  // ---- embedded dataset (BaseMods extracted from the OggDude DataSet) — text via i18n keys ----
  // quals/removes: quality slugs → t("saber.qual.<slug>") ; added tokens: lowercase → t("saber.mod.<tok>"), UPPERCASE/raw kept verbatim.
  const RAW = {
    crystals: [
      { key:"BARABLS",       hp:2, price:15000, rarity:8,  dmg:2, crit:1,  enc:0, quals:[["breach",1],["burn",1],["sunder",1]], removes:[], nNotes:0, added:[["burn",2],["vicious",2]] },
      { key:"CORRUPTCRYS",   hp:2, price:0,     rarity:9,  dmg:0, crit:0,  enc:0, quals:[["breach",1],["sunder",1],["vicious",2]], removes:[], nNotes:2, added:[["dmg",2],["CRITSUB",1],["vicious",1],["SUBQUALVICIOUS",2]] },
      { key:"CRACKEDCRYS",   hp:2, price:0,     rarity:10, dmg:1, crit:1,  enc:0, quals:[["breach",2],["sunder",1],["vicious",1]], removes:[], nNotes:1, added:[["CRITSUB",1],["vicious",2]] },
      { key:"JEDHACR",       hp:3, price:8000,  rarity:7,  dmg:1, crit:1,  enc:0, quals:[["breach",1],["inaccurate",2],["sunder",1],["vicious",1]], removes:[], nNotes:0, added:[["vicious",3],["dmg",2],["SUBQUALINACCURATE",1],["CRITSUB",1]] },
      { key:"DANTARI",       hp:2, price:12000, rarity:9,  dmg:1, crit:0,  enc:0, quals:[["breach",1],["sunder",1]], removes:[], nNotes:1, added:[["CRITSUB",1],["dmg",2]] },
      { key:"DRAGITE",       hp:2, price:14000, rarity:7,  dmg:1, crit:1,  enc:0, quals:[["breach",1],["disorient",1],["sunder",1]], removes:[], nNotes:0, added:[["disorient",2],["concussive",2],["dmg",1]] },
      { key:"ETAAN",         hp:1, price:12000, rarity:9,  dmg:0, crit:0,  enc:0, quals:[["breach",1],["sunder",1]], removes:[], nNotes:1, added:[["vicious",1],["dmg",2],["CRITSUB",1],["PARRY",1],["REFLECT",1]] },
      { key:"GHOSTFIRE",     hp:1, price:14000, rarity:9,  dmg:0, crit:0,  enc:0, quals:[["breach",1],["sunder",1]], removes:[], nNotes:1, added:[["defensive",2],["dmg",2]] },
      { key:"ILUM",          hp:2, price:9000,  rarity:10, dmg:0, crit:0,  enc:0, quals:[["breach",1],["sunder",1]], removes:[], nNotes:0, added:[["vicious",2],["dmg",4],["CRITSUB",1]] },
      { key:"KIMBER",        hp:2, price:6500,  rarity:8,  dmg:3, crit:-1, enc:0, quals:[["stunDamage",1]], removes:[], nNotes:0, added:[["dmg",2],["concussive",1],["disorient",2]] },
      { key:"KRAYT",         hp:2, price:15000, rarity:10, dmg:3, crit:-1, enc:0, quals:[["breach",1],["sunder",1],["vicious",1]], removes:[], nNotes:0, added:[["vicious",3],["dmg",1]] },
      { key:"LORRDIAN",      hp:2, price:9600,  rarity:8,  dmg:1, crit:0,  enc:0, quals:[["breach",1],["defensive",1],["sunder",1]], removes:[], nNotes:0, added:[["defensive",1],["DEFLECTION",2]] },
      { key:"MEPHITE",       hp:2, price:10000, rarity:10, dmg:2, crit:0,  enc:0, quals:[["breach",1],["sunder",1]], removes:[], nNotes:1, added:[["dmg",3],["CRITSUB",1],["vicious",1]] },
      { key:"NISHSTONE",     hp:2, price:12500, rarity:8,  dmg:1, crit:1,  enc:0, quals:[["breach",1],["sunder",1]], removes:[], nNotes:1, added:[["PLANMAP",1],["disorient",2],["vicious",1]] },
      { key:"SAPITH",        hp:2, price:18000, rarity:10, dmg:1, crit:0,  enc:0, quals:[["breach",1],["sunder",1]], removes:[], nNotes:0, added:[["breach",1],["dmg",2],["CRITSUB",1]] },
      { key:"SEEKERCRYS",    hp:0, price:16000, rarity:9,  dmg:1, crit:0,  enc:0, quals:[["breach",1],["sunder",1]], removes:[], nNotes:1, added:[["dmg",1],["None",1]] },
      { key:"SOLARICRYS",    hp:3, price:16000, rarity:9,  dmg:1, crit:0,  enc:0, quals:[["breach",1],["sunder",1],["defensive",1]], removes:[], nNotes:2, added:[["dmg",1],["defensive",1],["None",1]] },
      { key:"SORIAN",        hp:4, price:16000, rarity:9,  dmg:0, crit:1,  enc:0, quals:[["breach",1],["sunder",1]], removes:[], nNotes:1, added:[["dmg",3],["PARRY",1],["disorient",1]] },
      { key:"TAINTNIGHT",    hp:2, price:13000, rarity:10, dmg:0, crit:0,  enc:0, quals:[["breach",1],["sunder",1],["disorient",3],["vicious",4]], removes:[], nNotes:0, added:[["dmg",1],["disorient",1]] },
      { key:"UNSTKYBER",     hp:2, price:16000, rarity:10, dmg:0, crit:0,  enc:0, quals:[["breach",1],["sunder",1]], removes:[], nNotes:1, added:[] },
      { key:"VARPCRYST",     hp:2, price:14000, rarity:9,  dmg:2, crit:1,  enc:0, quals:[["breach",1],["vicious",1],["sunder",1]], removes:[], nNotes:1, added:[["vicious",2],["dmg",1]] },
      { key:"THONTIIN",      hp:2, price:9000,  rarity:9,  dmg:0, crit:0,  enc:0, quals:[["breach",1],["sunder",1]], removes:[], nNotes:1, added:[["dmg",3],["CRITSUB",1]] },
      { key:"ZOPHIS",        hp:2, price:11000, rarity:10, dmg:2, crit:0,  enc:0, quals:[["breach",2],["sunder",1],["vicious",1]], removes:[], nNotes:2, added:[["dmg",2]] },
      { key:"CHRISTOPHCRYS", hp:2, price:11000, rarity:8,  dmg:1, crit:1,  enc:0, quals:[["breach",1],["sunder",1]], removes:[], nNotes:0, added:[["breach",1],["knockdown",1],["dmg",3],["CRITSUB",2]] },
    ],
    accessories: [
      { key:"BLADEDRAIN",   hp:2, price:4000, rarity:9, dmg:0,  crit:0,  enc:0, quals:[], removes:[], nNotes:2, added:[["defensive",2]] },
      { key:"CCARRAY",      hp:2, price:1500, rarity:8, dmg:0,  crit:0,  enc:0, quals:[], removes:[], nNotes:2, added:[["crystalNoHp",1]] },
      { key:"CURVEDHILT",   hp:1, price:1000, rarity:6, dmg:0,  crit:0,  enc:0, quals:[], removes:[], nNotes:1, added:[["defensive",1]] },
      { key:"CUSTGRIP",     hp:1, price:500,  rarity:6, dmg:0,  crit:0,  enc:0, quals:[], removes:[], nNotes:2, added:[["ACCURATE",1]] },
      { key:"DUALPHASE",    hp:2, price:4500, rarity:6, dmg:0,  crit:0,  enc:0, quals:[], removes:[], nNotes:1, added:[] },
      { key:"EXTHILT",      hp:1, price:3800, rarity:7, dmg:1,  crit:0,  enc:0, quals:[], removes:[], nNotes:0, added:[["vicious",1]] },
      { key:"FLICKERPHASE", hp:1, price:5000, rarity:4, dmg:-2, crit:0,  enc:0, quals:[["inaccurate",2]], removes:[], nNotes:1, added:[["SUBQUALINACCURATE",1],["dmg",1]] },
      { key:"HILTMASK",     hp:1, price:0,    rarity:0, dmg:0,  crit:0,  enc:0, quals:[], removes:[], nNotes:1, added:[["None",2]] },
      { key:"POMMELCAP",    hp:1, price:3000, rarity:2, dmg:0,  crit:0,  enc:0, quals:[["stun",2]], removes:[], nNotes:0, added:[["stun",2]] },
      { key:"REMAGSH",      hp:1, price:4000, rarity:5, dmg:0,  crit:0,  enc:0, quals:[["concussive",1],["knockdown",1],["pierce",1]], removes:["breach"], nNotes:0, added:[["concussive",1],["disorient",2],["pierce",1]] },
      { key:"STUNBLAST",    hp:2, price:750,  rarity:5, dmg:0,  crit:0,  enc:0, quals:[], removes:[], nNotes:0, added:[["dmg",1],["SUBQUALUNWIELDY",1],["disorient",2]] },
      { key:"SUPHILT",      hp:1, price:5000, rarity:6, dmg:0,  crit:0,  enc:0, quals:[["superior",1]], removes:[], nNotes:0, added:[] },
      { key:"THISSCOIL",    hp:1, price:5500, rarity:5, dmg:0,  crit:0,  enc:0, quals:[], removes:[], nNotes:1, added:[] },
      { key:"THOLOHILT",    hp:1, price:8000, rarity:7, dmg:2,  crit:0,  enc:1, quals:[], removes:[], nNotes:1, added:[] },
      { key:"TRAINEMIT",    hp:2, price:100,  rarity:6, dmg:0,  crit:-1, enc:0, quals:[["stunDamage",1]], removes:["sunder","breach"], nNotes:0, added:[] },
      { key:"WALKHILT",     hp:1, price:2500, rarity:6, dmg:0,  crit:0,  enc:0, quals:[["inaccurate",1]], removes:[], nNotes:1, added:[["SUBQUALINACCURATE",1]] },
      { key:"CATFAILMOD",   hp:0, price:0,    rarity:0, dmg:0,  crit:0,  enc:0, quals:[], removes:[], nNotes:1, added:[] },
    ],
  };
  const Q = s => t(`saber.qual.${s}`);
  const modTxt = ([k, v]) => `${/^[a-z]/.test(k) ? t(`saber.mod.${k}`) : k} +${v}`;
  const hydrate = e => ({
    ...e,
    name: t(`saber.att.${e.key}`),
    quals: e.quals.map(([q, r]) => ({ n: Q(q), r })),
    removes: e.removes.map(Q),
    notes: Array.from({ length: e.nNotes }, (_, i) => t(`saber.note.${e.key}.${i + 1}`)),
    added: e.added.map(modTxt),
  });
  const SABER = { crystals: RAW.crystals.map(hydrate), accessories: RAW.accessories.map(hydrate) };
  const REF_DMG = 6, REF_CRIT = 2;  // standard saber profile = baseline of the dataset's DAMSET/CRITSET

  const actor = myActor();
  if (!actor) { ui.notifications.warn(t("common.assignCharacter")); return; }
  const Roll = RollFFG();
  const loc = n => n.toLocaleString(game.i18n.lang);
  const stripQ = n => n.replace(/^Qualité\s+/i, "").replace(/\s+Quality$/i, "");

  // ---- preload qualities (real compendium mods, so the system recognizes them) ----
  // FR mods are named "Qualité X", EN mods "X Quality".
  const isQual = n => /^Qualité\s/i.test(n) || /\sQuality$/i.test(n);
  const qualCache = new Map();
  for (const pid of ["world.oggdudeweaponmods", "world.oggdudegenericmods"]) {
    const p = game.packs.get(pid); if (!p) continue;
    for (const e of p.index.contents) { if (isQual(e.name) && !qualCache.has(e.name)) qualCache.set(e.name, { pack: pid, id: e._id }); }
  }
  async function makeQual(name, rank) {
    const ref = qualCache.get(name);
    if (!ref) return { name, type: "itemmodifier", system: { description: `<p>${name}</p>`, attributes: {}, type: "weapon", rank, rank_current: rank, itemmodifier: [], adjusteditemmodifer: [] } };
    const doc = await game.packs.get(ref.pack).getDocument(ref.id);
    const o = doc.toObject(); o.system.rank = rank; o.system.rank_current = rank; return o;
  }

  // ---- hilts: complete sabers from the compendium (chassis) ----
  const wpnPack = game.packs.get("world.oggdudeweapons");
  const hilts = [];
  for (const e of wpnPack.index.contents.filter(e => e.type === "weapon" && /sabre|saber|laser|pique|pike|canne|cane|fleuret|foil|manche|poign|hilt|stick|shoto/i.test(e.name))) {
    const d = await wpnPack.getDocument(e._id);
    if (d.system.skill?.value !== "Lightsaber") continue;
    const dmg = Number(d.system.damage?.value) || 0;
    if (dmg <= 0) continue; // skip "bare" hilts (Dmg 0) the system does not compute
    const quals = (d.system.itemmodifier || []).filter(m => m.system?.rank_current > 0 && isQual(m.name)).map(m => ({ n: m.name, r: m.system.rank_current }));
    hilts.push({ id: d.id, name: d.name, dmg, crit: Number(d.system.crit?.value) || REF_CRIT, hp: Number(d.system.hardpoints?.value) || 0,
      enc: Number(d.system.encumbrance?.value) || 1, price: Number(d.system.price?.value) || 0, rarity: Number(d.system.rarity?.value) || 0, quals, obj: d.toObject() });
  }
  hilts.sort((a, b) => a.hp - b.hp || a.name.localeCompare(b.name));

  // saber weapons already owned by the character (recustom mode)
  const owned = actor.items.filter(i => i.type === "weapon" && i.system?.skill?.value === "Lightsaber");

  // ---- real compendium docs to attach ----
  const waPack = game.packs.get("world.oggdudeweaponattachments");
  const attByName = new Map(waPack.index.contents.map(e => [e.name, e._id]));
  async function attachObj(name) { const id = attByName.get(name); if (!id) return null; return (await waPack.getDocument(id)).toObject(); }

  // ================= COMPUTE =================
  function compute(chassis, crys, accs) {
    const dmg  = REF_DMG + (crys?.dmg || 0) + accs.reduce((s, a) => s + (a.dmg || 0), 0);
    const crit = Math.max(1, REF_CRIT + (crys?.crit || 0) + accs.reduce((s, a) => s + (a.crit || 0), 0));
    const enc  = Math.max(0, (chassis?.enc || 1) + (crys?.enc || 0) + accs.reduce((s, a) => s + (a.enc || 0), 0));
    // qualities: crystal + accessories; + hilt qualities except Breach/Sunder (standard)
    const q = new Map();
    const add = arr => (arr || []).forEach(x => { const n = x.n, r = x.r || 1; q.set(n, Math.max(q.get(n) || 0, r)); });
    if (crys) add(crys.quals); accs.forEach(a => add(a.quals));
    (chassis?.quals || []).forEach(x => { if (!/Brèche|Briseur|Breach|Sunder/i.test(x.n)) q.set(x.n, Math.max(q.get(x.n) || 0, x.r || 1)); });
    const removes = [...(crys?.removes || []), ...accs.flatMap(a => a.removes || [])];
    removes.forEach(n => q.delete(n));
    const notes = [...(crys?.notes || []), ...accs.flatMap(a => a.notes || [])];
    const added = [
      ...(crys?.added?.length ? [t("saber.sum.addedLine", { name: crys.name, list: crys.added.join(", ") })] : []),
      ...accs.filter(a => a.added?.length).map(a => t("saber.sum.addedLine", { name: a.name, list: a.added.join(", ") })),
    ];
    const usedHP = (crys ? 2 : 0) + accs.reduce((s, a) => s + (a.hp || 0), 0);
    const totHP  = chassis?.hp ?? 0;
    const price  = (chassis?.price || 0) + (crys?.price || 0) + accs.reduce((s, a) => s + (a.price || 0), 0);
    const rarity = Math.max(chassis?.rarity || 0, crys?.rarity || 0, ...accs.map(a => a.rarity || 0));
    return { dmg, crit, enc, quals: [...q].map(([n, r]) => ({ n, r })), notes, added, usedHP, totHP, price, rarity };
  }

  // options
  const priceSuf = p => p ? t("saber.opt.priceSuffix", { price: p }) : "";
  const modeOpts = (owned.length ? `<option value="recustom">${t("saber.mode.recustom")}</option>` : "") + `<option value="new">${t("saber.mode.new")}</option>`;
  const hiltOpts = hilts.map((h, i) => `<option value="${i}">${t("saber.opt.hilt", { name: h.name, dmg: h.dmg, crit: h.crit, hp: h.hp, price: priceSuf(h.price) })}</option>`).join("");
  const ownedOpts = owned.map((w, i) => `<option value="${i}">${t("saber.opt.owned", { name: w.name, hp: w.system.hardpoints?.value ?? 0 })}</option>`).join("");
  const crysOpts = SABER.crystals.map((c, i) => `<option value="${i}">${t("saber.opt.crystal", { name: c.name, dmg: REF_DMG + c.dmg, crit: Math.max(1, REF_CRIT + c.crit), price: priceSuf(c.price), rarity: c.rarity })}</option>`).join("");
  const accRows = SABER.accessories.map((a, i) => `<label style="display:flex;gap:6px;align-items:flex-start;margin:2px 0"><input type="checkbox" class="acc" data-i="${i}"><span><b>${a.name}</b> <span style="opacity:.7">${t("saber.opt.accMeta", { hp: a.hp, price: a.price, rarity: a.rarity })}</span></span></label>`).join("");

  const content = `<div style="font-size:13px;max-height:72vh;overflow:auto">
    <p style="margin:.2em 0 .5em">${t("saber.intro", { name: actor.name })}</p>
    <div class="form-group"><label><b>${t("saber.lbl.mode")}</b></label><select id="mode" style="width:100%">${modeOpts}</select></div>
    <div class="form-group" id="hiltRow"><label><b>${t("saber.lbl.hilt")}</b></label><select id="hilt" style="width:100%">${hiltOpts}</select></div>
    <div class="form-group" id="ownRow" style="display:none"><label><b>${t("saber.lbl.own")}</b></label><select id="own" style="width:100%">${ownedOpts}</select></div>
    <div class="form-group"><label><b>${t("saber.lbl.crystal")}</b> ${t("saber.lbl.crystalHint")}</label><select id="crys" style="width:100%">${crysOpts}</select>
      <div id="cnote" style="opacity:.7;font-size:11px;margin-top:2px"></div></div>
    <div class="form-group"><label><b>${t("saber.lbl.acc")}</b></label><div style="border:1px solid #0002;border-radius:4px;padding:6px;max-height:150px;overflow:auto">${accRows}</div></div>
    <hr><div id="sum" style="background:#0001;border-radius:6px;padding:8px;line-height:1.5"></div></div>`;

  const buildPool = (difficulty) => {
    let ability = 0, proficiency = 0;
    const sk = actor?.system?.skills?.["Mechanics"];
    if (sk) { const cv = actor.system.characteristics?.[sk.characteristic]?.value ?? 0; const rank = sk.rank ?? 0;
      proficiency = Math.min(cv, rank); ability = Math.max(cv, rank) - proficiency; }
    return new DicePoolFFG({ ability, proficiency, difficulty });
  };

  new Dialog({
    title: t("saber.title"),
    content,
    buttons: {
      make: { icon: '<i class="fas fa-hammer"></i>', label: t("saber.btn.make"), callback: h => finish(h, true) },
      chat: { icon: '<i class="fas fa-scroll"></i>', label: t("saber.btn.sheetOnly"), callback: h => finish(h, false) },
      cancel: { icon: '<i class="fas fa-times"></i>', label: t("common.cancel") },
    },
    default: "make",
    render: (html) => {
      const $ = s => html[0].querySelector(s);
      const getState = () => {
        const mode = $("#mode").value;
        const chassis = mode === "recustom"
          ? (() => { const w = owned[+$("#own").value]; return { name: w.name, dmg: REF_DMG, crit: REF_CRIT, hp: Number(w.system.hardpoints?.value) || 0, enc: Number(w.system.encumbrance?.value) || 1, price: 0, rarity: 0, quals: [] }; })()
          : hilts[+$("#hilt").value];
        const crys = SABER.crystals[+$("#crys").value];
        const accs = [...html[0].querySelectorAll(".acc:checked")].map(e => SABER.accessories[+e.dataset.i]);
        return { mode, chassis, crys, accs };
      };
      const rec = () => {
        const mode = $("#mode").value;
        $("#hiltRow").style.display = mode === "recustom" ? "none" : "block";
        $("#ownRow").style.display  = mode === "recustom" ? "block" : "none";
        const { chassis, crys, accs } = getState();
        const R = compute(chassis, crys, accs);
        const over = R.usedHP > R.totHP;
        $("#cnote").innerHTML = crys?.added?.length ? t("saber.sum.possibleMods", { list: crys.added.join(", ") }) : "";
        $("#sum").innerHTML = `
          <div>${t("saber.sum.profile", { dmg: R.dmg, crit: R.crit, enc: R.enc })}</div>
          <div>${t("saber.sum.quals", { list: R.quals.map(q => stripQ(q.n) + (q.r > 1 ? ` ${q.r}` : "")).join(", ") || "—" })}</div>
          <div><b>${t("saber.sum.slots")}</b> : <span style="color:${over ? '#c0392b' : '#27ae60'};font-weight:bold">${R.usedHP}/${R.totHP}</span>${over ? t("saber.sum.over") : ""}</div>
          <div>${t("saber.sum.cost", { price: loc(R.price), rarity: R.rarity })}</div>
          ${R.notes.length ? `<div style="opacity:.8;font-size:11px;margin-top:2px">${R.notes.join(" · ")}</div>` : ""}
          <div style="margin-top:4px">${t("saber.sum.test", { d3: pips(3), d2: pips(2) })}
            <br><span style="opacity:.85;font-size:12px">${t("saber.sum.testHint", { force: sym('force') })}</span></div>`;
      };
      html[0].querySelectorAll("#mode,#hilt,#own,#crys,.acc").forEach(e => e.addEventListener("change", rec)); rec();
    },
  }, { width: 560 }).render(true);

  async function finish(html, roll) {
    const $ = s => html[0].querySelector(s);
    const mode = $("#mode").value;
    const crys = SABER.crystals[+$("#crys").value];
    const accs = [...html[0].querySelectorAll(".acc:checked")].map(e => SABER.accessories[+e.dataset.i]);
    let chassisMeta, targetWeapon = null, baseObj = null;
    if (mode === "recustom") {
      targetWeapon = owned[+$("#own").value];
      chassisMeta = { name: targetWeapon.name, dmg: REF_DMG, crit: REF_CRIT, hp: Number(targetWeapon.system.hardpoints?.value) || 0, enc: Number(targetWeapon.system.encumbrance?.value) || 1, price: 0, rarity: 0, quals: [] };
    } else {
      const h = hilts[+$("#hilt").value]; chassisMeta = h; baseObj = foundry.utils.duplicate(h.obj);
    }
    const R = compute(chassisMeta, crys, accs);
    if (R.usedHP > R.totHP && !await Dialog.confirm({ title: t("saber.confirm.overTitle"), content: `<p>${t("saber.confirm.overBody", { used: R.usedHP, tot: R.totHP })}</p>` })) return;

    // ---- 1) roll first (if requested): success gates the crafting ----
    let res = null;
    if (roll) {
      const pool = buildPool(3);
      const r = new Roll(pool.renderDiceExpression());
      await r.evaluate();
      await r.toMessage({ flavor: t("saber.roll.flavor", { crystal: crys.name }), speaker: ChatMessage.getSpeaker({ actor }) });
      const f = r.ffg;
      const netSucc = (f.success + f.triumph) - (f.failure + f.despair);
      res = { succeeded: netSucc > 0, netSucc, adv: Math.max(0, f.advantage - f.threat), thr: Math.max(0, f.threat - f.advantage), tri: f.triumph, des: f.despair };
      if (!res.succeeded) {
        await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }),
          content: `<div style="border:1px solid #c0392b;border-radius:6px;padding:8px;font-size:13px">
            <h3 style="margin:.1em 0;color:#c0392b">${t("saber.fail.title", { crystal: crys.name })}</h3>
            <div>${t("saber.fail.body")} ${res.des ? t("saber.fail.despair") : ""}</div>
            <div style="font-size:12px;opacity:.8;margin-top:3px">${t("saber.fail.hint")}</div></div>` });
        ui.notifications.warn(t("saber.fail.notify", { crystal: crys.name }));
        return;
      }
    }

    // ---- 2) build the item (test passed, or "sheet only") ----
    const qualMods = [];
    for (const q of R.quals) qualMods.push(await makeQual(q.n, q.r));
    // real attachments (traceability)
    const attachments = [];
    const cDoc = await attachObj(crys.name); if (cDoc) attachments.push(cDoc);
    for (const a of accs) { const d = await attachObj(a.name); if (d) attachments.push(d); }

    const shortCrys = crys.name
      .replace(/^Cristal (d[e’']|de |kyber )?/i, "")
      .replace(/^Gemme (de |)/i, "")
      .replace(/^Perle de dragon /i, "")
      .replace(/^Bille de /i, "")
      .replace(/^Pierre de /i, "")
      .replace(/\s+(Crystal|Gem|Gemstone|Stone|Ingot|Pearl)$/i, "")
      .replace(/^(Cracked|Corrupted|Unstable|Tainted)\s+/i, "");
    const label = t("saber.item.name", { crystal: shortCrys });
    const sysPatch = {
      "system.damage.value": R.dmg,
      "system.crit.value": R.crit,
      "system.encumbrance.value": R.enc,
      "system.hardpoints.value": R.totHP,
      "system.price.value": R.price,
      "system.rarity.value": R.rarity,
      "system.itemmodifier": qualMods,
      "system.itemattachment": attachments,
    };

    // recap card (native symbols)
    const resLine = res
      ? `<div style="margin-top:4px;font-size:12px">${t("saber.res.success", { pips: pips(res.netSucc, 'suc'), n: res.netSucc })}${res.adv ? ` · ${pips(res.adv, 'adv')} ${t("saber.res.adv")}` : ""}${res.tri ? ` · ${sym('tri')} ${t("saber.res.tri")}` : ""}${res.thr ? ` · ${pips(res.thr, 'thr')} ${t("saber.res.thr")}` : ""}${res.des ? ` · ${sym('des')} ${t("saber.res.des")}` : ""}.</div>`
      : `<div style="margin-top:4px;font-size:11px;opacity:.7">${t("saber.res.noRoll")}</div>`;
    const recap = `<div style="border:1px solid #8888;border-radius:6px;padding:8px;font-size:13px">
      <h3 style="margin:.1em 0">⚔️ ${mode === "recustom" ? t("saber.recap.recustom") : t("saber.recap.forge")} — ${crys.name}</h3>
      <div><b>${mode === "recustom" ? t("saber.recap.weapon") : t("saber.recap.hilt")}</b> : ${chassisMeta.name}${accs.length ? ` · <b>${t("saber.recap.accs")}</b> : ${accs.map(a => a.name).join(", ")}` : ""}</div><hr>
      <div>${t("saber.recap.profile", { dmg: R.dmg, crit: R.crit, enc: R.enc })}</div>
      <div>${t("saber.sum.quals", { list: R.quals.map(q => stripQ(q.n) + (q.r > 1 ? ` ${q.r}` : "")).join(", ") || "—" })}</div>
      <div>${t("saber.recap.meta", { used: R.usedHP, tot: R.totHP, price: loc(R.price), rarity: R.rarity })}</div>
      ${R.notes.length ? `<div style="margin-top:3px"><b>${t("saber.recap.effects")}</b> : ${R.notes.join(" · ")}</div>` : ""}
      ${R.added.length ? `<div style="margin-top:4px;font-size:12px;opacity:.85">${t("saber.recap.possibleMods", { pips: pips(3) })}<br>${R.added.join("<br>")}</div>` : ""}
      ${resLine}
    </div>`;
    await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: recap });

    let it;
    if (mode === "recustom") {
      await targetWeapon.update({ ...sysPatch, name: /sabre|saber/i.test(targetWeapon.name) ? targetWeapon.name : label });
      it = targetWeapon;
      ui.notifications.info(t("saber.done.recustom", { name: it.name, dmg: R.dmg, crit: R.crit }));
    } else {
      baseObj.name = label;
      baseObj.system = foundry.utils.mergeObject(baseObj.system, {
        damage: { value: R.dmg }, crit: { value: R.crit }, encumbrance: { value: R.enc }, hardpoints: { value: R.totHP },
        price: { value: R.price }, rarity: { value: R.rarity },
      });
      baseObj.system.itemmodifier = qualMods;
      baseObj.system.itemattachment = attachments;
      baseObj.system.description = `<p><b>${t("saber.item.forgedBy", { name: actor.name })}</b></p>` + recap;
      [it] = await actor.createEmbeddedDocuments("Item", [baseObj]);
      ui.notifications.info(t("saber.done.forge", { name: it.name, actor: actor.name, dmg: R.dmg, crit: R.crit }));
    }
    it?.sheet?.render(true);
  }
}
