/**
 * GLSL for the era-picker eye — three stages.
 *
 * 1. A 2D canvas paints this portfolio's own content — name, role, projects,
 *    numbers — in the idiom of the era (see era-screen-texture).
 * 2. ERA_UI_FRAG builds that era's screen around the page — window chrome, nav
 *    rails, tiles, wallpaper — and applies the display technology of the year
 *    (scanlines, 1-bit dither, posterised colour, bitmap grid), rendering into
 *    a mipmapped texture.
 * 3. ERA_EYE_FRAG draws the eye and the dark room. The screen appears three
 *    times: as the monitor itself, out of focus behind the eye; as a real
 *    specular reflection off the corneal dome — reflect() against the dome
 *    normal, into a monitor plane, so it is mirrored, fisheyed and
 *    Fresnel-weighted, refracted through the dome's own curvature with
 *    per-wavelength dispersion, tear-film roughness and a limbal shade; and
 *    dimly through the pupil as light that made it inside.
 *
 * There is no lens object in the scene. The cornea *is* the lens.
 *
 * Eye space: 1.0 unit = half the eye's width.
 */

export const ERA_EYE_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

/* ------------------------------------------------------------------------ */
/* Stage 2: the era's screen                                                 */
/* ------------------------------------------------------------------------ */

export const ERA_UI_FRAG = /* glsl */ `
precision highp float;

varying vec2 vUv;

uniform sampler2D uCodeTex;   // the portfolio page, painted by canvas 2D
uniform float uTime;
uniform vec3  uUiBg;
uniform vec3  uUiInk;
uniform vec3  uUiPanel;
uniform vec3  uUiAccent;
uniform vec3  uUiBar;
uniform float uStyleA;
uniform float uStyleB;
uniform float uStyleMix;
uniform float uScroll;
uniform float uUiScan;
uniform float uUiPixel;
uniform float uUiDither;
uniform float uUiPosterize;
uniform float uUiGlow;
uniform float uUiWobble;
uniform float uUiWarp;
uniform float uUiTech;
uniform vec2  uUiPx;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2.0 + a.y * a.y * 0.75);
}
float bayer4(vec2 a) {
  return bayer2(0.5 * a) * 0.25 + bayer2(a);
}

float rbox(vec2 p, vec2 c, vec2 h, float r, float aa) {
  vec2 q = abs(p - c) - h + r;
  float d = min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
  return 1.0 - smoothstep(-aa, aa, d);
}

/** Chiselled GUI border: light on one diagonal, dark on the other. */
vec3 bevel(vec3 c, vec2 uv, vec2 ctr, vec2 h, float t, float amt) {
  vec2 q = abs(uv - ctr) - h;
  float edge = 1.0 - smoothstep(0.0, t, max(q.x, q.y) + t);
  float dirn = (uv.y - ctr.y) - (uv.x - ctr.x);
  return mix(c, dirn > 0.0 ? vec3(1.0) : vec3(0.0), edge * amt * 0.3);
}

/**
 * One era's chrome, described rather than hand-drawn: where the page sits, what
 * frames it, how round it is. Twelve layouts out of one draw keeps the shader
 * small enough to compile instantly.
 */
struct Chrome {
  vec2 rect;      // content centre
  vec2 size;      // content half-size
  float bar;      // top chrome height
  float rail;     // left rail width
  float radius;   // corner radius
  float chisel;   // beveled borders (1980s/90s GUI)
  float tiles;    // wallpaper tiling
  float gloss;    // gel highlight
  float grid;     // app-grid decoration
  float paper;    // how light the page ground is
};

Chrome chromeFor(float style) {
  Chrome c;
  c.rect = vec2(0.5, 0.5); c.size = vec2(0.44, 0.40);
  c.bar = 0.0; c.rail = 0.0; c.radius = 0.0; c.chisel = 0.0;
  c.tiles = 0.0; c.gloss = 0.0; c.grid = 0.0; c.paper = 0.0;

  if (style < 0.5) {                    // terminal
    c.size = vec2(0.48, 0.47);
  } else if (style < 1.5) {             // Xerox Star
    c.rect = vec2(0.52, 0.46); c.size = vec2(0.40, 0.33);
    c.bar = 0.06; c.chisel = 1.0; c.paper = 0.9;
  } else if (style < 2.5) {             // early web
    c.rect = vec2(0.46, 0.44); c.size = vec2(0.40, 0.40);
    c.bar = 0.05; c.paper = 0.85;
  } else if (style < 3.5) {             // GeoCities
    c.rect = vec2(0.5, 0.44); c.size = vec2(0.36, 0.32);
    c.bar = 0.10; c.tiles = 1.0;
  } else if (style < 4.5) {             // frames
    c.rect = vec2(0.58, 0.42); c.size = vec2(0.36, 0.36);
    c.bar = 0.09; c.rail = 0.20; c.chisel = 1.0; c.paper = 0.75;
  } else if (style < 5.5) {             // Zen Garden
    c.rect = vec2(0.5, 0.42); c.size = vec2(0.30, 0.38);
    c.bar = 0.07; c.paper = 0.95;
  } else if (style < 6.5) {             // Web 2.0
    c.rect = vec2(0.5, 0.44); c.size = vec2(0.38, 0.34);
    c.bar = 0.08; c.radius = 0.045; c.gloss = 1.0; c.paper = 0.9;
  } else if (style < 7.5) {             // Aqua
    c.rect = vec2(0.58, 0.44); c.size = vec2(0.34, 0.38);
    c.bar = 0.07; c.rail = 0.18; c.radius = 0.02; c.gloss = 0.5; c.paper = 0.9;
  } else if (style < 8.5) {             // phone
    c.rect = vec2(0.5, 0.34); c.size = vec2(0.40, 0.26);
    c.bar = 0.04; c.radius = 0.05; c.grid = 1.0;
  } else if (style < 9.5) {             // Material
    c.rect = vec2(0.5, 0.42); c.size = vec2(0.40, 0.34);
    c.bar = 0.07; c.radius = 0.075;
  } else if (style < 10.5) {            // chat
    c.rect = vec2(0.5, 0.46); c.size = vec2(0.36, 0.34);
    c.bar = 0.06; c.radius = 0.06;
  } else {                              // generative
    c.rect = vec2(0.5, 0.46); c.size = vec2(0.40, 0.34);
    c.radius = 0.11;
  }
  return c;
}

vec3 drawScreen(float style, vec2 uv, float aa) {
  Chrome k = chromeFor(style);
  vec3 ground = mix(uUiBg, vec3(0.94, 0.935, 0.925), k.paper * 0.85);
  vec3 c = ground;

  // wallpaper
  if (k.tiles > 0.0) {
    float tile = step(0.5, fract(uv.x * 16.0)) * step(0.5, fract(uv.y * 16.0));
    c = mix(c, mix(ground, uUiAccent, 0.4), tile * 0.45);
  }

  // top chrome and left rail
  if (k.bar > 0.0) {
    float bar = rbox(uv, vec2(0.5, 1.0 - k.bar * 0.5), vec2(0.5, k.bar * 0.5),
                     0.0, aa);
    c = mix(c, uUiBar, bar * 0.92);
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      c = mix(c, mix(uUiAccent, vec3(1.0), 0.2),
              rbox(uv, vec2(0.05 + fi * 0.045, 1.0 - k.bar * 0.5),
                   vec2(0.014, 0.014), k.radius > 0.0 ? 0.014 : 0.0, aa));
    }
  }
  if (k.rail > 0.0) {
    float rail = rbox(uv, vec2(k.rail * 0.5, 0.5 - k.bar * 0.5),
                      vec2(k.rail * 0.5, 0.5 - k.bar * 0.5), 0.0, aa);
    c = mix(c, mix(uUiPanel, ground, 0.55), rail);
    for (int i = 0; i < 5; i++) {
      float fi = float(i);
      c = mix(c, uUiInk,
              rbox(uv, vec2(k.rail * 0.5, 0.74 - fi * 0.1),
                   vec2(k.rail * 0.30, 0.010), 0.0, aa) * 0.6);
    }
    if (k.chisel > 0.0) {
      c = bevel(c, uv, vec2(k.rail * 0.5, 0.5 - k.bar * 0.5),
                vec2(k.rail * 0.5, 0.5 - k.bar * 0.5), 0.006, 1.0);
    }
  }

  // app grid (phone eras) sits above the page
  if (k.grid > 0.0) {
    for (int i = 0; i < 8; i++) {
      float fi = float(i);
      vec2 gc = vec2(0.20 + mod(fi, 4.0) * 0.20, 0.84 - floor(fi / 4.0) * 0.16);
      float h = hash21(vec2(fi, 4.0));
      c = mix(c, mix(mix(uUiPanel, uUiAccent, h), uUiBar, step(0.72, h)),
              rbox(uv, gc, vec2(0.058, 0.058), 0.022, aa));
    }
  }

  // the content surface
  float pane = rbox(uv, k.rect, k.size, k.radius, aa);
  vec3 paneCol = mix(uUiBg, vec3(0.99), k.paper);
  c = mix(c, paneCol, pane * (style < 0.5 ? 0.0 : 0.96));
  if (k.chisel > 0.0) c = bevel(c, uv, k.rect, k.size, 0.006, 1.0);

  // the page itself, scrolling
  // The full width of the painted column, and a slice of its height, so the
  // portfolio's own type stays readable once the eye shrinks it into a
  // reflection: five or six lines across the pane.
  vec2 codeUv = (uv - k.rect) / k.size * vec2(0.5, 0.115) + vec2(0.5, 0.5);
  codeUv.y -= uScroll;
  vec3 code = texture2D(uCodeTex, codeUv).rgb;
  // the canvas already carries the era's ink colours; keep its own contrast
  c = mix(c, code, pane * (style < 0.5 ? 1.0 : 0.92));

  // gel highlight over the pane
  if (k.gloss > 0.0) {
    float top = smoothstep(k.rect.y, k.rect.y + k.size.y, uv.y);
    c = mix(c, vec3(1.0), pane * top * 0.18 * k.gloss);
  }

  // caret
  float caret = rbox(uv, vec2(k.rect.x - k.size.x * 0.55, k.rect.y - k.size.y * 0.62),
                     vec2(0.004, 0.013), 0.0, aa);
  c = mix(c, uUiAccent, caret * step(0.5, fract(uTime * 1.4)));

  return c;
}

void main() {
  vec2 q = vUv;
  if (uUiWobble > 0.0) {
    q += uUiWobble * 0.012 * vec2(sin(q.y * 9.0 + uTime * 0.9),
                                  cos(q.x * 7.0 - uTime * 0.7));
  }
  if (uUiWarp > 0.0) {
    float band = floor(q.y * 30.0);
    float seed = floor(uTime * 7.0);
    float hit = step(0.9, hash21(vec2(band * 1.7, seed)));
    q.x += (hash21(vec2(band, seed)) - 0.5) * uUiWarp * 0.3 * hit;
  }
  if (uUiPixel > 0.5) {
    float g = uUiPixel / 340.0;
    q = (floor(q / g) + 0.5) * g;
  }

  float aa = max(uUiPx.x, uUiPx.y) * 1.5;
  vec3 c;
  if (uStyleMix >= 0.999) c = drawScreen(uStyleB, q, aa);
  else if (uStyleMix <= 0.001) c = drawScreen(uStyleA, q, aa);
  else c = mix(drawScreen(uStyleA, q, aa), drawScreen(uStyleB, q, aa), uStyleMix);

  if (uUiPosterize > 1.5) c = floor(c * uUiPosterize + 0.5) / uUiPosterize;
  if (uUiDither > 0.0) {
    const vec3 LUMA = vec3(0.299, 0.587, 0.114);
    float l = dot(c, LUMA);
    float t = bayer4(gl_FragCoord.xy / max(uUiPixel, 1.0));
    float bgL = dot(uUiBg, LUMA);
    float inkL = dot(uUiInk, LUMA);
    vec3 paper = bgL >= inkL ? uUiBg : uUiInk;
    vec3 ink = bgL >= inkL ? uUiInk : uUiBg;
    c = mix(c, mix(ink, paper, 1.0 - step(l, t)), uUiDither);
  }
  if (uUiScan > 0.0) {
    float scan = step(0.5, fract(vUv.y * 210.0));
    c *= 1.0 - uUiScan * 0.42 * scan;
  }
  c += c * uUiGlow;

  // ---- the panel this year was actually made of ---------------------------
  // 0 cathode-ray · 1 backlit TFT · 2 IPS/retina · 3 OLED. The layout on a
  // screen dates it, but so does the screen: a 2003 TFT can never reach black,
  // and a 2023 OLED can never do anything else. Between eras the weights
  // cross-fade, so scrubbing the ring walks the display technology too.
  float wTft = max(0.0, 1.0 - abs(uUiTech - 1.0));
  float wIps = max(0.0, 1.0 - abs(uUiTech - 2.0));
  float wOled = max(0.0, 1.0 - abs(uUiTech - 3.0));

  if (wTft > 0.001) {
    float sub = mod(gl_FragCoord.x, 3.0);
    vec3 stripe = vec3(step(sub, 1.0),
                       step(1.0, sub) * step(sub, 2.0),
                       step(2.0, sub));
    c *= mix(vec3(1.0), 0.80 + 0.36 * stripe, wTft * 0.30);
    c += vec3(0.042, 0.047, 0.060) * wTft;             // the backlight, always on
    vec2 edge = abs(vUv - 0.5) * 2.0;
    c += vec3(0.05, 0.055, 0.072) * wTft *
         pow(max(edge.x, edge.y), 6.0);                 // and leaking at the corners
  }
  if (wIps > 0.001) {
    // the pixels are below the resolution of a reflection; only the black
    // level still gives the panel away
    c += vec3(0.014, 0.015, 0.019) * wIps;
  }
  if (wOled > 0.001) {
    float l = dot(c, vec3(0.299, 0.587, 0.114));
    c = mix(c, mix(vec3(l), c, 1.20) * smoothstep(0.0, 0.055, l), wOled);
  }

  gl_FragColor = vec4(c, 1.0);
}
`;

