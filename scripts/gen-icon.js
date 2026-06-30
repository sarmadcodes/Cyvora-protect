/* eslint-disable */
// Cyvora Protect — app icon.
// Dark rounded square. Cyan wireframe globe (triangulated mesh with glowing
// edges and bright dot vertices). White 3D padlock centered on top.
//   node scripts/gen-icon.js
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const OUT = path.join(__dirname, '..', 'assets', 'images', 'AppIcon-1024.png');
const SIZE = 1024, SS = 2, S = SIZE * SS;

const R = new Float32Array(S * S);
const G = new Float32Array(S * S);
const B = new Float32Array(S * S);

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const sstep = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;

function blend(x, y, col, a) {
  if (a <= 0 || x < 0 || y < 0 || x >= S || y >= S) return;
  const i = (y | 0) * S + (x | 0), ia = 1 - a;
  R[i] = R[i] * ia + col[0] * a; G[i] = G[i] * ia + col[1] * a; B[i] = B[i] * ia + col[2] * a;
}
function addL(x, y, col, a) {
  if (a <= 0 || x < 0 || y < 0 || x >= S || y >= S) return;
  const i = (y | 0) * S + (x | 0);
  R[i] = Math.min(1, R[i] + col[0] * a);
  G[i] = Math.min(1, G[i] + col[1] * a);
  B[i] = Math.min(1, B[i] + col[2] * a);
}
function setP(x, y, r, g, b) {
  const i = (y | 0) * S + (x | 0);
  R[i] = r; G[i] = g; B[i] = b;
}

// ─── Background: dark navy with subtle radial glow, rounded squircle mask ───
const CX = S / 2, CY = S / 2;
const ICON_R = S * 0.22; // corner radius
function squircle(x, y) {
  // distance from rounded-rect edge (positive = inside)
  const hw = S / 2, hh = S / 2;
  const dx = Math.abs(x - CX), dy = Math.abs(y - CY);
  const ix = dx - (hw - ICON_R), iy = dy - (hh - ICON_R);
  if (ix < 0 && iy < 0) return Math.min(hw - dx, hh - dy);
  if (ix < 0) return hh - dy;
  if (iy < 0) return hw - dx;
  return ICON_R - Math.hypot(ix, iy);
}

console.log('background…');
for (let y = 0; y < S; y++) {
  for (let x = 0; x < S; x++) {
    const d = squircle(x, y);
    if (d <= -2) { setP(x, y, 0, 0, 0); continue; }
    // radial darkening toward edges, slight blue tint top
    const dx = (x - CX) / (S / 2), dy = (y - CY) / (S / 2);
    const rr = Math.hypot(dx, dy);
    const top = sstep(1, -0.2, dy);
    const base = 0.008 + 0.016 * (1 - rr) + 0.012 * top;
    let r = base * 0.35, g = base * 0.65, b = base * 1.3 + 0.012;
    // strong ambient blue glow behind globe (atmosphere bloom)
    const glow1 = Math.exp(-rr * rr * 3.2) * 0.22;
    const glow2 = Math.exp(-rr * rr * 8.0) * 0.18;
    r += (glow1 + glow2) * 0.04;
    g += (glow1 + glow2) * 0.42;
    b += (glow1 + glow2) * 1.0;
    setP(x, y, r, g, b);
  }
}
// edge anti-alias mask
function applyEdgeMask() {
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const d = squircle(x, y);
      if (d < 2) {
        const a = clamp((d + 2) / 4, 0, 1);
        const i = y * S + x;
        R[i] *= a; G[i] *= a; B[i] *= a;
      }
    }
  }
}

// ─── Globe: wireframe sphere — generate points + edges ───
console.log('globe wireframe…');
const GR = S * 0.38;             // globe radius
const TILT = -0.32;              // tilt around X
const YAW = 0.55;                // yaw around Y

// Generate points using a Fibonacci sphere for even distribution
const N = 110;
const pts = [];
const phi0 = Math.PI * (3 - Math.sqrt(5));
for (let i = 0; i < N; i++) {
  const y = 1 - (i / (N - 1)) * 2;
  const r = Math.sqrt(1 - y * y);
  const phi = phi0 * i;
  pts.push([Math.cos(phi) * r, y, Math.sin(phi) * r]);
}

