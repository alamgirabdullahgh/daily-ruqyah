# build_join.py — অঙ্গের ৮ অংশের যাচাই-ক্লিপ: মাত্রা সমান + পরিবেশ-আওয়াজে মেশানো মসৃণ জোড়া (ওভারল্যাপ নয়)
# ব্যবহার: python3 -I build_join.py   (আগে /tmp/pack/x-এ প্যাক, /tmp/ctc-তে মডেল, /tmp/work/repo লিঙ্ক)
# শেষ-সীমা ওভাররাইড: তানবীন-ফাতহার "ন" বাদ (থামলে 'লাহমা'): ২:২৫৯ end 45.57, ২৩:১৪ end 17.22; ২৭:৪৪ start 6.76 (আগের শব্দের লেজ বাদ)
import sys, json, subprocess, os, numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ctc_align as C
SR = 22050
D = {r['key']: r for r in json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'organ-measure3.json')))}
KEYS = ['2:259:49-56', '3:29:2-10', '23:14:8-13', '9:30:11-19', '2:195:5-9', '27:44:9-11', '33:51:16-22', '23:21:6-9']
OV = {'2:259:49-56': {'end': 45.57, 'fo': .025}, '23:14:8-13': {'end': 17.22, 'fo': .025}, '27:44:9-11': {'start': 6.76}}
GAP, TARGET = 0.16, -20.0
def load(s, a):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f'/tmp/pack/x/{C.gid(s, a)}.mp3', '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
def room(x):
    w = int(.25 * SR); best = None
    for i in range(0, len(x) - w, int(.05 * SR)):
        r = np.sqrt(np.mean(x[i:i + w] ** 2))
        if best is None or r < best[0]: best = (r, i)
    t = x[best[1]:best[1] + w].copy(); return t - t.mean()
def loop(t, n):
    out = np.concatenate([t[::-1] if i % 2 else t for i in range(n // len(t) + 1)])[:n]; return out
parts = []; names = []
for k in KEYS:
    r = D[k]; o = OV.get(k, {}); s, a = r['s'], r['a']
    x = load(s, a); st = o.get('start', r['start']); en = o.get('end', r['end'])
    seg = x[int(st * SR):int(en * SR)].copy(); fo = int(o.get('fo', .04) * SR); fi = int(.025 * SR)
    fr = np.array([np.sqrt(np.mean(seg[i:i + 441] ** 2)) for i in range(0, len(seg) - 441, 441)]); act = fr[20 * np.log10(fr + 1e-9) > -40]
    g = 10 ** (TARGET / 20) / (np.sqrt(np.mean(act ** 2)) + 1e-9); seg *= g
    seg[-fo:] *= np.linspace(1, 0, fo); seg[:fi] *= np.linspace(0, 1, fi)
    parts.append((seg, room(x) * g * 0.5)); names.append(k)
    sf.write(f'/tmp/parts/q{len(parts)}.wav', np.clip(seg, -.97, .97), SR)
gap = int(GAP * SR); pieces = []; bed = []
for i, (seg, tone) in enumerate(parts):
    pieces.append(seg)
    if i < len(parts) - 1:
        pieces.append(np.zeros(gap, np.float32))
n = sum(len(p) for p in pieces); out = np.concatenate(pieces); bedt = np.zeros(n, np.float32); pos = 0
for i, (seg, tone) in enumerate(parts):
    L = len(seg) + (gap if i < len(parts) - 1 else 0); bedt[pos:pos + L] += loop(tone, L) * 1.0; pos += L
# জোড়ার ধাপে পরিবেশ-আওয়াজ নিজে নিজে এক অংশ থেকে পরেরটায় মেশে: প্রতিটি অংশের বেড ১২০ মি.সে. ধরে ফেড
pos = 0; B = np.zeros(n, np.float32)
for i, (seg, tone) in enumerate(parts):
    L = len(seg) + (gap if i < len(parts) - 1 else 0); b = loop(tone, L); f = int(.12 * SR)
    if i > 0: b[:f] *= np.linspace(0, 1, f)
    if i < len(parts) - 1: b[-f:] *= np.linspace(1, 0, f)
    B[pos:pos + L] += b; pos += L
res = np.clip(out + B, -.97, .97); sf.write('/tmp/parts/smooth.wav', res, SR)
print('ok', len(res) / SR)
