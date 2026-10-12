// Raymarched Judean landscape (WebGL2). Eroded hills, terraces, a valley road, olive trees, village houses, soft shadows, haze.
'use strict';

const TERRAIN_FS = `#version 300 es
precision highp float;
out vec4 frag;
uniform vec2 uRes;
uniform vec3 uRo, uTa;
uniform int uOct;
uniform float uFl, uTime, uExposure, uFog, uTrees, uHouses, uRoadW, uWindowGlow;
uniform vec3 uSun, uSunCol, uSkyTop, uSkyHor, uAmb, uFogCol;
uniform vec4 uVillage; // xz centre, radius, ground height
uniform int uMode;

float hash1(vec2 p){ p = 50.0*fract(p*0.3183099 + vec2(0.71,0.113)); return -1.0+2.0*fract(p.x*p.y*(p.x+p.y)); }
float hash01(vec2 p){ return 0.5+0.5*hash1(p); }
vec3 noised(vec2 x){
  vec2 p = floor(x), w = fract(x);
  vec2 u = w*w*w*(w*(w*6.0-15.0)+10.0), du = 30.0*w*w*(w*(w-2.0)+1.0);
  float a = hash1(p), b = hash1(p+vec2(1,0)), c = hash1(p+vec2(0,1)), d = hash1(p+vec2(1,1));
  float k1=b-a, k2=c-a, k4=a-b-c+d;
  return vec3(a+k1*u.x+k2*u.y+k4*u.x*u.y, du*vec2(k1+k4*u.y, k2+k4*u.x));
}
float noise(vec2 x){ return noised(x).x; }
const mat2 m2 = mat2(0.8,-0.6,0.6,0.8);

float roadX(float z){ return 22.0*sin(z/95.0) + 9.0*sin(z/41.0+1.3); }
float roadH(float z){ return 5.0*sin(z/160.0) + 2.5*sin(z/63.0); }

float hills(vec2 p, int oct){
  vec2 q = p/260.0; float a = 0.0, b = 1.0; vec2 d = vec2(0);
  for(int i=0;i<9;i++){ if(i>=oct) break; vec3 n = noised(q); d += n.yz; a += b*n.x/(1.0+dot(d,d)); b *= 0.5; q = m2*q*2.0; }
  return a;
}
float terrain(vec2 p, int oct){
  float off = abs(p.x - roadX(p.y));
  float h = 70.0*hills(p, oct) + 38.0;
  float rise = smoothstep(8.0, 160.0, off);
  h = mix(roadH(p.y), roadH(p.y) + h*1.15 + 0.12*off, rise);
  // terraces on the hill sides
  float st = 3.2, t = h/st, f = fract(t);
  float ter = (floor(t) + smoothstep(0.55, 0.95, f))*st;
  h = mix(h, ter, 0.35*smoothstep(25.0, 70.0, off));
  // village platform
  float dv = length(p - uVillage.xy);
  h = mix(h, uVillage.w, uHouses*smoothstep(uVillage.z*1.3, uVillage.z*0.7, dv));
  return h;
}

// olive trees on a jittered grid
vec2 cellTree(vec2 c){ return c + 0.5 + 0.35*vec2(hash1(c*1.7), hash1(c*2.3+4.1)); }
float treeMask(vec2 c, vec2 pos){
  float g = noise(c*0.11 + 3.0)*0.5+0.5;
  float off = abs(pos.x*9.0 - roadX(pos.y*9.0));
  return step(0.42, g) * step(0.35, hash01(c*3.1)) * step(7.0, off) * (1.0 - uHouses*step(length(pos*9.0-uVillage.xy), uVillage.z*1.25));
}
float trees(vec3 p, out vec3 tc){
  float cs = 9.0; vec2 c0 = floor(p.xz/cs); float d = 1e5; tc = vec3(0);
  if(uTrees < 0.5) return d;
  float above = p.y - terrain(p.xz, 3);
  if(above > 9.0) return above - 7.0;
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){
    vec2 c = c0 + vec2(i,j); vec2 pos = cellTree(c);
    if(treeMask(c, pos) < 0.5) continue;
    vec2 wp = pos*cs; float gh = terrain(wp, 3);
    float s = 0.75 + 0.5*hash01(c*5.3);
    vec3 cen = vec3(wp.x, gh + 2.6*s, wp.y);
    float e = 1e5;
    for(int k=0;k<4;k++){
      float a = float(k)*1.9 + hash1(c*7.1)*3.0;
      vec3 o = vec3(cos(a)*1.3, 0.35*sin(a*2.0) + (k==3 ? 0.9 : 0.0), sin(a)*1.3)*s*(k==3 ? 0.2 : 1.0);
      vec3 q = (p - cen - o)/vec3(1.6*s, 1.15*s, 1.6*s);
      e = min(e, (length(q) - 1.0)*1.15*s);
    }
    e += 0.18*s*(noise(p.xz*2.1 + p.y*1.7) );
    // trunk
    vec3 tq = p - vec3(wp.x, gh - 3.0, wp.y); float tr = max(length(tq.xz) - 0.22*s, tq.y - 5.0*s);
    float dd = min(e, tr);
    if(dd < d){ d = dd; tc = vec3(c, e < tr ? 1.0 : 2.0); }
  }
  return d;
}

// village: flat-roofed stone houses on a grid around the centre
float houses(vec3 p, out vec3 hid){
  hid = vec3(0); if(uHouses < 0.5) return 1e5;
  vec2 lp = p.xz - uVillage.xy; if(length(lp) > uVillage.z*1.4) return length(lp) - uVillage.z*1.2;
  float cs = 11.0; vec2 c = floor(lp/cs); float d = 1e5;
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){
    vec2 cc = c + vec2(i,j);
    if(length(cc*cs) > uVillage.z || hash01(cc*2.7) < 0.25) continue;
    vec2 ctr = (cc + 0.5)*cs + vec2(hash1(cc)*1.5, hash1(cc+7.0)*1.5);
    vec3 sz = vec3(2.6 + 1.6*hash01(cc*1.3), 1.25 + 0.9*step(0.7, hash01(cc*4.1)), 2.4 + 1.5*hash01(cc*3.3));
    vec3 q = p - vec3(ctr.x + uVillage.x, uVillage.w + sz.y, ctr.y + uVillage.y);
    vec3 b = abs(q) - sz; float bd = length(max(b,0.0)) + min(max(b.x,max(b.y,b.z)),0.0);
    // parapet lip
    vec3 b2 = abs(q - vec3(0, sz.y, 0)) - vec3(sz.x+0.15, 0.25, sz.z+0.15);
    bd = min(bd, length(max(b2,0.0)) + min(max(b2.x,max(b2.y,b2.z)),0.0));
    if(bd < d){ d = bd; hid = vec3(cc, 1.0); }
  }
  return d;
}

float map(vec3 p, out float mat, out vec3 info){
  float ht = p.y - terrain(p.xz, uOct);
  float d = ht*0.55; mat = 0.0; info = vec3(0);
  vec3 tc; float tr = trees(p, tc); if(tr < d){ d = tr; mat = tc.z; info = tc; }
  vec3 hid; float hs = houses(p, hid); if(hs < d){ d = hs; mat = 3.0; info = hid; }
  return d;
}

float march(vec3 ro, vec3 rd, out float mat, out vec3 info){
  float t = 0.5; mat = -1.0;
  for(int i=0;i<260;i++){
    vec3 p = ro + rd*t; float m; vec3 inf;
    float d = map(p, m, inf);
    if(abs(d) < 0.0015*t){ mat = m; info = inf; return t; }
    t += d; if(t > 3500.0) break;
  }
  return -1.0;
}

float shadow(vec3 ro, vec3 rd){
  float res = 1.0, t = 0.3;
  for(int i=0;i<30;i++){
    float m; vec3 inf; float h = map(ro + rd*t, m, inf);
    res = min(res, 10.0*h/t); t += clamp(h, 0.8, 60.0);
    if(res < 0.001 || t > 900.0) break;
  }
  return clamp(res, 0.0, 1.0);
}

vec3 calcNormal(vec3 p, float t){
  float e = 0.0015*t + 0.01; vec2 h = vec2(e, 0); float m; vec3 inf;
  return normalize(vec3(map(p+h.xyy,m,inf)-map(p-h.xyy,m,inf), map(p+h.yxy,m,inf)-map(p-h.yxy,m,inf), map(p+h.yyx,m,inf)-map(p-h.yyx,m,inf)));
}

vec3 sky(vec3 rd){
  float sd = max(dot(rd, uSun), 0.0);
  vec3 col = mix(uSkyHor, uSkyTop, pow(clamp(rd.y*2.2 + 0.03, 0.0, 1.0), 0.55))*0.85;
  col += uSunCol*0.25*pow(sd, 6.0) + uSunCol*0.45*pow(sd, 64.0) + vec3(1.0,0.95,0.85)*5.0*pow(sd, 2400.0);
  // clouds on a high plane
  if(rd.y > 0.0){
    vec2 cp = rd.xz/(rd.y + 0.08)*900.0 + vec2(uTime*6.0, uTime*2.0);
    float c = 0.0, a = 0.5; vec2 q = cp*0.0012;
    for(int i=0;i<6;i++){ c += a*noise(q); q = m2*q*2.1; a *= 0.5; }
    c = smoothstep(0.0, 0.55, c + 0.05);
    vec3 cc = mix(uSkyHor*0.85, uSunCol*1.15 + 0.1, pow(sd, 3.0)*0.8 + 0.2);
    col = mix(col, cc, c*0.7*smoothstep(0.0, 0.18, rd.y));
  }
  return col;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5*uRes)/uRes.y;
  vec3 cw = normalize(uTa - uRo), cu = normalize(cross(cw, vec3(0,1,0))), cv = cross(cu, cw);
  vec3 rd = normalize(uv.x*cu + uv.y*cv + uFl*cw);
  vec3 ro = uRo;
  float mat; vec3 info;
  float t = march(ro, rd, mat, info);
  vec3 col;
  if(uMode == 1){ float dd = t < 0.0 ? 0.0 : 1.0/(1.0 + t*0.02); frag = vec4(dd, dd, dd, 1.0); return; }
  if(t < 0.0){ col = sky(rd); }
  else {
    vec3 p = ro + rd*t, n = calcNormal(p, t);
    vec3 alb;
    float off = abs(p.x - roadX(p.z));
    if(mat < 0.5){
      float r = noise(p.xz*0.35), r2 = noise(p.xz*3.1), steep = 1.0 - n.y;
      vec3 soil = vec3(0.50,0.40,0.29), grass = vec3(0.56,0.50,0.33), lime = vec3(0.78,0.74,0.66);
      alb = mix(soil, grass, smoothstep(-0.2, 0.5, r));
      alb = mix(alb, lime, smoothstep(0.25, 0.55, steep + 0.15*r2));
      alb *= 0.85 + 0.25*r2;
      float road = smoothstep(uRoadW, uRoadW*0.6, off);
      vec3 dust = vec3(0.74,0.64,0.50)*(0.9 + 0.12*noise(p.xz*1.7));
      float rut = smoothstep(0.25, 0.0, abs(abs(p.x - roadX(p.z)) - uRoadW*0.35));
      dust *= 1.0 - 0.12*rut;
      alb = mix(alb, dust, road);
      // pebbles / scrub specks
      alb *= 1.0 - 0.25*smoothstep(0.72, 0.9, noise(p.xz*9.0))*(1.0 - road*0.6);
    } else if(mat < 1.5){
      float lv = noise(p.xz*4.0 + p.y*3.0);
      alb = mix(vec3(0.16,0.19,0.12), vec3(0.40,0.44,0.33), 0.5 + 0.5*lv);
      alb = mix(alb, vec3(0.55,0.58,0.48), 0.35*smoothstep(0.3, 0.9, n.y + 0.3*lv));
    } else if(mat < 2.5){ alb = vec3(0.25,0.20,0.15); }
    else {
      alb = vec3(0.62,0.54,0.44)*(0.85 + 0.2*noise(p.xz*2.0 + p.y*4.0));
      // stone courses
      alb *= 0.9 + 0.1*step(0.5, fract(p.y*2.5));
    }
    float sh = shadow(p + n*0.05, uSun);
    float dif = clamp(dot(n, uSun), 0.0, 1.0)*sh;
    float amb = 0.5 + 0.5*n.y;
    float bou = clamp(0.3 - 0.7*n.y, 0.0, 1.0);
    float sss = (mat > 0.5 && mat < 1.5) ? pow(clamp(dot(rd, uSun), 0.0, 1.0), 4.0)*0.15 : 0.0;
    float leaf = (mat > 0.5 && mat < 1.5) ? 0.7 : 1.0;
    vec3 lin = uSunCol*dif*2.6*leaf + uAmb*amb*0.38 + uSunCol*bou*0.10 + uSunCol*sss;
    col = alb*lin;
    // lit windows and doors in the village
    if(mat > 2.5 && uWindowGlow > 0.0){
      vec2 fw = abs(n.x) > 0.5 ? p.zy : p.xy;
      float hy = p.y - uVillage.w;
      float cx = fract(fw.x*0.18 + 0.37*info.x);
      float win = step(0.45, cx)*step(cx, 0.53) * step(0.9, hy)*step(hy, 1.6) * step(abs(n.y), 0.5);
      win *= step(0.72, hash01(info.xy*3.7 + floor(fw.x*0.18)));
      col += vec3(1.0,0.62,0.28)*win*uWindowGlow*2.5;
    }
    // aerial perspective
    float fog = 1.0 - exp(-uFog*t*(1.0 + 0.0*rd.y));
    vec3 fc = mix(uFogCol, uSunCol*1.2, pow(max(dot(rd, uSun), 0.0), 8.0)*0.6);
    col = mix(col, fc, fog);
  }
  // sun glare veil
  col += uSunCol*0.06*pow(max(dot(rd, uSun), 0.0), 3.0);
  col *= uExposure;
  col = col*(2.51*col + 0.03)/(col*(2.43*col + 0.59) + 0.14);   // ACES-ish
  col = pow(clamp(col, 0.0, 1.0), vec3(1.0/2.2));
  col = mix(col, col*col*(3.0 - 2.0*col), 0.45);                  // print contrast
  float lum = dot(col, vec3(0.299,0.587,0.114));
  col = mix(vec3(lum), col, 1.15);
  frag = vec4(col, 1.0);
}`;

