#!/usr/bin/env python3
"""Build scripts/data/attachments.json + lang-fragments/attach.{fr,en}.json from the OggDude dataset.

The OggDude→Foundry import strips all functional numbers (BaseMods discarded, attributes empty).
This script recovers them from ItemAttachments.xml / ItemDescriptors.xml so the module can inject
real Weapon Stat / Armor Stat attributes at attach-time (native profile computation).

Descriptor→mod table below is OURS: the system importer has no such table (verified).
Run: python3 tools/build_attachments.py
"""
from __future__ import annotations
import json, re
import xml.etree.ElementTree as ET
from pathlib import Path

# ---- dataset locations (FR = source of truth for names, EN = official English) ----
ROOT = Path(__file__).resolve().parents[2]  # .../star-wars JDR
DS = ROOT.parent / "oggdude_translate"
FR = DS / "OggDude-FullFR" / "DataCustom"
EN = DS / "OggDudes-Custom-Dataset-SW-main" / "DataCustom"
MODULE = Path(__file__).resolve().parents[1]  # swffg-workshops
OUT_JSON = MODULE / "scripts" / "data" / "attachments.json"
OUT_FR = MODULE / "lang-fragments" / "attach.fr.json"
OUT_EN = MODULE / "lang-fragments" / "attach.en.json"

FAMILIES = {"Weapon": "weapon", "Armor": "armor", "Gear": "gear"}  # Vehicle/Mount excluded

# Curated descriptor → attribute map. modtype None = resolve by family at runtime
# (encumbrance/hardpoints/price/rarity exist in both Weapon Stat and Armor Stat).
# kind: "set" (base value, no native set type → base-0 additive) | "add" (additive, sign applied).
MODMAP = {
    "DAMSET":      {"mod": "damage",      "modtype": "Weapon Stat", "kind": "set"},
    "DAMADD":      {"mod": "damage",      "modtype": "Weapon Stat", "kind": "add", "sign": 1},
    "DAMADDCRYS":  {"mod": "damage",      "modtype": "Weapon Stat", "kind": "add", "sign": 1},
    "DAMSUB":      {"mod": "damage",      "modtype": "Weapon Stat", "kind": "add", "sign": -1},
    "DAMSUBCRYS":  {"mod": "damage",      "modtype": "Weapon Stat", "kind": "add", "sign": -1},
    "CRITSET":     {"mod": "critical",    "modtype": "Weapon Stat", "kind": "set"},
    "CRITSUB":     {"mod": "critical",    "modtype": "Weapon Stat", "kind": "add", "sign": -1},
    "CRITADD":     {"mod": "critical",    "modtype": "Weapon Stat", "kind": "add", "sign": 1},
    "RANGEADD":    {"mod": "range",       "modtype": "Weapon Stat", "kind": "add", "sign": 1},
    "RANGESUB":    {"mod": "range",       "modtype": "Weapon Stat", "kind": "add", "sign": -1},
    "SOAKSET":     {"mod": "soak",        "modtype": "Armor Stat",  "kind": "set"},
    "SOAKADD":     {"mod": "soak",        "modtype": "Armor Stat",  "kind": "add", "sign": 1},
    "DEFSET":      {"mod": "defence",     "modtype": "Armor Stat",  "kind": "set"},
    "DEFADD":      {"mod": "defence",     "modtype": "Armor Stat",  "kind": "add", "sign": 1},
    "DEFADDFORCE": {"mod": "defence",     "modtype": "Armor Stat",  "kind": "add", "sign": 1},
    "MELEEDEFADD": {"mod": "defence",     "modtype": "Armor Stat",  "kind": "add", "sign": 1},
    "RANGEDEFADD": {"mod": "defence",     "modtype": "Armor Stat",  "kind": "add", "sign": 1},
    "HPADD":       {"mod": "hardpoints",  "modtype": None,          "kind": "add", "sign": 1},
    "HPSUB":       {"mod": "hardpoints",  "modtype": None,          "kind": "add", "sign": -1},
    "ENCADD":      {"mod": "encumbrance", "modtype": None,          "kind": "add", "sign": 1},
    "ENCSUB":      {"mod": "encumbrance", "modtype": None,          "kind": "add", "sign": -1},
    "ENCSUB2":     {"mod": "encumbrance", "modtype": None,          "kind": "add", "sign": -1, "fixed": 2},
}


def t(elem, tag, default=""):
    if elem is None:
        return default
    c = elem.find(tag)
    return (c.text or default).strip() if c is not None else default


def norm(v):
    v = (v or "").replace("\r\n", "\n").replace("\r", "\n").strip()
    return re.sub(r"\n{3,}", "\n\n", v)


def pseudo_html(v):
    v = norm(v)
    for s, d in {"[H3]": "<h3>", "[h3]": "</h3>", "[H4]": "<h4>", "[h4]": "</h4>",
                 "[B]": "<strong>", "[b]": "</strong>", "[I]": "<em>", "[i]": "</em>", "[BR]": "<br>"}.items():
        v = v.replace(s, d)
    parts = [p.strip() for p in v.split("[P]") if p.strip()]
    out = []
    for p in parts:
        out.append(p if p.startswith(("<h3>", "<h4>", "<p>", "<ul>", "<div>")) else f"<p>{p}</p>")
    return "".join(out) if out else v


def index(path):
    root = ET.parse(path).getroot()
    return {t(i, "Key"): i for i in root if t(i, "Key")}


def limits(item):
    def keys(parent, child):
        p = item.find(parent)
        return [ (c.text or "").strip() for c in p.findall(child) ] if p is not None else []
    return {
        "category": keys("CategoryLimit", "Category"),
        "type": keys("TypeLimit", "Type"),
        "item": keys("ItemLimit", "Key"),
        "skill": keys("SkillLimit", "Skill"),
    }


