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
SN=['আল-ফাতিহা', 'আল-বাকারা', 'আলে ইমরান', 'আন-নিসা', 'আল-মায়িদা', 'আল-আনআম', 'আল-আরাফ', 'আল-আনফাল', 'আত-তাওবা', 'ইউনুস', 'হূদ', 'ইউসুফ', 'আর-রাদ', 'ইবরাহীম', 'আল-হিজর', 'আন-নাহল', 'বনী ইসরাঈল', 'আল-কাহফ', 'মারইয়াম', 'ত্বোয়া-হা', 'আল-আম্বিয়া', 'আল-হজ্জ', 'আল-মুমিনূন', 'আন-নূর', 'আল-ফুরকান', 'আশ-শুআরা', 'আন-নামল', 'আল-কাসাস', 'আল-আনকাবূত', 'আর-রূম', 'লুকমান', 'আস-সাজদা', 'আল-আহযাব', 'সাবা', 'ফাতির', 'ইয়াসীন', 'আস-সাফফাত', 'সোয়াদ', 'আয-যুমার', 'গাফির', 'ফুসসিলাত', 'আশ-শূরা', 'আয-যুখরুফ', 'আদ-দুখান', 'আল-জাসিয়া', 'আল-আহকাফ', 'মুহাম্মাদ', 'আল-ফাতহ', 'আল-হুজুরাত', 'ক্বাফ', 'আয-যারিয়াত', 'আত-তূর', 'আন-নাজম', 'আল-ক্বামার', 'আর-রহমান', 'আল-ওয়াক্বিয়া', 'আল-হাদীদ', 'আল-মুজাদালা', 'আল-হাশর', 'আল-মুমতাহিনা', 'আস-সাফ', 'আল-জুমুআ', 'আল-মুনাফিকূন', 'আত-তাগাবুন', 'আত-তালাক', 'আত-তাহরীম', 'আল-মুলক', 'আল-কলম', 'আল-হাক্কাহ', 'আল-মাআরিজ', 'নূহ', 'আল-জিন', 'আল-মুযযাম্মিল', 'আল-মুদ্দাসসির', 'আল-ক্বিয়ামাহ', 'আদ-দাহর', 'আল-মুরসালাত', 'আন-নাবা', 'আন-নাযিআত', 'আবাসা', 'আত-তাকভীর', 'আল-ইনফিতার', 'আল-মুতাফফিফীন', 'আল-ইনশিকাক', 'আল-বুরূজ', 'আত-তারিক', "আল-আ'লা", 'আল-গাশিয়া', 'আল-ফাজর', 'আল-বালাদ', 'আশ-শামস', 'আল-লাইল', 'আদ-দুহা', 'আলাম নাশরাহ', 'আত-তীন', 'আল-আলাক', 'আল-কদর', 'আল-বাইয়্যিনাহ', 'আয-যিলযাল', 'আল-আদিয়াত', 'আল-কারিআহ', 'আত-তাকাসুর', 'আল-আসর', 'আল-হুমাযাহ', 'আল-ফীল', 'কুরাইশ', 'আল-মাউন', 'আল-কাওসার', 'আল-কাফিরূন', 'আন-নাসর', 'আল-লাহাব', 'আল-ইখলাস', 'আল-ফালাক', 'আন-নাস']
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
        out.append('\n**কুরআনের বর্ণনা:**\n')
        for (s,v) in vs:
            total+=1
            if (s,v) in seen:
                out.append(f'- ({tobn(s)}:{tobn(v)} — আগে অধ্যায় {tobn(seen[(s,v)])}-এ এসেছে)'); continue
            seen[(s,v)]=n; shown+=1
            a,b=verse(s,v)
            out.append(f'\n{b.strip()} **({SN[s-1]} {tobn(s)}:{tobn(v)})**\n')
    hd=f'# কুরআন-ভিত্তিক ধারাবাহিক উপন্যাস (অধ্যায় {tobn(lo)}–{tobn(min(hi,len(lines)))})\n\nপ্রতিটি আয়াত তার প্রথম আসার জায়গায় বাংলা অর্থসহ আছে; প্রতিটির পেছনে বন্ধনীতে সূরার নাম ও আয়াত-নম্বর। একই আয়াত পরে এলে শুধু ক্রস-রেফারেন্স।\n'
    open(f'{R}/novel/novel.md','w',encoding='utf-8').write(hd+'\n'.join(out)+'\n')
    print('আয়াত-সারি',total,'পূর্ণ পাঠসহ',shown,'গদ্যহীন অধ্যায়',len(noprose))
main()
