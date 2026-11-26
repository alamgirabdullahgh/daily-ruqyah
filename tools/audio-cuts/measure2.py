# measure2.py — প্যাক-অডিওর (audio-pack-32k-120 = ফোনের অফলাইন ফাইল) নিজের সময়ে শব্দ-পাল্লার কাট মাপে।
# ব্যবহার: প্যাক zip খুলে /tmp/pack/x/<আয়াত-নং>.mp3, quran-align Alafasy_128kbps.json → /tmp/qa0/
#   python3 tools/audio-cuts/measure2.py in.json out.json   (in = [[সূরা,আয়াত,শুরু,শেষ,N],...])
# দুটি স্বাধীন পদ্ধতি:
#  A) quran-align সময় → প্যাকের সময়ে রৈখিক মানচিত্র (প্যাকের আসল বাক-পরিসর থেকে ফিট; ÷১.২ অনুমান নয়) + সীমার কাছে আওয়াজের গভীরতম ফাঁক
#  B) শুধু আওয়াজের মিনিমা + শব্দ-দৈর্ঘ্যের DP (align_lib.boundaries2)
# দুটির ফারাক বেশি বা ফাঁক অগভীর হলে 'suspect' চিহ্ন; এগুলো কানে যাচাই করতে হবে।
import json, sys, os
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import align_lib as L
L.AL = {(x['surah'], x['ayah']): x['segments'] for x in json.load(open('/tmp/qa0/Alafasy_128kbps.json'))}
REPO = os.environ.get('REPO', '/tmp/work/repo')
HOP, WIN = 0.002, 0.010

def wcount(s, a):
    return len(json.load(open(f'{REPO}/data/quran-chunks/a/{s}.json', encoding='utf-8'))[a - 1].split(' '))

def qa_words(s, a, N):
    st = [None] * N; en = [None] * N
    for f, t, m0, m1 in L.aligned(s, a):
        n = t - f
        for k in range(n):
            if f + k < N:
                st[f + k] = (m0 + (m1 - m0) * k / n) / 1000; en[f + k] = (m0 + (m1 - m0) * (k + 1) / n) / 1000
    # ফাঁক ভরো (শব্দ বাদ পড়লে পাশের থেকে)
    for i in range(N):
        if st[i] is None:
            p = next((en[j] for j in range(i - 1, -1, -1) if en[j] is not None), 0.0)
            q = next((st[j] for j in range(i + 1, N) if st[j] is not None), p)
            st[i] = p; en[i] = q
    return st, en

def prof(x):
    h = int(L.SR * HOP); w = int(L.SR * WIN); n = (len(x) - w) // h
    idx = np.arange(n)[:, None] * h + np.arange(w)[None, :]
    e = np.sqrt(np.mean(x[idx] ** 2, axis=1))
    return 20 * np.log10(e / e.max() + 1e-6)

def zc(x):
    h = int(L.SR * HOP); w = int(L.SR * WIN); n = (len(x) - w) // h
    idx = np.arange(n)[:, None] * h + np.arange(w)[None, :]
    seg = x[idx]
    return np.mean(np.abs(np.diff(np.signbit(seg).astype(np.int8), axis=1)), axis=1)

def span(db, th=-30):
    on = np.where(db > th)[0]
    return on[0] * HOP, (on[-1] + 1) * HOP

def fit_map(s, a, N, db):
    """quran-align সময় (মূল ফাইল) → প্যাক সময়: প্যাকের বাক-পরিসর [t0,t1] ও qa-র প্রথম শুরু/শেষ শেষ থেকে a*t+b"""
    st, en = qa_words(s, a, N)
    t0, t1 = span(db)
    q0, q1 = st[0], en[N - 1]
    a_ = (t1 - t0) / max(q1 - q0, 1e-3)
    return (lambda t: t0 + (t - q0) * a_), a_, st, en

