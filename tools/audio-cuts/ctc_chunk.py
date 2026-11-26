# ctc_chunk.py — লম্বা আয়াতে মডেল মাঝের শব্দ বাদ দেয় (যেমন ২:১৭৭-এ ৫.৮–১০.৮ সে.), তাই আয়াত নীরব-ফাঁকে ছোট টুকরোয় ভেঙে আলাদা ডিকোড করে শব্দ-সময় বের করে।
# ctc_align.words-এর মতোই ফেরত দেয়: (res, ok, dur, dw), সময় প্যাক-ফাইলের নিজের সেকেন্ডে।
import json, difflib, numpy as np
import ctc_align as C
import align_lib as L, measure2 as M
def split_points(x, maxlen=9.0, minlen=4.0):
    db = M.prof(x); hop = M.HOP; dur = len(x) / L.SR; pts = [0.0]; cur = 0.0
    while dur - cur > maxlen + 1.5:
        a = int((cur + minlen) / hop); b = int((cur + maxlen) / hop)
        seg = db[a:b]
        if len(seg) == 0: break
        # সবচেয়ে গভীর ও দীর্ঘ নীরব জায়গা (২০ মি.সে. মসৃণ করে)
        k = np.convolve(seg, np.ones(int(0.04 / hop)) / int(0.04 / hop), 'same'); i = int(np.argmin(k)); t = (a + i) * hop
        pts.append(t); cur = t
    pts.append(dur); return pts
def dec(y16, off):
    out, lp = C.decode(y16); ws = C.dwords(out)
    return [[w[0], w[1] * C.STRIDE + off, w[2] * C.STRIDE + off] for w in ws]
def words(s, a, N):
    path = f'/tmp/pack/x/{C.gid(s, a)}.mp3'; x16 = C.load16(path); x22 = L.load(s, a); dur = len(x16) / 16000
    pts = split_points(x22); dw = []
    for i in range(len(pts) - 1):
        t0, t1 = pts[i], pts[i + 1]; seg = x16[int(t0 * 16000):int(t1 * 16000)]
        if len(seg) < 3200: continue
        dw += dec(seg, t0)
    exp = json.load(open(f'{C.REPO}/data/quran-chunks/a/{s}.json', encoding='utf-8'))[a - 1].split(' ')
    e = [C.nz(w) for w in exp]; d = [C.nz(w[0]) for w in dw]
    res = [None] * N; ok = 0; n, m = len(e), len(d); G = -0.35
    S = np.zeros((n + 1, m + 1)); T = np.zeros((n + 1, m + 1), np.int8); S[:, 0] = np.arange(n + 1) * G; S[0, :] = np.arange(m + 1) * G; T[1:, 0] = 1; T[0, 1:] = 2
    sim = np.array([[difflib.SequenceMatcher(None, e[i], d[j]).ratio() if (e[i] and d[j]) else 0 for j in range(m)] for i in range(n)]) if n and m else np.zeros((n, m))
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            c = [S[i - 1, j - 1] + (sim[i - 1, j - 1] - 0.4 if sim[i - 1, j - 1] > 0.4 else -9), S[i - 1, j] + G, S[i, j - 1] + G]
            k = int(np.argmax(c)); S[i, j] = c[k]; T[i, j] = k
    i, j = n, m
    while i > 0 or j > 0:
        k = T[i, j]
        if i > 0 and j > 0 and k == 0:
            if sim[i - 1, j - 1] > 0.4: res[i - 1] = (dw[j - 1][1], dw[j - 1][2]); ok += 1
            i -= 1; j -= 1
        elif i > 0 and (k == 1 or j == 0): i -= 1
        else: j -= 1
    return res, ok, dur, dw
