#!/usr/bin/env python3
# কুরআনের ৬,২৩৬ আয়াতের প্রতিটি হয় ঘটনা-সূচিতে (quran_events_minified.md) আছে, নয়তো tools/audit2/not_in_index.tsv-তে (লেখাসহ)।
# যাচাই: দুই তালিকা মিলে ঠিক ৬,২৩৬, কোনো আয়াত দুই তালিকায় নয়, কোনো আয়াত অনুপস্থিত নয়, সূচিতে অবৈধ রেফারেন্স নেই।
# চালানো: python3 tools/audit2/verify_coverage.py
import re,json,sys
bn='০১২৩৪৫৬৭৮৯'
lat=lambda s:''.join(str(bn.index(c)) if c in bn else c for c in s)
C={int(k):v['total'] for k,v in json.load(open('tools/novel/audit/surah_counts.json')).items()}
allv={(s,a) for s in C for a in range(1,C[s]+1)}
cov=set();bad=[];events=0
for ln in lat(open('quran_events_minified.md',encoding='utf-8').read()).split('\n'):
    m=re.match(r'^(\d+)\. (.*)$',ln)
    if not m: continue
    events+=1
    body=m.group(2).split(' — ',1)[1] if ' — ' in m.group(2) else ''
    for mm in re.finditer(r'(\d+):(\d+)(?:-(\d+))?',body):
        s,a=int(mm.group(1)),int(mm.group(2)); b=int(mm.group(3) or a)
        for x in range(a,b+1):
            (cov.add((s,x)) if (s,x) in allv else bad.append((s,x)))
out=set(); noText=0
for l in open('tools/audit2/not_in_index.tsv',encoding='utf-8'):
    r,t=l.rstrip('\n').split('\t',1); s,a=map(int,r.split(':')); out.add((s,a)); noText+= (t.strip() in ('','?'))
print('মোট আয়াত',len(allv),'| ঘটনা',events,'| সূচিতে',len(cov),'| সূচির বাইরে',len(out))
print('দুই তালিকায় একসাথে',len(cov&out),'| অনুপস্থিত',len(allv-cov-out),'| অবৈধ রেফারেন্স',len(bad),'| লেখাহীন সারি',noText)
ok=len(cov)+len(out)==len(allv) and not(cov&out) and not(allv-cov-out) and not bad and not noText
print('ফল:', 'পাস ✅' if ok else 'ব্যর্থ ❌'); sys.exit(0 if ok else 1)
