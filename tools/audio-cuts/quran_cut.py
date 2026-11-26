#!/usr/bin/env python3
# quran_cut.py — আয়াতের শব্দ-পাল্লা কাটার সব যাচাই-করা টুল এক কমান্ডে।
# উপাদান (প্রতিটি আলাদা কাজ, কোনোটা বাদ দেওয়া যায় না):
#   setup   : রিপো-লিঙ্ক, CTC মডেল (AymanOmara/wirdi, CC BY 4.0), quran-align ডেটা, অডিও-প্যাক নামানো
#   measure : শব্দ-সময় (CTC) + আওয়াজের গভীরতম ফাঁকে সীমা বসানো      (measure3.py)
#   refine  : আটকে থাকা সীমা প্রার্থী ধরে মডেলে শুনে সেরা বাছা         (refine.py, ctc_chunk.py)
#   verify  : কাটা টুকরো মডেলে শুনে প্রথম/শেষ শব্দ মেলানো              (verify_cuts.py)
#   clip    : কানের যাচাইয়ের জন্য টুকরো কেটে ফেড দিয়ে wav লেখা
#   apply   : সীমার json থেকে data/audio-cuts.json-এ চাবি যোগ (তারপর ক্যাশ ভার্সন বাড়াও — README দেখো)
#   status  : বাকি আয়াত (organ-pending.json) দেখানো
#   packcheck: প্যাকের কোন আয়াত-ফাইল কেটে ছোট (quran-align-এর দৈর্ঘ্যের সাথে মিলিয়ে)
# ব্যবহার: python3 tools/audio-cuts/quran_cut.py <আদেশ> ...
import argparse, glob, io, json, os, subprocess, sys, urllib.request, zipfile

H = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(H, '..', '..'))
PACK = '/tmp/pack/x'
MODEL_BASE = 'https://github.com/AymanOmara/wirdi/releases/download/recitation-fastconformer-v1/'
QA_URL = 'https://github.com/cpfair/quran-align/releases/download/release-2016-11-24/quran-align-data-2016-11-24.zip'
PACK_URL = 'https://github.com/alamgirabdullahgh/daily-ruqyah/releases/download/audio-pack-32k-120/s%03d.zip'


def _get(url):
    with urllib.request.urlopen(url, timeout=180) as r:
        return r.read()


def cmd_setup(a):
    os.makedirs('/tmp/work', exist_ok=True)
    if not os.path.exists('/tmp/work/repo'):
        os.symlink(ROOT, '/tmp/work/repo')  # পুরনো স্ক্রিপ্টগুলো এই পথ ধরে
    os.makedirs('/tmp/ctc', exist_ok=True)
    for f in ('model.int8.onnx', 'tokens.txt'):
        p = '/tmp/ctc/' + f
        if not os.path.exists(p):
            print('নামাচ্ছি', f); open(p, 'wb').write(_get(MODEL_BASE + f))
    if not os.path.exists('/tmp/qa0/Alafasy_128kbps.json'):
        os.makedirs('/tmp/qa0', exist_ok=True)
        z = zipfile.ZipFile(io.BytesIO(_get(QA_URL)))
        for n in z.namelist():
            if n.endswith('Alafasy_128kbps.json'):
                open('/tmp/qa0/Alafasy_128kbps.json', 'wb').write(z.read(n))
    os.makedirs(PACK, exist_ok=True)
    surahs = range(1, 115) if a.surahs == 'all' else [int(x) for x in a.surahs.split(',')]
    for s in surahs:
        z = zipfile.ZipFile(io.BytesIO(_get(PACK_URL % s)))
        for n in z.namelist():
            if n.endswith('.mp3'):
                open(os.path.join(PACK, os.path.basename(n)), 'wb').write(z.read(n))
        print('প্যাক সূরা', s, 'ঠিক')
    print('setup শেষ')


def _keys(ks):
    out = []
    for k in ks:
        s, ay, rg = k.split(':'); lo, hi = map(int, rg.split('-'))
        out.append((int(s), int(ay), lo, hi))
    return out


def _wcount(s, ay):
    return len(json.load(open(f'{ROOT}/data/quran-chunks/a/{s}.json', encoding='utf-8'))[ay - 1].split(' '))


def cmd_measure(a):
    sys.path.insert(0, H)
    import measure3 as M3
    cuts = [[s, ay, lo, hi, _wcount(s, ay)] for s, ay, lo, hi in _keys(a.keys)]
    for r in M3.run(cuts, a.out):
        print(r['key'], r.get('start'), r.get('end'), 'সন্দেহ:' + ','.join(r['suspect']) if r['suspect'] else 'ঠিক')


def cmd_refine(a):
    sys.path.insert(0, H)
    import refine as RF
    m = json.load(open(a.measure))
    res = json.load(open(a.out)) if os.path.exists(a.out) else {}
    for r in m:
        if a.keys and r['key'] not in a.keys:
            continue
        st, en, b = RF.refine(r, wide=a.wide)
        inf = {k: float(v) for k, v in (b[1] or {}).items()}
        res[r['key']] = dict(start=st, end=en, sc=round(float(b[0]), 2), info=inf)
        print(r['key'], st, en, res[r['key']]['sc'], inf)
        json.dump(res, open(a.out, 'w'), ensure_ascii=False)


