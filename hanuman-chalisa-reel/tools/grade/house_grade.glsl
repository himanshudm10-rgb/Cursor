// Mythic-reel house colour grade (matched to the user's reference films, Oct 2026).
// Paste into the final full-screen pass, after bloom, on linear-ish display colour c (0..1).
// Uniforms: expo (per scene, ~1.1 day / 1.5 dusk / 1.8-2.2 night & storm), cool (0 warm amber .. 1 storm teal), sat (1 = house).
uniform float expo; uniform float cool; uniform float sat;
vec3 houseGrade(vec3 c) {
  c *= expo;
  c = .84 * (1. - exp(-c * 1.55));                          // soft shoulder: highlights roll off near 0.75, never clip
  float l = dot(c, vec3(.299, .587, .114));
  float purple = clamp((min(c.r, c.b) - c.g) * 4., 0., 1.);  // purple/magenta -> neutral
  float blue = clamp((c.b - max(c.r, c.g)) * 3., 0., 1.);    // pure blue -> muted (less so in storms)
  c = mix(c, vec3(l), clamp(purple * .7 + blue * (.45 - cool * .25), 0., 1.));
  c = mix(vec3(l), c, .76 * sat);                           // low, painterly saturation
  vec3 shT = mix(vec3(.085, .062, .045), vec3(.045, .06, .065), cool); // warm brown (or teal-grey) lifted blacks
  vec3 hiT = mix(vec3(1.0, .9, .74), vec3(.88, .98, 1.0), cool);       // amber (or cold) highlights
  c = shT * (1. - smoothstep(0., .35, l)) + c * mix(vec3(1.), hiT, smoothstep(.15, .85, l));
  c = mix(c, c * mix(vec3(1.03, .97, .88), vec3(.94, 1.0, 1.04), cool), .5);
  return c;
}
