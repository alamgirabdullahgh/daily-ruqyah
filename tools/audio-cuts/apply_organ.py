# apply_organ.py — অঙ্গের কাট audio-cuts.json-এ: organ-measure3 (+নতুন মাপা) ; তানবীন-শেষে "ন" বাদ (থামলে লাহমা)
import sys, os, json, re, subprocess, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import measure3 as M3, ctc_align as C
SR = 22050; H = os.path.dirname(os.path.abspath(__file__)); REPO = '/tmp/work/repo'
meas = {r['key']: r for r in json.load(open(H + '/organ-measure3.json'))}
need = json.load(open('/tmp/need.json'))
if need:
    for r in M3.run(need, '/tmp/need-measure.json'): meas[r['key']] = r
U = json.load(open('/tmp/organ-ranges.json')); TAN = re.compile('[\u064b\u064c\u064d]')
def load(s, a):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f'/tmp/pack/x/{C.gid(s, a)}.mp3', '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
def hilo(x, t):
    g = x[int(t * SR):int(t * SR) + int(.03 * SR)]
    if len(g) < int(.03 * SR): return None, None
    g = g * np.hanning(len(g)); S = np.abs(np.fft.rfft(g, 1024)) ** 2; f = np.fft.rfftfreq(1024, 1 / SR)
    lo = S[f < 400].sum(); hi = S[(f >= 1000) & (f < 4000)].sum()
    return 10 * np.log10(S.sum() / 1024 + 1e-12), 10 * np.log10((hi + 1e-12) / (lo + 1e-12))
def trim_nun(x, st, en, E=-6, R=-4):
    """তানবীন-শেষ: স্বর-ফ্রেম (hi/lo ≥ -4 dB ও শক্তি ≥ -6 dB) যেখানে শেষ, তার পরে নাকি-ধ্বনি; কাট = স্বরের শেষ + ০.০৪ (শেষ ০.৯ সে.-এর জানালায়)।"""
    ts = np.arange(max(st + 0.2, en - 0.9), en - 0.03, 0.02); lastv = None; after = []
    for t in ts:
        e, r = hilo(x, t)
        if r is None: continue
        if e >= E and r >= R: lastv = t; after = []
        elif lastv is not None and e >= -14: after.append(r)
    if lastv is None: return None
    if after and np.mean([r < -4 for r in after]) < 0.6: return None
    return round(lastv + 0.04, 3)
out = {}; stats = dict(total=0, trimmed=0, tan_noop=0, skipped=0); trimlog = []
cuts = json.load(open('/home/claude/daily-ruqyah/data/audio-cuts.json'))
for k, rs in U.items():
    s, a = map(int, k.split(':')); w = json.load(open(f'{REPO}/data/quran-chunks/a/{s}.json', encoding='utf-8'))[a - 1].split(' '); x = None
    for lo, hi in rs:
        key = f'{s}:{a}:{lo}-{hi}'; r = meas.get(key); stats['total'] += 1
        if not r or r.get('start') is None or r.get('end') is None: stats['skipped'] += 1; continue
        st, en = r['start'], r['end']
        if hi < len(w) and TAN.search(w[hi - 1]):
            x = load(s, a) if x is None else x; t = trim_nun(x, st, en)
            if not t and '\u064b' in w[hi - 1]: t = trim_nun(x, st, en, -10, -6)
            if t and st + 0.2 < t < en: trimlog.append((key, en, t)); en = t; stats['trimmed'] += 1
            else: stats['tan_noop'] += 1; trimlog.append((key, en, None))
        out[key] = [round(st, 3), round(en, 3)]
json.dump(dict(out=out, stats=stats, trimlog=trimlog), open('/tmp/organ-apply.json', 'w'), ensure_ascii=False)
print(stats)
