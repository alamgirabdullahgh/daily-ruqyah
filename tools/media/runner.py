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
MAX_SEGMENTS = 10**6  # সীমা নেই (শুধু ৬ ঘণ্টার জব-সীমা)
FRAMES = 6          # প্রতি অংশে ছবি
IMG_EXT = (".png", ".jpg", ".jpeg", ".webp")


def sh(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, errors="replace", **kw)


# চিন্তা (thinking) বন্ধের চেষ্টা: যে ফ্ল্যাগ বাইনারি চেনে না, সেটা বাদ দিয়ে আবার চলে
OPTIONAL_FLAGS = [
    ["--chat-template-kwargs", '{"enable_thinking":false}'],
    ["--reasoning-budget", "0"],
]


def run_with_fallback(base, optional, **kw):
    """optional ফ্ল্যাগসহ চালায়; 'invalid argument: X' এলে ওই ফ্ল্যাগ বাদ দিয়ে আবার।"""
    opts = [list(o) for o in optional]
    while True:
        cmd = list(base)
        # ফ্ল্যাগগুলো -p-র আগে বসাতে: base-এর শেষ দুটো ["-p", prompt]
        cmd = cmd[:-2] + [x for o in opts for x in o] + cmd[-2:]
        p = sh(cmd, **kw)
        bad = re.search(r"invalid argument: (\S+)", p.stderr or "")
        if p.returncode and bad:
            keep = [o for o in opts if o[0] != bad.group(1)]
            if len(keep) < len(opts):
                opts = keep
                continue
        return p, opts


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


def resources():
    """মেমরি/ডিস্কের হিসাব (রানার মাঝপথে মরলে কারণ বোঝার জন্য)।"""
    a = sh(["free", "-m"]).stdout.strip().splitlines()[:2]
    b = sh(["df", "-h", "/", os.path.expanduser("~")]).stdout.strip().splitlines()[:3]
    return "\n".join(a + b)


def push_partial(jobdir, note):
    """Actions-এর ভেতরে চললে result.md রিপোতে পুশ করে; থেমে গেলেও ফল থাকে।"""
    if not os.environ.get("GITHUB_ACTIONS"):
        return
    ref = os.environ.get("GITHUB_REF", "")
    sh(["git", "config", "user.name", "github-actions"])
    sh(["git", "config", "user.email", "actions@github.com"])
    sh(["git", "add", "-f", os.path.join(jobdir, "result.md")])
    sh(["git", "commit", "-qm", "media partial: " + note])
    sh(["git", "pull", "-q", "--rebase", "origin", ref.replace("refs/heads/", "")])
    sh(["git", "push", "-q", "origin", "HEAD:" + ref])


def fmt(t):
    return f"{int(t // 60):02d}:{t % 60:05.2f}"


def run_open(src, question, work, model=None):
    model = model or OPEN_MODEL
    cli, libdir, asset = llama_cli(work)
    env = dict(os.environ)
    env["LD_LIBRARY_PATH"] = libdir + ":" + env.get("LD_LIBRARY_PATH", "")
    segs, has_audio = segments(src, work)
    lines = [f"(ওপেন মডেল: {model}, llama.cpp: {asset}; {len(segs)} অংশ)", ""]
    for n, (a, b, imgs) in enumerate(segs):
        cmd = [cli, "-hf", model, "--jinja", "-n", "1200", "--temp", "0.2"]
        for f in imgs:
            cmd += ["--image", f]
        if has_audio:
            wav = cut_audio(src, a, b - a, work, n)
            if wav:
                cmd += ["--audio", wav]
        prompt = "<__media__>" * (len(imgs) + (1 if "--audio" in cmd else 0)) + question
        if len(segs) > 1:
            prompt += f"\n(এটা পুরো ফাইলের {fmt(a)} – {fmt(b)} অংশ। শুধু এই অংশ নিয়ে বলো।)"
        cmd += ["-p", prompt]
        p, used = run_with_fallback(cmd, OPTIONAL_FLAGS, env=env, timeout=1500)
        text = (p.stdout or "").strip()
        if p.returncode or not text:
            text = f"(ব্যর্থ: কোড {p.returncode}) " + (p.stderr or "")[-400:]
        diag = [l for l in (p.stderr or "").splitlines()
                if any(k in l.lower() for k in ("audio", "mmproj", "projector", "clip", "mtmd", "unsupported", "warn", "error", "image"))]
        lines += [f"### {fmt(a)} – {fmt(b)}", text, ""]
        if diag:
            lines += ["<details><summary>নির্ণয় (stderr)</summary>", "", "```", "\n".join(diag[-25:]), "```", "</details>", ""]
    return "\n".join(lines)


