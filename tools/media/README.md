# অডিও শোনা ও ভিডিও দেখা: `senses.py`

## ব্যবহার
```
python3 tools/media/senses.py check                      # কী আর নেট ঠিক আছে কি না
python3 tools/media/senses.py ask clip.mp3 "কী কী শব্দ শোনা যায়? কোথাও কাটা পড়েছে?"
python3 tools/media/senses.py ask video.mp4 "পর্দায় ও শব্দে কী ঘটছে, সময়সহ বলো" --fps 5
python3 tools/media/senses.py local clip.mp3             # নেট/কী ছাড়া: মাপ + ছবি
```

## `ask` চালু করতে মালিকের দুটো কাজ (একবার)
1. https://aistudio.google.com থেকে Gemini API কী বানানো (ফ্রি স্তর আছে)।
2. যে ওয়ার্কস্পেসে কাজ হবে সেখানে নেট-তালিকায় `generativelanguage.googleapis.com` অনুমতি দেওয়া,
   আর কী-টা `GEMINI_API_KEY` নামে পরিবেশ-চলক বা নেটওয়ার্ক-সিক্রেট হিসেবে রাখা।
   রিপো পাবলিক: কী কখনো ফাইল, কমিট বা লগে লিখবে না।

ডক অনুযায়ী (২০২৬-১১-২৬): Claude Code-এর cloud environment (Pro/Max/Team) → Network access → **Custom**-এ ডোমেইন যোগ করা যায়
(নতুন সেশনে পরীক্ষা: `check`): https://code.claude.com/docs/en/cloud-environments । ফ্রি প্ল্যানে নির্দিষ্ট ডোমেইন যোগের
উপায় সহায়তা-পাতায় পাওয়া যায়নি। স্ক্রিপ্টটি নেট আছে এমন যেকোনো কম্পিউটারেও চলে।

GitHub Actions-এর `secrets.GEMINI_API_KEY` ওয়ার্কস্পেসে আসে না।

## সীমা
- শোনে/দেখে Gemini; ওয়ার্কস্পেসের সহকারী তার লেখা উত্তর পড়ে।
- ভিডিওতে Gemini ডিফল্টে সেকেন্ডে ১টি ছবি + শব্দ নেয়; দ্রুত দৃশ্যে `--fps` বাড়াও।
- সময় মোটামুটি সেকেন্ড-স্তরের। কুরআনের মিলিসেকেন্ড-কাটে `tools/audio-cuts/`; চূড়ান্ত যাচাই মালিকের কানে।
- ফ্রি স্তরে পাঠানো ফাইল Google তাদের পণ্য উন্নয়নে ব্যবহার করতে পারে। ব্যক্তিগত/গোপন রেকর্ডিং
  মালিকের সম্মতি ছাড়া পাঠিও না।

## কেন বাইরের রিপো কপি করা হয়নি (২০২৬-১১-২৬-এ দেখা)
GitHub-এর `gadgrandez/gemini-mcp-server`, `mario-andreschak/mcp_video_recognition`,
`iceener/video-stdio-mcp` ইত্যাদির বিবরণ অনুযায়ী এগুলোরও API কী (Gemini বা সমতুল্য) ও বাইরের সার্ভারে নেট লাগে। অচেনা কোডে কী না দিয়ে
এই ছোট নিজস্ব স্ক্রিপ্ট রাখা হয়েছে।
