import subprocess, glob, numpy as np, os
def fp(path):
    wav = "/tmp/x.wav"
    subprocess.run(["ffmpeg","-loglevel","error","-y","-i",path,"-ac","1","-ar","11025",wav],check=True)
    out = subprocess.run(["fpcalc","-raw","-length","600",wav],capture_output=True,text=True).stdout
    raw = [l for l in out.splitlines() if l.startswith("FINGERPRINT=")][0].split("=")[1]
    return np.array([int(x) for x in raw.split(",")],dtype=np.uint32)
def dur(path):
    return float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",path],capture_output=True,text=True).stdout.strip())
def sim(a,b):
    # সব অফসেটে ফিঙ্গারপ্রিন্টের বিট-মিল; সেরা অফসেট (প্রতি আইটেম ≈0.124 সেকেন্ড)
    best=(0,0)
    for off in range(-len(b)+60,len(a)-60):
        if off>=0: x,y=a[off:],b
        else: x,y=a,b[-off:]
        n=min(len(x),len(y))
        if n<60: continue
        v=np.bitwise_xor(x[:n],y[:n])
        bits=np.unpackbits(v.view(np.uint8)).reshape(n,32).sum(1)
        s=1-bits.mean()/32
        if s>best[0]: best=(s,off)
    return best
mine="dua/adhan.mp3"; A=fp(mine); lines=[f"আমার ফাইল: {mine}, দৈর্ঘ্য {dur(mine):.1f}s"]
for f in sorted(glob.glob("work/*")):
    try:
        B=fp(f); s,off=sim(A,B)
        lines.append(f"{os.path.basename(f)}: দৈর্ঘ্য {dur(f):.1f}s, মিল {s*100:.1f}% (অফসেট {off*0.1238:.1f}s) [র‍্যান্ডম ≈৫০%, একই রেকর্ডিং ≈৮০%+]")
    except Exception as e:
        lines.append(f"{f}: ত্রুটি {e}")
open("res/compare.txt","w",encoding="utf-8").write("\n".join(lines)+"\n"); print("\n".join(lines))
