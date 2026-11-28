import json,re,unicodedata,sys
D='/home/claude/daily-ruqyah/data/'
ORG=json.load(open('/tmp/org.json',encoding='utf-8'))
roots=json.load(open(D+'quran-roots.json',encoding='utf-8'))['roots']
MARKS=re.compile(r'[\u0610-\u061A\u064B-\u065F\u06D6-\u06ED\u0640]')
def nz(s,dag=False):
    s=s.replace('\u0670','ا' if dag else '');s=MARKS.sub('',s)
    s=re.sub('[أإآٱ]','ا',s).replace('ؤ','و').replace('ئ','ي').replace('ى','ي').replace('ة','ه')
    return re.sub('[^\u0621-\u064A]','',s)
nfc=lambda s:unicodedata.normalize('NFC',s)
lk=lambda s:re.sub('[اويء]','',nz(s))
lessAl=lambda s:s[2:] if len(s)>3 and s.startswith('ال') else s
R=[]
for r,fs in roots:
    forms=[dict(t=t,l=l,m=m or '',p=p or '',refs=refs.split(','),k1=nz(t,1),k2=nz(t),k3=lk(t),kl=nz(l)) for t,l,refs,m,p in fs]
    R.append(dict(r=r,rn=nz(r),r3=lk(r),forms=forms))
def search(q):
    out=[]
    for r in R:
        sc=0;mf=None
        if r['rn']==q: sc=100
        else:
            ex=[f for f in r['forms'] if f['k1']==q or f['k2']==q or lessAl(f['k1'])==q or lessAl(f['k2'])==q]
            if ex: sc=80;mf=ex
            elif len(q)>=2 and q in r['rn']: sc=60
            elif len(q)>=2:
                p=[f for f in r['forms'] if q in f['k1'] or q in f['k2']]
                if p: sc=40;mf=p
                else:
                    l=[f for f in r['forms'] if q in f['kl']]
                    if l: sc=30;mf=l
        if sc: out.append(dict(r=r,sc=sc,mf=mf))
    if not out:
        q3=lk(q)
        if len(q3)>=2:
            for r in R:
                sc=0;mf=None
                if r['r3']==q3: sc=50
                else:
                    p=[f for f in r['forms'] if q3 in f['k3']]
                    if p: sc=35;mf=p
                if sc: out.append(dict(r=r,sc=sc,mf=mf,loose=1))
    return out
def applyFl(items,fl):
    m=re.compile(nfc(fl['m'])) if fl.get('m') else None
    x=re.compile(nfc(fl['x'])) if fl.get('x') else None
    vs=str(fl['v']).split('|') if fl.get('v') else None
    out=[]
    for it in items:
        if it['sc']!=100: continue
        mf=[f for f in it['r']['forms'] if (not m or m.search(nfc(f['m']))) and (not x or not x.search(nfc(f['m']))) and (not fl.get('p') or f['p']==fl['p'])]
        if vs: mf=[dict(f,refs=[r for r in f['refs'] if ':'.join(r.split(':')[:2]) in vs]) for f in mf]; mf=[f for f in mf if f['refs']]
        if mf: out.append(dict(r=it['r'],sc=80,mf=mf))
    return out
def term_set(pp):
    t=pp[1];fl=pp[2] if len(pp)>2 else None
    q=nz(t)
    if not q: return None  # Bengali term: cannot port
    items=search(q) if len(q)>=2 else []
    if fl and items: items=applyFl(items,fl)
    u=set()
    for it in items:
        L=it['r']['forms'] if (it['sc']==100 or it['sc']==60 or not it['mf']) else it['mf']
        for f in L:
            for r in f['refs']: u.add(':'.join(r.split(':')[:2]))
    return u
BN={}
for s in range(1,115):
    b=json.load(open(f'{D}quran-chunks/b/{s}.json',encoding='utf-8'))
    for i,t in enumerate(b,1): BN[f'{s}:{i}']=nfc(re.sub('[\u200c\u200d]','',t))
