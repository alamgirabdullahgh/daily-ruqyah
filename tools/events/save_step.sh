#!/bin/bash
# ব্যবহার: GH_TOKEN=... tools/events/save_step.sh "<বার্তা>"  — INDEX_READ.md কমিট+পুশ+খাতায় লেখা
cd "$(dirname "$0")/../.."
git add INDEX_READ.md tools/events/ && git commit -q -m "সূচি হাতে-পড়া: $1"
git push -q "https://x-access-token:${GH_TOKEN}@github.com/alamgirabdullahgh/daily-ruqyah.git" main 2>&1 | sed "s/${GH_TOKEN}/***/g"
tools/handoff/log.sh "সূচির ভেতর হাতে-পড়া যাচাই" doing "$1" 2>&1 | sed "s/${GH_TOKEN}/***/g" | tail -n 1
