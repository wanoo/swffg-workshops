#!/usr/bin/env python3
"""Assemble lang/{fr,en}.json from lang-fragments, check collisions & parity, zip the module."""
import json, pathlib, sys, zipfile
ROOT = pathlib.Path(__file__).parent
MODID = json.load(open(ROOT/"module.json"))["id"]
frag = ROOT/"lang-fragments"
errors = []
def merge(lang):
    out, origin = {}, {}
    for f in sorted(frag.glob(f"*.{lang}.json")):
        d = json.load(open(f))
        for k, v in d.items():
            if k in out and out[k] != v: errors.append(f"collision {k} : {origin[k]} vs {f.name}")
            out[k] = v; origin[k] = f.name
    prefixes = {k.split(".")[0] for k in out}
    if len(prefixes) > 1: errors.append(f"préfixes multiples : {prefixes}")
    return out
fr, en = merge("fr"), merge("en")
for k in fr.keys() - en.keys(): errors.append(f"clé FR sans EN : {k}")
for k in en.keys() - fr.keys(): errors.append(f"clé EN sans FR : {k}")
def nest(flat):
    tree = {}
    for k, v in flat.items():
        cur = tree
        parts = k.split(".")
        for p in parts[:-1]: cur = cur.setdefault(p, {})
        if not isinstance(cur, dict) or isinstance(cur.get(parts[-1]), dict):
            errors.append(f"conflit feuille/branche : {k}"); continue
        cur[parts[-1]] = v
    return tree
(ROOT/"lang").mkdir(exist_ok=True)
json.dump(nest(fr), open(ROOT/"lang/fr.json","w"), ensure_ascii=False, indent=1)
json.dump(nest(en), open(ROOT/"lang/en.json","w"), ensure_ascii=False, indent=1)
print(f"[{MODID}] lang fr={len(fr)} en={len(en)} clés")
if errors:
    print("ERREURS:"); [print("  -", e) for e in errors]; sys.exit(1)
if "--zip" in sys.argv:
    z = ROOT/f"dist/{MODID}.zip"
    z.parent.mkdir(exist_ok=True)
    with zipfile.ZipFile(z, "w", zipfile.ZIP_DEFLATED) as zf:
        for p in ROOT.rglob("*"):
            rel = p.relative_to(ROOT)
            if rel.parts[0] in ("_dump","lang-fragments","dist","media",".git") or rel.name in ("build.py",".DS_Store"): continue
            if p.is_file(): zf.write(p, pathlib.Path(MODID)/rel)
    print(f"zip: {z} ({z.stat().st_size/1048576:.1f} Mo)")
