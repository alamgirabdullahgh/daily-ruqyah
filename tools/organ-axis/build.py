#!/usr/bin/env python3
"""tools/organ-axis/picks.txt থেকে data/organ-axis.json বানায় ও যাচাই করে (শব্দ-সীমা, তিন গ্রুপ, অঙ্গের নাম)।"""
import json, re, sys, pathlib
R = pathlib.Path(__file__).resolve().parent.parent.parent
D = R / "data"
names = re.findall(r'\["([^"]+)","[^"]+",\[\[', next(l for l in (R / "app.js").read_text(encoding="utf-8").split("\n") if l.startswith("const ORG=[")))
CH = {}
def words(s, a):
    if s not in CH: CH[s] = json.load(open(D / "quran-chunks" / "a" / f"{s}.json", encoding="utf-8"))
    return len(CH[s][a - 1].split(" "))
def part(x):
    s, a, r = x.split(":"); f, t = map(int, r.split("-")); s, a = int(s), int(a)
    assert 1 <= f <= t <= words(s, a), f"শব্দ-সীমা ভুল: {x} (আয়াতে {words(s, a)} শব্দ)"
    return [s, a, f, t]
def ref(x):
    if x.count(":") == 2: return part(x)
    s, a = map(int, x.split(":")); words(s, a); return [s, a]
organs, only, cur = {}, {}, None
for line in (R / "tools/organ-axis/picks.txt").read_text(encoding="utf-8").split("\n"):
    line = line.strip()
    if not line or line.startswith("#"): continue
    if line.startswith("@"):
        cur = line[1:].strip(); assert cur in names, f"অজানা অঙ্গ: {cur}"; assert cur not in organs, f"দুবার: {cur}"; organs[cur] = {}; continue
    if line.startswith("all "): only[cur] = [ref(x) for x in line.split()[1:]]; continue
    g, rest = line.split(" ", 1); assert g in ("nazar", "jadu", "jin") and g not in organs[cur], (cur, g)
    b, _, m = rest.partition("|")
    organs[cur][g] = {"b": part(b.strip()), "m": [ref(x) for x in m.split()]}
for n, v in organs.items(): assert len(v) == 3, f"{n}: তিন গ্রুপ পূর্ণ নয়"
out = {"_doc": "অঙ্গ-স্তর (অবস্থান › শরীরে)। b = মৌলিক অংশ, m = গ্রুপ-নির্দিষ্ট বাকি আয়াত। tools/organ-axis/build.py দিয়ে তৈরি; হাতে বদলাবেন না।",
       "order": [n for n in names if n in organs], "organs": organs, "all": only}
(D / "organ-axis.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"{len(organs)}/{len(names)} অঙ্গ; বাকি: {[n for n in names if n not in organs]}")