def valley(db, lo, hi):
    """[lo,hi] সেকেন্ডে সবচেয়ে নিচু আওয়াজের সমতল অংশের মাঝ; (সময়, গভীরতা dB আশপাশের মধ্যমার তুলনায়, প্রস্থ)"""
    i0 = max(0, int(lo / HOP)); i1 = min(len(db), int(hi / HOP) + 1)
    if i1 - i0 < 2: return None
    seg = db[i0:i1]; m = seg.min()
    idx = np.where(seg <= m + 1.0)[0]
    runs = np.split(idx, np.where(np.diff(idx) > 1)[0] + 1)
    best = max(runs, key=len)
    t = (i0 + best.mean()) * HOP
    ctx = np.median(db[max(0, int((t - 0.3) / HOP)):min(len(db), int((t + 0.3) / HOP))])
    return t, float(ctx - m), len(best) * HOP

def measureA(s, a, lo, hi, N, db, mp, st, en):
    """পদ্ধতি A: মানচিত্রে শব্দ-সীমার কাছে গভীরতম ফাঁক"""
    r = {}
    if lo == 1:
        r['start'] = max(0.0, span(db)[0] - 0.010); r['s_info'] = 'onset'
    else:
        p0, p1 = mp(en[lo - 2]), mp(st[lo - 1])
        lo_w, hi_w = min(p0, p1) - 0.05, max(p0, p1) + 0.05
        v = valley(db, lo_w, hi_w)
        r['start'] = v[0] if v else (p0 + p1) / 2; r['s_info'] = ('gap' if v and v[1] >= 10 else 'edge', round(v[1], 1) if v else None, round((p0 + p1) / 2, 3))
    if hi == N:
        r['end'] = min(len(db) * HOP, span(db)[1] + 0.015); r['e_info'] = 'offset'
    else:
        p0, p1 = mp(en[hi - 1]), mp(st[hi])
        lo_w, hi_w = min(p0, p1) - 0.05, max(p0, p1) + 0.05
        v = valley(db, lo_w, hi_w)
        r['end'] = v[0] if v else (p0 + p1) / 2; r['e_info'] = ('gap' if v and v[1] >= 10 else 'edge', round(v[1], 1) if v else None, round((p0 + p1) / 2, 3))
    return r

_dp = {}
def measureB(s, a, lo, hi, N):
    """পদ্ধতি B: শুধু আওয়াজ-মিনিমা + শব্দ-দৈর্ঘ্য DP (প্রতি আয়াতে একবার)"""
    k = (s, a)
    if k not in _dp:
        best, (t0, t1), x, e, h = L.boundaries2(s, a, N)
        _dp[k] = (best[2], t0, t1)
    b, t0, t1 = _dp[k]
    start = t0 if lo == 1 else b[lo - 2]
    end = t1 if hi == N else b[hi - 1]
    return start, end

def run(cuts, outp, tol=0.06):
    out = []
    for n, (s, a, lo, hi, N) in enumerate(cuts):
        x = L.load(s, a); db = prof(x)
        mp, sc, st, en = fit_map(s, a, N, db)
        A = measureA(s, a, lo, hi, N, db, mp, st, en)
        try:
            bs, be = measureB(s, a, lo, hi, N)
        except Exception as ex:
            bs = be = None
        sus = []
        if lo > 1 and A['s_info'][0] != 'gap': sus.append('start-edge')
        if hi < N and A['e_info'][0] != 'gap': sus.append('end-edge')
        if bs is not None:
            if lo > 1 and abs(bs - A['start']) > tol: sus.append(f'start-AB{abs(bs-A["start"]):.2f}')
            if hi < N and abs(be - A['end']) > tol: sus.append(f'end-AB{abs(be-A["end"]):.2f}')
        out.append(dict(key=f'{s}:{a}:{lo}-{hi}', s=s, a=a, lo=lo, hi=hi, N=N, dur=round(len(x) / L.SR, 3), scale=round(sc, 4),
                        start=round(A['start'], 3), end=round(A['end'], 3), B=[None if bs is None else round(bs, 3), None if be is None else round(be, 3)],
                        s_info=A['s_info'], e_info=A['e_info'], suspect=sus))
        if n % 25 == 0: print(n, len(cuts), file=sys.stderr, flush=True)
    json.dump(out, open(outp, 'w'), ensure_ascii=False)
    return out

if __name__ == '__main__':
    cuts = json.load(open(sys.argv[1]))
    if len(sys.argv) > 3: i, k = map(int, sys.argv[3].split('/')); cuts = cuts[i::k]
    run(cuts, sys.argv[2])