def cmd_verify(a):
    sys.path.insert(0, H)
    import verify_cuts as V
    s, ay, lo, hi = _keys([a.key])[0]
    l, f, nd, ne = V.check(s, ay, lo, hi, a.start, a.end)
    print(f'শেষ-শব্দ মিল={l} প্রথম-শব্দ মিল={f} শোনা-শব্দ={nd} চাওয়া-শব্দ={ne}',
          '→ ঠিক' if l >= 0.5 and f >= 0.5 else '→ কানে যাচাই লাগবে')


def cmd_clip(a):
    import numpy as np, soundfile as sf
    sys.path.insert(0, H)
    import align_lib as L
    s, ay, lo, hi = _keys([a.key])[0]
    x = L.load(s, ay); seg = x[int(a.start * L.SR):int(a.end * L.SR)].copy()
    n = int(0.006 * L.SR); seg[:n] *= np.linspace(0, 1, n); seg[-n:] *= np.linspace(1, 0, n)  # অ্যাপের মতো ৬ মি.সে. ফেড
    sf.write(a.out, np.clip(seg, -.97, .97), L.SR); print('লেখা হলো', a.out, round(len(seg) / L.SR, 2), 'সে.')


def cmd_apply(a):
    p = f'{ROOT}/data/audio-cuts.json'
    cuts = json.load(open(p, encoding='utf-8'))
    new = json.load(open(a.file))
    if isinstance(new, list):  # measure/refine-এর আউটপুট: [{key,start,end,...}]
        new = {r['key']: {'start': r['start'], 'end': r['end']} for r in new if r.get('start') is not None and r.get('end') is not None and not r.get('suspect')}
    add = {k: [round(v['start'], 3), round(v['end'], 3)] if isinstance(v, dict) else [round(v[0], 3), round(v[1], 3)] for k, v in new.items()}
    cuts['cuts'].update(add)
    json.dump(cuts, open(p, 'w', encoding='utf-8'), ensure_ascii=False)
    print(len(add), 'চাবি যোগ; মোট', len(cuts['cuts']), '— এখন app.js/sw.js/index.html-এর ভার্সন বাড়াও (README ধাপ ৪)')


def cmd_status(a):
    d = json.load(open(os.path.join(H, 'organ-pending.json'), encoding='utf-8'))
    cuts = json.load(open(f'{ROOT}/data/audio-cuts.json', encoding='utf-8'))['cuts']
    left = [k for k in d.get('verses_not_cut', []) if not any(c.startswith(k + ':') for c in cuts)]
    print('বাকি আয়াত:', left or 'নেই')


def cmd_packcheck(a):
    import subprocess
    sys.path.insert(0, H)
    import align_lib as L
    qa = {(x['surah'], x['ayah']): x['segments'] for x in json.load(open('/tmp/qa0/Alafasy_128kbps.json'))}
    bad = []
    for (s, ay), seg in sorted(qa.items()):
        if a.surahs != 'all' and s not in [int(v) for v in a.surahs.split(',')]:
            continue
        f = f'{PACK}/{L.g(s, ay)}.mp3'
        if not os.path.exists(f):
            continue
        d = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], capture_output=True, text=True).stdout.strip() or 0)
        exp = seg[-1][3] / 1000 / 1.2  # শেষ শব্দের শেষ, গতি ×১.২
        if d < exp * 0.85:
            bad.append((f'{s}:{ay}', round(d, 1), round(exp, 1)))
    print('কেটে-ছোট ফাইল (আয়াত, আছে সে., থাকার কথা সে.):', bad or 'নেই')


def main():
    p = argparse.ArgumentParser(description=__doc__ or '', formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = p.add_subparsers(dest='c', required=True)
    x = sp.add_parser('setup'); x.add_argument('--surahs', default='2'); x.set_defaults(f=cmd_setup)
    x = sp.add_parser('measure'); x.add_argument('out'); x.add_argument('keys', nargs='+', help='সূরা:আয়াত:শুরু-শেষ'); x.set_defaults(f=cmd_measure)
    x = sp.add_parser('refine'); x.add_argument('measure'); x.add_argument('out'); x.add_argument('keys', nargs='*'); x.add_argument('--wide', action='store_true'); x.set_defaults(f=cmd_refine)
    x = sp.add_parser('verify'); x.add_argument('key'); x.add_argument('start', type=float); x.add_argument('end', type=float); x.set_defaults(f=cmd_verify)
    x = sp.add_parser('clip'); x.add_argument('key'); x.add_argument('start', type=float); x.add_argument('end', type=float); x.add_argument('out'); x.set_defaults(f=cmd_clip)
    x = sp.add_parser('apply'); x.add_argument('file'); x.set_defaults(f=cmd_apply)
    x = sp.add_parser('packcheck'); x.add_argument('--surahs', default='2'); x.set_defaults(f=cmd_packcheck)
    x = sp.add_parser('status'); x.set_defaults(f=cmd_status)
    a = p.parse_args(); a.f(a)


if __name__ == '__main__':
    main()
