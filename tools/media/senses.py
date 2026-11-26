#!/usr/bin/env python3
"""অডিও শোনা ও ভিডিও দেখার টুল (শুধু Python স্ট্যান্ডার্ড লাইব্রেরি; `local`-এ ffmpeg লাগে)।

  python3 tools/media/senses.py check
  python3 tools/media/senses.py ask <ফাইল বা YouTube-লিংক> "<প্রশ্ন>" [--fps 5] [--model নাম]
  python3 tools/media/senses.py local <ফাইল> [আউটপুট-ফোল্ডার]

ask   : আসল অডিও/ভিডিও ফাইল Google Gemini-তে যায়; Gemini শুনে/দেখে লিখে উত্তর দেয়।
        GEMINI_API_KEY (পরিবেশ-চলক) ও generativelanguage.googleapis.com-এ নেট লাগে।
local : নেট/কী ছাড়া: দৈর্ঘ্য, জোর, নীরব অংশ মাপে এবং ছবি বানায় (Read দিয়ে দেখা যায়)।
        এটা মাপ ও রূপান্তর, শোনা নয়।

প্রস্থান-কোড: 0 ঠিক, 1 ভুল, 2 কী নেই বা নেট বন্ধ।
"""
import argparse
import base64
import json
import mimetypes
import os
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request

HOST = "https://generativelanguage.googleapis.com"
MODELS = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-flash-latest"]
INLINE_LIMIT = 14 * 1024 * 1024  # base64-এর পর ২০MB-এর নিচে থাকে
MIME = {
    ".mp3": "audio/mp3", ".wav": "audio/wav", ".ogg": "audio/ogg", ".opus": "audio/ogg",
    ".flac": "audio/flac", ".aac": "audio/aac", ".m4a": "audio/mp4", ".aiff": "audio/aiff",
    ".mp4": "video/mp4", ".mov": "video/quicktime", ".webm": "video/webm",
    ".avi": "video/x-msvideo", ".mpeg": "video/mpeg", ".3gp": "video/3gpp",
    ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
}


class Unavailable(Exception):
    """কী নেই বা নেট বন্ধ।"""


def base_url():
    """আসল ঠিকানা; পরীক্ষার জন্য শুধু localhost বদলি মানে (কী অন্যত্র যাবে না)।"""
    b = os.environ.get("GEMINI_BASE_URL", HOST).rstrip("/")
    if b != HOST and urllib.parse.urlparse(b).hostname not in ("127.0.0.1", "localhost"):
        raise SystemExit("GEMINI_BASE_URL শুধু localhost হতে পারে")
    return b


def key():
    k = os.environ.get("GEMINI_API_KEY", "").strip()
    if not k:
        raise Unavailable("GEMINI_API_KEY নেই। aistudio.google.com থেকে কী বানিয়ে ওয়ার্কস্পেসের "
                          "পরিবেশ-চলকে বসাতে হবে (ফাইল/কমিটে নয়)।")
    return k


