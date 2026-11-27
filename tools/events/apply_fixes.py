# -*- coding: utf-8 -*-
# সিদ্ধান্ত (হাতে-পড়া INDEX_READ.md থেকে নেওয়া) প্রয়োগের সহায়ক: বাদ দেওয়া (অ-ঘটনা) ও সরানো (অন্য ঘটনায়)।
import re, sys, shutil
B='০১২৩৪৫৬৭৮৯'
def bn2i(s): return int(''.join(str(B.index(c)) for c in s))
def i2bn(n): return ''.join(B[int(c)] for c in str(n))
TOK=re.compile(r'([০-৯]+):([০-৯]+)(?:-([০-৯]+))?')
def parse(spec):
    out=[]
    for m in TOK.finditer(spec):
        s=bn2i(m.group(1)); a=bn2i(m.group(2)); b=bn2i(m.group(3)) if m.group(3) else a
        out.append((s,a,b))
    return out
def fmt(t):
    s,a,b=t
    return f"{i2bn(s)}:{i2bn(a)}" if a==b else f"{i2bn(s)}:{i2bn(a)}-{i2bn(b)}"
def sub(toks,rem):
    res=[];hit=0
    for (s,a,b) in toks:
        ov=[r for r in rem if r[0]==s and r[1]<=b and r[2]>=a]
        if not ov: res.append((s,a,b)); continue
        cur=[(a,b)]
        for r in ov:
            nxt=[]
            for (x,y) in cur:
                if r[2]<x or r[1]>y: nxt.append((x,y)); continue
                hit+=min(y,r[2])-max(x,r[1])+1
                if x<r[1]: nxt.append((x,r[1]-1))
                if y>r[2]: nxt.append((r[2]+1,y))
            cur=nxt
        res+= [(s,x,y) for x,y in cur]
    return res,hit
def load(path):
    L=open(path,encoding='utf-8').read().split('\n'); ev={}
    for i,l in enumerate(L):
        m=re.match(r'^([০-৯]+)\. (.*?) — (.*)$',l)
        if m: ev[bn2i(m.group(1))]=i
    return L,ev
def split_line(l):
    m=re.match(r'^(.*? — )([^ (]+)(?: \((.*)\))?$',l)
    return m.group(1),parse(m.group(2)),parse(m.group(3) or '')
def join_line(pre,main,rest):
    return pre+', '.join(fmt(t) for t in main)+((' ('+', '.join(fmt(t) for t in rest)+')') if rest else '')
def run(path,removals,moves,logf):
    L,ev=load(path); log=[]
    for n,spec in removals.items():
        i=ev[n]; pre,main,rest=split_line(L[i]); rem=parse(spec)
        rest2,hit=sub(rest,rem); main2,hm=sub(main,rem)
        if hm: log.append(f"! ঘটনা {n}: মূল আয়াত ছোঁয়া হয়নি/মিলেছে: {spec}"); main2=main
        L[i]=join_line(pre,main,rest2)
        want=sum(r[2]-r[1]+1 for r in rem)
        log.append(f"বাদ ঘটনা {n}: {spec} (সূচিতে পাওয়া {hit}/{want} আয়াত)")
    for (src,dst,spec) in moves:
        rem=parse(spec); i=ev[src]; pre,main,rest=split_line(L[i])
        rest2,hit=sub(rest,rem); L[i]=join_line(pre,main,rest2)
        j=ev[dst]; pre2,main2,rest3=split_line(L[j]); rest3+= rem
        L[j]=join_line(pre2,main2,rest3)
        want=sum(r[2]-r[1]+1 for r in rem)
        log.append(f"সরানো ঘটনা {src} → {dst}: {spec} (সূচিতে পাওয়া {hit}/{want})")
    open(path,'w',encoding='utf-8').write('\n'.join(L))
    open(logf,'w',encoding='utf-8').write('# সূচি-বদলের লগ (apply_fixes.py)\n\n'+'\n'.join('- '+x for x in log)+'\n')
