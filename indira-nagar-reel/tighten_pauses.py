# word-guided pause removal: in every inter-word gap, cut low-energy (silence/breath) frames down to a target length
import numpy as np, subprocess, sys, json
SR=48000; HOP=480
def load(f):
    raw=subprocess.run(["ffmpeg","-v","error","-i",f,"-ar",str(SR),"-ac","1","-f","f32le","-"],capture_output=True).stdout
    return np.frombuffer(raw,np.float32).copy()
out_path=sys.argv[1]; pairs=sys.argv[2:]
chunks=[]
for fi in range(0,len(pairs),2):
    x=load(pairs[fi]); W=json.load(open(pairs[fi+1]))
    n=len(x)//HOP; db=20*np.log10(np.sqrt(np.mean(x[:n*HOP].reshape(n,HOP)**2,1)+1e-12))
    sp=np.percentile(db,90); quiet=db<sp-24
    def fr(t): return int(np.clip(t*100,0,n-1))
    # first speech onset / last offset
    a0=fr(W[0][0]-0.3)
    while a0<n and quiet[a0]: a0+=1
    z=fr(W[-1][1]+0.5)
    while z>0 and quiet[z]: z-=1
    cuts=[]
    for i in range(len(W)-1):
        e,s=W[i][1],W[i+1][0]
        lo,hi=fr(min(e,s)-0.12),fr(s+0.04)
        # longest quiet run inside window
        best=(0,0); j=lo
        while j<hi:
            if quiet[j]:
                k=j
                while k<hi and quiet[k]: k+=1
                if k-j>best[1]-best[0]: best=(j,k)
                j=k
            else: j+=1
        L=(best[1]-best[0])/100
        w=W[i][2]
        tgt=0.30 if w.endswith(('.','?','!')) else (0.18 if w.endswith(',') else 0.08)
        if L>tgt+0.03:
            mid=(best[0]+best[1])/2/100
            cuts.append((mid-(L-tgt)/2, mid+(L-tgt)/2))
    t0=max(a0/100-0.05,0); t1=min(z/100+0.12,len(x)/SR)
    keep=[];cur=t0
    for c in cuts:
        if c[0]>cur: keep.append((cur,c[0]))
        cur=max(cur,c[1])
    keep.append((cur,t1))
    xf=int(SR*0.006)
    for a,b in keep:
        seg=x[int(a*SR):int(b*SR)].copy()
        seg[:xf]*=np.linspace(0,1,xf); seg[-xf:]*=np.linspace(1,0,xf)
        chunks.append(seg)
    chunks.append(np.zeros(int(SR*0.30),np.float32))
    print(pairs[fi], "cuts", len(cuts), "removed %.2fs"%sum(b-a for a,b in cuts))
y=np.concatenate(chunks[:-1]+[np.zeros(int(SR*0.2),np.float32)])
print("dur %.2f"%(len(y)/SR))
subprocess.run(["ffmpeg","-v","error","-y","-f","f32le","-ar",str(SR),"-ac","1","-i","-",out_path],input=y.tobytes())