def request(url, data=None, headers=None, method=None, timeout=600):
    req = urllib.request.Request(url, data=data, headers=headers or {}, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.read(), r.headers
    except urllib.error.HTTPError:
        raise
    except urllib.error.URLError as e:
        raise Unavailable(f"Gemini-তে পৌঁছানো যাচ্ছে না ({e.reason})। প্রক্সি 403 দিলে এই ওয়ার্কস্পেসের "
                          "নেট-নীতি ঠিকানাটা বন্ধ রেখেছে; পাশ কাটিও না, মালিককে অনুমতি দিতে বলো: "
                          "generativelanguage.googleapis.com")


def api(path, body=None, method=None):
    h = {"x-goog-api-key": key()}
    data = None
    if body is not None:
        h["Content-Type"] = "application/json"
        data = json.dumps(body).encode()
    raw, _ = request(f"{base_url()}/{path}", data, h, method)
    return json.loads(raw or b"{}")


def upload(path, mime):
    """Files API (বড় ফাইল)।"""
    size = os.path.getsize(path)
    _, h = request(
        f"{base_url()}/upload/v1beta/files",
        json.dumps({"file": {"display_name": os.path.basename(path)}}).encode(),
        {"x-goog-api-key": key(), "Content-Type": "application/json",
         "X-Goog-Upload-Protocol": "resumable", "X-Goog-Upload-Command": "start",
         "X-Goog-Upload-Header-Content-Length": str(size),
         "X-Goog-Upload-Header-Content-Type": mime}, "POST")
    up = h.get("x-goog-upload-url")
    if not up:
        raise SystemExit("আপলোড-ঠিকানা পাওয়া যায়নি")
    with open(path, "rb") as f:
        raw, _ = request(up, f, {"Content-Length": str(size), "X-Goog-Upload-Offset": "0",
                                 "X-Goog-Upload-Command": "upload, finalize"}, "POST")
    info = json.loads(raw)["file"]
    for _ in range(300):
        if info.get("state") != "PROCESSING":
            break
        time.sleep(2)
        info = api(f"v1beta/{info['name']}")
    if info.get("state") not in (None, "ACTIVE"):
        raise SystemExit(f"ফাইল প্রস্তুত হয়নি: {info.get('state')}")
    return info


def media_part(src, fps):
    """(অংশ, পরে মোছার ফাইল-নাম বা None)।"""
    uploaded = None
    if src.startswith(("http://", "https://")):
        host = urllib.parse.urlparse(src).hostname or ""
        if not (host == "youtu.be" or host == "youtube.com" or host.endswith(".youtube.com")):
            raise SystemExit("লিংক হিসেবে শুধু YouTube চলে; অন্য ক্ষেত্রে ফাইল দাও")
        part = {"file_data": {"file_uri": src}}
        mime = "video/*"
    else:
        if not os.path.isfile(src):
            raise SystemExit(f"ফাইল নেই: {src}")
        mime = MIME.get(os.path.splitext(src)[1].lower()) or mimetypes.guess_type(src)[0]
        if not mime or mime.split("/")[0] not in ("audio", "video", "image"):
            raise SystemExit("অডিও/ভিডিও/ছবি ফাইল নয়")
        key()  # কী না থাকলে ফাইল পড়ার আগেই থামো
        if os.path.getsize(src) <= INLINE_LIMIT:
            with open(src, "rb") as f:
                part = {"inline_data": {"mime_type": mime, "data": base64.b64encode(f.read()).decode()}}
        else:
            info = upload(src, mime)
            uploaded = info["name"]
            part = {"file_data": {"mime_type": mime, "file_uri": info["uri"]}}
    if fps and mime.startswith("video/"):
        part["video_metadata"] = {"fps": fps}
    return part, uploaded


def ask(src, question, fps=None, model=None):
    model = model or os.environ.get("GEMINI_MODEL")
    part, uploaded = media_part(src, fps)
    body = {"contents": [{"parts": [part, {"text": question}]}]}
    errors = []
    try:
        for m in ([model] if model else MODELS):
            try:
                j = api(f"v1beta/models/{m}:generateContent", body, "POST")
            except urllib.error.HTTPError as e:
                msg = e.read().decode(errors="replace")[:300]
                errors.append(f"{m}: HTTP {e.code} {msg}")
                if e.code in (404, 429, 500, 503):  # পরের মডেল চেষ্টা
                    continue
                break
            cand = (j.get("candidates") or [{}])[0]
            text = "".join(p.get("text", "") for p in cand.get("content", {}).get("parts", []))
            if text.strip():
                return m, text.strip()
            errors.append(f"{m}: খালি উত্তর ({cand.get('finishReason') or j.get('promptFeedback')})")
        raise SystemExit("Gemini উত্তর দেয়নি:\n" + "\n".join(errors))
    finally:
        if uploaded:  # গুগলের সার্ভারে ফাইল রেখে দিও না
            try:
                api(f"v1beta/{uploaded}", method="DELETE")
            except Exception as e:  # ৪৮ ঘণ্টায় এমনিই মুছে যায়
                print(f"(আপলোড মোছা যায়নি: {type(e).__name__})", file=sys.stderr)


def check():
    problems = []
    has_key = bool(os.environ.get("GEMINI_API_KEY", "").strip())
    print("GEMINI_API_KEY :", "আছে" if has_key else "নেই")
    if not has_key:
        problems.append("কী")
    try:
        headers = {"x-goog-api-key": key()} if has_key else {}
        request(f"{base_url()}/v1beta/models?pageSize=1", headers=headers, timeout=20)
        print("নেট            : খোলা")
    except urllib.error.HTTPError as e:  # সার্ভার পর্যন্ত পৌঁছেছে
        print("নেট            : খোলা")
        if has_key:
            print(f"কী কাজ করছে না : HTTP {e.code}")
            problems.append("কী অচল")
    except Unavailable as e:
        print("নেট            : বন্ধ —", e)
        problems.append("নেট")
    print("ffmpeg         :", "আছে" if shutil.which("ffmpeg") else "নেই")
    if problems:
        print(f"ফল: `ask` এখন চলবে না ({', '.join(problems)})। `local` ব্যবহার করো।")
        return 2
    print("ফল: `ask` চালানোর জন্য প্রস্তুত।")
    return 0


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True, errors="replace")


