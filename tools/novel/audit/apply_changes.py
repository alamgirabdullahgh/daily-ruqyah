# changes.md-এর "যোগ: ঘটনা N ← সূরা:আয়াত" সারিগুলো quran_events_minified.md-এর ওই ঘটনার ব্র্যাকেটের শেষে যোগ করে।
# একই আয়াত আগে থেকে থাকলে বসায় না (আবার চালালেও নিরাপদ)।
import re, sys
D=str.maketrans('০১২৩৪৫৬৭৮৯','0123456789'); B=str.maketrans('0123456789','০১২৩৪৫৬৭৮৯')
chart='quran_events_minified.md'
lines=open(chart,encoding='utf-8').read().split('\n')
def expand(tok):
    m=re.match(r'(\d+):(\d+)(?:-(\d+))?$',tok.translate(D))
    if not m: return set()
    s,a,b=int(m[1]),int(m[2]),int(m[3] or m[2]); return {(s,i) for i in range(a,b+1)}
def verses(line):
    out=set()
    for tok in re.findall(r'[০-৯]+:[০-৯]+(?:-[০-৯]+)?',line): out|=expand(tok)
    return out
before=set().union(*[verses(l) for l in lines if re.match(r'[০-৯]+\.',l)])
added=0
for r in open('tools/novel/audit/changes.md',encoding='utf-8'):
    m=re.match(r'যোগ: ঘটনা ([০-৯]+) ← ([০-৯]+:[০-৯]+(?:-[০-৯]+)?)',r)
    if not m: continue
    n,ref=m[1],m[2]
    for i,l in enumerate(lines):
        if l.startswith(n+'.'):
            if expand(ref)<=verses(l): print('আছে:',n,ref); break
            if l.rstrip().endswith(')'): lines[i]=l.rstrip()[:-1]+', '+ref+')'
            else: lines[i]=l.rstrip()+' ('+ref+')'  # ব্র্যাকেট না থাকলে নতুন ব্র্যাকেট
            added+=1; print('যোগ:',n,ref); break
    else: print('ঘটনা পাওয়া যায়নি',n); sys.exit(1)
open(chart,'w',encoding='utf-8').write('\n'.join(lines))
after=set().union(*[verses(l) for l in lines if re.match(r'[০-৯]+\.',l)])
print('মোট আলাদা আয়াত আগে',len(before),'পরে',len(after),'বসানো',added,'নতুন আয়াত',len(after-before))
