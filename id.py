import asyncio, glob, json
from shazamio import Shazam
async def main():
    sh = Shazam(); out = []
    for f in sorted(glob.glob("cut/p*.wav")):
        try:
            r = await sh.recognize(f)
            tr = r.get("track")
            out.append(f"{f}: " + (f"{tr.get('title')} — {tr.get('subtitle')} ({tr.get('url','')})" if tr else "কিছু মেলেনি"))
        except Exception as e:
            out.append(f"{f}: ত্রুটি {e}")
    open("cut/result.txt","w",encoding="utf-8").write("\n".join(out)+"\n")
    print("\n".join(out))
asyncio.run(main())