def local(src, out=None):
    if not os.path.isfile(src):
        raise SystemExit(f"ফাইল নেই: {src}")
    if not (shutil.which("ffmpeg") and shutil.which("ffprobe")):
        raise SystemExit("ffmpeg/ffprobe দরকার")
    src = os.path.abspath(src)
    out = out or tempfile.mkdtemp(prefix="senses-")
    os.makedirs(out, exist_ok=True)
    probe = run(["ffprobe", "-v", "error", "-show_entries",
                 "format=duration:stream=codec_type,codec_name,width,height,sample_rate,channels",
                 "-of", "json", src])
    if probe.returncode:
        raise SystemExit("ফাইল পড়া যায়নি: " + probe.stderr.strip()[:300])
    info = json.loads(probe.stdout)
    dur = float(info.get("format", {}).get("duration") or 0)
    kinds = {s.get("codec_type") for s in info.get("streams", [])}
    print(f"দৈর্ঘ্য: {dur:.2f} সেকেন্ড")
    for s in info.get("streams", []):
        print("ধারা:", ", ".join(f"{k}={v}" for k, v in s.items()))
    made = []
    if "audio" in kinds:
        r = run(["ffmpeg", "-hide_banner", "-nostats", "-i", src, "-vn", "-af",
                 "silencedetect=noise=-35dB:d=0.25,volumedetect", "-f", "null", "-"])
        for line in r.stderr.splitlines():
            if any(t in line for t in ("silence_start", "silence_end", "mean_volume", "max_volume")):
                print(line.split("] ", 1)[-1])
        for name, flt in (("spectrogram.png", "showspectrumpic=s=1600x600:legend=1"),
                          ("waveform.png", "showwavespic=s=1600x300")):
            p = os.path.join(out, name)
            if run(["ffmpeg", "-y", "-v", "error", "-i", src, "-lavfi", flt,
                    "-frames:v", "1", p]).returncode == 0:
                made.append(p)
    if "video" in kinds:
        step = max(dur / 24, 0.04)
        p = os.path.join(out, "frames.png")
        r = run(["ffmpeg", "-y", "-v", "error", "-i", src, "-an", "-vf",
                 f"fps=1/{step:.4f},scale=320:-2,tile=4x6", "-frames:v", "1", p])
        if r.returncode == 0 and os.path.exists(p):
            made.append(p)
            print(f"frames.png: প্রায় প্রতি {step:.2f} সেকেন্ডে একটি ছবি, বাঁ থেকে ডানে")
    for p in made:
        print("ছবি (Read দিয়ে দেখো):", p)
    return 0


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("check")
    a = sub.add_parser("ask")
    a.add_argument("source")
    a.add_argument("question")
    a.add_argument("--fps", type=float, help="ভিডিওতে সেকেন্ডে কয়টি ছবি (ডিফল্ট ১, সর্বোচ্চ ২৪)")
    a.add_argument("--model")
    l = sub.add_parser("local")
    l.add_argument("file")
    l.add_argument("outdir", nargs="?")
    args = ap.parse_args(argv)
    try:
        if args.cmd == "check":
            return check()
        if args.cmd == "local":
            return local(args.file, args.outdir)
        model, text = ask(args.source, args.question, args.fps, args.model)
        print(f"[{model} শুনে/দেখে বলেছে]\n{text}")
        return 0
    except Unavailable as e:
        print(e, file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
