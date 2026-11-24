#!/usr/bin/env python3
# ব্যবহার: overlap.py [--prose] — সূচিতে (মূল+ব্র্যাকেট) এবং গদ্যে একই আয়াত একাধিক অধ্যায়ে থাকলে দেখায়।
import re,sys,collections
bn='০১২৩৪৫৬৭৮৯'
tolat=lambda s:''.join(str(bn.index(c)) if c in bn else c for c in s)
def verses(spec):
    out=set()
    for t in re.findall(r'[০-৯]+:[০-৯]+(?:[-–][০-৯]+)?',spec):
        s,r=tolat(t).split(':');a,b=(re.split('[-–]',r) if re.search('[-–]',r) else (r,r))
        for v in range(int(a),int(b)+1): out.add((int(s),v))
    return out
def load():
    L={}
    for l in open('quran_events_minified.md',encoding='utf-8').read().split('\n'):
        m=re.match(r'^([০-৯]+)\. (.*)$',l)
        if m: L[int(tolat(m.group(1)))]=m.group(2)
    return L
if __name__=='__main__':
    L=load(); own=collections.defaultdict(list)
    for n,t in L.items():
        refs=t.split(' — ',1)[1] if ' — ' in t else ''
        for v in verses(refs): own[v].append(n)
    d={v:ns for v,ns in own.items() if len(ns)>1}
    print('সূচিতে ওভারল্যাপ করা আয়াত:',len(d))
    if '--prose' in sys.argv:
        pv=collections.defaultdict(list)
        for n in L:
            try: p=open(f'novel/prose/{n:03d}.md',encoding='utf-8').read()
            except FileNotFoundError: continue
            have=set()
            for m in re.finditer(r'\(([^()]*[০-৯]+:[০-৯]+[^()]*)\)',p): have|=verses(m.group(1))
            for v in have: pv[v].append(n)
        dp={v:ns for v,ns in pv.items() if len(ns)>1}
        print('গদ্যে ওভারল্যাপ করা আয়াত:',len(dp))
    if '-v' in sys.argv:
        for v,ns in sorted(d.items())[:400]: print(f'{v[0]}:{v[1]} -> {ns}')
