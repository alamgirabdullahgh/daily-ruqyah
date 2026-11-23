#!/usr/bin/env python3
# ব্যবহার: addref.py <ঘটনা-নং> <সূরা:আয়াত>... — ঘটনার ব্র্যাকেটে আয়াত যোগ (রেকর্ড: tools/audit2/added.tsv)
import re,sys
bn='০১২৩৪৫৬৭৮৯'
tobn=lambda s:''.join(bn[int(c)] if c.isdigit() else c for c in str(s))
tolat=lambda s:''.join(str(bn.index(c)) if c in bn else c for c in s)
n=int(sys.argv[1]); ex=', '.join(tobn(x) for x in sys.argv[2:])
P='quran_events_minified.md'; out=[]
for l in open(P,encoding='utf-8').read().split('\n'):
    m=re.match(r'^([০-৯]+)\. ',l)
    if m and int(tolat(m.group(1)))==n:
        i=l.find('['); head,tail=(l[:i].rstrip(),' '+l[i:]) if i>=0 else (l,'')
        head=head[:-1]+', '+ex+')' if head.endswith(')') else head+' ('+ex+')'
        l=head+tail
    out.append(l)
open(P,'w',encoding='utf-8').write('\n'.join(out))
open('tools/audit2/added.tsv','a',encoding='utf-8').write(f"{n}\t{' '.join(sys.argv[2:])}\n")