/* ------------------------------------------------------------------------ */
/* Stage 3: the eye, the glass, and the room                                 */
/* ------------------------------------------------------------------------ */

export const ERA_EYE_FRAG = /* glsl */ `
precision highp float;

varying vec2 vUv;

uniform sampler2D uScreenTex;

uniform vec2  uRes;
uniform float uTime;
uniform float uSpan;
uniform float uOffsetY;
uniform float uMip;
uniform float uUnit;
uniform vec2  uGaze;
uniform float uBlink;
uniform float uFade;
uniform float uDilate;

uniform vec3  uIris;
uniform vec3  uUiBg;
uniform vec3  uUiPanel;
uniform vec3  uUiAccent;

uniform float uReflect;
uniform float uPupil;      // already includes the light response
uniform float uScreenLum;  // how bright this era's screen is, 0..1
uniform float uCrt;        // how much of a cathode-ray tube this era is

const float IRIS_R = 0.345;
const float CORNEA_R = 0.450;

/**
 * The monitor, twice over. ROOM_* places it in the shot behind the eye; the
 * SCREEN_* trio is the same panel measured for the reflection — a rectangle
 * sitting up and to the left on the dome, the way a monitor does when you are
 * sitting at one, with the dark room filling the rest of the glass.
 */
const vec2  ROOM_C = vec2(-0.86, 0.34);
const vec2  ROOM_H = vec2(0.62, 0.38);
/** Where the light is: the monitor, in front of the face and to the left. */
const vec3  KEY = vec3(-0.42, 0.48, 0.77);
const float SCREEN_D = 0.72;
const vec2  SCREEN_C = vec2(-0.20, 0.24);
const vec2  SCREEN_H = vec2(2.30, 1.40);

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
             mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x),
             f.y);
}

/**
 * Three octaves, not five. The last two were worth a few percent of contrast
 * and a third of the shader's cost — this runs on every pixel of a full-screen
 * quad, several times over.
 */
float fbm(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    s += a * vnoise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return s;
}

/**
 * The era's page, sampled out of its own mipmap chain. uMip is added on top
 * of whatever blur the caller asks for: when the shot stands back, one texel
 * of that page lands on fewer pixels, and a 1-bit dither that reads as texture
 * up close reads as a field of white specks. Standing back should cost detail,
 * not add it.
 */
vec3 screenTex(vec2 uv, float blur) {
  blur += uMip;
  return texture2D(uScreenTex, uv, blur).rgb;
}

/**
 * 1 inside the panel, 0 outside. Everything that samples the screen multiplies
 * by this: the texture clamps at its edges, and an unmasked sample smears the
 * last row of pixels outward as long grey wedges across the shot.
 */
float inPanel(vec2 uv, float soft) {
  vec2 d = abs(uv - 0.5);
  return (1.0 - smoothstep(0.5 - soft, 0.5, d.x)) *
         (1.0 - smoothstep(0.5 - soft, 0.5, d.y));
}

/**
 * A cathode-ray tube, in the shader rather than in CSS overlays: aperture
 * grille, scanlines locked to the panel, the slow refresh bar rolling bottom to
 * top on an eight-second loop, static, and the phosphor bloom that comes with
 * all of it.
 */
vec3 tube(vec3 c, vec2 uv, float amt) {
  if (amt < 0.002) return c;
  float m = mod(gl_FragCoord.x, 3.0);
  vec3 grille = vec3(step(m, 1.0), step(1.0, m) * step(m, 2.0), step(2.0, m));
  c *= mix(vec3(1.0), 0.55 + 0.85 * grille, amt * 0.65);
  c *= 1.0 - amt * 0.26 * (0.5 + 0.5 * cos(uv.y * 780.0));
  float bar = fract(uv.y * 0.9 - uTime / 8.0);
  c *= 1.0 - amt * 0.20 * smoothstep(0.10, 0.0, bar) * smoothstep(0.0, 0.02, bar);
  c += (hash21(uv * uRes + fract(uTime * 7.0)) - 0.5) * amt * 0.055;
  c += c * amt * 0.30;
  return c;
}

/**
 * Filmic roll-off (the ACES fit). A white 2003 page reflected in a wet cornea
 * is genuinely brighter than 1.0, and without a curve it clipped to a white
 * blob with no page left in it. This keeps the highlight and the content.
 */
vec3 tonemap(vec3 x) {
  x *= 0.92;
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14),
               0.0, 1.0);
}

/** Radial lens scale. Positive bulges, negative pinches. The cornea's own. */
float lensScale(float distortion, float r2) {
  return distortion >= 0.0 ? 1.0 + distortion * r2 : 1.0 / (1.0 - distortion * r2);
}

void main() {
  float aspect = uRes.x / max(uRes.y, 1.0);
  vec2 p = (vUv - 0.5) * vec2(aspect, 1.0) * uSpan;
  // The eye sits above centre, so the lower lid and the dial under it are not
  // fighting for the same band of screen. How far above is the framing's call,
  // not the shader's: a phone lifts the eye much further than a desktop does.
  p.y -= uOffsetY;
  float aa = uUnit * 1.25;

  // How much of this era's page is light. A white page lights the whole face,
  // and everything downstream of that — sclera, cornea, the reflection itself
  // — was clipping together into one blank lozenge. Bright eras are read a
  // little sharper, carried a little quieter, and exposed a stop down.
  float blown = smoothstep(0.30, 0.92, uScreenLum);
  float calm = 1.0 - 0.42 * blown;

  // Half-width of the aperture. Not a constant: the palpebral fissure is
  // stretched to whatever the viewport is wide (plus a hair of overscan) so the
  // outer canthus is always off the edge of the frame rather than sitting in a
  // strip of empty room. Wider screens get a longer, flatter almond, which is
  // what a real eye does when you widen it — the arc's radius grows with it.
  float halfX = aspect * uSpan * 0.5;
  float A = max(1.0, halfX);
  const float B = 0.495;

  // ---- lid geometry -------------------------------------------------------
  float rr0 = (A * A + B * B) / (2.0 * B);
  float yArc = B - rr0 + sqrt(max(0.0, rr0 * rr0 - p.x * p.x));
  float lidBow = 0.12 * sin(3.14159265 * uBlink) * (1.0 - (p.x / A) * (p.x / A));
  float lidU = mix(yArc, -yArc + 0.010, uBlink) + lidBow;
  float lidL = mix(-yArc, -yArc + 0.055, uBlink * 0.55);

  float inX = 1.0 - smoothstep(A - aa * 2.0, A, abs(p.x));
  float inside = inX *
    (1.0 - smoothstep(lidU - aa, lidU + aa, p.y)) *
    smoothstep(lidL - aa, lidL + aa, p.y);

  // ---- the room -----------------------------------------------------------
  // Near-black, with one lit object in it. The tube is curved, so the panel is
  // sampled through a barrel; the surface it stands on is polished enough to
  // hold a blurred, upside-down copy of it, which is where the depth comes from.
  vec2 room = p;
  float persp = 1.0 + room.y * 0.10;
  vec2 flat0 = (room / persp - ROOM_C) / ROOM_H * 0.5 + 0.5;

  vec2 cc = flat0 * 2.0 - 1.0;
  float bulge = 0.05 + 0.14 * uCrt;
  cc *= lensScale(bulge, dot(cc, cc) * 0.35);
  vec2 scrUv = cc * 0.5 + 0.5;

  vec2 sIn = abs(scrUv - 0.5);
  float onScr = inPanel(scrUv, 0.010);
  // A tube needs a deep beige box around it; a flat panel needs almost nothing.
  // The bezel is the other half of dating a monitor.
  float bw = mix(0.016, 0.062, uCrt);
  float bezel = (1.0 - smoothstep(0.5 + bw * 0.72, 0.5 + bw, sIn.x)) *
                (1.0 - smoothstep(0.5 + bw, 0.5 + bw * 1.34, sIn.y)) - onScr;

  // out of focus: the shot is focused on the eye, not on the monitor
  vec3 panel = tube(screenTex(scrUv, 3.4 + 1.2 * uCrt), scrUv, uCrt) * onScr;
  vec3 glow = mix(uUiBg, mix(uUiPanel, uUiAccent, 0.5), 0.62);

  vec3 col = vec3(0.0026, 0.0030, 0.0040);              // the dark
  float throwOff = exp(-max(max(sIn.x, sIn.y) - 0.5, 0.0) * 3.6);
  col += glow * throwOff * 0.22;

  // The reflection in the surface below: the panel again, flipped and blurred.
  // Blended rather than branched — a hard cut on room.y drew a seam straight
  // across the shot, which read as a bug, not as a desk.
  float floorY = -0.46;
  float below = smoothstep(floorY + 0.12, floorY - 0.12, room.y);
  if (below > 0.002) {
    float depth = max(floorY - room.y, 0.0);
    vec2 mirrored = vec2(room.x, floorY * 2.0 - room.y + depth * 0.22);
    vec2 mUv = (mirrored - ROOM_C) / ROOM_H * 0.5 + 0.5;
    mUv.x += sin(mirrored.y * 26.0 + uTime * 0.4) * 0.004 * depth;
    vec3 mirror = screenTex(mUv, 3.4 + depth * 5.0) * inPanel(mUv, 0.10);
    col += mirror * exp(-depth * 3.6) * below * 0.18;
    col += glow * exp(-depth * 2.6) * below * 0.04;
    col *= 1.0 - 0.30 * below;                          // the desk in shadow
  }

  col = mix(col, mix(vec3(0.010, 0.011, 0.014), vec3(0.062, 0.057, 0.046), uCrt),
            max(bezel, 0.0));
  col = mix(col, panel * 0.30, onScr * 0.75);

  // the desk in front of the monitor, so the bottom of the shot is a room and
  // not a black band under an eye
  float desk = smoothstep(-0.10, -0.62, p.y);
  col += glow * desk * 0.055 * (1.0 - smoothstep(0.2, 1.4, abs(p.x)));
  col += glow * 0.030 * exp(-length(p - vec2(-0.86, 0.34)) * 1.15);

  float dust = smoothstep(0.990, 1.0, hash21(floor(vUv * uRes / 3.0)));
  // Motes float in the room, not on the cornea. Masking them out of the eye
  // only mattered once the shot could stand back far enough for the sclera to
  // be a small, bright part of the frame — on a phone they read as dirt on the
  // eyeball itself.
  col += dust * throwOff * 0.20 * (1.0 - inside);
  col += (hash21(vUv * uRes + fract(uTime)) - 0.5) * 0.012;
  // depth: everything falls away from the middle of the shot
  col *= 0.24 + 0.76 * smoothstep(1.6, 0.06, length((vUv - 0.5) * vec2(aspect, 1.0)));

  vec3 screenTint = mix(uUiBg, mix(uUiPanel, uUiAccent, 0.5), 0.65);

  // ---- lids ---------------------------------------------------------------
  // Near-black skin: this is a dark room, so the lid is a silhouette that the
  // monitor rims rather than a lit surface.
  float dOut = max(max(max(p.y - lidU, lidL - p.y), abs(p.x) - A), 0.0);
  float skinBand = 1.0 - smoothstep(0.06, 0.62, dOut);
  vec3 skin = vec3(0.0);
  if (skinBand > 0.002) {
    skin = mix(vec3(0.115, 0.086, 0.080), vec3(0.038, 0.030, 0.031),
               smoothstep(-0.60, 0.70, p.y));
    skin *= 0.86 + 0.14 * fbm(p * 9.0 + 21.0);
    // lit by the same monitor: the lower lid catches it, the brow does not
    float keyLid = clamp(0.34 - p.y * 0.50 - p.x * 0.07, 0.0, 1.0);
    skin *= 0.42 + 1.45 * keyLid;
    float rimLid = smoothstep(0.055, 0.0, min(abs(p.y - lidU), abs(p.y - lidL)));
    skin += screenTint * (0.05 * throwOff + 0.16 * rimLid * throwOff);
    skin *= 1.0 - 0.42 *
            smoothstep(0.22, 0.0, min(abs(p.y - lidU), abs(p.y - lidL)));
  }
  // the monitor throws a soft halo onto the brow and cheek; without it the
  // lash line is black on black and the eye has no edge
  col += screenTint * 0.20 * smoothstep(0.60, 0.0, dOut) * (1.0 - inside) * uFade;
  col = mix(col, skin, (1.0 - inside) * skinBand * uFade);

  float creaseY = mix(yArc + 0.11, yArc + 0.02, uBlink);
  float crease = smoothstep(0.016, 0.0, abs(p.y - creaseY)) * inX;
  col = mix(col, skin * 0.5, crease * 0.75 * skinBand * uFade);

  // ---- lash mass ----------------------------------------------------------
  // Not drawn as individual hairs. A single lash is far thicker than the depth
  // of field is deep at this magnification, so combing them out one per column
  // is what read as a plastic doll — a picket fence of identical spikes, all in
  // focus, all the same length. What a macro lens actually records is a soft
  // dark mass sitting on the margin, heaviest at the outer third, with only a
  // grain of structure surviving inside it.
  float xN = clamp(abs(p.x) / A, 0.0, 1.0);
  float outer = smoothstep(0.14, 0.98, xN);
  // Lashes grow in bundles, so the silhouette is lumpy at the scale of a few
  // hairs rather than combed at one per column; the fine noise only ever thins
  // a mass that is already there, so no hair is ever drawn on its own.
  float clump = fbm(vec2(p.x * 26.0, 4.0));
  float bundle = fbm(vec2(p.x * 8.5, 19.0));
  float lashFine = fbm(vec2(p.x * 88.0, (p.y - lidU) * 9.0 + 11.0));
  // the mass thins toward the inner canthus and folds onto the lid as it
  // closes, the way lashes drop rather than staying proud of the skin
  float lashH = (0.036 + 0.092 * outer) * (0.30 + 1.15 * clump) *
                (0.62 + 0.85 * bundle) * (1.0 - 0.55 * uBlink);
  float upT = (p.y - lidU) / max(lashH, 1e-4);   // 0 at the margin, 1 at the tip
  float lashU = smoothstep(1.0, 0.22, clamp(upT, 0.0, 1.0)) * step(0.0, upT);
  lashU *= 0.62 + 0.52 * lashFine;
  float loT = (lidL - p.y) / 0.030;
  float lashL = smoothstep(1.0, 0.15, clamp(loT, 0.0, 1.0)) * step(0.0, loT) *
                (0.34 + 0.44 * outer) * (0.50 + 0.60 * lashFine);
  float lashes = clamp(max(lashU, lashL), 0.0, 1.0) * inX;
  col = mix(col, vec3(0.005, 0.004, 0.005), lashes * 0.95 * uFade);
  // hair is not matte: the monitor lays a thin sheen over the top of the mass,
  // which is the only thing that separates it from the dark it sits in
  col += screenTint * throwOff * lashes * 0.055 * uFade;

  // A lid is a few millimetres thick, and the front of that thickness is wet.
  // A dark lash line, then the lit lip in front of it: the upper lid is turned
  // away from the monitor and barely catches it, the lower lid faces it and
  // catches a lot. Drawn on the skin side of the margin, so the lid reads as an
  // edge you could put a finger on rather than as a hole cut in a mask.
  float lineU = smoothstep(0.010, 0.0, abs(p.y - lidU - 0.008)) * inX;
  float lipU  = smoothstep(0.009, 0.0, abs(p.y - lidU - 0.001)) * inX;
  float lipL  = smoothstep(0.014, 0.0, abs(p.y - lidL + 0.004)) * inX;
  float lidLit = (1.0 - smoothstep(0.55, 1.0, xN)) * uFade;
  col = mix(col, vec3(0.010, 0.008, 0.009), lineU * 0.75 * uFade);
  col += screenTint * throwOff * lidLit * (lipU * 0.10 + lipL * 0.30);
  col += vec3(0.9, 0.86, 0.86) * lidLit * (lipU * 0.03 + lipL * 0.09);

  // ---- eyeball ------------------------------------------------------------
  vec2 gazeV = uGaze * vec2(0.27, 0.11) + vec2(0.0, uBlink * 0.10);
  vec2 eRaw = p - gazeV - vec2(0.0, 0.03);

  float cRad = length(eRaw) / CORNEA_R;
  float cd = min(cRad, 1.0);
  float dome = sqrt(max(0.0, 1.0 - cd * cd));
  // tear film — a slow, shallow ripple, so the glass is never mathematically
  // perfect
  vec2 tear = vec2(fbm(eRaw * 7.0 + uTime * 0.06),
                   fbm(eRaw * 7.0 + 13.0 - uTime * 0.05)) - 0.5;
  vec3 N = normalize(vec3(eRaw / CORNEA_R + tear * 0.040, dome * 0.92 + 0.08));
  vec3 V = vec3(0.0, 0.0, 1.0);

  // the iris sits under the cornea, so it is refracted, not just offset
  vec2 refr = eRaw * (1.0 - 0.16 * dome);
  float turn = min(length(uGaze), 1.0);
  vec2 tDir = turn > 1e-4 ? normalize(uGaze + vec2(1e-5)) : vec2(1.0, 0.0);
  float alongT = dot(refr, tDir);
  vec2 e = tDir * (alongT / mix(1.0, 0.82, turn * turn)) + (refr - alongT * tDir);
  float rad = length(e) / IRIS_R;

  // ---- sclera: a sphere, not a white disc ---------------------------------
  // Flat fill plus a vignette is what read as plastic. This is a lit ball: a
  // terminator toward the corners, a contact shadow where the upper lid rests
  // on it, and a warm wet caruncle at the inner corner.
  vec2 ballV = p - gazeV * 0.35;
  float ballR = min(length(ballV) / 1.04, 1.0);
  float sphere = sqrt(max(0.0, 1.0 - ballR * ballR));
  // The ball as a lit sphere. Keying it off the room panel behind the head was
  // what left the whole eye grey: the light is in front of the face.
  vec3 L = normalize(KEY);
  vec3 Nb = normalize(vec3(ballV / 1.04, max(sphere, 0.15)));
  float keyB = clamp(dot(Nb, L), 0.0, 1.0);
  float lit = (0.11 + 0.20 * uScreenLum) +
              (0.72 + 0.42 * uScreenLum) * pow(keyB, 1.6);

  float toRim = smoothstep(0.34, 0.0, min(abs(p.y - lidU), abs(p.y - lidL)));
  vec3 sclera = mix(vec3(0.52, 0.53, 0.58), vec3(0.96, 0.955, 0.94),
                    smoothstep(0.10, 0.92, sphere));
  sclera *= 0.30 + 0.80 * sphere * sphere;
  sclera = mix(sclera, vec3(0.50, 0.40, 0.39), toRim * 0.55);
  sclera *= lit;
  sclera *= 0.93 + 0.07 * vnoise(p * 26.0 + 5.0);
  sclera *= 0.55 + 0.45 * smoothstep(1.0, 0.35, ballR);
  // vessels, gathered at the corners where they actually are
  float veinN = fbm(p * vec2(9.0, 20.0) + 3.7);
  float veins = smoothstep(0.58, 0.80, veinN) * smoothstep(0.94, 0.74, veinN);
  float fine = smoothstep(0.62, 0.90, fbm(p * vec2(24.0, 44.0) + 9.1));
  sclera = mix(sclera, vec3(0.70, 0.30, 0.28),
               clamp(veins * 1.4 + fine * 0.5, 0.0, 1.0) * 0.30 * (0.15 + toRim));
  // the upper lid sits on the ball and darkens it
  sclera *= 1.0 - 0.62 * smoothstep(0.55, 0.0, max(0.0, lidU - p.y));
  sclera *= 1.0 - 0.26 * smoothstep(0.22, 0.0, max(0.0, p.y - lidL));
  // the monitor's colour bounces into the wet white
  sclera += screenTint * 0.16 * keyB * sphere;
  // The cornea stands proud of the ball rather than being painted onto it, so
  // it shades the sclera beside it on the side facing away from the monitor
  // and catches a thin bright rim on the side facing it. Without this the eye
  // is a flat disc with a circle drawn on it.
  float beside = smoothstep(0.97, 1.30, cRad) * (1.0 - smoothstep(1.30, 1.85, cRad));
  vec2 keyDir = normalize(KEY.xy);
  float facing = dot(normalize(eRaw + vec2(1e-5)), keyDir);
  sclera *= 1.0 - 0.34 * beside * clamp(-facing, 0.0, 1.0);
  sclera += vec3(0.9, 0.92, 1.0) * 0.05 * beside * clamp(facing, 0.0, 1.0) * lit;

  // ---- iris ---------------------------------------------------------------
  // Era colour as a tint over a real iris, rather than as the iris. Pure
  // #00ff41 fibres read as green fur; this keeps the stroma brown-grey and lets
  // the era through the lit fibres and the reflection above them.
  float ang = atan(e.y, e.x);
  vec2 polar = vec2(cos(ang), sin(ang)) * 3.2 + vec2(rad * 2.4);
  float fibre = fbm(polar * 2.6);
  fibre = mix(fibre, 0.5 + 0.5 * sin(ang * 96.0 + fibre * 6.0), 0.30);
  fibre = mix(fibre, 0.5 + 0.5 * sin(ang * 210.0 + rad * 3.0), 0.16);
  fibre = mix(0.5, fibre, 0.82);
  float crypts = smoothstep(0.35, 0.75, vnoise(polar * 5.0 + 11.0));
  // muscle fibres stretch and bunch as the pupil works
  float stretch = smoothstep(0.0, 1.0, (rad - uPupil) / max(1.0 - uPupil, 0.2));

  vec3 tint = mix(vec3(0.36, 0.30, 0.22), uIris, 0.55);
  vec3 irisDeep = mix(vec3(0.030, 0.026, 0.028), tint * 0.30, 0.55);
  vec3 irisLit = mix(vec3(0.44, 0.36, 0.25), tint, 0.44);
  vec3 iris = mix(irisDeep, irisLit, clamp(fibre, 0.0, 1.0));
  iris = mix(iris, irisDeep, crypts * 0.55 * smoothstep(0.2, 0.95, rad));
  iris *= 0.58 + 0.52 * stretch;
  // collarette, the raised ring around the pupil
  iris = mix(iris, irisLit * 1.25,
             smoothstep(0.12, 0.0, abs(rad - uPupil - 0.14)) * 0.45);
  // limbal ring: the dark band that makes an iris read as an iris
  iris = mix(iris, vec3(0.035, 0.035, 0.048), smoothstep(0.82, 1.0, rad) * 0.88);
  iris *= 0.30 + 0.68 * keyB;
  iris += screenTint * 0.14 * keyB * (1.0 - stretch * 0.4);

  float irisEdge = aa / IRIS_R;
  float irisMask = 1.0 - smoothstep(1.0 - irisEdge, 1.0, rad);
  vec3 eyeCol = mix(sclera, iris, irisMask);
  // The corners are pockets, not edges: the lids meet there and almost no light
  // reaches in. This is most of what stops the eye reading as a cut-out.
  float canthus = smoothstep(0.34, 0.02, A - abs(p.x));
  eyeCol *= 1.0 - 0.55 * canthus * canthus;
  // the limbus: a soft blue-grey halo just outside the iris
  eyeCol = mix(eyeCol, vec3(0.13, 0.14, 0.18),
               smoothstep(0.055, 0.0, abs(rad - 1.01)) * 0.62);
  eyeCol = mix(eyeCol, vec3(0.46, 0.49, 0.56),
               smoothstep(0.045, 0.0, abs(rad - 1.075)) * 0.22);

  // ---- pupil --------------------------------------------------------------
  float pupilR = IRIS_R * uPupil * uDilate;
  float pupil = 1.0 - smoothstep(pupilR - aa, pupilR + aa, length(e));
  // not a black disc: a hole with depth, a shadowed rim and a faint fundus glow
  float into = length(e) / max(pupilR, 1e-4);
  vec3 inner = mix(vec3(0.014, 0.010, 0.012), vec3(0.002), smoothstep(0.2, 1.0, into));
  inner += vec3(0.09, 0.02, 0.02) * smoothstep(1.0, 0.25, into) * 0.30;
  eyeCol = mix(eyeCol, inner, pupil);
  // light that made it inside, landing upside down as it does on a retina.
  // Kept faint — a legible page inside the pupil reads as a bug, not as optics.
  vec2 innerUv = -(e / max(pupilR, 1e-4)) * vec2(0.26, 0.17) + vec2(0.5, 0.55);
  eyeCol = mix(eyeCol, screenTex(innerUv, 4.0) * inPanel(innerUv, 0.2) * 0.5,
               pupil * 0.035 * smoothstep(1.0, 0.1, into));

  // ---- the glass ----------------------------------------------------------
  float cornea = 1.0 - smoothstep(0.965, 1.0, cRad);
  if (cornea > 0.002) {
    // A real reflection: bounce the view off the dome and find where that ray
    // meets the monitor. Mirrored, fisheyed and Fresnel-weighted for free.
    vec3 R = reflect(-V, N);
    vec2 hit = R.xy / max(R.z, 0.08) * SCREEN_D;
    vec2 ruv = (hit - SCREEN_C) / SCREEN_H * 0.5 + 0.5;
    ruv.x = 1.0 - ruv.x;                       // laterally inverted, as a mirror

    // The dome is the lens. Rather than laying a glass square over the shot,
    // the corneal image is refracted through the cornea's own curvature: the
    // centre magnifies, the limbus compresses, and each wavelength gets its own
    // index of refraction, so the fringing grows with curvature the way real
    // glass does — strong at the rim, absent dead centre.
    vec2 rc = ruv * 2.0 - 1.0;
    float r2 = clamp(dot(rc, rc), 0.0, 2.0);
    float ior = -0.13 * (0.30 + 0.70 * cd);
    vec2 uvR = 0.5 + (ruv - 0.5) * lensScale(ior * 1.07, r2);
    vec2 uvG = 0.5 + (ruv - 0.5) * lensScale(ior, r2);
    vec2 uvB = 0.5 + (ruv - 0.5) * lensScale(ior * 0.93, r2);

    // A monitor reflected in an eye has edges. Crisp across the middle of the
    // dome, softening toward the limbus where the tear film thins.
    float soft = 0.004 + 0.022 * cd;
    float onRefl = inPanel(uvG, soft);
    float rough = (0.45 + 3.2 * pow(cd, 3.0) + r2 * r2 * 0.8 + length(tear) * 1.1)
                  * (1.0 - 0.5 * blown);
    vec3 refl = vec3(
      screenTex(uvR, rough).r,
      screenTex(uvG, rough).g,
      screenTex(uvB, rough).b
    );
    refl = tube(refl, uvG, uCrt * 0.45);
    // thick glass: it gathers light in the middle and shades into its own edge
    refl *= 0.75 + 0.55 * (1.0 - cd * cd);

    // Compress the panel against its own brightness before the eye adds it in,
    // so the era's layout survives its own highlight; then pull its midtones
    // apart again, because what survives a highlight is contrast, not light.
    refl = mix(refl, refl / (1.0 + refl * 0.9), 0.8 * blown);
    refl = mix(refl, clamp((refl - 0.5) * 1.5 + 0.42, 0.0, 1.0), 0.7 * blown);

    // the monitor's own body around the panel, then the dark room past it
    float body = inPanel(0.5 + (uvG - 0.5) * 0.86, soft);
    vec3 mirrored = mix(vec3(0.008, 0.009, 0.012), vec3(0.030, 0.031, 0.036), body);
    mirrored = mix(mirrored, refl, onRefl);

    // Schlick, against the true dome normal
    float f0 = 0.035;
    float fres = f0 + (1.0 - f0) * pow(1.0 - max(dot(N, V), 0.0), 5.0);
    // Schlick alone would hide the panel face-on; a monitor is orders of
    // magnitude brighter than the eye it lights, so the source term carries it.
    // A monitor is orders of magnitude brighter than the eye it lights, so the
    // panel carries most of its own weight and Fresnel only shapes the rim.
    // Bright eras do not need help; dark ones do, or the panel disappears.
    float source = 0.86 - 0.22 * uScreenLum;
    float k = uReflect * source * (0.70 + 3.6 * fres);
    k *= cornea * mix(0.16, 1.0, onRefl);
    k *= mix(0.62, 1.0, irisMask);      // the bright sclera holds less of it
    k *= 1.0 - 0.34 * uScreenLum;       // and a white page does not own the eye
    k *= calm;
    eyeCol = 1.0 - (1.0 - eyeCol) * (1.0 - mirrored * clamp(k, 0.0, 1.0));

    // The panel as an emitter, not only as a mirror: this is the highlight the
    // whole shot hangs on, and Fresnel alone leaves it too weak to read.
    eyeCol += refl * onRefl * cornea * uReflect * (0.40 - 0.16 * uScreenLum) * calm;
    // its blown-out middle
    float core = onRefl *
      smoothstep(0.30, 0.0, max(abs(uvG.x - 0.5), abs(uvG.y - 0.5)) - 0.18);
    eyeCol += screenTint * core * cornea * (0.18 + 0.10 * uScreenLum) * calm;
    // the limbus: the rim of the lens catching light, and the shade just
    // inside it where the dome turns away
    eyeCol *= 1.0 - 0.24 * smoothstep(0.68, 1.0, cd) * cornea;
    eyeCol += vec3(1.0) * smoothstep(0.94, 1.0, cd) * cornea *
              (0.05 + 0.09 * uScreenLum);
    // one specular streak across the top-left of the dome, the highlight that
    // tells you the surface is glass and not paint
    float streak = smoothstep(0.06, 0.0,
      abs(dot(eRaw / CORNEA_R, normalize(vec2(0.72, 0.69))) + 0.42));
    eyeCol += vec3(1.0) * streak * cornea * (1.0 - cd * cd) *
              (0.09 + 0.13 * uScreenLum);
  }

  // tear film: a bright wet line along the lower lid, a thinner one under the
  // upper. This is most of what tells you the surface is wet.
  float mid = 1.0 - smoothstep(0.25, 0.92, abs(p.x) / A);
  float wetLo = smoothstep(0.016, 0.0, abs(p.y - lidL)) * inX * mid;
  float wetUp = smoothstep(0.009, 0.0, abs(p.y - lidU)) * inX * mid;
  eyeCol += (wetLo * 0.16 + wetUp * 0.07) * (0.55 + screenTint * 0.9);

  float duct = smoothstep(0.10, 0.0,
                          length((p - vec2(-(A - 0.10), -0.01)) * vec2(1.0, 1.5)));
  eyeCol = mix(eyeCol, vec3(0.52, 0.31, 0.30) * (0.35 + 0.5 * keyB),
               duct * 0.40 * inside);

  col = mix(col, eyeCol, inside * uFade);

  col = mix(col, vec3(0.006, 0.006, 0.009),
            pupil * step(1.05, uDilate) * uFade);

  // The exposure the whole shot is graded at. A phosphor terminal is printed
  // as it is; a white page is stopped down, which is the only way its layout
  // survives its own light.
  col *= 1.0 - 0.34 * blown;

  // The outer frame is a dark room and stays one. Everything away from the
  // middle of the shot falls off hard, so the widened corners of the fissure
  // sink into the surround instead of advertising how far the eye now runs.
  float vr = length((vUv - 0.5) * vec2(1.22, 1.0));
  col *= mix(0.38, 1.0, smoothstep(0.80, 0.22, vr));

  gl_FragColor = vec4(tonemap(col), 1.0);
}
`;