// Rotate
function rotate(p) {
  let [x, y, z] = p;
  // yaw (Y)
  let cy = Math.cos(YAW), sy = Math.sin(YAW);
  let nx = x * cy + z * sy, nz = -x * sy + z * cy;
  x = nx; z = nz;
  // tilt (X)
  let ct = Math.cos(TILT), st = Math.sin(TILT);
  let ny = y * ct - z * st; nz = y * st + z * ct;
  return [x, ny, nz];
}
const rp = pts.map(rotate);

// Build edges: connect each point to its k nearest neighbors
const K = 5;
const edgeSet = new Set();
const edges = [];
for (let i = 0; i < N; i++) {
  const dists = [];
  for (let j = 0; j < N; j++) {
    if (j === i) continue;
    const dx = pts[i][0] - pts[j][0], dy = pts[i][1] - pts[j][1], dz = pts[i][2] - pts[j][2];
    dists.push([j, dx * dx + dy * dy + dz * dz]);
  }
  dists.sort((a, b) => a[1] - b[1]);
  for (let k = 0; k < K; k++) {
    const j = dists[k][0];
    const key = i < j ? i + ',' + j : j + ',' + i;
    if (!edgeSet.has(key)) { edgeSet.add(key); edges.push([i, j]); }
  }
}

// Project to 2D
function project(p) {
  return [CX + p[0] * GR, CY + p[1] * GR, p[2]]; // z for depth
}
const proj = rp.map(project);

// Line with thickness + glow
function drawLine(x0, y0, x1, y1, depth, baseCol) {
  // depth ~ avg z of endpoints (-1 front, +1 back). Front brighter.
  const frontness = clamp(0.5 - depth * 0.5, 0, 1); // 1 front, 0 back
  const alpha = 0.12 + 0.78 * frontness;
  const thick = 0.7 + 1.4 * frontness;
  const col = [baseCol[0] * alpha, baseCol[1] * alpha, baseCol[2] * alpha];

  const dx = x1 - x0, dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  const steps = Math.ceil(len);
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const x = x0 + dx * t, y = y0 + dy * t;
    // soft-thick stamp
    const rad = thick + 0.8;
    const ix0 = Math.floor(x - rad), ix1 = Math.ceil(x + rad);
    const iy0 = Math.floor(y - rad), iy1 = Math.ceil(y + rad);
    for (let yy = iy0; yy <= iy1; yy++) {
      for (let xx = ix0; xx <= ix1; xx++) {
        const dd = Math.hypot(xx - x, yy - y);
        if (dd > rad) continue;
        const core = sstep(thick, 0, dd);
        const glow = Math.exp(-dd * dd / (thick * 1.8)) * 0.35;
        addL(xx, yy, col, core * 0.9 + glow);
      }
    }
  }
}

// Edge color: cyan
const CYAN = [0.25, 0.85, 1.0];
const CYAN_BRIGHT = [0.6, 1.0, 1.0];

// Draw all edges, back first (sort by depth)
const drawList = edges.map(([i, j]) => {
  const a = proj[i], b = proj[j];
  return { x0: a[0], y0: a[1], x1: b[0], y1: b[1], z: (a[2] + b[2]) / 2 };
});
drawList.sort((a, b) => b.z - a.z); // back first
for (const e of drawList) drawLine(e.x0, e.y0, e.x1, e.y1, e.z, CYAN);

