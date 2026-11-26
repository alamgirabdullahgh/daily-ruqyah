# ফল: input.mp3
প্রশ্ন: এই অডিওতে কী শব্দ শোনা যায়? কে কী বলছে? বাংলায় লিখো।

## Whisper ব্যর্থ
```
src, vad_filter=False, word_timestamps=False)
                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/opt/hostedtoolcache/Python/3.12.16/x64/lib/python3.12/site-packages/faster_whisper/transcribe.py", line 876, in transcribe
    audio = decode_audio(audio, sampling_rate=sampling_rate)
            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/opt/hostedtoolcache/Python/3.12.16/x64/lib/python3.12/site-packages/faster_whisper/audio.py", line 46, in decode_audio
    with av.open(input_file, mode="r", metadata_errors="ignore") as container:
         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "av/container/core.py", line 479, in av.container.core.open
    def open(
TypeError: open() got an unexpected keyword argument 'metadata_errors'

```


(চলমান — আংশিক ফল)
```
total        used        free      shared  buff/cache   available
Mem:           15983        4663        6044          46        5665       11319
Filesystem      Size  Used Avail Use% Mounted on
/dev/root       145G   62G   83G  43% /
/dev/root       145G   62G   83G  43% /
```