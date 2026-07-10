/** Force-alchemy crafting assistant — potions & talismans: FFG roll, symbol spending helper, item creation (swffg). */
import { t, sym, pips, RollFFG, myActor } from "../util.mjs";

export default async function run(scope = {}) {
  const actor = myActor();
  if (!actor) { ui.notifications.warn(t("common.assignCharacter")); return; }
  const actorName = actor.name;
  const Roll = RollFFG();
  const loc = n => n.toLocaleString(game.i18n.lang);
  const DIFF = [0, 1, 2, 3, 4, 5].map(i => t(`potions.diff.${i}`));

  // recipe ids (n/eff via i18n) — d: difficulty, cost: materials (cr), r: rarity, time: hours
  const RECIPES = [
    { id: "poison",          t: "potion",   d: 1, cost: 500,  r: 4,  time: 2 },
    { id: "protAmulet",      t: "talisman", d: 1, cost: 300,  r: 4,  time: 3 },
    { id: "acid",            t: "potion",   d: 2, cost: 600,  r: 6,  time: 2 },
    { id: "healPotion",      t: "potion",   d: 2, cost: 1000, r: 5,  time: 2 },
    { id: "stimulant",       t: "potion",   d: 2, cost: 400,  r: 4,  time: 2 },
    { id: "fearFetish",      t: "talisman", d: 2, cost: 300,  r: 4,  time: 2 },
    { id: "fireBrew",        t: "potion",   d: 3, cost: 400,  r: 5,  time: 3 },
    { id: "vigorElixir",     t: "potion",   d: 3, cost: 600,  r: 6,  time: 4 },
    { id: "weakPotion",      t: "potion",   d: 3, cost: 1000, r: 6,  time: 4 },
    { id: "destinyTalisman", t: "talisman", d: 3, cost: 4000, r: 6,  time: 10 },
    { id: "powerAmulet",     t: "talisman", d: 3, cost: 500,  r: 6,  time: 4 },
    { id: "willPotion",      t: "potion",   d: 4, cost: 1000, r: 8,  time: 6 },
    { id: "healAccel",       t: "talisman", d: 4, cost: 600,  r: 5,  time: 8 },
    { id: "neuralCharm",     t: "talisman", d: 4, cost: 1200, r: 7,  time: 6 },
    { id: "shieldAmulet",    t: "talisman", d: 4, cost: 1000, r: 8,  time: 5 },
    { id: "lifeWater",       t: "potion",   d: 5, cost: 1000, r: 10, time: 8 },
    { id: "resistSymbol",    t: "talisman", d: 5, cost: 1800, r: 9,  time: 8 },
  ].map(r => ({ ...r, n: t(`potions.rec.${r.id}.n`), eff: t(`potions.rec.${r.id}.eff`) }));
  // skill keys stay the EN system keys; labels are localized
  const SKILLS = [
    { label: t("potions.skill.cool"),       key: "Cool" },
    { label: t("potions.skill.discipline"), key: "Discipline" },
    { label: t("potions.skill.education"),  key: "Knowledge: Education" },
    { label: t("potions.skill.lore"),       key: "Knowledge: Lore" },
  ];

  // ---- advantage/triumph spending options (contextual helper) ----
  const SPEND = [
    { id: "boon",    adv: 1 },
    { id: "dur",     adv: 2 },
    { id: "thrift",  adv: 2 },
    { id: "batch",   adv: 3 },
    { id: "potent",  adv: 3 },
    { id: "virul",   tri: 1 },
    { id: "formula", tri: 1, advAlt: 4 },
  ].map(o => ({ ...o, label: t(`potions.spend.${o.id}.label`), desc: t(`potions.spend.${o.id}.desc`) }));

  const recOpts = RECIPES.map((r, i) => `<option value="${i}">${r.t === "potion" ? "🧪" : "🔮"} ${t("potions.opt.recipe", { name: r.n, diff: DIFF[r.d], time: r.time, cost: r.cost, rarity: r.r })}</option>`).join("");
  const skillOpts = SKILLS.map((s, i) => `<option value="${i}">${s.label}</option>`).join("");
  const SYMB = t("potions.symb", { force: sym('force'), light: sym('light'), dark: sym('dark'), suc: sym('suc'), adv: sym('adv'), tri: sym('tri'), thr: sym('thr'), des: sym('des') });

  const content = `<div style="font-size:13px;max-height:70vh;overflow:auto">
    <p style="margin:.2em 0 .6em">${t("potions.intro", { name: actorName })}</p>
    <div class="form-group"><label><b>${t("potions.lbl.recipe")}</b></label><select id="rec" style="width:100%">${recOpts}</select></div>
    <div class="form-group"><label><b>${t("potions.lbl.skill")}</b></label><select id="skill" style="width:100%">${skillOpts}</select></div>
    <hr><div id="sum" style="background:#0001;border-radius:6px;padding:8px;line-height:1.6"></div></div>`;

  const buildPool = (skillKey, difficulty) => {
    let ability = 0, proficiency = 0;
    const sk = actor?.system?.skills?.[skillKey];
    if (sk) { const cv = actor.system.characteristics?.[sk.characteristic]?.value ?? 0; const rank = sk.rank ?? 0;
      proficiency = Math.min(cv, rank); ability = Math.max(cv, rank) - proficiency; }
    return new DicePoolFFG({ ability, proficiency, difficulty, force: 1 });
  };

  new Dialog({
    title: t("potions.title"),
    content,
    buttons: {
      roll: { icon: '<i class="fas fa-dice-d20"></i>', label: t("potions.btn.roll"), callback: h => craft(h) },
      cancel: { icon: '<i class="fas fa-times"></i>', label: t("common.cancel") },
    },
    default: "roll",
    render: (html) => {
      const $ = s => html[0].querySelector(s);
      const rec = () => {
        const r = RECIPES[+$("#rec").value];
        $("#sum").innerHTML = `
          <div><b>${r.t === "potion" ? t("potions.type.potion") : t("potions.type.talisman")} : ${r.n}</b></div>
          <div style="font-size:12px;opacity:.9">${r.eff}</div>
          <div style="margin-top:3px">${t("potions.sum.test", { diff: DIFF[r.d], time: r.time, cost: loc(r.cost), rarity: r.r })}</div>
          <div style="margin-top:4px;font-size:11px;opacity:.8">${SYMB}</div>`;
      };
      $("#rec").addEventListener("change", rec); rec();
    },
  }, { width: 560 }).render(true);

  async function craft(html) {
    const $ = s => html[0].querySelector(s);
    const r = RECIPES[+$("#rec").value], s = SKILLS[+$("#skill").value];
    const pool = buildPool(s.key, r.d);
    const roll = new Roll(pool.renderDiceExpression());
    await roll.evaluate();
    await roll.toMessage({ flavor: t("potions.roll.flavor", { type: r.t === "potion" ? t("potions.word.potion") : t("potions.word.talisman"), name: r.n, skill: s.label, diff: DIFF[r.d] }), speaker: ChatMessage.getSpeaker({ actor }) });
    const f = roll.ffg;
    const netSucc = (f.success + f.triumph) - (f.failure + f.despair);
    const advAvail = Math.max(0, f.advantage - f.threat);
    const thrExcess = Math.max(0, f.threat - f.advantage);
    resolve(r, s, { succeeded: netSucc > 0, netSucc, advAvail, tri: f.triumph, des: f.despair, thrExcess });
  }

  function resolve(r, s, st) {
    const affordable = (opt, adv, tri) => {
      if (opt.tri && opt.advAlt) return tri >= opt.tri || adv >= opt.advAlt;
      if (opt.tri) return tri >= opt.tri;
      return adv >= (opt.adv || 0);
    };
    const costTxt = opt => opt.tri && opt.advAlt ? t("potions.cost.triOrAdv", { tri: sym('tri'), adv: sym('adv') }) : opt.tri ? `${opt.tri} ${sym('tri')}` : `${opt.adv} ${sym('adv')}`;
    const header = st.succeeded
      ? `<div style="color:#27ae60;font-weight:bold">${t("potions.res.success", { pips: pips(st.netSucc, 'suc') || sym('suc'), n: st.netSucc })}</div>`
      : `<div style="color:#c0392b;font-weight:bold">${t("potions.res.fail")} ${st.des ? t("potions.res.despair") : ""}</div>`;
    const symLine = `<div style="margin:4px 0">${t("potions.res.available")} ${st.advAvail ? pips(st.advAvail, 'adv') : "—"} ${st.tri ? pips(st.tri, 'tri') : ""} ${st.thrExcess ? t("potions.res.complication") + " " + pips(st.thrExcess, 'thr') : ""} ${st.des ? sym('des') : ""}</div>`;
    const rows = st.succeeded ? SPEND.map((o, i) => `
      <label class="opt" data-i="${i}" style="display:flex;gap:8px;align-items:flex-start;margin:3px 0;padding:3px 5px;border-radius:5px">
        <input type="checkbox" class="sp" data-i="${i}">
        <span style="flex:1"><b>${o.label}</b> <span style="opacity:.7">(${costTxt(o)})</span><br><span style="font-size:11px;opacity:.75">${o.desc}</span></span></label>`).join("") : "";
    const content = `<div style="font-size:13px">
      <div><b>${r.t === "potion" ? "🧪" : "🔮"} ${r.n}</b> — ${s.label}</div>${header}${symLine}
      ${st.succeeded ? `<hr><div style="font-size:12px;margin-bottom:3px">${t("potions.res.spendHeader")}</div>${rows}
        <div id="rem" style="text-align:center;font-size:12px;margin-top:4px"></div>` : ""}</div>`;
    new Dialog({
      title: t("potions.res.title", { name: r.n }),
      content,
      buttons: st.succeeded ? {
        make: { icon: '<i class="fas fa-flask"></i>', label: t("potions.btn.create"), callback: h => createItem(h, r, s, st) },
        cancel: { icon: '<i class="fas fa-times"></i>', label: t("common.cancel") },
      } : { ok: { icon: '<i class="fas fa-times"></i>', label: t("common.close") } },
      default: st.succeeded ? "make" : "ok",
      render: (html) => {
        if (!st.succeeded) return;
        const boxes = [...html[0].querySelectorAll(".sp")];
        const upd = () => {
          let adv = st.advAvail, tri = st.tri;
          for (const b of boxes) { if (b.checked) { const o = SPEND[+b.dataset.i];
            if (o.tri && o.advAlt) { if (tri >= o.tri) tri -= o.tri; else adv -= o.advAlt; }
            else if (o.tri) tri -= o.tri; else adv -= (o.adv || 0); } }
          for (const b of boxes) { const o = SPEND[+b.dataset.i];
            if (!b.checked) { const ok = affordable(o, adv, tri); b.disabled = !ok;
              b.closest(".opt").style.opacity = ok ? "1" : "0.4"; } }
          html[0].querySelector("#rem").innerHTML = t("potions.res.remaining", { adv: adv > 0 ? pips(adv, 'adv') : "0 ⬆", tri: tri > 0 ? pips(tri, 'tri') : "" });
        };
        boxes.forEach(b => b.addEventListener("change", upd)); upd();
      },
    }, { width: 520 }).render(true);
  }

  async function createItem(html, r, s, st) {
    const chosen = [...html[0].querySelectorAll(".sp:checked")].map(b => SPEND[+b.dataset.i]);
    const has = id => chosen.some(o => o.id === id);
    const qty = has("batch") ? 2 : 1;
    const timeSpent = Math.max(1, r.time - 2 * Math.max(0, st.netSucc - 1));
    const matCost = has("thrift") ? Math.round(r.cost / 2) : r.cost;
    const extras = chosen.map(o => o.label).filter(l => l);
    const desc = `<p><b>${r.eff}</b></p>
      <p style="font-size:12px"><em>${t("potions.item.madeBy", { name: actorName, skill: s.label, time: timeSpent, cost: loc(matCost) })}</em></p>
      ${extras.length ? `<p style="font-size:12px">${t("potions.item.upgrades", { list: extras.join(" · ") })}</p>` : ""}
      ${st.tri > chosen.filter(o => o.tri).length ? `<p style="font-size:12px">${t("potions.item.triumphLeft")}</p>` : ""}`;
    const [it] = await actor.createEmbeddedDocuments("Item", [{
      name: `${r.n}${qty > 1 ? t("potions.item.batchSuffix") : ""}`,
      type: "gear",
      img: r.t === "potion" ? "icons/consumables/potions/potion-tinted-pink.webp" : "icons/equipment/neck/amulet-hexagon-glowing-purple.webp",
      system: { encumbrance: { value: 0 }, quantity: { value: qty }, price: { value: matCost }, rarity: { value: r.r }, description: desc },
    }]);
    ui.notifications.info(t("potions.done", { item: it.name, name: actorName }));
    it?.sheet?.render(true);
    await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }),
      content: `<div style="border:1px solid #8a5fb0;border-radius:6px;padding:8px;font-size:13px">
        <h3 style="margin:.1em 0">${r.t === "potion" ? "🧪" : "🔮"} ${t("potions.chat.created", { item: it.name })}</h3>
        <div>${r.eff}</div>
        <div style="font-size:12px;opacity:.85;margin-top:3px">${t("potions.chat.meta", { time: timeSpent, cost: loc(matCost) })}${extras.length ? ` · ✨ ${extras.join(", ")}` : ""}</div></div>` });
  }
}
