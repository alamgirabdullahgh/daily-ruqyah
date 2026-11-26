# verify_cuts.py — প্রতিটি কাটা টুকরো CTC মডেলে শুনে প্রথম ও শেষ চাওয়া-শব্দের সঙ্গে মেলায়; ছাঁটা শেষ শব্দ কেটে ফেললে আগের শেষে ফেরায়
import sys, os, json, subprocess, difflib, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ctc_align as C
SR = 16000
def piece(s, a, st, en):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(st), '-t', str(en - st), '-i', f'/tmp/pack/x/{C.gid(s, a)}.mp3', '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
def check(s, a, lo, hi, st, en):
    w = json.load(open(f'/tmp/work/repo/data/quran-chunks/a/{s}.json', encoding='utf-8'))[a - 1].split(' ')[lo - 1:hi]
    y = piece(s, a, st, en)
    if len(y) < 3200: return 0.0, 0.0, 0, len(w)
    out, lp = C.decode(y); d = [C.nz(x[0]) for x in C.dwords(out)]; e = [C.nz(x) for x in w]
    r = lambda x, ys: max([difflib.SequenceMatcher(None, x, y).ratio() for y in ys] or [0])
    return round(r(e[-1], d[-2:]), 2), round(r(e[0], d[:2]), 2), len(d), len(e)
if __name__ == '__main__':
    A = json.load(open('/tmp/organ-apply.json')); out = A['out']; tl = {k: (e, t) for k, e, t in A['trimlog']}
    meas = {r['key']: r for r in json.load(open(os.path.dirname(os.path.abspath(__file__)) + '/organ-measure3.json'))}
    bad = []; rev = 0; res = {}
    for i, (k, (st, en)) in enumerate(out.items()):
        s, a, rg = k.split(':'); lo, hi = map(int, rg.split('-')); s, a = int(s), int(a)
        l, f, nd, ne = check(s, a, lo, hi, st, en)
        if k in tl and tl[k][1] and l < 0.5:
            old = tl[k][0]; l2, f2, _, _ = check(s, a, lo, hi, st, old)
            if l2 > l: out[k] = [st, old]; rev += 1; l = l2
        res[k] = [l, f, nd, ne]
        if l < 0.5 or f < 0.5: bad.append((k, l, f, nd, ne))
        if i % 100 == 0: print(i, file=sys.stderr, flush=True)
    json.dump(dict(out=out, bad=bad, reverted=rev), open('/tmp/organ-verified.json', 'w'), ensure_ascii=False)
    print('cuts', len(out), 'reverted', rev, 'flagged', len(bad))
