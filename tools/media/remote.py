#!/usr/bin/env python3
"""ফ্রি ও সীমাহীন শোনা-দেখা: ফাইল GitHub Actions-এ পাঠায়, ফল ফেরত আনে।
  GH_TOKEN=... python3 tools/media/remote.py <ফাইল> "<প্রশ্ন>" [--lang ar] [--model medium] [--fps 1]
ফল: ./senses-result/<id>/result.md (+ frames.png, waveform.png, words.json)।
⚠ রিপো পাবলিক: ইনপুট চলার সময় ও ফল পাবলিক ব্রাঞ্চে থাকে; শেষে ইনপুট মুছে ফেলা হয়। গোপন রেকর্ডিং পাঠিও না।"""
import argparse, json, os, shutil, subprocess, sys, tempfile, time, urllib.request

REPO = os.environ.get("REPO", "alamgirabdullahgh/daily-ruqyah")
TOK = os.environ.get("GH_TOKEN") or sys.exit("GH_TOKEN দরকার")
API = f"https://api.github.com/repos/{REPO}"
GIT = ["git", "-c", f"http.extraheader=Authorization: Basic " + __import__("base64").b64encode(f"x-access-token:{TOK}".encode()).decode()]
URL = f"https://github.com/{REPO}.git"

def api(path, body=None, method=None):
    r = urllib.request.Request(API + path, data=json.dumps(body).encode() if body is not None else None, method=method,
        headers={"Authorization": f"Bearer {TOK}", "Accept": "application/vnd.github+json"})
    with urllib.request.urlopen(r, timeout=60) as f:
        t = f.read()
    return json.loads(t) if t else {}

def git(d, *args, check=True):
    return subprocess.run(GIT + list(args), cwd=d, check=check, capture_output=True, text=True)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("file"); ap.add_argument("question", nargs="?", default="কী শোনা/দেখা যায়, সময়সহ বলো")
    ap.add_argument("--lang", default=""); ap.add_argument("--model", default="medium"); ap.add_argument("--fps", default="1")
    ap.add_argument("--out", default="senses-result")
    a = ap.parse_args()
    rid = time.strftime("%m%d-%H%M%S")
    d = tempfile.mkdtemp()
    try:
        git(d, "init", "-q"); git(d, "checkout", "-q", "-b", "senses-in")
        git(d, "config", "user.name", "Claude"); git(d, "config", "user.email", "noreply@anthropic.com")
        os.makedirs(f"{d}/{rid}"); shutil.copy(a.file, f"{d}/{rid}/")
        git(d, "add", "-A"); git(d, "commit", "-q", "-m", f"input {rid}")
        git(d, "push", "-q", "--force", URL, "senses-in")
        before = {r["id"] for r in api("/actions/workflows/senses.yml/runs?event=workflow_dispatch&per_page=5")["workflow_runs"]}
        api("/actions/workflows/senses.yml/dispatches", {"ref": "main", "inputs": {"id": rid, "question": a.question, "lang": a.lang, "model": a.model, "fps": a.fps}}, "POST")
        run = None
        for _ in range(30):
            time.sleep(4)
            for r in api("/actions/workflows/senses.yml/runs?event=workflow_dispatch&per_page=5")["workflow_runs"]:
                if r["id"] not in before: run = r["id"]
            if run: break
        if not run: sys.exit("run শুরু হয়নি")
        print("run:", run, f"https://github.com/{REPO}/actions/runs/{run}", flush=True)
        while True:
            time.sleep(15)
            r = api(f"/actions/runs/{run}")
            if r["status"] == "completed": break
        print("ফল:", r["conclusion"])
        # ইনপুট মুছে ফেলা (ইতিহাসসহ শাখা রিসেট)
        e = tempfile.mkdtemp(); git(e, "init", "-q"); git(e, "checkout", "-q", "-b", "senses-in")
        git(e, "config", "user.name", "Claude"); git(e, "config", "user.email", "noreply@anthropic.com")
        open(f"{e}/.keep", "w").write(""); git(e, "add", "-A"); git(e, "commit", "-q", "-m", "clear")
        git(e, "push", "-q", "--force", URL, "senses-in"); shutil.rmtree(e)
        if r["conclusion"] != "success": sys.exit(f"ব্যর্থ: https://github.com/{REPO}/actions/runs/{run}")
        o = tempfile.mkdtemp()
        git(o, "clone", "-q", "--depth", "1", "--branch", "senses-out", URL, o + "/c")
        dst = os.path.join(a.out, rid); os.makedirs(a.out, exist_ok=True)
        shutil.copytree(f"{o}/c/{rid}", dst, dirs_exist_ok=True); shutil.rmtree(o)
        print(open(f"{dst}/result.md").read()); print("ফোল্ডার:", dst)
    finally:
        shutil.rmtree(d, ignore_errors=True)

main()
