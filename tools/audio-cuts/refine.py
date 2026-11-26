# refine.py — যাচাইয়ে আটকানো কাটের সীমা খুঁজে ঠিক করে: শক্তির উপত্যকাগুলো প্রার্থী ধরে প্রতিটির টুকরো মডেলে শুনে চাওয়া শব্দের সঙ্গে মিলিয়ে সেরাটা বাছে।
# স্কোর = মিলে-যাওয়া শব্দের সাদৃশ্য − ০.৬×(বাড়তি শোনা শব্দ + বাদ-পড়া চাওয়া শব্দ)। ব্যবহার: python3 -I refine.py in-measure.json out.json [কী ...]
import sys, os, json, difflib, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ctc_align as C, verify_cuts as V, align_lib as L, measure2 as M
def score(s, a, lo, hi, st, en, exp):
    if en - st < 0.25: return -99, None
    y = V.piece(s, a, st, en)
    if len(y) < 3200: return -99, None
    out, lp = C.decode(y); d = [C.nz(w[0]) for w in C.dwords(out)]; e = [C.nz(x) for x in exp]
    n, m = len(e), len(d); G = -0.35; S = np.zeros((n + 1, m + 1)); T = np.zeros((n + 1, m + 1), np.int8); S[:, 0] = np.arange(n + 1) * G; S[0, :] = np.arange(m + 1) * G; T[1:, 0] = 1; T[0, 1:] = 2
    sim = np.array([[difflib.SequenceMatcher(None, e[i], d[j]).ratio() if (e[i] and d[j]) else 0 for j in range(m)] for i in range(n)]) if n and m else np.zeros((n, m))
    # কাটা-প্রান্তের শব্দ: মডেল শব্দের অংশ শোনে (যেমন "ولكن"→"و"); প্রথম/শেষ চাওয়া-শব্দের সাথে অংশ-মিল হলে ০.৭ ধরি
    if n and m:
        for (ii, jj) in ((0, 0), (n - 1, m - 1)):
            if e[ii] and d[jj] and sim[ii, jj] <= 0.4 and len(d[jj]) >= 1 and (e[ii].startswith(d[jj]) or e[ii].endswith(d[jj])) and len(d[jj]) <= len(e[ii]) * 0.8: sim[ii, jj] = 0.7
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            c = [S[i - 1, j - 1] + (sim[i - 1, j - 1] - 0.4 if sim[i - 1, j - 1] > 0.4 else -9), S[i - 1, j] + G, S[i, j - 1] + G]; k = int(np.argmax(c)); S[i, j] = c[k]; T[i, j] = k
    i, j = n, m; tot = 0.0; mt = 0; first = last = 0.0; pair = {}; mj = []
    while i > 0 or j > 0:
        k = T[i, j]
        if i > 0 and j > 0 and k == 0:
            if sim[i - 1, j - 1] > 0.4: tot += sim[i - 1, j - 1]; mt += 1; pair[i - 1] = sim[i - 1, j - 1]; mj.append(j - 1)
            i -= 1; j -= 1
        elif i > 0 and (k == 1 or j == 0): i -= 1
        else: j -= 1
    lead = sum(1 for q in range(0, min(mj)) if len(d[q]) > 2) if mj else 0
    trail = sum(1 for q in range(max(mj) + 1, m) if len(d[q]) > 2) if mj else 0
    sc = tot - 0.6 * ((m - mt) + (n - mt)) - 1.5 * (lead + trail)
    return sc, dict(first=round(pair.get(0, 0), 2), last=round(pair.get(n - 1, 0), 2), nd=m, ne=n, mt=mt, lead=lead, trail=trail)
def cands(db, t0, w=1.2, hop=M.HOP):
    a = max(0, int((t0 - w) / hop)); b = min(len(db), int((t0 + w) / hop)); k = int(0.03 / hop)
    sm = np.convolve(db[a:b], np.ones(k) / k, 'same'); r = []
    for i in range(k, len(sm) - k):
        if sm[i] <= sm[i - k:i + k + 1].min() + 1e-9: r.append((a + i) * hop)
    # ঘনত্ব কমানো: ০.০৩ সে.-এর কাছাকাছি একটাই
    out = []
    for t in r:
        if not out or t - out[-1] > 0.03: out.append(t)
    # গভীর উপত্যকা: আশপাশ (±০.২৫ সে.)-এর মধ্যমার চেয়ে অন্তত ৭ ডিবি নিচে
    kk = int(0.25 / hop); good = []
    for t in out:
        i = int(t / hop); nb = db[max(0, i - kk):i + kk]
        if len(nb) and db[i] < np.median(nb) - 7: good.append(t)
    good.sort(key=lambda t: abs(t - t0)); good = good[:(20 if w > 2 else 12)]
    if t0 not in good: good.append(t0)
    return sorted(good)
def refine(r, rounds=2, wide=False, extra=None):
    s, a, lo, hi, N = r['s'], r['a'], r['lo'], r['hi'], r['N']
    exp = json.load(open(f'/tmp/work/repo/data/quran-chunks/a/{s}.json', encoding='utf-8'))[a - 1].split(' ')[lo - 1:hi]
    x = L.load(s, a); db = M.prof(x); dur = len(x) / L.SR
    st = r.get('start'); en = r.get('end')
    if st is None: st = 0.0 if lo == 1 else None
    if en is None: en = dur if hi == N else None
    # কোনো সীমা না থাকলে আয়াতের অনুপাত থেকে মোটামুটি আন্দাজ
    if st is None: st = dur * (lo - 1) / N
    if en is None: en = dur * hi / N
    best = score(s, a, lo, hi, st, en, exp)
    for (s2, e2) in (extra or []):
        if s2 is None or e2 is None: continue
        sc = score(s, a, lo, hi, s2, e2, exp)
        if sc[0] > best[0] + 1e-6: best = sc; st = s2; en = e2
    for _ in range(rounds):
        moved = False
        if hi < N:
            for t in cands(db, en, 3.0 if wide else 1.2):
                sc = score(s, a, lo, hi, st, t, exp)
                if sc[0] > best[0] + 1e-6 or (abs(sc[0] - best[0]) < 1e-6 and sc[0] > -90 and abs(t - en) < 1e-9): best = sc; en = t; moved = True
        if lo > 1:
            for t in cands(db, st, 3.0 if wide else 1.2):
                sc = score(s, a, lo, hi, t, en, exp)
                if sc[0] > best[0] + 1e-6: best = sc; st = t; moved = True
        if not moved: break
    return round(st, 3), round(en, 3), best
if __name__ == '__main__':
    WIDE = os.environ.get('WIDE') == '1'; EX = json.load(open(os.environ['EXTRA'])) if os.environ.get('EXTRA') else {}
    M_ = json.load(open(sys.argv[1])); only = set(sys.argv[3:]); res = json.load(open(sys.argv[2])) if os.path.exists(sys.argv[2]) else {}
    for r in M_:
        if only and r['key'] not in only: continue
        if r['key'] in res: continue
        st, en, b = refine(r, wide=WIDE, extra=EX.get(r['key'])); inf = {k: float(v) for k, v in (b[1] or {}).items()}
        res[r['key']] = dict(start=st, end=en, sc=round(float(b[0]), 2), info=inf); print(r['key'], st, en, round(float(b[0]), 2), inf, flush=True)
        json.dump(res, open(sys.argv[2], 'w'), ensure_ascii=False)
