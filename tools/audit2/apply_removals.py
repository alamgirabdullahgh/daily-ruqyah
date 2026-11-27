#!/usr/bin/env python3
# removals.tsv (আয়াত<TAB>ঘটনা) অনুযায়ী ওই ঘটনার মূল/ব্র্যাকেট থেকে আয়াত সরায় (রেঞ্জ ভেঙে);
# যে আয়াত আর কোনো ঘটনায় নেই সেগুলো not_in_index.tsv-তে (লেখাসহ) যোগ করে।
import re,json,collections
bn='০১২৩৪৫৬৭৮৯'
lat=lambda s:''.join(str(bn.index(c)) if c in bn else c for c in s)
tobn=lambda s:''.join(bn[int(c)] if c.isdigit() else c for c in str(s))
B={s:json.load(open(f'data/quran-chunks/b/{s}.json',encoding='utf-8')) for s in range(1,115)}
rem=collections.defaultdict(set)
for l in open('tools/audit2/removals.tsv',encoding='utf-8'):
    r,e=l.strip().split('\t'); s,a=r.split(':'); a,b=(a.split('-') if '-' in a else (a,a))
    for v in range(int(a),int(b)+1): rem[int(e)].add((int(s),v))
TOK=re.compile(r'[০-৯]+:[০-৯]+(?:-[০-৯]+)?')
def cut(spec,rs,done):
    def f(m):
        s,a=lat(m.group(0)).split(':'); a,b=(a.split('-') if '-' in a else (a,a)); s,a,b=int(s),int(a),int(b)
        vs=[v for v in range(a,b+1)]; hit=[v for v in vs if (s,v) in rs]
        if not hit: return m.group(0)
        for v in hit: done.add((s,v))
        keep=[v for v in vs if (s,v) not in rs]; parts=[]; i=0
        while i<len(keep):
            j=i
            while j+1<len(keep) and keep[j+1]==keep[j]+1: j+=1
            parts.append(f'{tobn(s)}:{tobn(keep[i])}' + (f'-{tobn(keep[j])}' if j>i else '')); i=j+1
        return ', '.join(parts)
    r=TOK.sub(f,spec)
    r=re.sub(r'(, )+',', ',r).strip(', ').replace('(, ','(')
    return r
lines=open('quran_events_minified.md',encoding='utf-8').read().split('\n'); out=[]; missing=[]; empt=[]
for l in lines:
    m=re.match(r'^([০-৯]+)\. (.*)$',l)
    if not m or int(lat(m.group(1))) not in rem: out.append(l); continue
    n=int(lat(m.group(1))); rest=m.group(2); rs=rem[n]; done=set()
    title,refs=rest.rsplit(' — ',1)
    main,_,br=refs.partition(' (')
    br=br.rstrip(')')
    main2=cut(main,rs,done); br2=cut(br,rs,done)
    if not main2.strip():
        # মূল আয়াত নিঃশেষ: ব্র্যাকেটের প্রথম আয়াত মূল হবে
        t=TOK.findall(br2)
        if not t: empt.append(n); out.append(l); continue
        first=t[0]; br2=br2.replace(first,'',1); br2=re.sub(r'^[, ]+','',br2); main2=first
        if '-' in first and False: pass
    missing+= [(n,s,v) for (s,v) in rs-done]
    nl=f'{m.group(1)}. {title} — {main2}'+(f' ({br2})' if br2.strip() else '')
    out.append(nl)
open('quran_events_minified.md','w',encoding='utf-8').write('\n'.join(out))
print('অনুপস্থিত (ঘটনায় ছিলই না):',len(missing),missing[:40]); print('মূল নিঃশেষ:',empt)
# এখন কোন আয়াত সূচির বাইরে গেল
cov=set()
for ln in lat(open('quran_events_minified.md',encoding='utf-8').read()).split('\n'):
    mm=re.match(r'^(\d+)\. (.*)$',ln)
    if not mm or ' — ' not in mm.group(2): continue
    for x in re.finditer(r'(\d+):(\d+)(?:-(\d+))?',mm.group(2).split(' — ',1)[1]):
        s,a=int(x.group(1)),int(x.group(2)); b=int(x.group(3) or a)
        for v in range(a,b+1): cov.add((s,v))
old=[l.split('\t')[0] for l in open('tools/audit2/not_in_index.tsv',encoding='utf-8').read().split('\n') if l]
oldset={tuple(map(int,r.split(':'))) for r in old}
allr=set().union(*rem.values())
new=sorted(k for k in allr if k not in cov and k not in oldset)
with open('tools/audit2/not_in_index.tsv','a',encoding='utf-8') as f:
    pass
rows=[l for l in open('tools/audit2/not_in_index.tsv',encoding='utf-8').read().split('\n') if l]
for s,v in new: rows.append(f'{s}:{v}\t{B[s][v-1].strip()}')
rows.sort(key=lambda r:tuple(map(int,r.split('\t')[0].split(':'))))
open('tools/audit2/not_in_index.tsv','w',encoding='utf-8').write('\n'.join(rows)+'\n')
print('নতুন সূচির বাইরে:',len(new),'; মোট সূচির বাইরে:',len(rows))
