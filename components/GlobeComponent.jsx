import React, { useEffect, useRef, useState, useMemo, memo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Svg, {
  Circle, Path, G, Defs, ClipPath, Rect, Line,
  RadialGradient, LinearGradient, Stop,
} from 'react-native-svg';

const DEG = Math.PI / 180;
const TARGET_FPS = 30;
const FRAME_MS = 1000 / TARGET_FPS;
const ROT_STEP = 2;          // degrees — how often the heavy surface rebuilds
const TILT_STEP = 2.5 * (Math.PI / 180);   // orbit-precession rebuild step (radians)

const LAT_LINES = [-60, -30, 0, 30, 60];
const LON_COUNT = 12;

// ─── REAL CONTINENT OUTLINES [lat, lon] ──────────────────────────────────────
const RAW_CONTINENTS = [
  // North America
  [[71,-137],[70,-128],[60,-140],[58,-152],[56,-163],[60,-166],[64,-168],[68,-166],[71,-156],[71,-143],[68,-120],[60,-95],[60,-84],[62,-75],[58,-68],[55,-60],[47,-52],[44,-66],[41,-70],[41,-74],[35,-76],[30,-81],[25,-80],[25,-90],[20,-87],[15,-83],[10,-85],[8,-77],[10,-75],[12,-72],[16,-62],[20,-72],[23,-82],[25,-90],[22,-105],[18,-103],[23,-110],[28,-110],[30,-115],[32,-118],[34,-120],[38,-123],[42,-124],[48,-124],[52,-128],[56,-130],[58,-136],[60,-145],[71,-137]],
  // Greenland
  [[83,-30],[80,-20],[76,-18],[72,-22],[70,-24],[68,-26],[66,-34],[64,-40],[62,-44],[60,-44],[61,-48],[64,-52],[66,-53],[68,-56],[70,-54],[72,-56],[76,-60],[78,-68],[80,-68],[82,-30],[83,-30]],
  // South America
  [[12,-72],[10,-62],[8,-60],[5,-52],[0,-50],[-5,-35],[-10,-37],[-15,-39],[-20,-41],[-23,-43],[-30,-50],[-35,-57],[-40,-62],[-46,-66],[-52,-68],[-56,-67],[-55,-65],[-50,-69],[-45,-65],[-40,-65],[-35,-58],[-30,-50],[-15,-75],[-10,-78],[-5,-81],[0,-80],[5,-77],[8,-77],[10,-75],[12,-72]],
  // Europe
  [[36,5],[38,0],[43,-9],[48,-5],[53,-10],[57,-6],[58,-5],[60,5],[65,14],[68,15],[70,25],[70,30],[65,25],[60,25],[57,22],[55,22],[53,14],[53,9],[56,8],[55,12],[55,15],[52,14],[50,14],[48,17],[46,13],[45,14],[44,14],[42,14],[40,18],[38,16],[38,14],[40,10],[44,8],[43,5],[41,1],[39,0],[36,5]],
  // Africa
  [[37,10],[33,12],[32,25],[31,32],[27,34],[22,37],[15,42],[12,44],[11,43],[11,51],[2,42],[-2,41],[-5,40],[-10,40],[-15,35],[-20,35],[-25,33],[-30,31],[-34,26],[-34,18],[-30,17],[-25,15],[-20,12],[-15,12],[-10,14],[-5,10],[0,9],[5,2],[5,-8],[4,-15],[10,-17],[15,-17],[18,-15],[20,-17],[22,-17],[25,-15],[30,-10],[32,-8],[35,-5],[37,10]],
  // Asia
  [[37,36],[42,42],[43,50],[45,60],[40,55],[37,57],[36,60],[37,68],[40,72],[42,70],[45,75],[50,80],[55,85],[60,90],[62,95],[60,100],[55,100],[52,105],[50,103],[47,100],[44,95],[40,90],[35,75],[28,72],[22,68],[20,73],[15,73],[10,77],[8,80],[15,80],[20,87],[25,92],[27,95],[28,98],[22,100],[15,108],[10,104],[5,103],[5,100],[13,100],[15,102],[18,104],[22,114],[28,120],[35,120],[38,122],[40,124],[42,130],[45,137],[48,140],[52,141],[55,135],[58,130],[62,130],[66,133],[68,135],[70,130],[72,140],[72,130],[70,110],[72,100],[72,90],[70,70],[68,55],[65,35],[60,30],[57,26],[53,22],[50,18],[47,16],[45,15],[40,26],[37,36]],
  // Australia
  [[-14,130],[-12,135],[-12,140],[-15,145],[-20,148],[-25,152],[-28,153],[-30,153],[-34,151],[-38,148],[-38,146],[-35,138],[-34,136],[-32,134],[-32,130],[-28,114],[-22,113],[-20,116],[-18,122],[-16,128],[-14,130]],
  // Great Britain
  [[58,-5],[57,-2],[55,-1.5],[54,-0.5],[53,0.5],[51,1],[50.5,-0.5],[50,-5],[51.5,-4],[53,-4.5],[54.5,-3],[55,-5.5],[57,-6],[58,-5]],
  // Ireland
  [[55,-7.5],[54,-6],[52.5,-6],[51.5,-10],[53,-10],[54.5,-8.5],[55,-7.5]],
  // Japan
  [[45.5,142],[43,145],[41,140],[38,141],[35,140],[34,136],[33,131],[31.5,131],[33,133],[35,135],[37,137],[40,140],[43,141.5],[45.5,142]],
  // Sumatra
  [[5.5,95],[2,99],[-2,102],[-5.5,105.5],[-4,103],[-1,100],[2,97],[4,96],[5.5,95]],
  // Java
  [[-6,105.5],[-7,110],[-8.5,114],[-8,116],[-7,112],[-6.5,108],[-6,105.5]],
  // Borneo
  [[7,117],[4,114.5],[1,110],[-2,110],[-4,114],[-3,117],[0,118.5],[4,119],[7,117]],
  // New Guinea
  [[-0.5,131],[-2,137],[-4,141],[-7,143],[-9,147],[-10,150],[-7,148],[-4,141],[-2,134],[-0.5,131]],
  // Philippines
  [[18.5,121],[16,120],[13,121],[11,123],[8,124],[6,126],[9,126],[12,124],[15,122],[18.5,121]],
  // Madagascar
  [[-12,49],[-15,50],[-20,49],[-23,47],[-25,45],[-24,44],[-20,44],[-16,46],[-13,48.5],[-12,49]],
  // New Zealand (North)
  [[-34.5,173],[-37,176],[-39,177],[-41,175],[-39,174],[-37,174.5],[-34.5,173]],
  // New Zealand (South)
  [[-40.5,172.5],[-43,171],[-46,167],[-46.5,169],[-44,171],[-41.5,174],[-40.5,172.5]],
  // Iceland
  [[66.5,-23],[65.5,-14],[64,-15],[63.5,-20],[65,-24],[66.5,-23]],
  // Cuba
  [[23,-84],[22.5,-80],[21,-77],[20,-74],[21,-78],[22,-82],[23,-84]],
  // Sri Lanka
  [[9.5,80.5],[7,82],[6,81.5],[6.5,80],[8,80],[9.5,80.5]],
];

// Server "nodes" the VPN visualises [lat, lon]
const LOCATIONS = [
  [40, -74], [51, 0], [1, 103], [-23, -46], [35, 139], [-33, 151], [19, 72],
];
const ARCS = [[1, 0], [1, 6], [0, 3], [6, 2], [2, 4], [2, 5]];

// ─── PROJECTION ──────────────────────────────────────────────────────────────
function project(lat, lon, rotDeg, g) {
  const phi = lat * DEG;
  const theta = (lon + rotDeg) * DEG;
  const cosPhi = Math.cos(phi);
  return {
    x: g.cx + g.R * cosPhi * Math.sin(theta),
    y: g.cy - g.R * Math.sin(phi),
    z: g.R * cosPhi * Math.cos(theta),
  };
}

function buildContinents(rot, g) {
  return RAW_CONTINENTS.map(latlons => {
    const segs = [];
    let seg = null;
    for (const [la, lo] of latlons) {
      const p = project(la, lo, rot, g);
      if (p.z >= -g.R * 0.04) {
        if (!seg) seg = [];
        seg.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
      } else {
        if (seg && seg.length > 1) segs.push('M' + seg[0] + ' ' + seg.slice(1).map(v => 'L' + v).join(' ') + ' Z');
        seg = null;
      }
    }
    if (seg && seg.length > 1) segs.push('M' + seg[0] + ' ' + seg.slice(1).map(v => 'L' + v).join(' ') + ' Z');
    return segs.join(' ');
  }).filter(d => d.length > 0);
}

function buildGrid(rot, g) {
  const lat = LAT_LINES.map(la => {
    const pts = [];
    for (let lo = 0; lo <= 360; lo += 6) {
      const p = project(la, lo, rot, g);
      pts.push(p.z >= 0 ? `${p.x.toFixed(1)},${p.y.toFixed(1)}` : null);
    }
    return { la, d: stitch(pts) };
  });
  const step = 360 / LON_COUNT;
  const lon = Array.from({ length: LON_COUNT }, (_, i) => i * step).map(lo => {
    const pts = [];
    for (let la = -90; la <= 90; la += 6) {
      const p = project(la, lo, rot, g);
      pts.push(p.z >= 0 ? `${p.x.toFixed(1)},${p.y.toFixed(1)}` : null);
    }
    return { lo, d: stitch(pts) };
  });
  return { lat, lon };
}

function stitch(pts) {
  let d = '', pen = false;
  for (const p of pts) {
    if (p === null) { pen = false; continue; }
    d += (pen ? 'L' : 'M') + p + ' ';
    pen = true;
  }
  return d;
}

function quadAt(x0, y0, cx, cy, x1, y1, t) {
  const u = 1 - t;
  return {
    x: u * u * x0 + 2 * u * t * cx + t * t * x1,
    y: u * u * y0 + 2 * u * t * cy + t * t * y1,
  };
}

function buildArcs(rot, g) {
  const proj = LOCATIONS.map(([la, lo]) => project(la, lo, rot, g));
  const arcs = [];
  for (const [a, b] of ARCS) {
    const pa = proj[a], pb = proj[b];
    if (pa.z < 0 || pb.z < 0) continue;
    const mx = (pa.x + pb.x) / 2, my = (pa.y + pb.y) / 2;
    const dx = mx - g.cx, dy = my - g.cy;
    const len = Math.hypot(dx, dy) || 1;
    const lift = g.R * 0.45 + len * 0.15;
    const cx = mx + (dx / len) * lift;
    const cy = my + (dy / len) * lift;
    arcs.push({
      d: `M${pa.x.toFixed(1)},${pa.y.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${pb.x.toFixed(1)},${pb.y.toFixed(1)}`,
      x0: pa.x, y0: pa.y, cx, cy, x1: pb.x, y1: pb.y,
    });
  }
  return arcs;
}

function buildPings(rot, g) {
  return LOCATIONS.map(([la, lo]) => project(la, lo, rot, g))
    .filter(p => p.z >= 0)
    .map(p => ({ x: p.x, y: p.y, o: 0.4 + 0.6 * (p.z / g.R) }));
}

// ─── ORBIT RINGS ─────────────────────────────────────────────────────────────
function orbitPos(angle, rc, tilt, g) {
  const px = Math.cos(angle) * rc.rx;
  const py = Math.sin(angle) * rc.ry;
  return {
    x: g.cx + px * Math.cos(tilt) - py * Math.sin(tilt),
    y: g.cy + px * Math.sin(tilt) + py * Math.cos(tilt),
    front: py > 0,
  };
}

function buildRing(rc, tilt, g) {
  const steps = 72;
  const front = [], back = [];
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const px = Math.cos(a) * rc.rx, py = Math.sin(a) * rc.ry;
    const x = g.cx + px * Math.cos(tilt) - py * Math.sin(tilt);
    const y = g.cy + px * Math.sin(tilt) + py * Math.cos(tilt);
    (py > 0 ? front : back).push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  const toPath = a => (a.length ? 'M' + a[0] + ' ' + a.slice(1).map(v => 'L' + v).join(' ') : '');
  return { front: toPath(front), back: toPath(back) };
}

// ─── RING BACK HALVES (behind the globe) — rebuilt as the orbits precess ──────
const RingBack = memo(({ g, ring1, ring2 }) => (
  <Svg width={g.VIEW} height={g.VIEW} style={{ position: 'absolute', top: 0, left: 0 }}>
    <Path d={ring1.back} fill="none" stroke="#37ecff" strokeWidth={g.R * 0.012} strokeOpacity="0.16" />
    <Path d={ring2.back} fill="none" stroke="#9fe0ff" strokeWidth={g.R * 0.010} strokeOpacity="0.12" />
  </Svg>
));

// ─── STATIC SHELL (gradients, sphere, glow) — never re-renders ───────────────
const Shell = memo(({ g }) => (
  <Svg width={g.VIEW} height={g.VIEW} style={{ position: 'absolute', top: 0, left: 0 }}>
    <Defs>
      <RadialGradient id="globeBody" cx="36%" cy="30%" r="78%">
        <Stop offset="0%" stopColor="#0a5a92" />
        <Stop offset="34%" stopColor="#04305f" />
        <Stop offset="66%" stopColor="#021a3d" />
        <Stop offset="100%" stopColor="#01081c" />
      </RadialGradient>
      <RadialGradient id="spec" cx="32%" cy="25%" r="42%">
        <Stop offset="0%" stopColor="#9be6ff" stopOpacity="0.45" />
        <Stop offset="45%" stopColor="#1f8fd0" stopOpacity="0.12" />
        <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
      </RadialGradient>
      <RadialGradient id="atm" cx="50%" cy="50%" r="50%">
        <Stop offset="64%" stopColor="#00d4ff" stopOpacity="0" />
        <Stop offset="90%" stopColor="#00d4ff" stopOpacity="0.30" />
        <Stop offset="100%" stopColor="#3ae6ff" stopOpacity="0" />
      </RadialGradient>
      <RadialGradient id="ambient" cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor="#0a8ad0" stopOpacity="0.22" />
        <Stop offset="55%" stopColor="#063a78" stopOpacity="0.10" />
        <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
      </RadialGradient>
    </Defs>
    <Circle cx={g.cx} cy={g.cy} r={g.R * 1.85} fill="url(#ambient)" />
    <Circle cx={g.cx} cy={g.cy} r={g.R} fill="url(#globeBody)" />
    <Circle cx={g.cx} cy={g.cy} r={g.R} fill="url(#spec)" />
    <Circle cx={g.cx} cy={g.cy} r={g.R * 1.06} fill="url(#atm)" />
    <Circle cx={g.cx} cy={g.cy} r={g.R} fill="none" stroke="#5fe0ff" strokeWidth={g.R * 0.01} strokeOpacity="0.5" />
  </Svg>
));

// ─── RING FRONT HALVES (over the globe) — rebuilt as the orbits precess ───────
const RingFront = memo(({ g, ring1, ring2 }) => (
  <Svg width={g.VIEW} height={g.VIEW} style={{ position: 'absolute', top: 0, left: 0 }}>
    <Defs>
      <LinearGradient id="ringG" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#00d4ff" stopOpacity="0.05" />
        <Stop offset="25%" stopColor="#00d4ff" stopOpacity="0.55" />
        <Stop offset="50%" stopColor="#a9f1ff" stopOpacity="1" />
        <Stop offset="75%" stopColor="#00d4ff" stopOpacity="0.55" />
        <Stop offset="100%" stopColor="#00d4ff" stopOpacity="0.05" />
      </LinearGradient>
    </Defs>
    <Path d={ring2.front} fill="none" stroke="#9fe0ff" strokeWidth={g.R * 0.016} strokeOpacity="0.55" strokeLinecap="round" />
    <Path d={ring1.front} fill="none" stroke="url(#ringG)" strokeWidth={g.R * 0.020} strokeLinecap="round" />
  </Svg>
));

// ─── SURFACE (grid + continents) — rebuilt every ROT_STEP ────────────────────
const Surface = memo(({ g, grid, continents }) => (
  <Svg width={g.VIEW} height={g.VIEW} style={{ position: 'absolute', top: 0, left: 0 }}>
    <Defs>
      <ClipPath id="clip"><Circle cx={g.cx} cy={g.cy} r={g.R} /></ClipPath>
      <RadialGradient id="land" cx="38%" cy="32%" r="80%">
        <Stop offset="0%" stopColor="#27d6c8" />
        <Stop offset="60%" stopColor="#0e8fb0" />
        <Stop offset="100%" stopColor="#0a4f78" />
      </RadialGradient>
    </Defs>
    <G clipPath="url(#clip)">
      {grid.lat.map(({ la, d }) => d ? (
        <Path key={`la${la}`} d={d} fill="none" stroke="#3ad9ff"
          strokeWidth={la === 0 ? g.R * 0.006 : g.R * 0.004}
          strokeOpacity={la === 0 ? 0.20 : 0.10} />
      ) : null)}
      {grid.lon.map(({ lo, d }) => d ? (
        <Path key={`lo${lo}`} d={d} fill="none" stroke="#3ad9ff" strokeWidth={g.R * 0.0035} strokeOpacity="0.09" />
      ) : null)}
      {continents.map((d, i) => (
        <Path key={`cf${i}`} d={d} fill="url(#land)" fillOpacity="0.85" />
      ))}
      {continents.map((d, i) => (
        <Path key={`co${i}`} d={d} fill="none" stroke="#7af6ff" strokeWidth={g.R * 0.006} strokeOpacity="0.55" />
      ))}
    </G>
  </Svg>
));

// ─── ARCS (rebuilt every ROT_STEP) ───────────────────────────────────────────
const ArcLayer = memo(({ g, arcs }) => (
  <Svg width={g.VIEW} height={g.VIEW} style={{ position: 'absolute', top: 0, left: 0 }}>
    {arcs.map((a, i) => (
      <Path key={`arc${i}`} d={a.d} fill="none" stroke="#37ecff"
        strokeWidth={g.R * 0.008} strokeOpacity="0.30" strokeLinecap="round" />
    ))}
  </Svg>
));

// ─── ORBITING ICONS: SHIELD + LOCK ───────────────────────────────────────────
function ShieldIcon({ x, y, size, color, opacity }) {
  const w = size * 0.80, h = size * 1.02, hw = w / 2;
  const d =
    `M${x.toFixed(1)},${(y - h * 0.46).toFixed(1)} ` +
    `C${(x + hw).toFixed(1)},${(y - h * 0.40).toFixed(1)} ${(x + hw).toFixed(1)},${(y - h * 0.34).toFixed(1)} ${(x + hw).toFixed(1)},${(y - h * 0.18).toFixed(1)} ` +
    `L${(x + hw).toFixed(1)},${(y + h * 0.04).toFixed(1)} ` +
    `C${(x + hw).toFixed(1)},${(y + h * 0.30).toFixed(1)} ${(x + hw * 0.5).toFixed(1)},${(y + h * 0.46).toFixed(1)} ${x.toFixed(1)},${(y + h * 0.54).toFixed(1)} ` +
    `C${(x - hw * 0.5).toFixed(1)},${(y + h * 0.46).toFixed(1)} ${(x - hw).toFixed(1)},${(y + h * 0.30).toFixed(1)} ${(x - hw).toFixed(1)},${(y + h * 0.04).toFixed(1)} ` +
    `L${(x - hw).toFixed(1)},${(y - h * 0.18).toFixed(1)} ` +
    `C${(x - hw).toFixed(1)},${(y - h * 0.34).toFixed(1)} ${(x - hw).toFixed(1)},${(y - h * 0.40).toFixed(1)} ${x.toFixed(1)},${(y - h * 0.46).toFixed(1)} Z`;
  return (
    <G opacity={opacity}>
      <Circle cx={x} cy={y} r={size * 0.74} fill={color} fillOpacity="0.14" />
      <Path d={d} fill={color} fillOpacity="0.26" stroke={color} strokeWidth={size * 0.07} strokeLinejoin="round" />
      <Path
        d={`M${(x - w * 0.24).toFixed(1)},${(y + h * 0.02).toFixed(1)} L${(x - w * 0.04).toFixed(1)},${(y + h * 0.16).toFixed(1)} L${(x + w * 0.26).toFixed(1)},${(y - h * 0.16).toFixed(1)}`}
        fill="none" stroke="#eafdff" strokeWidth={size * 0.10} strokeLinecap="round" strokeLinejoin="round"
      />
    </G>
  );
}

function LockIcon({ x, y, size, color, opacity }) {
  const bw = size * 0.66, bh = size * 0.50;
  const bx = x - bw / 2, by = y - bh * 0.02;
  const r = size * 0.10;
  const sr = bw * 0.30;
  const sy = by;
  return (
    <G opacity={opacity}>
      <Circle cx={x} cy={y} r={size * 0.72} fill={color} fillOpacity="0.14" />
      <Path
        d={`M${(x - sr).toFixed(1)},${sy.toFixed(1)} L${(x - sr).toFixed(1)},${(sy - sr * 0.5).toFixed(1)} A${sr.toFixed(1)},${sr.toFixed(1)} 0 0 1 ${(x + sr).toFixed(1)},${(sy - sr * 0.5).toFixed(1)} L${(x + sr).toFixed(1)},${sy.toFixed(1)}`}
        fill="none" stroke={color} strokeWidth={size * 0.10} strokeLinecap="round"
      />
      <Path
        d={`M${(bx + r).toFixed(1)},${by.toFixed(1)} L${(bx + bw - r).toFixed(1)},${by.toFixed(1)} Q${(bx + bw).toFixed(1)},${by.toFixed(1)} ${(bx + bw).toFixed(1)},${(by + r).toFixed(1)} L${(bx + bw).toFixed(1)},${(by + bh - r).toFixed(1)} Q${(bx + bw).toFixed(1)},${(by + bh).toFixed(1)} ${(bx + bw - r).toFixed(1)},${(by + bh).toFixed(1)} L${(bx + r).toFixed(1)},${(by + bh).toFixed(1)} Q${bx.toFixed(1)},${(by + bh).toFixed(1)} ${bx.toFixed(1)},${(by + bh - r).toFixed(1)} L${bx.toFixed(1)},${(by + r).toFixed(1)} Q${bx.toFixed(1)},${by.toFixed(1)} ${(bx + r).toFixed(1)},${by.toFixed(1)} Z`}
        fill={color} fillOpacity="0.30" stroke={color} strokeWidth={size * 0.055}
      />
      <Circle cx={x} cy={by + bh * 0.42} r={size * 0.05} fill="#eafdff" />
      <Path d={`M${x.toFixed(1)},${(by + bh * 0.42).toFixed(1)} L${x.toFixed(1)},${(by + bh * 0.72).toFixed(1)}`}
        stroke="#eafdff" strokeWidth={size * 0.05} strokeLinecap="round" />
    </G>
  );
}

function SatelliteIcon({ x, y, size, color, opacity }) {
  const bw = size * 0.26, bh = size * 0.44;
  const bx = x - bw / 2, by = y - bh / 2;
  const pw = size * 0.30, ph = size * 0.26, gap = size * 0.07;
  const py = y - ph / 2;
  return (
    <G opacity={opacity}>
      <Circle cx={x} cy={y} r={size * 0.68} fill={color} fillOpacity="0.12" />
      {/* solar panels */}
      <Rect x={bx - gap - pw} y={py} width={pw} height={ph} fill={color} fillOpacity="0.20" stroke={color} strokeWidth={size * 0.035} />
      <Rect x={bx + bw + gap} y={py} width={pw} height={ph} fill={color} fillOpacity="0.20" stroke={color} strokeWidth={size * 0.035} />
      <Line x1={bx - gap - pw / 2} y1={py} x2={bx - gap - pw / 2} y2={py + ph} stroke={color} strokeWidth={size * 0.025} strokeOpacity="0.7" />
      <Line x1={bx + bw + gap + pw / 2} y1={py} x2={bx + bw + gap + pw / 2} y2={py + ph} stroke={color} strokeWidth={size * 0.025} strokeOpacity="0.7" />
      {/* connectors */}
      <Line x1={bx - gap} y1={y} x2={bx} y2={y} stroke={color} strokeWidth={size * 0.04} />
      <Line x1={bx + bw} y1={y} x2={bx + bw + gap} y2={y} stroke={color} strokeWidth={size * 0.04} />
      {/* body */}
      <Rect x={bx} y={by} width={bw} height={bh} rx={size * 0.05} fill={color} fillOpacity="0.34" stroke={color} strokeWidth={size * 0.045} />
      {/* antenna */}
      <Line x1={x} y1={by} x2={x} y2={by - size * 0.20} stroke={color} strokeWidth={size * 0.035} strokeLinecap="round" />
      <Circle cx={x} cy={by - size * 0.22} r={size * 0.05} fill="#eafdff" />
    </G>
  );
}

function NodeIcon({ x, y, size, color, opacity }) {
  const rr = size * 0.46;
  const pts = [];
  for (let k = 0; k < 6; k++) {
    const a = (60 * k - 90) * DEG;
    pts.push(`${(x + Math.cos(a) * rr).toFixed(1)},${(y + Math.sin(a) * rr).toFixed(1)}`);
  }
  const d = 'M' + pts.join(' L') + ' Z';
  return (
    <G opacity={opacity}>
      <Circle cx={x} cy={y} r={size * 0.66} fill={color} fillOpacity="0.12" />
      <Path d={d} fill={color} fillOpacity="0.22" stroke={color} strokeWidth={size * 0.06} strokeLinejoin="round" />
      <Circle cx={x} cy={y} r={size * 0.15} fill="#eafdff" />
      <Circle cx={x} cy={y} r={size * 0.28} fill="none" stroke="#eafdff" strokeWidth={size * 0.03} strokeOpacity="0.6" />
    </G>
  );
}

const ICON = {
  lock: { Cmp: LockIcon, color: '#5fe6ff' },
  shield: { Cmp: ShieldIcon, color: '#ffd15a' },
  satellite: { Cmp: SatelliteIcon, color: '#cfe6ff' },
  node: { Cmp: NodeIcon, color: '#43ffb0' },
};

// One depth pass of the orbiting icons ('back' draws behind the globe)
function OrbitLayer({ g, items, face }) {
  const want = face === 'front';
  const sz = g.R * 0.32;
  const sc = f => (f ? 1 : 0.82);
  const op = f => (f ? 1 : 0.42);
  return (
    <Svg width={g.VIEW} height={g.VIEW} style={{ position: 'absolute', top: 0, left: 0 }}>
      {items.map((it, i) => {
        if (it.front !== want) return null;
        const { Cmp, color } = ICON[it.type];
        return <Cmp key={i} x={it.x} y={it.y} size={sz * sc(it.front)} color={color} opacity={op(it.front)} />;
      })}
    </Svg>
  );
}

// ─── LIVE LAYER (per frame: travellers + pulsing pings) ──────────────────────
function Live({ g, travellers, pings, pingT }) {
  return (
    <Svg width={g.VIEW} height={g.VIEW} style={{ position: 'absolute', top: 0, left: 0 }}>
      {travellers.map((t, i) => (
        <G key={`tr${i}`}>
          {t.trail.map((p, k) => (
            <Circle key={k} cx={p.x} cy={p.y} r={g.R * (0.016 - k * 0.005)}
              fill="#bff6ff" fillOpacity={0.45 - k * 0.18} />
          ))}
          <Circle cx={t.head.x} cy={t.head.y} r={g.R * 0.024} fill="#eafdff" />
          <Circle cx={t.head.x} cy={t.head.y} r={g.R * 0.046} fill="#37ecff" fillOpacity="0.25" />
        </G>
      ))}
      {pings.map((p, i) => {
        const ph = (pingT + i * 0.27) % 1;
        return (
          <G key={`pg${i}`} opacity={p.o}>
            <Circle cx={p.x} cy={p.y} r={g.R * (0.04 + ph * 0.10)}
              fill="none" stroke="#37ecff" strokeWidth={g.R * 0.006}
              strokeOpacity={0.6 * (1 - ph)} />
            <Circle cx={p.x} cy={p.y} r={g.R * 0.022} fill="#eafdff" />
            <Circle cx={p.x} cy={p.y} r={g.R * 0.011} fill="#ffffff" />
          </G>
        );
      })}
    </Svg>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function GlobeComponent({ size }) {
  const { width } = useWindowDimensions();

  const g = useMemo(() => {
    const VIEW = size || Math.max(240, Math.min(width * 0.9, 380));
    const R = VIEW * 0.34;
    return {
      VIEW, cx: VIEW / 2, cy: VIEW / 2, R,
      // two orbital planes, kept close to the globe
      ring1: { rx: R * 1.16, ry: R * 0.30, tilt: -22 * DEG },
      ring2: { rx: R * 1.20, ry: R * 0.34, tilt: 28 * DEG },
    };
  }, [width, size]);


  const [anim, setAnim] = useState({ rot: 0, orbit: 0, t: 0 });
  const s = useRef({ rot: 0, orbit: 0, t: 0 }).current;
  const rafRef = useRef(null);
  const lastRef = useRef(null);
  const nextRef = useRef(0);

  useEffect(() => {
    const stepFn = (ts) => {
      rafRef.current = requestAnimationFrame(stepFn);
      if (lastRef.current === null) lastRef.current = ts;
      const dt = Math.min(ts - lastRef.current, 50);
      lastRef.current = ts;

      s.rot = (s.rot + dt * 0.009) % 360;
      s.orbit = (s.orbit + dt * 0.0006) % (Math.PI * 2);
      s.t += dt / 1000;

      if (ts < nextRef.current) return;
      nextRef.current = ts + FRAME_MS;
      setAnim({ rot: s.rot, orbit: s.orbit, t: s.t });
    };
    rafRef.current = requestAnimationFrame(stepFn);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Heavy geometry: only recompute when rotation crosses a ROT_STEP boundary.
  // Memoised so the Surface/Arc layers don't re-render (or hit the native
  // bridge) on every frame — this is what keeps it smooth and crash-free.
  const qrot = Math.round(anim.rot / ROT_STEP) * ROT_STEP;
  const grid = useMemo(() => buildGrid(qrot, g), [qrot, g]);
  const continents = useMemo(() => buildContinents(qrot, g), [qrot, g]);
  const arcs = useMemo(() => buildArcs(qrot, g), [qrot, g]);
  const pings = useMemo(() => buildPings(qrot, g), [qrot, g]);

  // The orbit PLANES precess over time so the rings sweep around (no more static
  // cross). Quantised so the ring paths rebuild in small steps, not every frame.
  const tilt1 = g.ring1.tilt + anim.t * 0.22;
  const tilt2 = g.ring2.tilt - anim.t * 0.30;
  const qt1 = Math.round(tilt1 / TILT_STEP) * TILT_STEP;
  const qt2 = Math.round(tilt2 / TILT_STEP) * TILT_STEP;
  const ring1 = useMemo(() => buildRing(g.ring1, qt1, g), [g, qt1]);
  const ring2 = useMemo(() => buildRing(g.ring2, qt2, g), [g, qt2]);

  // Light, per-frame motion — each ring carries two different icons on opposite
  // ends, so both orbits look full and balanced (lock, shield, satellite, node).
  const a1 = anim.orbit;
  const a2 = -anim.orbit * 0.85 - 0.6;
  const orbItems = [
    { ...orbitPos(a1, g.ring1, qt1, g), type: 'lock' },
    { ...orbitPos(a1 + Math.PI, g.ring1, qt1, g), type: 'satellite' },
    { ...orbitPos(a2, g.ring2, qt2, g), type: 'shield' },
    { ...orbitPos(a2 + Math.PI, g.ring2, qt2, g), type: 'node' },
  ];
  const travellers = arcs.map((a, i) => {
    const tt = (anim.t * 0.16 + i * 0.37) % 1;
    const head = quadAt(a.x0, a.y0, a.cx, a.cy, a.x1, a.y1, tt);
    const trail = [1, 2].map(k =>
      quadAt(a.x0, a.y0, a.cx, a.cy, a.x1, a.y1, Math.max(0, tt - k * 0.05)));
    return { head, trail };
  });

  return (
    <View style={{ width: g.VIEW, height: g.VIEW, alignSelf: 'center' }}>
      <OrbitLayer g={g} items={orbItems} face="back" />
      <RingBack g={g} ring1={ring1} ring2={ring2} />
      <Shell g={g} />
      <Surface g={g} grid={grid} continents={continents} />
      <RingFront g={g} ring1={ring1} ring2={ring2} />
      <ArcLayer g={g} arcs={arcs} />
      <Live g={g} travellers={travellers} pings={pings} pingT={anim.t * 0.5} />
      <OrbitLayer g={g} items={orbItems} face="front" />
    </View>
  );
}