SUF=r'(?:ে|ের|র|য়|কে|ও|েও|রও|েরও|গুলো|গুলোর|গুলোকে|গুলোতে|গুলোও|সমূহ|সমূহের|সমূহে|সমুহ|তে|দের|দেরকে|েরকে|ায়|ার|ারা|ায়ও|য়ের|য়ে|য়েও)?'
STEMS={
'মাথা':['মাথা','মস্তক','শিরঃ'],
'চুল':['চুল','কেশ','লোম'],
'কপাল':['কপাল','ললাট'],
'চেহারা (মুখমণ্ডল)':['চেহারা','মুখমণ্ডল','মুখমন্ডল','মুখ'],
'মুখের ভেতর (মুখগহ্বর)':['মুখ','মুখগহ্বর'],
'জিহ্বা':['জিহ্বা','জিহবা','রসনা','জবান','জিব'],
'ঠোঁট':['ঠোঁট','ওষ্ঠ','অধর'],
'দাঁত':['দাঁত','দন্ত'],
'চোখ':['চোখ','চক্ষু','নয়ন','দৃষ্টি','আঁখি'],
'কান':['কান','কর্ণ','শ্রবণ'],
'নাক':['নাক','নাসিকা'],
'গাল':['গাল'],
'চিবুক':['চিবুক','থুতনি'],
'ঘাড় ও গলা':['ঘাড়','গলা','গর্দান','গ্রীবা'],
'কণ্ঠনালী ও কণ্ঠার হাড়':['কণ্ঠনালী','কন্ঠনালী','কণ্ঠ','কন্ঠ','কণ্ঠার','গলনালী'],
'ধমনী':['ধমনী','ধমনি'],
'বুক ও বক্ষ':['বুক','বক্ষ','বক্ষঃ','বক্ষদেশ'],
'অন্তর (হৃদয়)':['অন্তর','হৃদয়','অন্তঃকরণ','অন্তকরণ','কলব'],
'পেট':['পেট','উদর','জঠর'],
'পিঠ ও মেরুদণ্ড':['পিঠ','পৃষ্ঠ','পৃষ্ঠদেশ','মেরুদণ্ড','মেরুদন্ড','ঔরস'],
'পার্শ্বদেশ':['পার্শ্ব','পাঁজর'],
'হাত':['হাত','হস্ত','করতল'],
'বাহু ও বগল':['বাহু','বগল','বাহুমূল'],
'আঙুল':['আঙ্গুল','আঙুল','অঙ্গুলি','অঙ্গুলী'],
'পা':['=পা','=পায়ে','=পায়ের','=পাগুলো','=পাকে','=পাদুটো','=পাসমূহ','=পাগুলোর','পদযুগল','পিণ্ডলী','পিন্ডলি'],
'গোড়ালি':['গোড়ালি','গোঁড়ালি','গোড়ালী'],
'চামড়া (ত্বক)':['চামড়া','ত্বক','চর্ম'],
'হাড়':['হাড়','অস্থি','অস্তি','মজ্জা'],
'মাংস':['মাংস','গোশত','গোস্ত'],
'রক্ত':['রক্ত'],
'লজ্জাস্থান':['লজ্জাস্থান','গুপ্তাঙ্গ','যৌনাঙ্গ','সতীত্ব','গোপনাঙ্গ'],
'গর্ভ (জরায়ু)':['গর্ভ','জরায়ু','গর্ভাশয়'],
'অন্ত্র ও নাড়িভুঁড়ি':['অন্ত্র','নাড়িভুঁড়ি','নাড়ীভুড়ি','নাড়িভুড়ি'],
'দাড়ি':['দাড়ি','শ্মশ্রু'],
}
FALSE={'53:49','15:19'}  # শিরা = নক্ষত্র (লুব্ধক), অঙ্গ নয়
def kw_set(stems):
    pats=[re.compile('^'+re.escape(nfc(s[1:]))+'$') if s.startswith('=') else re.compile('^'+re.escape(nfc(s))+SUF+'$') for s in stems]
    out=set()
    for k,t in BN.items():
        for tok in re.findall(r'[\u0980-\u09FF]+',t):
            if any(p.match(tok) for p in pats): out.add(k);break
    return out
key=lambda k:tuple(map(int,k.split(':')))
res={}
for o in ORG:
    name=o[0];subs=o[2]
    app=set();bn_term=False
    for pp in subs:
        u=term_set(pp)
        if u is None: bn_term=True
        else: app|=u
    kw=kw_set(STEMS[name])-FALSE
    miss=sorted(kw-app,key=key)
    res[name]=dict(app=len(app),kw=len(kw),miss=miss,bn_term=bn_term)
json.dump(res,open('/tmp/w/extras.json','w'),ensure_ascii=False)
for n,r in res.items(): print(n,'| অ্যাপে',r['app'],'| শব্দ-আয়াত',r['kw'],'| বাদ',len(r['miss']),'| বাংলা-শব্দ-এন্ট্রি' if r['bn_term'] else '')

