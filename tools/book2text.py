#!/usr/bin/env python3
"""PDF -> পৃষ্ঠার ছবি -> OCR (Tesseract LSTM, imagetotext.my-র একই ইঞ্জিন) -> JSON + TXT।
একসাথে সর্বোচ্চ ১০ পৃষ্ঠা (BATCH) ছবি বানানো ও OCR হয়; ব্যাচ শেষ হলেই ছবি মুছে যায়।
ব্যবহার: book2text.py বই.pdf [--name নাম] [--lang ben+eng] [--dpi 300] [--first N] [--last N]
ফলাফল: output/<নাম>.txt (সব পৃষ্ঠা) এবং output/<নাম>.json (পৃষ্ঠাভিত্তিক লেখা + confidence)।
আবার চালালে আগের শেষ হওয়া ব্যাচ থেকে চলে (work/<নাম>/batch-*.json)।"""
import argparse, json, os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

BATCH = 10  # একসাথে দশটির বেশি পৃষ্ঠা নয়

def run(cmd, **kw):
    return subprocess.run(cmd, check=True, capture_output=True, **kw)

def page_count(pdf):
    out = run(["pdfinfo", pdf]).stdout.decode("utf-8", "ignore")
    return int(re.search(r"^Pages:\s+(\d+)", out, re.M).group(1))

def ocr_image(img, lang):
    base = img[:-4]
    run(["tesseract", img, base, "-l", lang, "--oem", "1", "--psm", "3", "txt", "tsv"])  # একবারেই লেখা ও confidence
    words, conf = [], []
    for ln in open(base + ".tsv", encoding="utf-8").read().split("\n")[1:]:
        c = ln.split("\t")
        if len(c) >= 12 and c[0] == "5" and c[11].strip():
            words.append(c[11]); 
            try:
                v = float(c[10])
                if v >= 0: conf.append(v)
            except ValueError: pass
    text = open(base + ".txt", encoding="utf-8").read().strip()
    return text, round(sum(conf) / len(conf), 1) if conf else 0.0

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf"); ap.add_argument("--name"); ap.add_argument("--lang", default="ben+eng")
    ap.add_argument("--dpi", type=int, default=300); ap.add_argument("--first", type=int, default=1)
    ap.add_argument("--last", type=int, default=0); ap.add_argument("--jobs", type=int, default=0)
    a = ap.parse_args()
    name = re.sub(r'[\\/:*?"<>|]+', "_", a.name or os.path.splitext(os.path.basename(a.pdf))[0]).strip()
    total = page_count(a.pdf); first = max(1, a.first); last = min(total, a.last or total)
    jobs = a.jobs or os.cpu_count() or 2
    wdir = os.path.join("work", name); os.makedirs(wdir, exist_ok=True); os.makedirs("output", exist_ok=True)
    print(f"{name}: মোট {total} পৃষ্ঠা, OCR {first}-{last}, ভাষা {a.lang}, {a.dpi} DPI", flush=True)
    for s in range(first, last + 1, BATCH):
        e = min(s + BATCH - 1, last); bj = os.path.join(wdir, f"batch-{s:05d}.json")
        if os.path.exists(bj): print(f"  পৃষ্ঠা {s}-{e}: আগেই হয়েছে", flush=True); continue
        tmp = tempfile.mkdtemp(prefix="pg-")
        try:
            run(["pdftoppm", "-r", str(a.dpi), "-png", "-f", str(s), "-l", str(e), a.pdf, os.path.join(tmp, "p")])
            imgs = sorted(f for f in os.listdir(tmp) if f.endswith(".png"))
            with ThreadPoolExecutor(jobs) as ex:
                res = list(ex.map(lambda f: ocr_image(os.path.join(tmp, f), a.lang), imgs))
            pages = []
            for f, (t, c) in zip(imgs, res):
                n = int(re.search(r"-(\d+)\.png$", f).group(1))
                pages.append({"page": n, "confidence": c, "text": t})
            json.dump(pages, open(bj, "w", encoding="utf-8"), ensure_ascii=False)
            print(f"  পৃষ্ঠা {s}-{e} শেষ", flush=True)
        finally:
            shutil.rmtree(tmp, ignore_errors=True)
    pages = []
    for f in sorted(os.listdir(wdir)):
        if f.startswith("batch-"): pages += json.load(open(os.path.join(wdir, f), encoding="utf-8"))
    pages.sort(key=lambda p: p["page"])
    json.dump({"name": name, "lang": a.lang, "dpi": a.dpi, "total_pages": total, "pages": pages},
              open(f"output/{name}.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    with open(f"output/{name}.txt", "w", encoding="utf-8") as o:
        for p in pages: o.write(p["text"] + "\n\n")
    print(f"✅ output/{name}.txt ও .json ({len(pages)} পৃষ্ঠা)")

if __name__ == "__main__":
    main()
