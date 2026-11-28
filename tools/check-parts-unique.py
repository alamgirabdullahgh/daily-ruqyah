#!/usr/bin/env python3
"""নিয়ম-যাচাই: পুরো সফটওয়্যারে হুবহু একই অংশ (সূরা, আয়াত, শুরু-শব্দ, শেষ-শব্দ) দুই জায়গায় বসেনি তো?
একই আয়াত একাধিক জায়গায় থাকতে পারে, কিন্তু ভিন্ন জায়গায় ভিন্ন অংশ বা ভিন্ন আয়াত (CLAUDE.md-এর নিয়ম)।
পরীক্ষা: (১) সাত-অক্ষের চার্টের ৪৮ মৌলিক অংশ (data/axis-ayat.json), (২) রোগ নির্ণয়ের তালিকা (data/quran-diagnosis.json)। --all দিলে শারীরিক ও মানসিক রোগের তালিকাও (quran-disease.json, quran-mental.json), যেখানে একই আয়াত অনেক রোগে ইচ্ছাকৃত বসানো আছে, তাই শত শত হুবহু মিল আসবে এবং শুধু গণনা দেখানো হয়।
হুবহু মিল থাকলে exit 1; আংশিক ওভারল্যাপ শুধু তথ্য হিসেবে দেখায়।   চালানো: python3 tools/check-parts-unique.py
"""
import json, pathlib, collections, sys
D = pathlib.Path(__file__).resolve().parent.parent / "data"
items = []
_files = ("quran-diagnosis", "quran-disease", "quran-mental") if "--all" in sys.argv else ("quran-diagnosis",)
for _fn in _files:
    dg = json.load(open(D / f"{_fn}.json", encoding="utf-8"))
    for g in dg["groups"]:
        for c in g["cats"]:
            for k in c.get("keys", []):
                items.append((k["s"], k["a"], k.get("from") or 1, k.get("to") or 999, f"{_fn}:{g['section']}›{c['name']}"))
ax = json.load(open(D / "axis-ayat.json", encoding="utf-8"))
for gi, G in enumerate(ax["axes"]):
    for ci, col in enumerate(G["cols"]):
        for oi, o in enumerate(col["opts"]):
            b = ax["cells"][f"{gi}.{ci}.{oi}"]["b"][0]
            items.append((b[0], b[1], b[2], b[3], f"অক্ষ:{G['name']}›{col['name']}›{o}"))
og = json.load(open(D / "organ-axis.json", encoding="utf-8"))
for n, v in og["organs"].items():
    for g, c in v.items():
        b = c["b"]
        items.append((b[0], b[1], b[2], b[3], f"অঙ্গ:{g}›{n}"))
by = collections.defaultdict(list)
for i in items:
    by[(i[0], i[1])].append(i)
exact = over = 0
for k, v in sorted(by.items()):
    for x in range(len(v)):
        for y in range(x + 1, len(v)):
            a, b = v[x], v[y]
            if (a[2], a[3]) == (b[2], b[3]):
                exact += 1
                if "--all" not in sys.argv or exact <= 20: print("হুবহু", k, (a[2], a[3]), "|", a[4], "|", b[4])
            elif max(a[2], b[2]) <= min(a[3], b[3]):
                print("(আংশিক ওভারল্যাপ)", k, (a[2], a[3]), (b[2], b[3]), "|", a[4], "|", b[4]); over += 1
print(f"মোট {len(items)}টি অংশ; হুবহু মিল {exact}, আংশিক ওভারল্যাপ {over}")
sys.exit(1 if exact else 0)
