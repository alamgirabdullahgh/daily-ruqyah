import sys,json,re
sys.path.insert(0,'/home/claude/daily-ruqyah/tools/audio-cuts'); sys.path.insert(0,'/tmp')
import ctc_align as C, ctc_chunk as K, refine as RF, apply_organ_trim as T
TAN=re.compile('[\u064b\u064c\u064d]')
manual={'21:39:3-14':(10.80,19.74),'21:39:5-13':(12.30,19.20),'49:14:10-14':(9.78,14.6),'41:29:4-16':(2.62,21.489),'9:29:26-27':(21.80,23.0)}
todo={'6:46':[(3,10),(1,11)],'3:103':[(14,16)],'57:27':[(12,18)],'2:259':[(49,56),(54,59)]}
out={}
for k,(st,en) in manual.items(): out[k]=dict(start=st,end=en,src='manual')
need=json.load(open('/home/claude/daily-ruqyah/tools/audio-cuts/organ-cuts-needed.json'))
for vk,rs in todo.items():
    s,a=map(int,vk.split(':')); N=[n for S,A,l,h,n in need if S==s and A==a][0]
    exp_all=json.load(open(f'/tmp/work/repo/data/quran-chunks/a/{s}.json',encoding='utf-8'))[a-1].split(' ')
    res,ok,dur,dw=K.words(s,a,N)
    for lo,hi in rs:
        st=None;en=None
        for i in range(lo,hi+1):
            if res[i-1]: st=res[i-1][0]-0.12;break
        for i in range(hi,lo-1,-1):
            if res[i-1]: en=res[i-1][1]+0.35;break
        if lo==1: st=0.0
        if hi==N: en=dur
        r=dict(s=s,a=a,lo=lo,hi=hi,N=N,start=st,end=en)
        s2,e2,b=RF.refine(r,wide=False)
        exp=exp_all[lo-1:hi]; sc,inf=RF.score(s,a,lo,hi,s2,e2,exp)
        trimmed=None
        if hi<N and TAN.search(exp[-1]):
            x=T.load(s,a); t=T.trim_nun(x,s2,e2)
            if not t and '\u064b' in exp[-1]: t=T.trim_nun(x,s2,e2,-10,-6)
            if t and s2+0.2<t<e2:
                sc2,inf2=RF.score(s,a,lo,hi,s2,t,exp)
                if inf2 and inf2['last']>=inf['last']-0.05 and inf2['lead']+inf2['trail']==0: trimmed=(e2,t); e2=t; inf=inf2
        k=f'{vk}:{lo}-{hi}'
        out[k]=dict(start=round(s2,3),end=round(e2,3),src='refine',trimmed=trimmed,info={a_:float(b_) for a_,b_ in inf.items()})
        print(k,out[k],flush=True)
        json.dump(out,open('/tmp/final8.json','w'),ensure_ascii=False)
json.dump(out,open('/tmp/final8.json','w'),ensure_ascii=False)
