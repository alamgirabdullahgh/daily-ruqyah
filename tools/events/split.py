#!/usr/bin/env python3
# সূচি (quran_events_minified.md) থেকে দুটি ফাইল বানায় ও যান্ত্রিক যাচাই করে:
#   quran_event_verses.md      — ঘটনার আয়াত (ঘটনা ধরে: মূল আয়াত + ব্র্যাকেটের সমপর্যায়)
#   quran_non_event_verses.md  — অঘটনার আয়াত (সূচির বাইরের সব আয়াত, সূরা ধরে)
# চালানো: python3 tools/events/split.py   (রিপোর মূল ফোল্ডার থেকে)
import re,json,sys
bn='০১২৩৪৫৬৭৮৯'
tolat=lambda s:''.join(str(bn.index(c)) if c in bn else c for c in s)
tobn=lambda s:''.join(bn[int(c)] if c.isdigit() else c for c in str(s))
B={};A={}
def ld(d,s):
    return json.load(open(f'data/quran-chunks/{d}/{s}.json',encoding='utf-8'))
for s in range(1,115): B[s]=ld('b',s); A[s]=ld('a',s)
TOTAL=sum(len(B[s]) for s in B)
events=[]; errors=[]
for l in open('quran_events_minified.md',encoding='utf-8').read().split('\n'):
    m=re.match(r'^([০-৯]+)\. (.*)$',l)
    if not m: continue
    n=int(tolat(m.group(1))); rest=m.group(2)
    title,refs=rest.rsplit(' — ',1) if ' — ' in rest else (rest,'')
    main,_,br=refs.partition(' (')
    br=br.rstrip(')')
    def parse(spec):
        out=[]
        for t in re.findall(r'[০-৯]+:[০-৯]+(?:-[০-৯]+)?',spec):
            s,r=tolat(t).split(':'); a,b=(r.split('-') if '-' in r else (r,r)); s=int(s);a=int(a);b=int(b)
            if s<1 or s>114 or a<1 or b<a or b>len(B[s]): errors.append(f'ঘটনা {n}: অবৈধ রেফারেন্স {t}'); continue
            out+= [(s,v) for v in range(a,b+1)]
        return out
    mv=parse(main); bv=parse(br)
    if not mv: errors.append(f'ঘটনা {n}: মূল আয়াত নেই')
    events.append((n,title.strip(),mv,bv))
nums=[e[0] for e in events]
if nums!=list(range(1,len(nums)+1)): errors.append('ঘটনা-নম্বরে ফাঁক/ক্রমভঙ্গ')
inev={}
for n,t,mv,bv in events:
    for k in mv+bv: inev.setdefault(k,[]).append(n)
allv=[(s,v) for s in range(1,115) for v in range(1,len(B[s])+1)]
non=[k for k in allv if k not in inev]
def fmt(s,v): return f'{tobn(s)}:{tobn(v)}'
with open('quran_event_verses.md','w',encoding='utf-8') as f:
    f.write(f'# ঘটনার আয়াত ({len(events)}টি ঘটনা, {len(inev)}টি আলাদা আয়াত)\n\nসূচি: quran_events_minified.md। প্রতিটি ঘটনায় মূল আয়াত, তারপর সমপর্যায়ের আয়াত। একই আয়াত একাধিক ঘটনায় থাকলে প্রতিবার দেখানো হয়েছে।\nতৈরি: `python3 tools/events/split.py`\n\n')
    for n,t,mv,bv in events:
        f.write(f'## {tobn(n)}. {t}\n\n**মূল আয়াত**\n\n')
        for s,v in mv: f.write(f'- [{fmt(s,v)}] {A[s][v-1].strip()} — {B[s][v-1].strip()}\n')
        if bv:
            f.write('\n**সমপর্যায়ের আয়াত**\n\n')
            for s,v in bv: f.write(f'- [{fmt(s,v)}] {A[s][v-1].strip()} — {B[s][v-1].strip()}\n')
        f.write('\n')
with open('quran_non_event_verses.md','w',encoding='utf-8') as f:
    f.write(f'# অঘটনার আয়াত ({len(non)}টি)\n\nঘটনার সূচিতে নেই এমন সব আয়াত (বিধান, উপদেশ, তাওহীদ, দোয়া, সাধারণ আখিরাত-বর্ণনা ইত্যাদি)। সূরা ধরে সাজানো।\nতৈরি: `python3 tools/events/split.py`\n\n')
    cur=None
    for s,v in non:
        if s!=cur: f.write(f'\n## সূরা {tobn(s)}\n\n'); cur=s
        f.write(f'- [{fmt(s,v)}] {A[s][v-1].strip()} — {B[s][v-1].strip()}\n')
# যান্ত্রিক যাচাই
if len(inev)+len(non)!=TOTAL: errors.append('যোগফল মেলেনি')
dup=sum(1 for k,x in inev.items() if len(set(x))>1)
print(f'মোট আয়াত {TOTAL}; ঘটনার {len(inev)}; অঘটনার {len(non)}; যোগফল {"✓" if len(inev)+len(non)==TOTAL else "✗"}')
print(f'ঘটনা {len(events)}টি; একাধিক ঘটনায় থাকা আয়াত {dup}')
print('ত্রুটি:',len(errors)); [print(' ',e) for e in errors]
sys.exit(1 if errors else 0)
