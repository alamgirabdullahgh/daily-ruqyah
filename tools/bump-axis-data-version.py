#!/usr/bin/env python3
"""data/axis-ayat.json বদলালে অ্যাপ ও সার্ভিস-ওয়ার্কারের ক্যাশ-ভার্সন একটা করে বাড়ায়, যাতে ফোনে নতুন ডেটা আসে।
axes.js ও sw.js-এ axis-ayat.json?v=N; index.html ও sw.js-এ axes.js?v=N; আর sw.js-এ dr-shell-vN। (apply-app-edits ওয়ার্কফ্লো এটা চালায়)"""
import re, pathlib
R = pathlib.Path(__file__).resolve().parent.parent
def bump(path, pat):
    t = (R / path).read_text(encoding="utf-8")
    m = re.search(pat, t)
    assert m, (path, pat)
    n = int(m.group(2)) + 1
    t = t[:m.start(2)] + str(n) + t[m.end(2):]
    (R / path).write_text(t, encoding="utf-8")
    return n
print("axis-ayat.json?v=", bump("axes.js", r"(axis-ayat\.json\?v=)(\d+)"))
# axes.js-এর লেখা বদলেছে, তাই axes.js নিজের লিংকের ভার্সনও বাড়াতে হবে (নইলে ফোন পুরনো axes.js ধরে রাখে)
print("axes.js?v=", bump("index.html", r"(axes\.js\?v=)(\d+)"))
bump("sw.js", r"(axes\.js\?v=)(\d+)")
bump("sw.js", r"(axis-ayat\.json\?v=)(\d+)")
print("dr-shell-v", bump("sw.js", r"(dr-shell-v)(\d+)"))
