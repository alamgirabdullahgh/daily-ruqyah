# ctc_align.py — প্যাক-অডিও (×১.২০) থেকে সরাসরি শব্দ-সময়: Quran FastConformer CTC (int8 ONNX, CC BY 4.0, NVIDIA/mohammed) + onnxruntime
# মডেল: https://github.com/AymanOmara/wirdi/releases/download/recitation-fastconformer-v1/{model.int8.onnx,tokens.txt} → /tmp/ctc/
# ব্যবহার: from ctc_align import words; words(সূরা, আয়াত, N) -> [(শুরু_সেকেন্ড, শেষ_সেকেন্ড) × N]  (প্যাক ফাইলের নিজের সময়ে; না মিললে None)
import json, os, re, subprocess, difflib, numpy as np, librosa
import onnxruntime as ort
REPO = os.environ.get('REPO', '/tmp/work/repo')
AYN = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6]
gid = lambda s, a: sum(AYN[:s-1]) + a
TOK = [l.rstrip('\n').rsplit(' ', 1)[0] for l in open('/tmp/ctc/tokens.txt', encoding='utf-8')]
BLK = len(TOK) - 1
SES = ort.InferenceSession('/tmp/ctc/model.int8.onnx', providers=['CPUExecutionProvider'])
MEL = librosa.filters.mel(sr=16000, n_fft=512, n_mels=80, fmin=0, fmax=8000, norm='slaney', htk=False)
WIN = np.hanning(401)[:-1].astype(np.float32)  # periodic hann 400
STRIDE = 0.08
DIA = re.compile('[ؐ-ًؚ-ٰٟۖ-ۭـ]')
def nz(w):
    w = DIA.sub('', w).replace('ٱ', 'ا').replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا').replace('ى', 'ي').replace('ة', 'ه').replace('ؤ', 'و').replace('ئ', 'ي')
    return w
def load16(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 's16le', '-ac', '1', '-ar', '16000', '-'], capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
def feats(x):
    x = np.concatenate([x[:1], x[1:] - 0.97 * x[:-1]])
    xp = np.pad(x, 256, mode='reflect')
    n = 1 + (len(xp) - 512) // 160
    idx = np.arange(n)[:, None] * 160 + np.arange(512)[None, :]
    fr = xp[idx]; w = np.zeros(512, np.float32); w[56:456] = WIN
    sp = np.abs(np.fft.rfft(fr * w, axis=1)) ** 2
    m = np.log(sp @ MEL.T + 2 ** -24)
    m = (m - m.mean(0)) / (m.std(0, ddof=1) + 1e-5)
    return m.T.astype(np.float32)[None]
def decode(x):
    f = feats(x); lp = SES.run(None, {'audio_signal': f, 'length': np.array([f.shape[2]], np.int64)})[0][0]
    ids = lp.argmax(1); out = []; prev = -1
    for t, i in enumerate(ids):
        if i != prev and i != BLK: out.append((int(i), t))
        prev = i
    return out, lp
def dwords(out):
    ws = []
    for i, t in out:
        p = TOK[i]
        if p == '<unk>': continue
        if p.startswith('▁') or not ws:
            ws.append([p.lstrip('▁'), t, t])
        else:
            ws[-1][0] += p; ws[-1][2] = t
        if p == '▁': ws[-1][0] = ''
    return [w for w in ws if w[0]]
def words(s, a, N):
    path = f'/tmp/pack/x/{gid(s, a)}.mp3'
    x = load16(path); out, lp = decode(x); dw = dwords(out)
    exp = json.load(open(f'{REPO}/data/quran-chunks/a/{s}.json', encoding='utf-8'))[a - 1].split(' ')
    e = [nz(w) for w in exp]; d = [nz(w[0]) for w in dw]
    res = [None] * N; ok = 0
    # ক্রম-রক্ষী মেলানো (Needleman–Wunsch): আয়াতের শব্দ ↔ মডেলের ডিকোড-করা শব্দ; সাদৃশ্য > ০.৪ হলে জোড়া
    n, m = len(e), len(d); S = np.zeros((n + 1, m + 1)); T = np.zeros((n + 1, m + 1), np.int8); G = -0.35
    S[:, 0] = np.arange(n + 1) * G; S[0, :] = np.arange(m + 1) * G; T[1:, 0] = 1; T[0, 1:] = 2
    sim = np.array([[difflib.SequenceMatcher(None, e[i], d[j]).ratio() if (e[i] and d[j]) else 0 for j in range(m)] for i in range(n)]) if n and m else np.zeros((n, m))
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            c = [S[i - 1, j - 1] + (sim[i - 1, j - 1] - 0.4 if sim[i - 1, j - 1] > 0.4 else -9), S[i - 1, j] + G, S[i, j - 1] + G]
            k = int(np.argmax(c)); S[i, j] = c[k]; T[i, j] = k
    i, j = n, m
    while i > 0 or j > 0:
        k = T[i, j]
        if i > 0 and j > 0 and k == 0:
            if sim[i - 1, j - 1] > 0.4: res[i - 1] = (dw[j - 1][1] * STRIDE, dw[j - 1][2] * STRIDE); ok += 1
            i -= 1; j -= 1
        elif i > 0 and (k == 1 or j == 0): i -= 1
        else: j -= 1
    return res, ok, len(x) / 16000, dw
