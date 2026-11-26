import sys,json
sys.path.insert(0,'/home/claude/daily-ruqyah/tools/audio-cuts')
import align_lib as L, measure2 as M, numpy as np
vk=sys.argv[1]; s,a=map(int,vk.split(':')); x=L.load(s,a); db=M.prof(x); hop=M.HOP
for w in sys.argv[2:]:
    t0,t1=map(float,w.split(','))
    seg=db[int(t0/hop):int(t1/hop)]
    # print coarse profile every 20ms
    print(vk,w,' '.join(f'{(int(t0/hop)+i)*hop:.2f}:{seg[i]:.0f}' for i in range(0,len(seg),5)))
