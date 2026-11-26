#!/usr/bin/env python3
"""GitHub Actions-এ চলে (পাবলিক রিপোয় সীমাহীন ফ্রি)। ফল: <out>/result.md + ছবি।
১) মাপ+ছবি (ffmpeg)  ২) Whisper (ওপেন-সোর্স, কী লাগে না) শব্দ-সময়সহ লেখা
৩) GEMINI_API_KEY থাকলে ও কোটা থাকলে Gemini-র শুনে/দেখে দেওয়া উত্তর (ব্যর্থ হলে বাদ, বাকিটা থাকে)।"""
import argparse, glob, json, os, subprocess, sys, traceback
sys.path.insert(0, os.path.dirname(__file__))
import senses

ap = argparse.ArgumentParser()
ap.add_argument("indir"); ap.add_argument("out")
ap.add_argument("--question", default=""); ap.add_argument("--lang", default="")
ap.add_argument("--model", default="medium"); ap.add_argument("--fps", default="1")
a = ap.parse_args()
os.makedirs(a.out, exist_ok=True)
files = [f for f in sorted(glob.glob(a.indir + "/*")) if os.path.isfile(f) and not f.endswith(".keep")]
if not files:
    sys.exit("ইনপুট ফাইল নেই: " + a.indir)
src = files[0]
res = [f"# ফল: {os.path.basename(src)}", f"প্রশ্ন: {a.question}", ""]
is_video = bool(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_type", "-of", "csv=p=0", src], capture_output=True, text=True).stdout.strip()) \
    and not src.lower().endswith((".mp3", ".wav", ".m4a", ".ogg", ".opus", ".flac", ".aac"))

# ১) মাপ
try:
    import io, contextlib
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        senses.local(src, a.out)
    res += ["## মাপে দেখা গেল", buf.getvalue().strip(), ""]
except BaseException as e:
    res += ["## মাপ ব্যর্থ", repr(e), ""]

# ২) Whisper
try:
    from faster_whisper import WhisperModel
    wav = os.path.join(a.out, "audio16k.wav")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", src, "-vn", "-ac", "1", "-ar", "16000", wav], check=True)
    m = WhisperModel(a.model, device="cpu", compute_type="int8")
    segs, info = m.transcribe(wav, language=a.lang or None, word_timestamps=True, vad_filter=False, beam_size=5)
    words, lines = [], []
    for s in segs:
        lines.append(f"[{s.start:7.2f} – {s.end:7.2f}] {s.text.strip()}")
        for w in s.words or []:
            words.append({"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3), "p": round(w.probability, 2)})
    json.dump(words, open(os.path.join(a.out, "words.json"), "w"), ensure_ascii=False)
    os.remove(wav)
    res += [f"## Whisper ({a.model}) শুনে লিখল — ভাষা: {info.language} ({info.language_probability:.2f})"] + (lines or ["(কোনো কথা ধরা পড়েনি)"]) + ["", "(শব্দ-সময়: words.json)", ""]
except BaseException:
    res += ["## Whisper ব্যর্থ", "```", traceback.format_exc()[-1500:], "```", ""]

# ৩) Gemini (ঐচ্ছিক)
if os.environ.get("GEMINI_API_KEY"):
    try:
        mdl, ans = senses.ask(src, a.question or "কী শোনা/দেখা যায়, সময়সহ বলো", fps=float(a.fps) if is_video else None)
        res += [f"## Gemini ({mdl}) শুনে/দেখে বলল", ans, ""]
    except BaseException as e:
        res += ["## Gemini হয়নি (কোটা/কী/নেট)", repr(e)[:300], ""]
else:
    res += ["## Gemini: কী নেই, বাদ", ""]

open(os.path.join(a.out, "result.md"), "w").write("\n".join(res))
print("\n".join(res))
