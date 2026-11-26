#!/usr/bin/env python3
"""GitHub Actions-এ চলে (media-senses.yml)। job/request.json পড়ে job/result.md লেখে।

request.json: {"file": "input.mp3", "question": "..."}
  (file হলো job/ ফোল্ডারের ভেতরের নাম)
শুধু ওপেন মডেল (Gemini বাদ)।
open  : llama.cpp + Gemma 4 E4B (ওপেন-ওয়েট; অডিও ও ছবি সরাসরি নেয়)। কোনো কী বা কোটা লাগে না।
"""
import json
import os
import re
import subprocess
import sys
import tarfile
import tempfile
import traceback
import urllib.request

OPEN_MODEL = "ggml-org/gemma-4-E4B-it-GGUF"
SEGMENT = 28.0      # Gemma 4-এর অডিও-ঘর ৩০ সেকেন্ডের
MAX_SEGMENTS = 40   # প্রায় ১৮ মিনিট
FRAMES = 6          # প্রতি অংশে ছবি
IMG_EXT = (".png", ".jpg", ".jpeg", ".webp")


def sh(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, errors="replace", **kw)


def llama_cli(work):
    """llama.cpp-এর তৈরি-করা সর্বশেষ Linux বাইনারি।"""
    h = {"Accept": "application/vnd.github+json"}
    if os.environ.get("GH_API_TOKEN"):
        h["Authorization"] = "Bearer " + os.environ["GH_API_TOKEN"]
    url = "https://api.github.com/repos/ggml-org/llama.cpp/releases?per_page=15"
    with urllib.request.urlopen(urllib.request.Request(url, headers=h), timeout=60) as r:
        releases = json.load(r)
    asset = next((a for rel in releases for a in rel["assets"]
                  if re.search(r"bin-ubuntu-x64\.tar\.gz$", a["name"])), None)
    if not asset:
        raise RuntimeError("llama.cpp বাইনারি পাওয়া যায়নি")
    tar = os.path.join(work, asset["name"])
    urllib.request.urlretrieve(asset["browser_download_url"], tar)
    with tarfile.open(tar) as t:
        t.extractall(os.path.join(work, "llama"), filter="data")
    for root, _, files in os.walk(os.path.join(work, "llama")):
        if "llama-mtmd-cli" in files:
            return os.path.join(root, "llama-mtmd-cli"), root, asset["name"]
    raise RuntimeError("llama-mtmd-cli নেই")


def segments(src, work):
    """([(শুরু, শেষ, [ছবির ফাইল])], আছে_অডিও) — অডিও টুকরো আর ভিডিও হলে সেই সময়ের ছবি।"""
    p = sh(["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_type",
            "-of", "json", src])
    if p.returncode:
        raise RuntimeError("ফাইল পড়া যায়নি: " + p.stderr[:300])
    info = json.loads(p.stdout)
    kinds = {s["codec_type"] for s in info.get("streams", [])}
    if os.path.splitext(src)[1].lower() in IMG_EXT:
        return [(0.0, 0.0, [src])], False
    dur = float(info.get("format", {}).get("duration") or 0)
    out, start, n = [], 0.0, 0
    while start < dur - 0.05 and n < MAX_SEGMENTS:
        length = min(SEGMENT, dur - start)
        files = []
        if "video" in kinds:
            for i in range(FRAMES):
                t = start + length * (i + 0.5) / FRAMES
                f = os.path.join(work, f"s{n:02d}f{i}.jpg")
                sh(["ffmpeg", "-y", "-v", "error", "-ss", f"{t:.3f}", "-i", src,
                    "-frames:v", "1", "-vf", "scale='min(640,iw)':-2", f])
                if os.path.isfile(f):
                    files.append(f)
        out.append((start, start + length, files))
        start += length
        n += 1
    return out, "audio" in kinds


def cut_audio(src, start, length, work, n):
    wav = os.path.join(work, f"s{n:02d}.wav")
    sh(["ffmpeg", "-y", "-v", "error", "-ss", f"{start:.3f}", "-t", f"{length:.3f}", "-i", src,
        "-vn", "-ac", "1", "-ar", "16000", wav])
    return wav if os.path.isfile(wav) else None


def fmt(t):
    return f"{int(t // 60):02d}:{t % 60:05.2f}"


def run_open(src, question, work):
    cli, libdir, asset = llama_cli(work)
    env = dict(os.environ)
    env["LD_LIBRARY_PATH"] = libdir + ":" + env.get("LD_LIBRARY_PATH", "")
    segs, has_audio = segments(src, work)
    lines = [f"(ওপেন মডেল: {OPEN_MODEL}, llama.cpp: {asset}; {len(segs)} অংশ)", ""]
    for n, (a, b, imgs) in enumerate(segs):
        cmd = [cli, "-hf", OPEN_MODEL, "-n", "400", "--temp", "0.2"]
        for f in imgs:
            cmd += ["--image", f]
        if has_audio:
            wav = cut_audio(src, a, b - a, work, n)
            if wav:
                cmd += ["--audio", wav]
        prompt = question
        if len(segs) > 1:
            prompt += f"\n(এটা পুরো ফাইলের {fmt(a)} – {fmt(b)} অংশ। শুধু এই অংশ নিয়ে বলো।)"
        cmd += ["-p", prompt]
        p = sh(cmd, env=env, timeout=1500)
        text = (p.stdout or "").strip()
        if p.returncode or not text:
            text = f"(ব্যর্থ: কোড {p.returncode}) " + (p.stderr or "")[-400:]
        lines += [f"### {fmt(a)} – {fmt(b)}", text, ""]
    return "\n".join(lines)


def main(jobdir):
    req = json.load(open(os.path.join(jobdir, "request.json"), encoding="utf-8"))
    src = os.path.join(jobdir, req["file"])
    question = req.get("question") or "কী শোনা/দেখা যায়, সময়সহ বলো"
    res = [f"# ফল: {req['file']}", f"প্রশ্ন: {question}", ""]
    try:
        with tempfile.TemporaryDirectory() as work:
            res += ["## ওপেন মডেল শুনে/দেখে বলল", run_open(src, question, work), ""]
    except BaseException:
        res += ["## ওপেন মডেল ব্যর্থ", "```", traceback.format_exc()[-1500:], "```", ""]
    open(os.path.join(jobdir, "result.md"), "w", encoding="utf-8").write("\n".join(res))
    print("\n".join(res))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "job")
