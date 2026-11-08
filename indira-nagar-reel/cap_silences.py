# second pass: cap any remaining silence at 0.30 s
import numpy as np,subprocess,sys
SR=48000;H=480
x=np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',sys.argv[1],'-ar',str(SR),'-ac','1','-f','f32le','-'],capture_output=True).stdout,np.float32).copy()
n=len(x)//H;db=20*np.log10(np.sqrt(np.mean(x[:n*H].reshape(n,H)**2,1)+1e-12));q=db<np.percentile(db,90)-30
cuts=[];i=0
while i<n:
  if q[i]:
    j=i
    while j<n and q[j]: j+=1
    L=(j-i)/100
    if L>0.34 and j<n: m=(i+j)/200; cuts.append((m-(L-0.30)/2,m+(L-0.30)/2))
    i=j
  else: i+=1
keep=[];cur=0
for a,b in cuts: keep.append((cur,a)); cur=b
keep.append((cur,len(x)/SR))
xf=int(SR*0.006);out=[]
for a,b in keep:
  s=x[int(a*SR):int(b*SR)].copy(); s[:xf]*=np.linspace(0,1,xf); s[-xf:]*=np.linspace(1,0,xf); out.append(s)
y=np.concatenate(out);print('cuts',[(round(a,2),round(b-a,2)) for a,b in cuts],'dur %.2f'%(len(y)/SR))
subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(SR),'-ac','1','-i','-',sys.argv[2]],input=y.tobytes())
