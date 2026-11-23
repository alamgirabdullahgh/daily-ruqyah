#!/bin/bash
# ব্যবহার: GH_TOKEN=... tools/novel/save.sh <অধ্যায়-নং>
# বই আবার বানায়, ওই অধ্যায়টি কমিট করে main-এ পুশ করে। টোকেন কোথাও লেখা হয় না।
cd "$(dirname "$0")/../.."
python3 tools/novel/build.py | tail -1
git add novel tools/novel
git commit -q -m "উপন্যাস: অধ্যায় $1 সেভ" || { echo "কমিটের কিছু নেই"; exit 0; }
git push -q "https://x-access-token:${GH_TOKEN}@github.com/alamgirabdullahgh/daily-ruqyah.git" main 2>&1 | sed 's/github_pat_[A-Za-z0-9_]*/***/g'
echo "সেভ: অধ্যায় $1 -> $(git rev-parse --short HEAD)"
