#!/usr/bin/env python3
# কুরআন-ভিত্তিক ধারাবাহিক উপন্যাস বিল্ডার।
# quran_events_minified.md-এর ঘটনা-ক্রম অনুযায়ী প্রতিটি অধ্যায়ে (ক) novel/prose/<ঘটনা-নং>.md-এর গদ্য-কাহিনী,
# (খ) ঘটনার সব আয়াত (আরবি + বাংলা) স্ক্রিপ্ট নিজেই বসায়। গদ্য না থাকলেও আয়াত বাদ যায় না।
# ব্যবহার: python3 tools/novel/build.py [শুরু-ঘটনা] [শেষ-ঘটনা]  -> novel/novel.md
import re,json,sys,os
R=os.path.join(os.path.dirname(__file__),'..','..')
bn='০১২৩৪৫৬৭৮৯'
tolat=lambda s:''.join(str(bn.index(c)) if c in bn else c for c in s)
tobn=lambda s:''.join(bn[int(c)] if c.isdigit() else c for c in str(s))
AR={};BN={}
def verse(s,v):
    if s not in AR:
        AR[s]=json.load(open(f'{R}/data/quran-chunks/a/{s}.json',encoding='utf-8'))
        BN[s]=json.load(open(f'{R}/data/quran-chunks/b/{s}.json',encoding='utf-8'))
    return AR[s][v-1],BN[s][v-1]
def parse(line):
    m=re.match(r'^([০-৯]+)\. (.*)$',line); n=int(tolat(m.group(1))); rest=m.group(2)
    # [নোট] সরিয়ে ভাগ করি
    notes=re.findall(r'\[[^\]]*\]',rest); clean=re.sub(r'\s*\[[^\]]*\]','',rest)
    title,refs=clean.rsplit(' — ',1) if ' — ' in clean else (clean,'')
    toks=re.findall(r'[০-৯]+:[০-৯]+(?:-[০-৯]+)?',refs)
    return n,title.strip(),notes,toks
def expand(t):
    s,r=tolat(t).split(':'); a,b=(r.split('-') if '-' in r else (r,r))
    return [(int(s),v) for v in range(int(a),int(b)+1)]
def main():
    lo=int(sys.argv[1]) if len(sys.argv)>1 else 1; hi=int(sys.argv[2]) if len(sys.argv)>2 else 10**6
    lines=[l for l in open(f'{R}/quran_events_minified.md',encoding='utf-8').read().split('\n') if l.strip()]
    seen={}; out=[]; total=0; shown=0; noprose=[]
    for line in lines:
        n,title,notes,toks=parse(line)
        vs=[]
        for t in toks:
            for x in expand(t):
                if x not in vs: vs.append(x)
        if n<lo or n>hi:
            for x in vs: seen.setdefault(x,n)
            continue
        out.append(f'\n\n# অধ্যায় {tobn(n)}: {title}\n')
        for nt in notes: out.append(f'*{nt.strip("[]")}*\n')
        pp=f'{R}/novel/prose/{n:03d}.md'
        if os.path.exists(pp): out.append(open(pp,encoding='utf-8').read().strip()+'\n')
        else: noprose.append(n)
        out.append('\n**এই অধ্যায়ের আয়াত:**\n')
        for (s,v) in vs:
            total+=1
            if (s,v) in seen:
                out.append(f'- ({tobn(s)}:{tobn(v)} — আগে অধ্যায় {tobn(seen[(s,v)])}-এ এসেছে)'); continue
            seen[(s,v)]=n; shown+=1
            a,b=verse(s,v)
            out.append(f'\n> **{tobn(s)}:{tobn(v)}** — {a}\n>\n> {b}\n')
    hd=f'# কুরআন-ভিত্তিক ধারাবাহিক উপন্যাস (অধ্যায় {lo}–{min(hi,len(lines))})\n\nপ্রতিটি আয়াত তার প্রথম আসার জায়গায় পূর্ণ পাঠসহ আছে; পরে এলে ক্রস-রেফারেন্স।\n'
    open(f'{R}/novel/novel.md','w',encoding='utf-8').write(hd+'\n'.join(out)+'\n')
    print('আয়াত-সারি',total,'পূর্ণ পাঠসহ',shown,'গদ্যহীন অধ্যায়',len(noprose))
main()
