#!/usr/bin/env python3
# ব্যবহার: show.py <ঘটনা-নং>... — গদ্য ও ঘটনার আয়াত (অনুবাদসহ) দেখায়।
import re,sys,json
sys.argv_=sys.argv
R='.'
bn='০১২৩৪৫৬৭৮৯'
tolat=lambda s:''.join(str(bn.index(c)) if c in bn else c for c in s)
tobn=lambda s:''.join(bn[int(c)] if c.isdigit() else c for c in str(s))
L={}
for l in open('quran_events_minified.md',encoding='utf-8').read().split('\n'):
    m=re.match(r'^([০-৯]+)\. (.*)$',l)
    if m: L[int(tolat(m.group(1)))]=m.group(2)
B={}
def bnv(s,v):
    if s not in B: B[s]=json.load(open(f'data/quran-chunks/b/{s}.json',encoding='utf-8'))
    return B[s][v-1].strip()
for n in map(int,sys.argv[1:]):
    rest=re.sub(r'\s*\[[^\]]*\]','',L[n]); title,refs=rest.rsplit(' — ',1) if ' — ' in rest else (rest,'')
    print(f'===== {n}: {title}')
    print('গদ্য:',open(f'novel/prose/{n:03d}.md',encoding='utf-8').read().strip())
    seen=set()
    for t in re.findall(r'[০-৯]+:[০-৯]+(?:-[০-৯]+)?',refs):
        s,r=tolat(t).split(':');a,b=(r.split('-') if '-' in r else (r,r))
        for v in range(int(a),int(b)+1):
            if (s,v) in seen: continue
            seen.add((s,v)); print(f'  [{s}:{v}] {bnv(int(s),v)[:150]}')
