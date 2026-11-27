import re,sys
t=open('quran_event_verses.md',encoding='utf-8').read()
ar=re.compile(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+')
parts=re.split(r'\n## ',t)[1:]
a,b=int(sys.argv[1]),int(sys.argv[2])
for p in parts[a-1:b]:
    p=ar.sub('',p); p=re.sub(r'[ \t]+',' ',p); p=re.sub(r'\n\s*\n+','\n',p)
    p=p.replace('**মূল আয়াত**','[মূল]').replace('**সমপর্যায়ের আয়াত**','[সম]')
    print('## '+p.strip())
