#!/usr/bin/env bash
# লাইভ কাজের খাতা: প্রতিটি ধাপের পর চালাও। দুটো কাজ একসাথে করে —
#  ১) `handoff-log` ব্রাঞ্চের TASKS.md-তে এক লাইন যোগ (main-এ বিল্ড চালু হয় না)
#  ২) অসমাপ্ত কোড-বদল `wip` ব্রাঞ্চে জমা (wip.sh)
# ব্যবহার: GH_TOKEN=... tools/handoff/log.sh <কাজের নাম> <অবস্থা: done|doing|todo|blocked> "কতটুকু হলো / পরের ধাপ"
#   যেমন:  tools/handoff/log.sh "Daily Note" doing "তালিকা+এডিটর হয়েছে; ড্রয়ার বাকি"
# দেখতে: tools/handoff/log.sh --show
set -euo pipefail
BR=handoff-log
ROOT=$(git rev-parse --show-toplevel); cd "$ROOT"
URL=$(git remote get-url origin | sed 's#https://[^@]*@#https://#')
W=$(mktemp -d); trap 'rm -rf "$W"' EXIT
if git ls-remote --exit-code --heads "$URL" $BR >/dev/null 2>&1; then
  git clone -q --depth 1 -b $BR "$URL" "$W/r" 2>/dev/null
else
  git init -q "$W/r"; git -C "$W/r" checkout -q -b $BR; printf '# কাজের খাতা (নতুন থেকে পুরনো ওপরে)\n\n' > "$W/r/TASKS.md"
fi
if [ "${1:-}" = "--show" ]; then cat "$W/r/TASKS.md"; exit 0; fi
: "${GH_TOKEN:?GH_TOKEN দরকার}"; : "${1:?কাজের নাম}"; : "${2:?অবস্থা}"
ic=$(case "$2" in done) echo "✅";; doing) echo "🔄";; blocked) echo "⛔";; *) echo "⏳";; esac)
line="- $ic **$1** ($(date '+%F %H:%M')) — ${3:-}"
{ head -n 2 "$W/r/TASKS.md"; echo "$line"; tail -n +3 "$W/r/TASKS.md"; } > "$W/n" && mv "$W/n" "$W/r/TASKS.md"
head -n 200 "$W/r/TASKS.md" > "$W/n" && mv "$W/n" "$W/r/TASKS.md"   # খাতা বড় হতে দেয় না
git -C "$W/r" config user.name Claude; git -C "$W/r" config user.email noreply@anthropic.com
git -C "$W/r" add -A; git -C "$W/r" commit -qm "log: $1 [$2]"
P="${URL/https:\/\//https://x-access-token:${GH_TOKEN}@}"
git -C "$W/r" push -q "$P" HEAD:refs/heads/$BR 2>&1 | sed 's/github_pat_[A-Za-z0-9_]*/***/g'
echo "খাতায় যোগ: $line"
# কোডের অসমাপ্ত বদলও জমা (ব্যর্থ হলে খাতার কাজ নষ্ট হয় না)
bash tools/handoff/wip.sh "$1: ${3:-$2}" || echo "(wip জমা হয়নি)"
