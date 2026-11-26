#!/usr/bin/env python3
"""ফাইল media-job/<id> ব্রাঞ্চে পাঠায়, Actions-এ ওপেন মডেল শোনে/দেখে, ফল ফেরত আনে।
  GH_TOKEN=... python3 tools/media/job.py <ফাইল> "<প্রশ্ন>"
⚠ রিপো পাবলিক: ব্রাঞ্চ ফল আসার পর মুছে ফেলা হয়। গোপন রেকর্ডিং পাঠিও না।"""
import base64, json, os, shutil, subprocess, sys, tempfile, time, urllib.request

REPO = os.environ.get("REPO", "alamgirabdullahgh/daily-ruqyah")
TOK = os.environ.get("GH_TOKEN") or sys.exit("GH_TOKEN দরকার")
URL = f"https://github.com/{REPO}.git"
GIT = ["git", "-c", "http.extraheader=Authorization: Basic " + base64.b64encode(f"x-access-token:{TOK}".encode()).decode()]

def git(d, *a, check=True):
    return subprocess.run(GIT + list(a), cwd=d, check=check, capture_output=True, text=True)

def main():
    if len(sys.argv) < 2: sys.exit(__doc__)
    f = sys.argv[1]; q = sys.argv[2] if len(sys.argv) > 2 else "কী শোনা/দেখা যায়, সময়সহ বলো"
    br = "media-job/" + time.strftime("%m%d-%H%M%S"); d = tempfile.mkdtemp()
    try:
        git(d, "clone", "-q", "--depth", "1", URL, d + "/c"); c = d + "/c"
        git(c, "checkout", "-q", "-b", br)
        git(c, "config", "user.name", "Claude"); git(c, "config", "user.email", "noreply@anthropic.com")
        os.makedirs(c + "/job"); name = "input" + os.path.splitext(f)[1].lower()
        shutil.copy(f, f"{c}/job/{name}")
        json.dump({"file": name, "question": q}, open(c + "/job/request.json", "w"), ensure_ascii=False)
        git(c, "add", "-A"); git(c, "commit", "-q", "-m", "media job"); git(c, "push", "-q", "origin", br)
        print("ব্রাঞ্চ:", br, flush=True)
        for _ in range(240):
            time.sleep(15)
            git(c, "fetch", "-q", "origin", br)
            r = git(c, "show", f"origin/{br}:job/result.md", check=False)
            if r.returncode == 0:
                print(r.stdout); break
        else:
            sys.exit("সময় শেষ: https://github.com/%s/actions" % REPO)
    finally:
        git(d + "/c", "push", "-q", "origin", "--delete", br, check=False) if os.path.isdir(d + "/c") else None
        shutil.rmtree(d, ignore_errors=True)
main()
