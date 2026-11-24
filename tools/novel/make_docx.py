#!/usr/bin/env python3
# novel/novel.md -> novel/quran-novel.docx (pandoc + বাংলা ফন্ট ঠিক করা রেফারেন্স-ডক)
# ব্যবহার: python3 tools/novel/build.py && python3 tools/novel/make_docx.py [md-ফাইল] [আউটপুট]
# ফন্ট: Nirmala UI (Windows-এ বাংলার ডিফল্ট), ফলব্যাক Kohinoor Bangla/Noto। সব স্টাইলে একই ফন্ট ও আকার ১২ পয়েন্ট।
import subprocess,zipfile,re,sys,os,tempfile,shutil
R=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..')
src=sys.argv[1] if len(sys.argv)>1 else f'{R}/novel/novel.md'
out=sys.argv[2] if len(sys.argv)>2 else f'{R}/novel/quran-novel.docx'
FONT='Nirmala UI'
tmp=tempfile.mkdtemp(); ref=f'{tmp}/ref.docx'
open(ref,'wb').write(subprocess.check_output(['pandoc','--print-default-data-file','reference.docx']))
zin=zipfile.ZipFile(ref); zout=zipfile.ZipFile(f'{tmp}/ref2.docx','w',zipfile.ZIP_DEFLATED)
for it in zin.infolist():
    data=zin.read(it.filename)
    if it.filename=='word/styles.xml':
        s=data.decode('utf-8')
        fonts=f'<w:rFonts w:ascii="{FONT}" w:hAnsi="{FONT}" w:eastAsia="{FONT}" w:cs="{FONT}"/>'
        s=re.sub(r'<w:rFonts(?![^>]*Consolas)[^>]*/>',fonts,s)
        # ডিফল্ট আকার ১২pt (বাংলা = complex script, তাই szCs-ও)
        s=re.sub(r'(<w:rPrDefault>\s*<w:rPr>)',r'\1<w:sz w:val="24"/><w:szCs w:val="24"/>',s,count=1) if '<w:rPrDefault>' in s else s
        s=re.sub(r'<w:pPrDefault>.*?</w:pPrDefault>','<w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="336" w:lineRule="auto"/></w:pPr></w:pPrDefault>',s,flags=re.S)
        data=s.encode('utf-8')
    zout.writestr(it,data)
zout.close()
subprocess.check_call(['pandoc',src,'-f','markdown-smart','-o',out,f'--reference-doc={tmp}/ref2.docx','--metadata','lang=bn-BD'])
shutil.rmtree(tmp); print('docx:',out,os.path.getsize(out)//1024,'KB')
