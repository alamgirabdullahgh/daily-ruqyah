#!/usr/bin/env python3
# ব্যবহার: check.py [অধ্যায়-নং...] — ঘটনার আয়াত-তালিকার কোন আয়াত গদ্যে রেফারেন্স হিসেবে নেই, তা দেখায়।
import re,sys
bn='০১২৩৪৫৬৭৮৯'
tolat=lambda s:''.join(str(bn.index(c)) if c in bn else c for c in s)
L={}
for l in open('quran_events_minified.md',encoding='utf-8').read().split('\n'):
    m=re.match(r'^([০-৯]+)\. (.*)$',l)
    if m: L[int(tolat(m.group(1)))]=m.group(2)
def verses(spec):
    out=set()
    for t in re.findall(r'[০-৯]+:[০-৯]+(?:-[০-৯]+)?',spec):
        s,r=tolat(t).split(':');a,b=(r.split('-') if '-' in r else (r,r))
        for v in range(int(a),int(b)+1): out.add((int(s),v))
    return out
want=[int(x) for x in sys.argv[1:]] or sorted(L)
tot=0
for n in want:
    rest=re.sub(r'\s*\[[^\]]*\]','',L[n])
    refs=rest.rsplit(' — ',1)[1] if ' — ' in rest else ''
    need=verses(refs)
    try: p=open(f'novel/prose/{n:03d}.md',encoding='utf-8').read()
    except FileNotFoundError: p=''
    have=set()
    for m in re.finditer(r'\(([০-৯]+:[০-৯]+(?:[-–][০-৯]+)?(?:[,،] *[০-৯]+:?[০-৯]*)*)\)',p):
        have|=verses(m.group(1).replace('–','-'))
    miss=sorted(need-have)
    tot+=len(miss)
    if miss: print(f'{n}: বাদ {len(miss)} — '+', '.join(f'{s}:{v}' for s,v in miss[:40])+(' …' if len(miss)>40 else ''))
print('মোট বাদ পড়া আয়াত:',tot)