// Draw vertex dots (front more vivid)
console.log('vertices…');
const dotList = proj.map((p, i) => ({ x: p[0], y: p[1], z: p[2] }));
dotList.sort((a, b) => b.z - a.z);
for (const d of dotList) {
  const frontness = clamp(0.5 - d.z * 0.5, 0, 1);
  const r = 2.2 + 4.5 * frontness;
  const glowR = r * 4;
  // glow
  for (let yy = Math.floor(d.y - glowR); yy <= Math.ceil(d.y + glowR); yy++) {
    for (let xx = Math.floor(d.x - glowR); xx <= Math.ceil(d.x + glowR); xx++) {
      const dd = Math.hypot(xx - d.x, yy - d.y);
      if (dd > glowR) continue;
      const g = Math.exp(-dd * dd / (r * r * 2)) * (0.4 + 0.5 * frontness);
      addL(xx, yy, CYAN, g);
    }
  }
  // core dot (white-cyan)
  for (let yy = Math.floor(d.y - r); yy <= Math.ceil(d.y + r); yy++) {
    for (let xx = Math.floor(d.x - r); xx <= Math.ceil(d.x + r); xx++) {
      const dd = Math.hypot(xx - d.x, yy - d.y);
      if (dd > r) continue;
      const a = sstep(r, r - 1.5, dd);
      blend(xx, yy, CYAN_BRIGHT, a * (0.55 + 0.4 * frontness));
    }
  }
}

// Outer atmosphere — bright rim halo around globe silhouette
console.log('atmosphere…');
const ATM_R = GR + 4;
for (let y = Math.floor(CY - ATM_R - 60); y <= Math.ceil(CY + ATM_R + 60); y++) {
  for (let x = Math.floor(CX - ATM_R - 60); x <= Math.ceil(CX + ATM_R + 60); x++) {
    const d = Math.hypot(x - CX, y - CY);
    if (d < ATM_R - 10 || d > ATM_R + 60) continue;
    // tight bright rim
    const rim = sstep(ATM_R + 12, ATM_R + 2, d) * sstep(ATM_R - 10, ATM_R + 2, d);
    addL(x, y, CYAN_BRIGHT, rim * 0.55);
    // soft outer halo
    const halo = sstep(ATM_R + 60, ATM_R + 4, d) * sstep(ATM_R - 4, ATM_R + 8, d);
    addL(x, y, CYAN, halo * 0.25);
  }
}

// ─── White 3D padlock — centered ───
console.log('padlock…');
const LOCK_W = S * 0.30;
const LOCK_H = S * 0.32;
const LOCK_CX = CX;
const LOCK_CY = CY + S * 0.025;
const BODY_W = LOCK_W;
const BODY_H = LOCK_W * 0.78;
const BODY_TOP = LOCK_CY - BODY_H * 0.42;
const BODY_BOT = BODY_TOP + BODY_H;
const BODY_L = LOCK_CX - BODY_W / 2;
const BODY_R = LOCK_CX + BODY_W / 2;
const BODY_RAD = BODY_W * 0.17;

// Shackle
const SHK_R_OUT = BODY_W * 0.32;
const SHK_R_IN = SHK_R_OUT * 0.58;
const SHK_CY = BODY_TOP - SHK_R_OUT * 0.05;
const SHK_THK = SHK_R_OUT - SHK_R_IN;

// Soft cyan rim-light behind the lock (so it pops off the globe)
for (let y = Math.floor(LOCK_CY - LOCK_H * 0.7); y <= Math.ceil(LOCK_CY + LOCK_H * 0.7); y++) {
  for (let x = Math.floor(LOCK_CX - LOCK_W * 0.8); x <= Math.ceil(LOCK_CX + LOCK_W * 0.8); x++) {
    const dx = (x - LOCK_CX) / (LOCK_W * 0.55);
    const dy = (y - LOCK_CY) / (LOCK_H * 0.55);
    const r = Math.sqrt(dx * dx + dy * dy);
    const g = Math.exp(-r * r * 2.2) * 0.45;
    addL(x, y, CYAN, g);
  }
}
// Drop shadow under lock
for (let y = Math.floor(BODY_BOT - 10); y <= Math.ceil(BODY_BOT + 70); y++) {
  for (let x = Math.floor(BODY_L - 24); x <= Math.ceil(BODY_R + 24); x++) {
    const dx = (x - LOCK_CX) / (BODY_W * 0.58);
    const dy = (y - (BODY_BOT + 18)) / 26;
    const f = Math.exp(-(dx * dx + dy * dy) * 1.3);
    blend(x, y, [0, 0, 0], f * 0.62);
  }
}

