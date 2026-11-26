import sys,json
sys.path.insert(0,'/home/claude/daily-ruqyah/tools/audio-cuts')
import ctc_align as C, ctc_chunk as K
vk=sys.argv[1]; s,a=map(int,vk.split(':'))
exp=json.load(open(f'/tmp/work/repo/data/quran-chunks/a/{s}.json',encoding='utf-8'))[a-1].split(' ')
res,ok,dur,dw=K.words(s,a,len(exp))
print(vk,'dur',round(dur,2),'matched',ok,'/',len(exp))
for i,(w,r) in enumerate(zip(exp,res),1): print(i,C.nz(w),None if r is None else (round(r[0],2),round(r[1],2)))
print('DEC',[(d[0],round(d[1],2),round(d[2],2)) for d in dw])
