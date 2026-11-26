# finalize_pending.py — বাকি ৪৩ আয়াতের সেরা সীমা বেছে নতুন করে যাচাই, তানবীনের ন ছাঁটা, গ্রহণযোগ্য কাটের তালিকা /tmp/final-pending.json
import sys, os, json, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import refine as RF, ctc_align as C, verify_cuts as V, align_lib as L
from collections import defaultdict
need = json.load(open('organ-cuts-needed.json')); pend = json.load(open('organ-pending.json'))['verses_not_cut']
D = defaultdict(list)
for s, a, lo, hi, N in need: D[f'{s}:{a}'].append((lo, hi, N))
def merge(rs):
    out = []
    for lo, hi in sorted(rs):
        if out and lo <= out[-1][1] + 1: out[-1][1] = max(out[-1][1], hi)
        else: out.append([lo, hi])
    return out
src = {}
for f in ['/tmp/pend-refined.json', '/tmp/pend-refined2.json', '/tmp/pend-refined3.json', '/tmp/merged-refined.json']:
    if os.path.exists(f):
        for k, v in json.load(open(f)).items(): src.setdefault(k, []).append((v['start'], v['end']))
TAN = re.compile('[\u064b\u064c\u064d]')
res = {}; fin = {}
for vk in pend:
    s, a = map(int, vk.split(':')); N = D[vk][0][2]; ws = json.load(open(f'/tmp/work/repo/data/quran-chunks/a/{s}.json', encoding='utf-8'))[a - 1].split(' ')
    ok_all = True; items = []
    for lo, hi in merge([(x, y) for x, y, _ in D[vk]]):
        key = f'{vk}:{lo}-{hi}'; exp = ws[lo - 1:hi]; best = None
        for st, en in src.get(key, []):
            sc, inf = RF.score(s, a, lo, hi, st, en, exp)
            if inf and (best is None or sc > best[0]): best = (sc, inf, st, en)
        if not best: items.append((key, None, 'no-candidate')); ok_all = False; continue
        sc, inf, st, en = best
        lw = C.nz(exp[-1]); shortlast = len(lw) <= 3
        good = inf['lead'] + inf['trail'] == 0 and inf['first'] >= 0.5 and inf['mt'] >= inf['ne'] - 1 and (inf['last'] >= 0.5 or (shortlast and inf['mt'] >= inf['ne'] - 1))
        flag = 'ear' if (inf['last'] < 0.5 or inf['first'] < 0.5) else ''
        # তানবীনের ন
        trimmed = None
        if good and hi < N and TAN.search(exp[-1]):
            import apply_organ_trim as T
            x = T.load(s, a); t = T.trim_nun(x, st, en)
            if not t and '\u064b' in exp[-1]: t = T.trim_nun(x, st, en, -10, -6)
            if t and st + 0.2 < t < en:
                sc2, inf2 = RF.score(s, a, lo, hi, st, t, exp)
                if inf2 and inf2['last'] >= inf['last'] - 0.05 and inf2['lead'] + inf2['trail'] == 0: trimmed = (en, t); en = t
        items.append((key, dict(st=round(st, 3), en=round(en, 3), info=inf, good=good, flag=flag, trimmed=trimmed), 'ok' if good else 'bad'))
        if not good: ok_all = False
    res[vk] = dict(ok=ok_all, items=items)
    print(vk, ok_all, [(i[0], i[2], (i[1] or {}).get('flag'), (i[1] or {}).get('trimmed')) for i in items], flush=True)
    json.dump(res, open('/tmp/final-pending.json', 'w'), ensure_ascii=False, default=lambda o: bool(o) if hasattr(o,'dtype') and o.dtype==bool else float(o))
