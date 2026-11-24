#!/usr/bin/env python3
# ব্যবহার: prune.py [--apply] [অধ্যায়...] — গদ্য থেকে ওই অধ্যায়ের সূচিতে-নেই-এমন আয়াতের বাক্য সরায় (ওভারল্যাপ দূর)।
# শুধু সেই বাক্যই সরে, যার সব রেফারেন্স বাড়তি; মিশ্র বাক্য হাতে ঠিক করার জন্য দেখায়।
import sys,re
sys.path.insert(0,'tools/novel')
import overlap as o
L=o.load(); apply='--apply' in sys.argv
ch=[int(a) for a in sys.argv[1:] if a.isdigit()] or sorted(L)
REF=re.compile(r'\(([^()]*[০-৯]+:[০-৯]+[^()]*)\)')
def cites(s):
    v=set()
    for m in REF.finditer(s): v|=o.verses(m.group(1).replace('–','-'))
    return v
for n in ch:
    need=o.verses(L[n].rsplit(' — ',1)[1])
    path=f'novel/prose/{n:03d}.md'; p=open(path,encoding='utf-8').read()
    allc=cites(p); extra={v for v in allc if v not in need}
    if not extra: continue
    paras=p.split('\n\n'); out=[]; mixed=[]; drops=0
    UR=re.compile(r'\([^()]*[০-৯]+:[০-৯]+[^()]*\)[।?!]*"?\s*')
    for para in paras:
        units=[]; pos=0
        for m in UR.finditer(para):
            units.append(para[pos:m.end()]); pos=m.end()
        if para[pos:].strip(): units.append(para[pos:])
        keep=[]
        for u in units:
            c=cites(u)
            if c and c<=extra: drops+=1; continue
            if c&extra: mixed.append(u)
            keep.append(u)
        if keep: out.append(''.join(keep).strip())
    print(f'== {n}: বাড়তি {len(extra)}, সরবে {drops}, মিশ্র {len(mixed)}')
    for s_ in mixed: print('   মিশ্র>',s_[:400])
    if apply and not mixed:
        open(path,'w',encoding='utf-8').write('\n\n'.join(out).rstrip('\n')+'\n')
