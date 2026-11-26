import re,sys
t=open('quran_event_verses.md',encoding='utf-8').read()
parts=re.split(r'\n## ',t)[1:]
a,b=int(sys.argv[1]),int(sys.argv[2])
ar=re.compile(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+')
for p in parts[a-1:b]:
    p=ar.sub('',p)
    p=re.sub(r' +',' ',p)
    print('## '+p.strip()); print()
