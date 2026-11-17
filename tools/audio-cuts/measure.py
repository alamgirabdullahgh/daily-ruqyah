# ব্যবহার: প্যাক zip খুলে /tmp/pack/x/<আয়াত-নম্বর>.mp3, quran-align Alafasy_128kbps.json → /tmp/qa0/ রেখে সব কাটা মাপে (axis-ayat.json-এর b ও mp থেকে)
import json,sys,subprocess,numpy as np
sys.path.insert(0,__import__('os').path.dirname(__import__('os').path.abspath(__file__)))
import align_lib as L
L.AL=None
import json
L.AL={(x['surah'],x['ayah']):x['segments'] for x in json.load(open('/tmp/qa0/Alafasy_128kbps.json'))}

import numpy as np, json
SP=1.2
def wcount(s,a): return len(json.load(open(f'/home/claude/daily-ruqyah/data/quran-chunks/a/{s}.json',encoding='utf-8'))[a-1].split(' '))
def wtimes(s,a,N):
    st=[None]*N; en=[None]*N
    for f,t,m0,m1 in L.aligned(s,a):
        n=t-f
        for k in range(n):
            if f+k<N:
                st[f+k]=(m0+(m1-m0)*k/n)/1000/SP; en[f+k]=(m0+(m1-m0)*(k+1)/n)/1000/SP
    return st,en
def prof(x,hop=0.002,win=0.010):
    h=int(L.SR*hop);w=int(L.SR*win);n=(len(x)-w)//h
    e=np.array([np.sqrt(np.mean(x[i*h:i*h+w]**2)) for i in range(n)])
    return 20*np.log10(e/ e.max()+1e-6),hop
def pick0(db,hop,p,rad=0.10):
    lo=max(0,int((p-rad)/hop));hi=min(len(db),int((p+rad)/hop))
    seg=db[lo:hi];m=seg.min();idx=np.where(seg<=m+1.0)[0]   # plateau within 1 dB of the minimum
    # choose the plateau run nearest to p, take its middle
    runs=np.split(idx,np.where(np.diff(idx)>1)[0]+1)
    best=min(runs,key=lambda r:abs((lo+r.mean())*hop-p))
    t=(lo+best.mean())*hop
    ctx=np.median(db[max(0,int((p-0.25)/hop)):int((p+0.25)/hop)])
    return t,m,ctx-m,(len(best))*hop
def pick(db,hop,p,side):
    # side: 'start' (পরের শব্দ শুরুর সীমা) বা 'end' (আয়াতাংশ শেষের সীমা)
    # ১) ±৬০ মি.সে.-এ প্রকৃত বিরতি (≥১০ dB গভীর ফাঁক) থাকলে সেখানে
    t,m,dep,wd=pick0(db,hop,p,0.06)
    if dep>=10: return t,m,dep,wd,'gap'
    # ২) নইলে (নাকি/জোড়া-লাগা ধ্বনি) শব্দ-সীমার কাছেই, ভেতরের দিকে ছোট জানালায়: শেষে পরের শব্দ পেরোবে না, শুরুতে আগের শব্দ ঢুকবে না
    lo,hi=(p-0.03,p+0.005) if side=='end' else (p-0.005,p+0.03)
    i0=max(0,int(lo/hop));i1=min(len(db),int(hi/hop)+1);seg=db[i0:i1];mn=seg.min()
    idx=np.where(seg<=mn+1.0)[0];t=(i0+idx.mean())*hop
    return t,mn,dep,len(idx)*hop,'edge'
def cut(s,a,f,t):
    N=wcount(s,a);x=L.load(s,a);db,hop=prof(x);st,en=wtimes(s,a,N)
    r={}
    if f==1:
        on=np.where(db>-30)[0][0]*hop;r['start']=max(0,on-0.010);r['s_info']='onset'
    else:
        p=(en[f-2]+st[f-1])/2;ts,m,dep,wd,md=pick(db,hop,p,'start');r['start']=ts;r['s_info']=(round(ts-p,3),round(m,1),round(dep,1),md)
    if t==N:
        off=np.where(db>-30)[0][-1]*hop;r['end']=min(len(x)/L.SR,off+0.015);r['e_info']='offset'
    else:
        p=(en[t-1]+st[t])/2;te,m,dep,wd,md=pick(db,hop,p,'end');r['end']=te;r['e_info']=(round(te-p,3),round(m,1),round(dep,1),md)
    return r
if __name__=='__main__':
    old=json.load(open('/home/claude/daily-ruqyah/data/audio-cuts.json',encoding='utf-8'))['cuts']
    for k,v in old.items():
        s,a,fr=k.split(':');f,t=map(int,fr.split('-'));s=int(s);a=int(a)
        r=cut(s,a,f,t)
        print(k,'old',v,'new',round(r['start'],3),round(r['end'],3),'| S',r['s_info'],'E',r['e_info'])
