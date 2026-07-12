/** Shared FFG roll helpers — Mechanics pool + craft-roll resolution. */
import { RollFFG } from "../util.mjs";

/** Build a DicePoolFFG from an actor's skill vs a difficulty (+ optional Force dice). */
export function skillPool(actor, difficulty, { skill = "Mechanics", force = 0 } = {}) {
  let ability = 0, proficiency = 0;
  const sk = actor?.system?.skills?.[skill];
  if (sk) {
    const cv = actor.system.characteristics?.[sk.characteristic]?.value ?? 0;
    const rank = sk.rank ?? 0;
    proficiency = Math.min(cv, rank);
    ability = Math.max(cv, rank) - proficiency;
  }
  return new DicePoolFFG({ ability, proficiency, difficulty, force });
}

/** Roll a pool, post it to chat, and return the normalized craft outcome. */
export async function rollCraft(pool, { flavor, actor }) {
  const Roll = RollFFG();
  const r = new Roll(pool.renderDiceExpression());
  await r.evaluate();
  await r.toMessage({ flavor, speaker: ChatMessage.getSpeaker({ actor }) });
  const f = r.ffg;
  const netSucc = (f.success + f.triumph) - (f.failure + f.despair);
  return {
    succeeded: netSucc > 0, netSucc,
    adv: Math.max(0, f.advantage - f.threat),
    thr: Math.max(0, f.threat - f.advantage),
    tri: f.triumph, des: f.despair,
    light: f.light, dark: f.dark, ffg: f,
  };
}
