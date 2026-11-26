#!/usr/bin/env bash
# REA (Reverse Engineer Anything) চালানোর র‍্যাপার। কোড রিপোতে কপি নেই; npm থেকে নির্দিষ্ট সংস্করণ নামে।
# ব্যবহার: tools/rea/rea.sh --version | setup | <অন্য সাবকমান্ড>
set -e
REA_VERSION="${REA_VERSION:-6.10.1}"
command -v node >/dev/null || { echo "Node.js লাগবে (22.23.4+ / 24.22.1+ / 26.12.1+)"; exit 1; }
exec npx --yes "rea-agents@${REA_VERSION}" "$@"
