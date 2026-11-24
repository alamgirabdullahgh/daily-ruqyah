#!/usr/bin/env python3
# সূচিতে ওভারল্যাপ দূর: প্রতিটি আয়াত ঠিক একটি ঘটনায় রাখে (মালিকের নিয়ম ২০২৬-১১-২৪)।
import re,sys
sys.path.insert(0,'tools/novel')
import overlap as o
bn='০১২৩৪৫৬৭৮৯'
tobn=lambda n:''.join(bn[int(c)] for c in str(n))
# ঘটনা -> সরানো আয়াত (বর্ণনা: কোন আয়াত অন্য কোন ঘটনায় থাকছে)
R={
15:['2:36'],18:['2:37'],132:['3:46'],160:['3:123','3:172-174'],
10:['7:14-17'],11:['7:16-17'],71:['7:113-126','26:38-51','28:38','43:55'],
139:['9:30'],28:['11:42-44'],29:['11:44'],62:['12:93'],225:['17:97','25:12'],
151:['19:71-72','23:86'],74:['20:71-73'],2:['81:20'],
52:[],51:['26:189'],66:['28:8-9'],53:['38:13'],72:['40:36-37'],
191:['48:1-3'],175:['48:15-21'],176:[],177:['48:18'],4:['66:6','79:1-5'],
25:['71:23'],5:['72:1'],33:['91:14'],98:['2:248'],
}
# 26:90-102 ধরা থাকবে 39-এ; 225 থেকে সরাও
R[225]+=['26:90-102']
def parse(line):
    m=re.match(r'^([০-৯]+)\. (.*?) — (.*)$',line)
    return m
def render(vs):
    vs=sorted(vs); out=[]; i=0
    while i<len(vs):
        j=i
        while j+1<len(vs) and vs[j+1]==(vs[j][0],vs[j][1]+1): j+=1
        a,b=vs[i],vs[j]
        out.append(f'{tobn(a[0])}:{tobn(a[1])}' if i==j else f'{tobn(a[0])}:{tobn(a[1])}-{tobn(b[1])}')
        i=j+1
    return out
def strip(refs,rm):
    m=re.match(r'^(.*?)(?: \((.*)\))?$',refs)
    main=m.group(1); br=m.group(2).split(', ') if m.group(2) else []
    toks=[main]+br; new=[]
    for t in toks:
        vs=o.verses(t); keep=sorted(v for v in vs if v not in rm)
        if keep: new+=render(keep) if len(vs)!=len(keep) else [t]
    return new[0]+(' ('+', '.join(new[1:])+')' if len(new)>1 else '') if new else ''
lines=open('quran_events_minified.md',encoding='utf-8').read().split('\n')
for k,idx in enumerate(lines):
    m=re.match(r'^([০-৯]+)\. ',idx)
    if not m: continue
    n=int(o.tolat(m.group(1)))
    if n in R and R[n]:
        rm=set()
        for s in R[n]: rm|=o.verses(''.join(bn[int(c)] if c.isdigit() else c for c in s))
        head,refs=lines[k].split(' — ')[0:1][0], lines[k].split(' — ',1)[1]
        # নামে ' — ' থাকলে শেষটাই রেফ
        parts=lines[k].rsplit(' — ',1); head,refs=parts
        lines[k]=head+' — '+strip(refs,rm)
open('quran_events_minified.md','w',encoding='utf-8').write('\n'.join(lines))
