#!/usr/bin/env python3
# ব্যবহার: python3 tools/events/show_lines.py <ঘটনা-নম্বর> <শুরু-লাইন(০ থেকে)> <কয়টি>
# বড় ঘটনার আয়াত ভাগ ভাগ করে (শুধু বাংলা) দেখানোর সহায়ক; পড়া ও সিদ্ধান্ত নিজে।
import re, subprocess, sys
n, start, cnt = int(sys.argv[1]), int(sys.argv[2]), int(sys.argv[3])
out = subprocess.run([sys.executable, 'tools/events/show_bn.py', str(n), str(n)], capture_output=True, text=True).stdout
lines = [l for l in out.split('\n') if l.startswith('- [')]
print(f'# ঘটনা {n}: মোট {len(lines)} আয়াত; দেখানো {start}–{min(start+cnt, len(lines))-1}')
for l in lines[start:start+cnt]: print(l)
