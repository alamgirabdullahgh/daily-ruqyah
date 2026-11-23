#!/usr/bin/env python3
# decisions.tsv (আয়াত<TAB>ঘটনা-নং) অনুযায়ী quran_events_minified.md-র ঘটনার ব্র্যাকেটে আয়াত যোগ করে।
import re,collections
bn='০১২৩৪৫৬৭৮৯'
tobn=lambda s:''.join(bn[int(c)] if c.isdigit() else c for c in str(s))
tolat=lambda s:''.join(str(bn.index(c)) if c in bn else c for c in s)
add=collections.defaultdict(list)
for l in open('tools/audit2/decisions.tsv',encoding='utf-8'):
    l=l.strip()
    if not l: continue
    ref,ev=l.split('\t'); add[int(ev)].append(tobn(ref))
P='quran_events_minified.md'
lines=open(P,encoding='utf-8').read().split('\n'); out=[]
for l in lines:
    m=re.match(r'^([০-৯]+)\. ',l)
    if m and int(tolat(m.group(1))) in add:
        n=int(tolat(m.group(1))); ex=', '.join(add[n])
        i=l.find('[')
        head,tail=(l[:i].rstrip(),' '+l[i:]) if i>=0 else (l,'')
        if '—' not in head: head+=' — '+ex
        elif head.endswith(')'): head=head[:-1]+', '+ex+')'
        else: head+=' ('+ex+')'
        l=head+tail
    out.append(l)
open(P,'w',encoding='utf-8').write('\n'.join(out))
print('events touched',len(add),'refs',sum(len(v) for v in add.values()))
