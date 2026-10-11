import sherpa_onnx, wave, numpy as np, json, re
d="sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8/"
rec=sherpa_onnx.OfflineRecognizer.from_transducer(encoder=d+"encoder.int8.onnx",decoder=d+"decoder.int8.onnx",joiner=d+"joiner.int8.onnx",tokens=d+"tokens.txt",model_type="nemo_transducer",num_threads=4)
w=wave.open("narr16.wav"); sr=w.getframerate(); a=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32768
T=len(a)/sr
sil=[l.split() for l in open("sil.txt")]
starts=[float(x[1]) for x in sil if x[0].startswith("silence_start")]
ends=[float(x[1]) for x in sil if x[0].startswith("silence_end")]
mids=[(s+e)/2 for s,e in zip(starts,ends)]
# chunk boundaries: greedy, max 20s
cuts=[0.0]
for m in mids:
    if m-cuts[-1]>12: cuts.append(m)
cuts.append(T)
words=[]
for s,e in zip(cuts[:-1],cuts[1:]):
    st=rec.create_stream(); st.accept_waveform(sr,a[int(s*sr):int(e*sr)]); rec.decode_stream(st)
    r=st.result
    toks=r.tokens; ts=r.timestamps
    cur=None
    for t,tt in zip(toks,ts):
        if t.startswith(" ") or cur is None:
            if cur: words.append(cur)
            cur={"w":t.strip(),"s":round(s+tt,2)}
        else: cur["w"]+=t
    if cur: words.append(cur)
    print(f"[{s:6.1f}] {r.text}",flush=True)
json.dump(words,open("words.json","w"))
