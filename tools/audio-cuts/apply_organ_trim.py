# apply_organ.py থেকে আলাদা করা: তানবীন-শেষে ন ছাঁটার ফাংশন
import os, sys, numpy as np, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ctc_align as C
SR = 22050
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
