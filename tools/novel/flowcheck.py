#!/usr/bin/env python3
# পাস ৩ (প্রবাহ/ভাষা মসৃণ করা) পাহারাদার। ব্যবহার:
#   flowcheck.py --init        # (একবারই) বর্তমান গদ্য থেকে প্রতি অধ্যায়ের আয়াত-তালিকা বেসলাইনে রাখে
#   flowcheck.py <নং>...       # অধ্যায়ের আয়াত বেসলাইনের সাথে মেলায়: বাদ পড়লে ✗, বাড়তি এলে ✗ (আয়াতে ভিত্তি নেই)
#   flowcheck.py --all         # সব অধ্যায় + কোন অধ্যায় পাস ৩-এ সম্পন্ন (audit/pass3_done.txt) তা দেখায়
import re,sys,json,glob,os
bn='০১২৩৪৫৬৭৮৯'
tolat=lambda s:''.join(str(bn.index(c)) if c in bn else c for c in s)
BASE='tools/novel/audit/baseline_verses.json'; DONE='tools/novel/audit/pass3_done.txt'
def verses(text):
    out=set()
    for g in re.findall(r'\(([^()]*[০-৯]+:[০-৯]+[^()]*)\)',text):
        for t in re.findall(r'[০-৯]+:[০-৯]+(?:[-–][০-৯]+)?',g):
            s,r=tolat(t).split(':'); a,b=(re.split('[-–]',r)+[r])[:2] if re.search('[-–]',r) else (r,r)
            for v in range(int(a),int(b)+1): out.add(f'{int(s)}:{v}')
    return out
def prose(n): return open(f'novel/prose/{int(n):03d}.md',encoding='utf-8').read()
def uncited(text):
    # শেষ রেফারেন্সের পরে বাড়তি লেখা, বা ৬০০+ অক্ষরের রেফারেন্সহীন টুকরো
    refs=list(re.finditer(r'\([^()]*[০-৯]+:[০-৯]+[^()]*\)',text)); bad=[]
    if not refs: return ['কোনো রেফারেন্স নেই']
    if len(text[refs[-1].end():].strip(' \n।'))>3: bad.append('শেষে রেফারেন্সহীন লেখা')
    prev=0
    for m in refs:
        if m.start()-prev>600: bad.append(f'{m.start()-prev} অক্ষর রেফারেন্সহীন')
        prev=m.end()
    return bad
if sys.argv[1]=='--init':
    if os.path.exists(BASE): sys.exit('বেসলাইন আছে; বদলাবে না')
    b={f'{n}':sorted(verses(prose(n))) for n in range(1,232)}
    json.dump(b,open(BASE,'w'),ensure_ascii=False); print('বেসলাইন',sum(len(v) for v in b.values()),'আয়াত-সারি'); sys.exit()
B=json.load(open(BASE)); done=set(open(DONE).read().split()) if os.path.exists(DONE) else set()
ns=range(1,232) if sys.argv[1]=='--all' else map(int,sys.argv[1:]); bad=0
for n in ns:
    cur=verses(prose(n)); base=set(B[str(n)]); miss=base-cur; extra=cur-base; u=uncited(prose(n))
    if miss or extra or u:
        bad+=1; print(f'✗ {n}: বাদ {sorted(miss)[:8]} বাড়তি {sorted(extra)[:8]} {u}')
    elif sys.argv[1]!='--all': print(f'✓ {n}: আয়াত অবিকৃত ({len(cur)})')
if sys.argv[1]=='--all': print('পাস ৩ সম্পন্ন অধ্যায়:',len(done),'/ ২৩১; সমস্যা:',bad)
