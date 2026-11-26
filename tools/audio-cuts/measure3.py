# measure3.py — কাটের জায়গা: CTC মডেলের শব্দ-সময় (ctc_align.py) দিয়ে সীমার জানালা ছোট করে, প্যাক-অডিওর আসল শক্তি-প্রোফাইলের গভীরতম ফাঁকে বসায়।
# ব্যবহার: python3 -I measure3.py in.json out.json   (in = [[সূরা,আয়াত,শুরু,শেষ,N],...])
import json, sys, os
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import align_lib as L, measure2 as M, ctc_align as C
HOP = M.HOP
_c = {}
def ctc(s, a, N):
    if (s, a) not in _c: _c[(s, a)] = C.words(s, a, N)[:3]
    return _c[(s, a)]
def boundary(db, w, k, dur, side):
    """শব্দ k ও k+1 (১-ভিত্তিক k)-এর মাঝের সীমা। side='end': k-তে শেষ (পরের শব্দ বাদ); side='start': k+1 থেকে শুরু (আগের শব্দ বাদ)।
    ছোট জানালা (< ০.৩৫ সে.) → গভীরতম ফাঁক; লম্বা বিরতি (ওয়াক্ফ) → কথার শেষ/শুরুর ঠিক কাছে, যাতে কাটা অংশে ফাঁকা নীরবতা না ঢোকে।"""
    a, b = w[k - 1], w[k]
    if a is None or b is None: return None
    lo, hi = min(a[1], b[0]), max(a[1], b[0]) + 0.06
    lo = max(lo, a[0]); hi = min(hi, dur)
    if hi - lo < 0.03: lo -= 0.03; hi += 0.03
    if hi - lo >= 0.35:
        i0 = max(0, int(lo / HOP)); i1 = min(len(db), int(hi / HOP) + 1); q = db[i0:i1] < -35; run_ = int(0.04 / HOP)
        idx = np.where(q)[0]
        runs = [r for r in np.split(idx, np.where(np.diff(idx) > 1)[0] + 1) if len(r) >= run_] if len(idx) else []
        if runs:
            if side == 'end': t = (i0 + runs[0][0]) * HOP + 0.03
            else: t = (i0 + runs[-1][-1]) * HOP - 0.03
            return dict(t=float(t), depth=20.0, win=[round(lo, 3), round(hi, 3)], pause=True)
    v = M.valley(db, lo, hi)
    if v is None: return None
    return dict(t=v[0], depth=v[1], win=[round(lo, 3), round(hi, 3)], pause=False)
def run(cuts, outp):
    out = []
    for n, (s, a, lo, hi, N) in enumerate(cuts):
        x = L.load(s, a); db = M.prof(x); dur = len(x) / L.SR
        w, ok, d16 = ctc(s, a, N)
        sus = []
        if ok < N: sus.append(f'ctc-unmatched{N-ok}')
        r = dict(key=f'{s}:{a}:{lo}-{hi}', s=s, a=a, lo=lo, hi=hi, N=N, dur=round(dur, 3), ctc_ok=ok)
        if lo == 1: r['start'] = max(0.0, M.span(db)[0] - 0.010); r['s_kind'] = 'onset'
        else:
            b = boundary(db, w, lo - 1, dur, 'start')
            if b is None: sus.append('start-noctc'); r['start'] = None; r['s_kind'] = None
            else: r['start'] = round(b['t'], 3); r['s_kind'] = 'gap' if b['depth'] >= 10 else 'edge'; r['s_depth'] = round(b['depth'], 1); r['s_win'] = b['win']; r['s_pause'] = b['pause']
        if hi == N: r['end'] = min(dur, M.span(db)[1] + 0.015); r['end'] = round(r['end'], 3); r['e_kind'] = 'offset'
        else:
            b = boundary(db, w, hi, dur, 'end')
            if b is None: sus.append('end-noctc'); r['end'] = None; r['e_kind'] = None
            else: r['end'] = round(b['t'], 3); r['e_kind'] = 'gap' if b['depth'] >= 10 else 'edge'; r['e_depth'] = round(b['depth'], 1); r['e_win'] = b['win']; r['e_pause'] = b['pause']
        r['suspect'] = sus; out.append(r)
        if n % 50 == 0: print(n, len(cuts), file=sys.stderr, flush=True)
    json.dump(out, open(outp, 'w'), ensure_ascii=False); return out
if __name__ == '__main__':
    run(json.load(open(sys.argv[1])), sys.argv[2])
