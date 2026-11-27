#!/usr/bin/env python3
# READ2_NOTES.md-র "বাদযোগ্য" তালিকা (ঘটনা ধরে) থেকে removals.tsv (আয়াত<TAB>ঘটনা) বানায়।
import re
bn='০১২৩৪৫৬৭৮৯'
lat=lambda s:''.join(str(bn.index(c)) if c in bn else c for c in s)
N=open('tools/audit2/READ2_NOTES.md',encoding='utf-8').read().split('\n')
REF=r'[০-৯]+:[০-৯]+(?:-[০-৯]+)?'
def refs(s): return re.findall(REF,s)
def line(prefix):
    r=[l for l in N if l.startswith(prefix)]
    assert len(r)==1,(prefix,len(r)); return r[0]
def bad(l):  # "বাদযোগ্য ...:" থেকে "সীমান্ত"/"সন্দেহে" এর আগ পর্যন্ত
    i=l.find('বাদযোগ্য'); j=l.find(':',l.find('**',i)+2) if False else None
    s=l[i:]
    m=re.search(r'\*\*[:：]?\s*',s)  # বোল্ড শেষ
    s=s[m.end():] if m else s
    for stop in ['সীমান্ত','সন্দেহে রাখা:','সন্দেহে থাকবে']:
        k=s.find(stop)
        if k>=0: s=s[:k]
    return s
out=[]
def add(ev,s):
    for r in refs(s): out.append((r,ev))
# ৫৩
l=line('- ঘটনা ৫৩ (ঝুড়ি'); s=l.split('বাদযোগ্য',1)[1]; s=s.split('৬৪:৫-৬')[0]; add(53,s.split('**',1)[1])
# ৯৮
add(98,'২:২৪৪, ২:২৪৫')
# ১১৭
l=line('- ঘটনা ১১১–১২৪'); s=l.split('**ঘটনা ১১৭ বাদযোগ্য',1)[1].split('উপমার ভেতরে',1)[0]; add(117,s.split('**',1)[1])
# ১৫২–১৬২
l=line('- ঘটনা ১৫২–১৬২'); s=l.split('বাদযোগ্য',1)[1].split('সীমান্ত')[0]
add(159,'৮:৬০'); add(160,'৩:১৩০-১৩২, ৩:১৩৩-১৩৬, ৩:১৩৭-১৩৮, ৩:১৬৩-১৬৪, ১৬:১২৫-১২৬'); add(162,'৫৯:৭')
# ১৬৩
l=line('- ঘটনা ১৬৩ (আহলে'); s=l.split('বাদযোগ্য',1)[1].split('ঘটনা ১৬৩-এ সন্দেহে')[0]; add(163,s.split('**',1)[1])
# ১৭০
add(170,'২৪:৪-৫, ২৪:১৯, ২৪:২১, ২৪:২৩')
# ১৭১–১৭৮
add(171,'৪:১১০-১১১'); add(172,'৩৩:৪৯'); add(175,'৪৮:১৪, ৪৮:২৩')
# ১৭৯–১৮৬
l=line('- ঘটনা ১৭৯–১৮৬'); s=l.split('বাদযোগ্য',1)[1]
a=s.split('ঘটনা ১৮১:',1)[1].split('ঘটনা ১৮২:',1); add(181,a[0])
b=a[1].split('ঘটনা ১৮৩:',1); add(182,b[0]); add(183,b[1])
# ১৮৭–১৯২
l=line('- ঘটনা ১৮৭–১৯২'); s=l.split('বাদযোগ্য',1)[1]
add(187,s.split('**',1)[1].split('সন্দেহে রাখা')[0]); add(189,s.split('১৮৯-এ বাদযোগ্য:',1)[1])
# ১৯৩–২০০
add(199,'৮:৫৩, ৩৯:৪২, ৫৬:৯৬'); add(200,'১৬:৭৭, ৫৫:২৬-২৭')
# ২০১–২১০
add(205,'২২:৭'); add(209,'৩৬:১২')
# ২১১–২১৭
add(213,'২২:৬১-৬৫, ২২:৭০'); add(214,'১৭:৯-১২, ৬:৩২, ৬৪:৮')
# ২২৫, ২৩০
l=line('- ঘটনা ২২৫:'); add(225,l.split('**',2)[1+1] if False else l.split('নেই):**',1)[1].split('সীমান্ত')[0])
add(230,'২২:১৮, ৪৭:১৪')
# ১৫১ খণ্ডগুলো
for l in N:
    if l.startswith('- ঘটনা ১৫১ খণ্ড'):
        s=l.split('বাদযোগ্য',1)[1]; s=s.split('**',1)[1]; s=s.split('সীমান্ত')[0]; add(151,s)
with open('tools/audit2/removals.tsv','w',encoding='utf-8') as f:
    for r,e in out: f.write(f'{lat(r)}\t{e}\n')
import collections
c=collections.Counter(e for _,e in out); print(len(out),'refs'); print(sorted(c.items()))
