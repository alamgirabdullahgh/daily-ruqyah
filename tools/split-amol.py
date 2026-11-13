# amol-guide.json (বইয়ের মূল লেখা, অপরিবর্তিত) -> amol-struct.json (লক্ষণ / রেসপন্স / ট্রিটমেন্ট-ধাপ)
# নিয়ম-ভিত্তিক ভাগ: প্রতিটি অনুচ্ছেদ হুবহু রাখা হয়, শুধু কোথায় যাবে তা ঠিক হয়। হাতে-লেখা (c-hari, c-putul) বদলায় না।
import json,re,sys
D=json.load(open('data/amol-guide.json',encoding='utf-8'))
S=json.load(open('data/amol-struct.json',encoding='utf-8'))
HAND={'c-hari','c-putul'}
END=re.compile(r'[।?!:;)\]”"\'॥]\s*$');LIST=re.compile(r'^\s*([0-9০-৯]+\s*[.)।\-–:]|[-–—•*●▪◦]\s|সূরা\s)')
def paras(pages):
    out=[];cur=None
    for pg in pages:
        for l in pg.replace('\r','').split('\n'):
            l=re.sub(r'\s+',' ',l).strip()
            if not l:
                if cur is not None: out.append(cur);cur=None
                continue
            if cur is None: cur=l;continue
            if not END.search(cur) and len(cur)>=25 and not LIST.search(l): cur+=' '+l
            else: out.append(cur);cur=l
    if cur is not None: out.append(cur)
    return out
HEAD=re.compile(r'^(ধাপ|দিন|পদ্ধতি|পর্ব|রুটিন|সময়|কাজ|সতর্কতা|নিয়ম|ফলাফল|প্রথম|দ্বিতীয়|তৃতীয়|চতুর্থ|শর্ত|[০-৯]+\s*(ধাপ|দিন|টা|টি))')
def is_head(p): return len(p)<=70 and (bool(HEAD.search(p)) or p.endswith(':') or p.endswith('ঃ'))
SYM=re.compile(r'^(রোগীর\s*)?(আলামত|লক্ষণ|লক্ষন)|কীভাবে বুঝবেন|বুঝবেন')
RESP=re.compile(r'আলামত|রুকইয়াহ শুনলে|স্বপ্নে|স্বপ্ন|প্রতিক্রিয়া|বমি|কান্না|ঝাঁকুনি|অজ্ঞান|কাঁপ|লাফ|বুঝতে পারবেন|চিৎকার|হাই ওঠ|ঢেকুর')
DO=re.compile(r'পড়|বার\b|ফুঁ|লিখ|মাখ|খাও|গোসল|ছিটা|রাখু|দিন\b|করুন|করবেন|নিন\b')
MUD=re.compile(r'মুদাব্বির|মুদাব্বীর|হাদিয়া|টাকা নেন|টাকা নিবেন|টাকা নেবেন|টাকা নিলে|টাকা নিতে|ফি নিবেন|ফি নেবেন|সম্মানি')
DEF={'b1a':'sym','b2c':'sym','b1d:যাদুকরকে':'sym','b2b:যাদুর রোগী কত':'resp'}
def defcls(cid,t):
    for k,v in DEF.items():
        a,_,b=k.partition(':')
        if a==cid and (not b or t.startswith(b)): return v
    return 'treat'
