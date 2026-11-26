# measure4.py — measure3 + ctc_chunk (টুকরো-ডিকোড)। ব্যবহার: python3 -I measure4.py in.json out.json
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ctc_chunk as K, measure3 as M3
M3.C.words = K.words
if __name__ == '__main__': M3.run(json.load(open(sys.argv[1])), sys.argv[2])
