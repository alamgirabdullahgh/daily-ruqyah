#!/usr/bin/env python3
# ব্যবহার: python3 tools/novel/flowreport.py [--all]   — টোকেন খরচ ছাড়া, সেকেন্ডে ২৩১ অধ্যায়ের প্রবাহ-ছাঁকনি।
# এটা মান মাপে না; শুধু প্রবাহ ভাঙার সন্ধানী চিহ্ন দেখায়: (ক) ১২০০+ অক্ষরের ঠাসা অনুচ্ছেদ যার শুরুতে [দৃশ্য-সূচনা] নেই,
# (খ) ২৫০০+ অক্ষরের অধ্যায় মাত্র ১ অনুচ্ছেদে। [ব্র্যাকেট] শিরোনাম না থাকা দোষ নয়: ফাঁকা লাইন-ভাগও দৃশ্য। সীমাগুলো আন্দাজি, সিদ্ধান্ত মালিকের।
import glob,re,sys
rows=[];tot_c=0;tot_w=0
for f in sorted(glob.glob('novel/prose/[0-9][0-9][0-9].md')):
    n=int(f[-6:-3]); T=open(f,encoding='utf8').read()
    P=[p.strip() for p in re.split(r'\n\s*\n',T) if p.strip()]
    sc=sum(1 for p in P if p.startswith('['))
    dense=[len(p) for p in P if len(p)>=1200 and not p.startswith('[')]
    chars=sum(len(p) for p in P); words=len(T.split()); tot_c+=chars; tot_w+=words
    flag=[]
    if dense: flag.append(f'ঠাসা অনুচ্ছেদ {len(dense)}টি (সর্বোচ্চ {max(dense)} অক্ষর)')
    if chars>=2500 and len(P)==1: flag.append('২৫০০+ অক্ষর, মাত্র ১ অনুচ্ছেদ')
    rows.append((n,chars,len(P),sc,max((len(p) for p in P),default=0),flag))
bad=[r for r in rows if r[5]]
big=sorted(rows,key=lambda r:-r[1])[:5]
print('সবচেয়ে বড় ৫ অধ্যায় (বইয়ের অংশ): '+', '.join(f'{r[0]}={r[1]*100//tot_c}%' for r in big))
print(f'অধ্যায় {len(rows)}টি; মোট শব্দ ≈ {tot_w}; জোরে পড়লে ≈ {tot_w//130//60} ঘণ্টা ({tot_w//130} মিনিট, ১৩০ শব্দ/মিনিট)')
print(f'চিহ্ন পাওয়া অধ্যায়: {len(bad)}টি; চিহ্নহীন: {len(rows)-len(bad)}টি')
for r in (bad if '--all' in sys.argv else bad[:40]):
    print(f'  {r[0]:>3}: {r[1]:>6} অক্ষর, অনুচ্ছেদ {r[2]}, দৃশ্য {r[3]} — '+'; '.join(r[5]))
if not '--all' in sys.argv and len(bad)>40: print(f'  … আরও {len(bad)-40}টি (--all দিয়ে সব)')
