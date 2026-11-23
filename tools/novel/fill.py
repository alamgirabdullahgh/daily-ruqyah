#!/usr/bin/env python3
# ব্যবহার: fill.py [অধ্যায়-নং...] — ঘটনার তালিকার যে আয়াত গদ্যে নেই, তালিকার ক্রম অনুযায়ী আগের আয়াতের পরে
# আয়াতের অনুবাদ হুবহু (সূরা:আয়াত) সহ বসায়। কোনো আয়াত বাদ যাবে না — মালিকের নীতি।
import re,sys,json
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
def ordered(spec):
    out=[];seen=set()
    for t in re.findall(r'[০-৯]+:[০-৯]+(?:-[০-৯]+)?',spec):
        s,r=tolat(t).split(':');a,b=(r.split('-') if '-' in r else (r,r))
        for v in range(int(a),int(b)+1):
            if (int(s),v) not in seen: seen.add((int(s),v));out.append((int(s),v))
    return out
GRP=re.compile(r'\(([^()]*[০-৯]+:[০-৯]+[^()]*)\)')
def present(p):
    have=set()
    for m in GRP.finditer(p): have|=set(ordered(m.group(1).replace('–','-')))
    return have
def clean(t):
    t=re.sub(r'\s+',' ',t).strip()
    return t[:-1] if t.endswith(('।','.')) else t
want=[int(x) for x in sys.argv[1:]] or sorted(L)
total=0
for n in want:
    rest=re.sub(r'\s*\[[^\]]*\]','',L[n])
    refs=rest.rsplit(' — ',1)[1] if ' — ' in rest else ''
    order=ordered(refs)
    f=f'novel/prose/{n:03d}.md'
    try: p=open(f,encoding='utf-8').read()
    except FileNotFoundError: p=''
    have=present(p)
    miss=[v for v in order if v not in have]
    if not miss: continue
    for v in miss:
        i=order.index(v)
        sent=f'{clean(bnv(*v))} ({tobn(v[0])}:{tobn(v[1])})।'
        pos=None
        # পরের যে আয়াত গদ্যে আছে, তার প্রথম অবস্থান — এর আগেই বসাতে হবে
        nxt=None
        for k in range(i+1,len(order)):
            if order[k] in have:
                for m in GRP.finditer(p):
                    if order[k] in set(ordered(m.group(1).replace('–','-'))): nxt=m.start();break
                if nxt is not None: break
        j=i-1
        while j>=0:
            a=order[j]
            cands=[]
            for m in GRP.finditer(p):
                if a in set(ordered(m.group(1).replace('–','-'))):
                    e=m.end()
                    while e<len(p) and p[e] in '।?!"”’': e+=1
                    cands.append(e)
            if cands:
                ok=[e for e in cands if nxt is None or e<=nxt]
                pos=(ok[-1] if ok else cands[0]);break
            j-=1
        if pos is None:
            p=sent+' '+p if p else sent+'\n'
        else:
            p=p[:pos]+' '+sent+p[pos:]
    open(f,'w',encoding='utf-8').write(p)
    total+=len(miss); print(f'{n}: {len(miss)}টি আয়াত যোগ')
print('মোট যোগ:',total)