ENSEMBLE = [   # সব ফ্রি ওপেন-ওয়েট মডেল; একটা ব্যর্থ হলে বাকিগুলো চলে (অডিও-সক্ষম ছোটগুলো আগে)
    "ggml-org/Qwen2.5-Omni-3B-GGUF",
    "ggml-org/Voxtral-Mini-3B-2507-GGUF",
    "ggml-org/gemma-4-E4B-it-GGUF",
    "ggml-org/Qwen2.5-Omni-7B-GGUF",
    "ggml-org/Qwen2.5-VL-7B-Instruct-GGUF",   # ভিডিওর ছবি দেখার জন্য
    "ggml-org/gemma-3-12b-it-GGUF",
]


def run_whisper(src):
    from faster_whisper import WhisperModel
    last = None
    for name in ("large-v3", "small"):
        try:
            m = WhisperModel(name, device="cpu", compute_type="int8")
            segs, info = m.transcribe(src, vad_filter=False, word_timestamps=False)
            segs = list(segs)
            break
        except Exception as e:   # মেমরি/ডাউনলোড সমস্যায় ছোট মডেল
            last = e
    else:
        raise last
    out = [f"(Whisper {name}; ভাষা: {info.language} {info.language_probability:.2f})", ""]
    if not segs:
        out.append("(কোনো কথা ধরা পড়েনি)")
    for g in segs:
        out.append(f"[{fmt(g.start)} – {fmt(g.end)}] {g.text.strip()}")
    return "\n".join(out)


def run_all(src, question, work, save=lambda t: None):
    res = []
    save("(শুরু: Whisper চলছে)")
    try:
        res += ["## Whisper (ট্রান্সক্রিপশন)", run_whisper(src), ""]
    except BaseException:
        res += ["## Whisper ব্যর্থ", "```", traceback.format_exc()[-800:], "```", ""]
    save("\n".join(res))
    for m in ENSEMBLE:
        try:
            res += [f"## {m}", run_open(src, question, work, m), ""]
            sh(["rm", "-rf", os.path.expanduser("~/.cache/llama.cpp")])   # ১৪GB ডিস্ক বাঁচাতে
        except BaseException:
            res += [f"## {m} ব্যর্থ", "```", traceback.format_exc()[-800:], "```", ""]
        save("\n".join(res))
    res += ["## তুলনার নোট", "মডেলগুলোর উত্তর আলাদা রাখা হয়েছে; যেখানে অমিল, সেখানে কোনোটাকেই যাচাই-হওয়া ধরা হয়নি। সময়ের জন্য Whisper-এর টাইমস্ট্যাম্প বেশি ভরসাযোগ্য; কুরআনের চূড়ান্ত যাচাই মালিকের কানে।"]
    return "\n".join(res)


def main(jobdir):
    req = json.load(open(os.path.join(jobdir, "request.json"), encoding="utf-8"))
    src = os.path.join(jobdir, req["file"])
    question = req.get("question") or "কী শোনা/দেখা যায়, সময়সহ বলো"
    res = [f"# ফল: {req['file']}", f"প্রশ্ন: {question}", ""]
    try:
        with tempfile.TemporaryDirectory() as work:
            def save(t):
                open(os.path.join(jobdir, "result.md"), "w", encoding="utf-8").write(
                    "\n".join(res + [t, "", "(চলমান — আংশিক ফল)", "```", resources(), "```"]))
                push_partial(jobdir, "ধাপ শেষ")
            res += [run_all(src, question, work, save)]
    except BaseException:
        res += ["## ওপেন মডেল ব্যর্থ", "```", traceback.format_exc()[-1500:], "```", ""]
    open(os.path.join(jobdir, "result.md"), "w", encoding="utf-8").write("\n".join(res))
    print("\n".join(res))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "job")
