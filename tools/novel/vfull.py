#!/usr/bin/env python3
# ব্যবহার: vfull.py সূরা:আয়াত ... — আয়াতের পূর্ণ অনুবাদ দেখায়।
import sys,json
for a in sys.argv[1:]:
    s,v=map(int,a.split(':'))
    d=json.load(open(f'data/quran-chunks/b/{s}.json',encoding='utf-8'))
    print(f'[{s}:{v}] {d[v-1].strip()}')