def parse_mods(section, item_fr, item_en):
    """Return list of {descriptor, count, qualSet, misc?} for a BaseMods/AddedMods section."""
    out = []
    sec_fr = item_fr.find(section)
    sec_en = item_en.find(section) if item_en is not None else None
    if sec_fr is None:
        return out
    mods_en = sec_en.findall("Mod") if sec_en is not None else []
    for i, mod in enumerate(sec_fr.findall("Mod")):
        key = t(mod, "Key")
        count = t(mod, "Count")
        qualset = t(mod, "QualSet").lower() == "true"
        entry = {"descriptor": key or None, "count": int(count) if count else 1, "qualSet": qualset}
        misc_fr = t(mod, "MiscDesc")
        mod_en = mods_en[i] if i < len(mods_en) else None
        misc_en = t(mod_en, "MiscDesc") if mod_en is not None else ""
        if not key and (misc_fr or misc_en):
            entry["misc"] = {"fr": misc_fr or misc_en, "en": misc_en or misc_fr}
        out.append(entry)
    return out


def main():
    att_fr, att_en = index(FR / "ItemAttachments.xml"), index(EN / "ItemAttachments.xml")
    desc_fr, desc_en = index(FR / "ItemDescriptors.xml"), index(EN / "ItemDescriptors.xml")

    # qualities: IsQuality descriptors → localized short label (strip "Qualité "/"… Quality")
    def strip_q(n):
        return re.sub(r"^Qualité\s+", "", re.sub(r"\s+Quality$", "", n)).strip()
    qualities = {}
    for k, d in desc_fr.items():
        if t(d, "IsQuality").lower() == "true":
            nfr, nen = t(d, "Name"), t(desc_en.get(k), "Name")
            qualities[k] = {"compendiumName": {"fr": nfr, "en": nen or nfr},
                            "label": {"fr": strip_q(nfr), "en": strip_q(nen or nfr)}}

    attachments = {}
    frag_fr, frag_en = {}, {}
    fam_count = {}
    for key, item in att_fr.items():
        is_crystal = t(item, "IsCrystal").lower() == "true"
        fam_x = t(item, "Type")
        # crystals (or lightsaber-limited attachments) are weapon-family even if <Type> is blank
        lim = limits(item)
        if fam_x in FAMILIES:
            family = FAMILIES[fam_x]
        elif is_crystal or "Lightsaber" in lim["category"]:
            family = "weapon"
        else:
            continue
        fam_count[family] = fam_count.get(family, 0) + 1
        item_en = att_en.get(key)
        base = parse_mods("BaseMods", item, item_en)
        added = parse_mods("AddedMods", item, item_en)
        attachments[key] = {
            "key": key, "family": family,
            "isCrystal": is_crystal,
            "hp": int(t(item, "HP") or 0),
            "price": int(t(item, "Price") or 0),
            "rarity": int(t(item, "Rarity") or 0),
            "restricted": t(item, "Restricted").lower() == "true",
            "limits": lim,
            "baseMods": base, "addedMods": added,
        }
        # i18n fragments
        frag_fr[f"WKSH.attach.name.{key}"] = t(item, "Name")
        frag_en[f"WKSH.attach.name.{key}"] = t(item_en, "Name") or t(item, "Name")
        dfr, den = pseudo_html(t(item, "Description")), pseudo_html(t(item_en, "Description"))
        if dfr or den:
            frag_fr[f"WKSH.attach.desc.{key}"] = dfr or den
            frag_en[f"WKSH.attach.desc.{key}"] = den or dfr
        # narrative notes (MiscDesc mods)
        notes = [m for m in base + added if m.get("misc")]
        for i, m in enumerate(notes):
            frag_fr[f"WKSH.attach.note.{key}.{i}"] = m["misc"]["fr"]
            frag_en[f"WKSH.attach.note.{key}.{i}"] = m["misc"]["en"]

    # quality labels into fragments
    for k, q in qualities.items():
        frag_fr[f"WKSH.qual.{k}"] = q["label"]["fr"]
        frag_en[f"WKSH.qual.{k}"] = q["label"]["en"]

    # additive-mod labels (for activatable added mods): descriptor Name, {n} = magnitude
    def mod_label(dmap, k):
        d = dmap.get(k)
        if d is None:
            return None
        md = t(d, "ModDesc") or t(d, "Name")
        return re.sub(r"\b1\b", "{n}", md) if md else None
    for k in MODMAP:
        lfr, len_ = mod_label(desc_fr, k), mod_label(desc_en, k)
        if lfr or len_:
            frag_fr[f"WKSH.mod.{k}"] = lfr or len_
            frag_en[f"WKSH.mod.{k}"] = len_ or lfr

    data = {
        "version": "1.0.0",
        "modMap": MODMAP,
        "qualities": {k: {"compendiumName": q["compendiumName"]} for k, q in qualities.items()},
        "attachments": attachments,
    }
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=1))
    OUT_FR.write_text(json.dumps(frag_fr, ensure_ascii=False, indent=1))
    OUT_EN.write_text(json.dumps(frag_en, ensure_ascii=False, indent=1))
    crystals = sum(1 for a in attachments.values() if a["isCrystal"])
    print(f"attachments.json: {len(attachments)} attachements ({fam_count}), {crystals} cristaux, {len(qualities)} qualités")
    print(f"attach.fr.json: {len(frag_fr)} clés | attach.en.json: {len(frag_en)} clés")
    # parity
    miss = set(frag_fr) ^ set(frag_en)
    if miss:
        print("⚠ parité FR/EN:", list(miss)[:5])


if __name__ == "__main__":
    main()
