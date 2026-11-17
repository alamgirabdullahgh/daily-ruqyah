import json,subprocess,numpy as np
AYN=[7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6]
g=lambda s,a:sum(AYN[:s-1])+a
SR=22050
def load(s,a):
    f=f'/tmp/pack/x/{g(s,a)}.mp3'
    raw=subprocess.run(['ffmpeg','-v','error','-i',f,'-f','s16le','-ac','1','-ar',str(SR),'-'],capture_output=True).stdout
    return np.frombuffer(raw,dtype=np.int16).astype(np.float32)/32768
def env(x,hop=0.005,win=0.02):
    h=int(SR*hop);w=int(SR*win)
    n=(len(x)-w)//h
    e=np.array([np.sqrt(np.mean(x[i*h:i*h+w]**2)) for i in range(n)])
    return e,hop
def speech_span(e,hop,rel=0.04):
    th=e.max()*rel
    idx=np.where(e>th)[0]
    return idx[0]*hop,(idx[-1]+1)*hop

from scipy.signal import argrelextrema
from scipy.ndimage import uniform_filter1d
AL=None
def aligned(s,a):
    global AL
    if AL is None: AL={(x['surah'],x['ayah']):x['segments'] for x in json.load(open('/tmp/qa/Alafasy_128kbps.json'))}
    return AL[(s,a)]
def word_priors(s,a,nw):
    """per-word [start,end] seconds from quran-align (words missing -> interpolate)"""
    sg=aligned(s,a);ws=[None]*nw
    for f,t,m0,m1 in sg:
        n=t-f
        for k in range(n):
            if f+k<nw: ws[f+k]=(m0/1000+(m1-m0)/1000*k/n,m0/1000+(m1-m0)/1000*(k+1)/n)
    for i in range(nw):
        if ws[i] is None: ws[i]=(None,None)
    return ws
def boundaries(s,a,nw,verbose=False):
    x=load(s,a);e,h=env(x,0.005,0.025)
    le=np.log(e+1e-4);ls=uniform_filter1d(le,5)
    t0,t1=speech_span(e,h,0.02)
    pr=word_priors(s,a,nw)
    # prior durations of words (fill gaps)
    d=[]
    for i,(p0,p1) in enumerate(pr): d.append((p1-p0) if p0 is not None else None)
    known=[v for v in d if v]; mean=np.mean(known)
    d=[v if v else mean for v in d]
    # boundary between word i and i+1 (i=0..nw-2) ; candidates = local minima of smoothed log-energy
    mins=argrelextrema(ls,np.less_equal,order=3)[0]
    cand=[m for m in mins if t0/h<=m<=t1/h]
    cand=np.array(cand)
    T=np.array([m*h for m in cand]);depth=np.array([ (np.max(ls[max(0,m-20):m+21])-ls[m]) for m in cand])
    best=None
    for scale in np.linspace(0.70,1.0,31):
        # DP over boundaries
        K=len(cand);INF=1e18
        # state: (boundary idx i, candidate c)
        # word0 : from t0 to b0 ; word nw-1: from b_{nw-2} to t1
        prev=None
        dp=[]
        # first boundary
        c0=np.full(K,INF);bp=[]
        for c in range(K):
            dur=T[c]-t0
            if dur<=0.05: continue
            c0[c]=(np.log(dur/(d[0]*scale)))**2*3-0.15*depth[c]
        dp.append(c0);bps=[]
        for i in range(1,nw-1):
            cur=np.full(K,INF);bp=np.full(K,-1)
            for c in range(K):
                best_c=INF;bi=-1
                for q in range(K):
                    if T[q]>=T[c]-0.05 or dp[-1][q]>=INF: continue
                    dur=T[c]-T[q]
                    v=dp[-1][q]+(np.log(dur/(d[i]*scale)))**2*3-0.15*depth[c]
                    if v<best_c: best_c=v;bi=q
                cur[c]=best_c;bp[c]=bi
            dp.append(cur);bps.append(bp)
        # last word
        tot=np.full(K,INF)
        for c in range(K):
            if dp[-1][c]>=INF: continue
            dur=t1-T[c]
            if dur<=0.05: continue
            tot[c]=dp[-1][c]+(np.log(dur/(d[nw-1]*scale)))**2*3
        c=int(np.argmin(tot));cost=tot[c]
        if best is None or cost<best[0]:
            path=[c]
            for bp in reversed(bps):
                c=int(bp[c]);path.append(c)
            path=path[::-1]
            best=(cost,scale,[float(T[k]) for k in path])
    return best,(t0,t1),x

def boundaries2(s,a,nw):
    x=load(s,a);e,h=env(x,0.005,0.025)
    ls=uniform_filter1d(np.log(e+1e-4),5)
    t0,t1=speech_span(e,h,0.02)
    pr=word_priors(s,a,nw)
    d=np.array([(p1-p0) if p0 is not None else np.nan for p0,p1 in pr]);d[np.isnan(d)]=np.nanmean(d);d=np.maximum(d,0.15)
    mins=argrelextrema(ls,np.less_equal,order=3)[0]
    cand=np.array([m for m in mins if t0/h<=m<=t1/h])
    T=cand*h;depth=np.array([(np.max(ls[max(0,m-20):m+21])-ls[m]) for m in cand]);K=len(cand)
    allow=T[None,:]>T[:,None]+0.05   # allow[q,c]
    best=None
    for scale in np.linspace(0.70,1.0,31):
        INF=1e18
        dur0=T-t0;c0=np.where(dur0>0.05,3*np.log(np.maximum(dur0,1e-3)/(d[0]*scale))**2-0.15*depth,INF)
        dp=c0;bps=[]
        D=T[None,:]-T[:,None]
        with np.errstate(all='ignore'):
            LD=np.log(np.where(allow,D,1)/1.0)
        for i in range(1,nw-1):
            cost=dp[:,None]+3*(LD-np.log(d[i]*scale))**2-0.15*depth[None,:]
            cost=np.where(allow,cost,INF)
            bp=np.argmin(cost,axis=0);dp=cost[bp,np.arange(K)];bps.append(bp)
        durl=t1-T
        tot=np.where(durl>0.05,dp+3*np.log(np.maximum(durl,1e-3)/(d[nw-1]*scale))**2,INF)
        c=int(np.argmin(tot));cost=tot[c]
        if best is None or cost<best[0]:
            path=[c]
            for bp in reversed(bps): c=int(bp[c]);path.append(c)
            path=path[::-1];best=(cost,scale,[float(T[k]) for k in path],[float(depth[k]) for k in path])
    return best,(t0,t1),x,e,h