def conv(cond):
    out={'sym':[],'resp':[],'treat':[],'mud':[]}
    multi=len(cond['items'])>1
    for ref in cond['items']:
        it=[c for c in D['cats'] if c['id']==ref[0]][0]['items'][ref[1]]
        dc=defcls(ref[0],it['t']);cur={'sym':None,'resp':None,'treat':None,'mud':None}
        if 'steps' in it:  # আগে হাতে সাজানো
            for st in it['steps']:
                k='resp' if 'আলামত' in st['h'] else 'treat'
                out[k].append(st)
            continue
        started=False;h=None
        def put(k,p,h):
            if cur[k] is None or (h is not None and cur[k].get('_h')!=h):
                b={'h':(h or ('📖 '+it['t'] if multi else '')),'p':[],'_h':h}
                out[k].append(b);cur[k]=b
            cur[k]['p'].append(p)
        for p in paras(it['pages']):
            if is_head(p) and not MUD.search(p):
                h=p
                stepish=bool(re.match(r'^(ধাপ|দিন|পদ্ধতি|চাবি|কাজ|রুটিন|[০-৯]+\s*(ধাপ|দিন))',p))
                if stepish: started=True
                for k in cur: cur[k]=None
                # শিরোনাম নিজেই একটি ব্লক খোলে
                k=defcls(ref[0],it['t'])
                if not started and k=='treat': k='sym'
                if SYM.search(p): k='sym'
                out[k].append({'h':h,'p':[],'_h':h});cur[k]=out[k][-1]
                continue
            if MUD.search(p): k='mud'
            elif not started and not (DO.search(p) and re.search(r'বার\b|পড়',p)) and dc=='treat': k='sym'
            elif SYM.search(p) and not started: k='sym'
            elif dc=='sym': k='treat' if (DO.search(p) and re.search(r'বার\b|পড়',p)) else 'sym'
            elif dc=='resp': k='treat' if (DO.search(p) and re.search(r'বার\b|পড়',p)) else 'resp'
            elif started and RESP.search(p) and not (DO.search(p) and re.search(r'বার\b|পড়ু|পড়ে',p)): k='resp'
            elif not started and SYM.search(p): k='sym'
            else: k='treat'
            put(k,p,cur[k]['_h'] if cur[k] else None)
    for k in out:
        out[k]=[{kk:vv for kk,vv in b.items() if kk!='_h'} for b in out[k] if b.get('p') or b.get('ol') or b.get('ul') or b.get('h')]
        for b in out[k]:
            if not b['h']: b.pop('h')
    return out
def norm(x): return re.sub(r'\s+','',x)
allok=True
for cond in D['conds']:
    cid=cond['id']
    if cid in HAND: continue
    o=conv(cond)
    if cid=='c-kobor':  # এই অংশ বইয়ে আগের লেখার (পুতুল) শেষ পাতায় ছিল; এখানে আনা হলো
        o['sym'].insert(0,{'h':'কবর ও মাটির চালান — পরিচয় ও আলামত','p':['এটা সবচেয়ে সেনসিটিভ, ভয় পাবেন না, ভয় [স্ক্যানে অস্পষ্ট] ধরবে।','আলামত: দিন দিন শুকায়, কালো হয়, চোখ গর্তে, সারাক্ষণ মৃত্যুর কথা, কান্না, স্বপ্নে কবর, কাফন, মরা মানুষ ডাকে - “আয়, আয়” | শরীরে মাটির গন্ধ, কবরের মাটির গন্ধ']})
    S['conds'][cid]={k:v for k,v in o.items() if v}
    # কিছু-হারায়-না যাচাই
    src=''.join(norm(p) for ref in cond['items'] for it in [[c for c in D['cats'] if c['id']==ref[0]][0]['items'][ref[1]]] if 'steps' not in it for p in paras(it['pages']))
    got=''.join(norm(' '.join(b.get('p',[]))+b.get('h','')) for k in o for b in o[k])
    ok=sorted(src)==sorted(src) and all(norm(p) in got for ref in cond['items'] for it in [[c for c in D['cats'] if c['id']==ref[0]][0]['items'][ref[1]]] if 'steps' not in it for p in paras(it['pages']))
    n={k:sum(len(b.get('p',[])) for b in v) for k,v in o.items()}
    print(cid,'OK' if ok else 'MISSING',n); allok&=ok
S['v']=2
json.dump(S,open('data/amol-struct.json','w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
print('ALL OK' if allok else 'PROBLEM')
