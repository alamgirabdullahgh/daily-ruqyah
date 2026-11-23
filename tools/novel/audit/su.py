#!/usr/bin/env python3
# ব্যবহার: su.py <সূরা-নং>... — ওই সূরার সূচির-বাইরের আয়াত (পূর্ণ অনুবাদসহ) দেখায়।
# প্রতিটি আয়াতের আগে-পরের সূচিভুক্ত আয়াতের ঘটনা-নং দেখায়, যেন সমপর্যায় ধরা সহজ হয়।
import re,json,sys
bn='০১২৩৪৫৬৭৮৯'
tolat=lambda s:''.join(str(bn.index(c)) if c in bn else c for c in s)
ev=[l for l in open('quran_events_minified.md',encoding='utf-8').read().split('\n') if re.match(r'^[০-৯]+\. ',l)]
idx={};title={}
for l in ev:
    n=int(tolat(re.match(r'^([০-৯]+)\.',l).group(1)));title[n]=l.split(' — ')[0].split('. ',1)[1]
    for t in re.findall(r'[০-৯]+:[০-৯]+(?:-[০-৯]+)?',l.split(' — ',1)[1]):
        s,r=tolat(t).split(':');a,b=(r.split('-') if '-' in r else (r,r))
        for v in range(int(a),int(b)+1): idx.setdefault((int(s),v),[]).append(n)
for s in map(int,sys.argv[1:]):
    d=json.load(open(f'data/quran-chunks/b/{s}.json',encoding='utf-8'))
    print(f'##### সূরা {s} ({len(d)} আয়াত)')
    run=[]
    def flush():
        global run
        if not run: return
        a,b=run[0],run[-1]
        prev=idx.get((s,a-1));nxt=idx.get((s,b+1))
        print(f'-- {s}:{a}-{b} | আগে ঘটনা {prev} | পরে ঘটনা {nxt}')
        for v in run: print(f'  [{s}:{v}] {d[v-1].strip()}')
        run=[]
    for v in range(1,len(d)+1):
        if (s,v) in idx: flush()
        else: run.append(v)
    flush()