const VS = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0, 1); }`;

class Terrain {
  constructor(w = W, h = H) {
    this.w = w; this.h = h;
    this.c = document.createElement('canvas'); this.c.width = w; this.c.height = h;
    const gl = this.gl = this.c.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false });
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const pr = this.pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, TERRAIN_FS)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
    gl.useProgram(pr);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.u = {};
  }
  set(name, v) {
    const gl = this.gl, loc = this.u[name] ?? (this.u[name] = gl.getUniformLocation(this.pr, name));
    if (name === 'uOct' || name === 'uMode') gl.uniform1i(loc, v);
    else if (typeof v === 'number') gl.uniform1f(loc, v);
    else if (v.length === 2) gl.uniform2fv(loc, v); else if (v.length === 3) gl.uniform3fv(loc, v); else gl.uniform4fv(loc, v);
  }
  render(P) {
    const gl = this.gl; gl.viewport(0, 0, this.c.width, this.c.height);
    this.set('uRes', [this.c.width, this.c.height]);
    for (const k in P) this.set(k, P[k]);
    gl.drawArrays(gl.TRIANGLES, 0, 3); gl.finish();
    return this.c;
  }
}

// --- JS mirrors for placing figures on the road
const roadX = z => 22 * Math.sin(z / 95) + 9 * Math.sin(z / 41 + 1.3);
const roadH = z => 5 * Math.sin(z / 160) + 2.5 * Math.sin(z / 63);
function v3(a, b, c) { return [a, b, c]; }
const vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const vnorm = a => { const l = Math.hypot(a[0], a[1], a[2]); return [a[0] / l, a[1] / l, a[2] / l]; };
const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
function project(P, ro, ta, fl, w = W, h = H) {
  const cw = vnorm(vsub(ta, ro)), cu = vnorm(vcross(cw, [0, 1, 0])), cv = vcross(cu, cw);
  const d = vsub(P, ro), z = vdot(d, cw); if (z <= 0.1) return null;
  const x = vdot(d, cu) * fl / z, y = vdot(d, cv) * fl / z;
  return { x: x * h + 0.5 * w, y: 0.5 * h - y * h, s: fl * h / z, z };
}
const sunDir = (az, el) => vnorm([Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)]);
const LIGHT = {
  afternoon: { uSunCol: [1.0, 0.86, 0.66], uSkyTop: [0.22, 0.38, 0.62], uSkyHor: [0.80, 0.74, 0.64], uAmb: [0.42, 0.48, 0.58], uFogCol: [0.80, 0.76, 0.68], uFog: 0.00045, uExposure: 0.62 },
  golden: { uSunCol: [1.0, 0.70, 0.42], uSkyTop: [0.30, 0.36, 0.55], uSkyHor: [0.96, 0.72, 0.50], uAmb: [0.38, 0.38, 0.48], uFogCol: [0.86, 0.66, 0.50], uFog: 0.0006, uExposure: 0.66 },
  dusk: { uSunCol: [1.0, 0.48, 0.24], uSkyTop: [0.12, 0.13, 0.28], uSkyHor: [0.85, 0.46, 0.32], uAmb: [0.22, 0.20, 0.32], uFogCol: [0.55, 0.36, 0.34], uFog: 0.0008, uExposure: 0.80 },
};

// ---------------------------------------------------------------- post: depth parallax + oil-paint (Kuwahara) filter
const FX_VS = `#version 300 es
in vec2 p; out vec2 vUv; void main(){ vUv = p*0.5+0.5; vUv.y = 1.0 - vUv.y; gl_Position = vec4(p,0,1); }`;
const PARALLAX_FS = `#version 300 es
precision highp float; in vec2 vUv; out vec4 o;
uniform sampler2D uCol, uDep; uniform vec2 uCenter, uShift; uniform float uZoom, uPar;
void main(){
  vec2 uv = uCenter + (vUv - 0.5)/uZoom;
  // iterative parallax: nearer pixels (dep ~ 1) move more
  vec2 q = uv;
  for(int i=0;i<4;i++){ float d = texture(uDep, q).r; q = uv - uShift*pow(d, 1.5)*uPar; }
  o = texture(uCol, q);
}`;
const KUWA_FS = `#version 300 es
precision highp float; in vec2 vUv; out vec4 o;
uniform sampler2D uTex; uniform vec2 uPx; uniform float uR;
void main(){
  vec3 m[4]; vec3 s[4];
  for(int k=0;k<4;k++){ m[k]=vec3(0); s[k]=vec3(0); }
  int R = int(uR);
  float n = float((R+1)*(R+1));
  for(int j=0;j<=8;j++){ if(j>R) break;
    for(int i=0;i<=8;i++){ if(i>R) break;
      vec3 c;
      c = texture(uTex, vUv + vec2(-i,-j)*uPx).rgb; m[0]+=c; s[0]+=c*c;
      c = texture(uTex, vUv + vec2( i,-j)*uPx).rgb; m[1]+=c; s[1]+=c*c;
      c = texture(uTex, vUv + vec2( i, j)*uPx).rgb; m[2]+=c; s[2]+=c*c;
      c = texture(uTex, vUv + vec2(-i, j)*uPx).rgb; m[3]+=c; s[3]+=c*c;
    }
  }
  float best = 1e9; vec3 res = vec3(0);
  for(int k=0;k<4;k++){ vec3 mu = m[k]/n; vec3 v = abs(s[k]/n - mu*mu); float sig = v.r+v.g+v.b; if(sig < best){ best = sig; res = mu; } }
  o = vec4(res, 1.0);
}`;

class FX {
  constructor(w = W, h = H) {
    this.w = w; this.h = h;
    this.c = document.createElement('canvas'); this.c.width = w; this.c.height = h;
    const gl = this.gl = this.c.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false });
    const mk = (fs) => { const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
      const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, FX_VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); return p; };
    this.par = mk(PARALLAX_FS); this.kuwa = mk(KUWA_FS);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    for (const p of [this.par, this.kuwa]) { const l = gl.getAttribLocation(p, 'p'); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 0, 0); }
    this.tex = {};
  }
  texFrom(name, src) {
    const gl = this.gl; let t = this.tex[name];
    if (!t) { t = this.tex[name] = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); }
    gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src); return t;
  }
  parallax(col, dep, P) {   // col/dep: canvases (uploaded once if P.static)
    const gl = this.gl; gl.useProgram(this.par); gl.viewport(0, 0, this.w, this.h);
    if (!P.cached) { this.texFrom('pc', col); this.texFrom('pd', dep); }
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex.pc);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.tex.pd);
    const u = n => gl.getUniformLocation(this.par, n);
    gl.uniform1i(u('uCol'), 0); gl.uniform1i(u('uDep'), 1);
    gl.uniform2fv(u('uCenter'), P.center || [0.5, 0.5]); gl.uniform2fv(u('uShift'), P.shift || [0, 0]);
    gl.uniform1f(u('uZoom'), P.zoom || 1); gl.uniform1f(u('uPar'), P.par ?? 1);
    gl.drawArrays(gl.TRIANGLES, 0, 3); return this.c;
  }
  kuwahara(src, r = 4) {
    const gl = this.gl; gl.useProgram(this.kuwa); gl.viewport(0, 0, this.w, this.h);
    this.texFrom('k', src); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex.k);
    const u = n => gl.getUniformLocation(this.kuwa, n);
    gl.uniform1i(u('uTex'), 0); gl.uniform2fv(u('uPx'), [1 / this.w, 1 / this.h]); gl.uniform1f(u('uR'), r);
    gl.drawArrays(gl.TRIANGLES, 0, 3); gl.finish(); return this.c;
  }
}
