# ফল: input.mp3
প্রশ্ন: কী শব্দ শোনা যায়? কে কী বলছে?

## Whisper ব্যর্থ
```
ily-ruqyah/daily-ruqyah/tools/media/runner.py", line 133, in run_whisper
    segs, info = m.transcribe(src, vad_filter=True, word_timestamps=False)
                 ~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/runner/.local/lib/python3.14/site-packages/faster_whisper/transcribe.py", line 876, in transcribe
    audio = decode_audio(audio, sampling_rate=sampling_rate)
  File "/home/runner/.local/lib/python3.14/site-packages/faster_whisper/audio.py", line 46, in decode_audio
    with av.open(input_file, mode="r", metadata_errors="ignore") as container:
         ~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "av/container/core.py", line 479, in av.container.core.open
    def open(
TypeError: open() got an unexpected keyword argument 'metadata_errors'

```

## ggml-org/gemma-4-E4B-it-GGUF
(ওপেন মডেল: ggml-org/gemma-4-E4B-it-GGUF, llama.cpp: llama-b12778-bin-ubuntu-x64.tar.gz; 1 অংশ)

### 00:00.00 – 00:05.00
(ব্যর্থ: কোড 1) error: invalid argument: --reasoning-budget


<details><summary>নির্ণয় (stderr)</summary>

```
error: invalid argument: --reasoning-budget
```
</details>


## ggml-org/Qwen2.5-Omni-3B-GGUF
(ওপেন মডেল: ggml-org/Qwen2.5-Omni-3B-GGUF, llama.cpp: llama-b12778-bin-ubuntu-x64.tar.gz; 1 অংশ)

### 00:00.00 – 00:05.00
(ব্যর্থ: কোড 1) error: invalid argument: --reasoning-budget


<details><summary>নির্ণয় (stderr)</summary>

```
error: invalid argument: --reasoning-budget
```
</details>


## ggml-org/Voxtral-Mini-3B-2507-GGUF
(ওপেন মডেল: ggml-org/Voxtral-Mini-3B-2507-GGUF, llama.cpp: llama-b12778-bin-ubuntu-x64.tar.gz; 1 অংশ)

### 00:00.00 – 00:05.00
(ব্যর্থ: কোড 1) error: invalid argument: --reasoning-budget


<details><summary>নির্ণয় (stderr)</summary>

```
error: invalid argument: --reasoning-budget
```
</details>


## তুলনার নোট
মডেলগুলোর উত্তর আলাদা রাখা হয়েছে; যেখানে অমিল, সেখানে কোনোটাকেই যাচাই-হওয়া ধরা হয়নি। সময়ের জন্য Whisper-এর টাইমস্ট্যাম্প বেশি ভরসাযোগ্য; কুরআনের চূড়ান্ত যাচাই মালিকের কানে।