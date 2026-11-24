#!/usr/bin/env python3
# ব্যবহার: para.py <অধ্যায়> list            — অনুচ্ছেদ-তালিকা (দৈর্ঘ্য, আয়াত-সীমা)
#          para.py <অধ্যায়> show <i>        — অনুচ্ছেদ i দেখায়
#          para.py <অধ্যায়> set <i> < নতুন  — আয়াত-তালিকা হুবহু মিললে তবেই বদলায় (নইলে ✗, কিছু বদলায় না)
import re,sys
bn='০১২৩৪৫৬৭৮৯'
tolat=lambda s:''.join(str(bn.index(c)) if c in bn else c for c in s)
def verses(text):
    out=set()
    for g in re.findall(r'\(([^()]*[০-৯]+:[০-৯]+[^()]*)\)',text):
        for t in re.findall(r'[০-৯]+:[০-৯]+(?:[-–][০-৯]+)?',g):
            s,r=tolat(t).split(':'); a,b=(re.split('[-–]',r)+[r])[:2] if re.search('[-–]',r) else (r,r)
            for v in range(int(a),int(b)+1): out.add((int(s),v))
    return out
n=int(sys.argv[1]); p=f'novel/prose/{n:03d}.md'; T=open(p,encoding='utf-8').read(); P=T.rstrip('\n').split('\n')
c=sys.argv[2]
if c=='list':
    for i,x in enumerate(P):
        v=sorted(verses(x)); print(i,len(x),f'{v[0][0]}:{v[0][1]}..{v[-1][0]}:{v[-1][1]}' if v else '-',len(v))
elif c=='show': print(P[int(sys.argv[3])])
elif c=='set':
    i=int(sys.argv[3]); new=sys.stdin.read().strip()
    if verses(new)!=verses(P[i]): 
        print('✗ আয়াত মেলেনি: বাদ',sorted(verses(P[i])-verses(new))[:10],'বাড়তি',sorted(verses(new)-verses(P[i]))[:10]); sys.exit(1)
    P[i]=new; open(p,'w',encoding='utf-8').write('\n'.join(P)+'\n'); print('✓ অনুচ্ছেদ',i,'বদলানো হলো')