// Shackle (U shape) — two vertical legs + top arc, behind body
function rectRoundDist(x, y, l, r, t, b, rad) {
  const cx = (l + r) / 2, cy = (t + b) / 2;
  const hw = (r - l) / 2 - rad, hh = (b - t) / 2 - rad;
  const dx = Math.max(Math.abs(x - cx) - hw, 0);
  const dy = Math.max(Math.abs(y - cy) - hh, 0);
  return Math.hypot(dx, dy) - rad;
}

function shackleDist(x, y) {
  const dxc = x - LOCK_CX, dyc = y - SHK_CY;
  // upper arc (annulus, only y < SHK_CY)
  if (dyc <= 0) {
    const d = Math.hypot(dxc, dyc);
    return Math.max(d - SHK_R_OUT, SHK_R_IN - d);
  }
  // legs: vertical bars at x = ±(SHK_R_IN + SHK_THK/2)
  const legX = SHK_R_IN + SHK_THK / 2;
  const legHalfW = SHK_THK / 2;
  const inLegX = Math.abs(dxc) >= SHK_R_IN && Math.abs(dxc) <= SHK_R_OUT;
  const legTop = SHK_CY;
  const legBot = BODY_TOP + BODY_H * 0.18; // legs end inside body
  if (inLegX && y >= legTop && y <= legBot) return -1; // inside
  // distance to nearest leg
  const lx = LOCK_CX + Math.sign(dxc || 1) * legX;
  const ddx = Math.abs(x - lx) - legHalfW;
  const ddy = y < legTop ? legTop - y : (y > legBot ? y - legBot : 0);
  return Math.hypot(Math.max(ddx, 0), ddy) - 0.001;
}

// Draw shackle with shading (steel gradient)
console.log('  shackle…');
for (let y = Math.floor(SHK_CY - SHK_R_OUT - 4); y <= Math.ceil(BODY_TOP + BODY_H * 0.25); y++) {
  for (let x = Math.floor(LOCK_CX - SHK_R_OUT - 4); x <= Math.ceil(LOCK_CX + SHK_R_OUT + 4); x++) {
    const d = shackleDist(x, y);
    if (d > 1.5) continue;
    const a = clamp(0.5 - d, 0, 1);
    if (a <= 0) continue;
    // shading: angle from center of cross-section
    const dxc = x - LOCK_CX, dyc = y - SHK_CY;
    let shade;
    if (dyc <= 0) {
      const ang = Math.atan2(dyc, dxc); // around top arc
      shade = 0.55 + 0.45 * Math.cos(ang + 0.5); // highlight upper-left-ish
    } else {
      // legs: shade by horizontal position within thickness
      const sideX = Math.sign(dxc);
      const localX = (Math.abs(dxc) - SHK_R_IN) / SHK_THK; // 0..1
      shade = 0.45 + 0.55 * (1 - Math.abs(localX - 0.35) * 1.6);
      // darken inner edge a bit
      if (sideX > 0) shade *= 0.95;
    }
    shade = clamp(shade, 0.35, 1.05);
    const col = [shade * 0.92, shade * 0.95, shade * 1.0];
    blend(x, y, col, a);
  }
}

// Body — white rounded rectangle with 3D shading
console.log('  body…');
for (let y = Math.floor(BODY_TOP - 2); y <= Math.ceil(BODY_BOT + 2); y++) {
  for (let x = Math.floor(BODY_L - 2); x <= Math.ceil(BODY_R + 2); x++) {
    const d = rectRoundDist(x, y, BODY_L, BODY_R, BODY_TOP, BODY_BOT, BODY_RAD);
    if (d > 1.5) continue;
    const a = clamp(0.5 - d, 0, 1);
    if (a <= 0) continue;
    // metallic shading: top-bright, mid-gray band, bottom-bright (chrome look)
    const nx = (x - LOCK_CX) / (BODY_W / 2);
    const ny = (y - (BODY_TOP + BODY_H / 2)) / (BODY_H / 2); // -1 top, +1 bot
    // base chrome gradient (two bright bands top + bottom, darker mid)
    const chrome = 0.78 + 0.22 * Math.cos(ny * 2.4 + 0.3);
    // left-right curvature (slightly darker on right)
    const sideShade = 1 - Math.abs(nx) * 0.12 - nx * 0.05;
    // rim darken
    const rim = sstep(-6, 0, d) * 0.22;
    let shade = chrome * sideShade - rim;
    // bright top highlight
    const hl = sstep(BODY_TOP + BODY_H * 0.22, BODY_TOP + BODY_H * 0.04, y);
    shade += hl * 0.20;
    // soft inner shadow at very bottom
    const bs = sstep(BODY_BOT - BODY_H * 0.08, BODY_BOT, y);
    shade -= bs * 0.20;
    shade = clamp(shade, 0.5, 1.08);
    const col = [shade * 0.99, shade * 1.0, shade * 1.02];
    blend(x, y, col, a);
  }
}

