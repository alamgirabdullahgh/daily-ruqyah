import sys,json
sys.path.insert(0,'/home/claude/daily-ruqyah/tools/audio-cuts')
import ctc_align as C, refine as RF
def sc(vk,lo,hi,st,en):
    s,a=map(int,vk.split(':'))
    exp=json.load(open(f'/tmp/work/repo/data/quran-chunks/a/{s}.json',encoding='utf-8'))[a-1].split(' ')[lo-1:hi]
    return RF.score(s,a,lo,hi,st,en,exp)
if __name__=='__main__':
    vk=sys.argv[1];lo,hi=int(sys.argv[2]),int(sys.argv[3])
    for pair in sys.argv[4:]:
        st,en=map(float,pair.split(','))
        r=sc(vk,lo,hi,st,en); print(vk,lo,hi,st,en,round(r[0],2),r[1])