// Keyhole — dark, on body
console.log('  keyhole…');
const KH_CX = LOCK_CX;
const KH_CY = BODY_TOP + BODY_H * 0.42;
const KH_R = BODY_W * 0.085;
const KH_SLOT_W = KH_R * 0.85;
const KH_SLOT_BOT = KH_CY + BODY_H * 0.28;

for (let y = Math.floor(KH_CY - KH_R - 2); y <= Math.ceil(KH_SLOT_BOT + 2); y++) {
  for (let x = Math.floor(KH_CX - KH_R - 2); x <= Math.ceil(KH_CX + KH_R + 2); x++) {
    // circle
    const dc = Math.hypot(x - KH_CX, y - KH_CY) - KH_R;
    // slot rect
    const slotL = KH_CX - KH_SLOT_W / 2, slotR = KH_CX + KH_SLOT_W / 2;
    const ds = rectRoundDist(x, y, slotL, slotR, KH_CY, KH_SLOT_BOT, KH_SLOT_W * 0.35);
    const d = Math.min(dc, ds);
    if (d > 1.5) continue;
    const a = clamp(0.5 - d, 0, 1);
    if (a <= 0) continue;
    // dark with subtle inner blue shadow
    const col = [0.04, 0.07, 0.12];
    blend(x, y, col, a);
  }
}

// Specular highlight on body top
for (let y = Math.floor(BODY_TOP + 4); y <= Math.ceil(BODY_TOP + BODY_H * 0.22); y++) {
  for (let x = Math.floor(BODY_L + BODY_RAD); x <= Math.ceil(BODY_R - BODY_RAD); x++) {
    const d = rectRoundDist(x, y, BODY_L, BODY_R, BODY_TOP, BODY_BOT, BODY_RAD);
    if (d > -2) continue;
    const ty = sstep(BODY_TOP + BODY_H * 0.22, BODY_TOP + 6, y);
    const tx = 1 - Math.abs((x - LOCK_CX) / (BODY_W * 0.42));
    addL(x, y, [1, 1, 1], ty * tx * 0.18);
  }
}

// Apply rounded-corner mask
applyEdgeMask();

// ─── Downsample 2x → 1024 and write PNG ───
console.log('downsample + write…');
const png = new PNG({ width: SIZE, height: SIZE });
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    let rr = 0, gg = 0, bb = 0;
    for (let oy = 0; oy < SS; oy++) {
      for (let ox = 0; ox < SS; ox++) {
        const i = (y * SS + oy) * S + (x * SS + ox);
        rr += R[i]; gg += G[i]; bb += B[i];
      }
    }
    const n = SS * SS;
    rr /= n; gg /= n; bb /= n;
    const o = (y * SIZE + x) * 4;
    png.data[o] = clamp(Math.round(rr * 255), 0, 255);
    png.data[o + 1] = clamp(Math.round(gg * 255), 0, 255);
    png.data[o + 2] = clamp(Math.round(bb * 255), 0, 255);
    png.data[o + 3] = 255; // fully opaque
  }
}
fs.mkdirSync(path.dirname(OUT), { recursive: true });
png.pack().pipe(fs.createWriteStream(OUT)).on('finish', () => {
  console.log('wrote', OUT);
});
