import React, { useEffect, useRef, useState, memo } from 'react';
import { View, Dimensions } from 'react-native';
import Svg, {
  Circle, Path, G, Defs, Ellipse,
  RadialGradient, LinearGradient, Stop,
  Text as SvgText, Rect, Polygon,
} from 'react-native-svg';

const { width } = Dimensions.get('window');
const GLOBE_R      = width * 0.36;
const CX           = GLOBE_R + 40;
const CY           = GLOBE_R + 40;
const GLOBE_SIZE_W = GLOBE_R * 2 + 80;
const GLOBE_SIZE_H = GLOBE_R * 2 + 80;

// Orbital ring parameters — tilted like the reference image
const RING_RX      = GLOBE_R + 28;
const RING_RY      = RING_RX * 0.38;
const RING_TILT    = -18 * (Math.PI / 180);  // slight upward tilt

const TARGET_FPS   = 60;
const FRAME_MS     = 1000 / TARGET_FPS;

// ─── GRID BUILDER ─────────────────────────────────────────────────────────────
const LAT_LINES = [-60, -30, 0, 30, 60];
const LON_COUNT = 12;

function project(lat, lon, rotDeg) {
  const phi   = lat  * (Math.PI / 180);
  const theta = (lon + rotDeg) * (Math.PI / 180);
  const cosPhi = Math.cos(phi);
  return {
    x: CX + GLOBE_R * cosPhi * Math.sin(theta),
    y: CY - GLOBE_R * Math.sin(phi),
    z:      GLOBE_R * cosPhi * Math.cos(theta),
  };
}

function buildGridPaths(rot) {
  // Latitude circles
  const lat = LAT_LINES.map(la => {
    const pts = [];
    for (let lo = 0; lo <= 360; lo += 8) {
      const p = project(la, lo, rot);
      pts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
    }
    const d = 'M' + pts[0] + ' ' + pts.slice(1).map(p => 'L' + p).join(' ');
    return { la, d };
  });

  // Longitude lines
  const lonStep = 360 / LON_COUNT;
  const lon = Array.from({ length: LON_COUNT }, (_, i) => i * lonStep).map(lo => {
    const pts = [];
    for (let la = -90; la <= 90; la += 8) {
      const p = project(la, lo, rot);
      pts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
    }
    const d = 'M' + pts[0] + ' ' + pts.slice(1).map(p => 'L' + p).join(' ');
    return { lo, d };
  });

  return { lat, lon };
}

// ─── ORBIT POSITION ───────────────────────────────────────────────────────────
function orbitPos(angle, rx, ry, tiltRad = 0) {
  const px =  Math.cos(angle) * rx;
  const py =  Math.sin(angle) * ry;
  const x  = CX + px * Math.cos(tiltRad) - py * Math.sin(tiltRad);
  const y  = CY + px * Math.sin(tiltRad) + py * Math.cos(tiltRad);
  // behind = in the back half of the ring
  const behind = py * Math.cos(tiltRad) > 0;
  return { x, y, behind, angle };
}

// ─── RING PATH ─────────────────────────────────────────────────────────────────
function buildRingPath(rx, ry, tilt) {
  const steps = 72;
  const frontPts = [];
  const backPts  = [];

  for (let i = 0; i <= steps; i++) {
    const a  = (i / steps) * Math.PI * 2;
    const px = Math.cos(a) * rx;
    const py = Math.sin(a) * ry;
    const x  = CX + px * Math.cos(tilt) - py * Math.sin(tilt);
    const y  = CY + px * Math.sin(tilt) + py * Math.cos(tilt);
    // py > 0 means the point is in the "lower" half of the tilted ellipse → behind globe
    if (py > 0) {
      backPts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    } else {
      frontPts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
  }

  // Build valid SVG path: always starts with M, rest are L
  const toPath = pts => {
    if (pts.length === 0) return '';
    return 'M' + pts[0] + ' ' + pts.slice(1).map(p => 'L' + p).join(' ');
  };

  return { front: toPath(frontPts), back: toPath(backPts) };
}

const RING_PATHS = buildRingPath(RING_RX, RING_RY, RING_TILT);

// ─── CHAT BUBBLE SVG ELEMENT ──────────────────────────────────────────────────
function ChatBubble({ x, y, size = 36, color = '#00ff9d', lines = 2, flip = false }) {
  const w = size, h = size * 0.75;
  const r = size * 0.15;
  const tailW = size * 0.22, tailH = size * 0.22;
  const ox = flip ? x - w * 0.5 : x - w * 0.3;
  const oy = y - h - tailH * 0.5;

  // tail on bottom-left or bottom-right
  const tailX = flip ? ox + w * 0.72 : ox + w * 0.22;
  const tailPoints = flip
    ? `${tailX},${oy + h} ${tailX + tailW},${oy + h} ${tailX},${oy + h + tailH}`
    : `${tailX},${oy + h} ${tailX - tailW},${oy + h} ${tailX},${oy + h + tailH}`;

  return (
    <G>
      {/* Shadow / glow */}
      <Rect
        x={ox - 2} y={oy - 2}
        width={w + 4} height={h + 4}
        rx={r + 2} ry={r + 2}
        fill={color} fillOpacity="0.08"
      />
      {/* Main body */}
      <Rect
        x={ox} y={oy}
        width={w} height={h}
        rx={r} ry={r}
        fill={color} fillOpacity="0.85"
      />
      {/* Tail */}
      <Polygon points={tailPoints} fill={color} fillOpacity="0.85" />
      {/* Lines */}
      {Array.from({ length: lines }).map((_, i) => (
        <Rect
          key={i}
          x={ox + size * 0.14}
          y={oy + h * 0.28 + i * (h * 0.28)}
          width={w * (i === 0 ? 0.65 : 0.45)}
          height={h * 0.13}
          rx={h * 0.065}
          fill="rgba(0,20,40,0.5)"
        />
      ))}
    </G>
  );
}

// ─── USER ICON ────────────────────────────────────────────────────────────────
function UserIcon({ x, y, size = 28, color = '#00ff9d' }) {
  const headR  = size * 0.28;
  const bodyW  = size * 0.5;
  const bodyH  = size * 0.38;
  const bodyR  = size * 0.12;
  return (
    <G>
      {/* Glow */}
      <Circle cx={x} cy={y} r={size * 0.7} fill={color} fillOpacity="0.06" />
      {/* Laptop/desk base */}
      <Rect
        x={x - bodyW * 0.65} y={y + headR * 0.6}
        width={bodyW * 1.3} height={bodyH}
        rx={bodyR} ry={bodyR}
        fill={color} fillOpacity="0.9"
      />
      {/* Head */}
      <Circle cx={x} cy={y - headR * 0.5} r={headR} fill={color} fillOpacity="0.9" />
      <Circle cx={x} cy={y - headR * 0.5} r={headR * 0.55} fill="rgba(0,20,40,0.45)" />
    </G>
  );
}

// ─── STATIC SHELL ─────────────────────────────────────────────────────────────
const StaticShell = memo(({ grid }) => (
  <Svg width={GLOBE_SIZE_W} height={GLOBE_SIZE_H} style={{ position: 'absolute', top: 0, left: 0 }}>
    <Defs>
      {/* Deep blue globe gradient */}
      <RadialGradient id="globeG" cx="40%" cy="35%" r="70%">
        <Stop offset="0%"   stopColor="#1a4fff" stopOpacity="1" />
        <Stop offset="40%"  stopColor="#0033cc" stopOpacity="1" />
        <Stop offset="75%"  stopColor="#0011aa" stopOpacity="1" />
        <Stop offset="100%" stopColor="#000880" stopOpacity="1" />
      </RadialGradient>
      {/* Specular highlight */}
      <RadialGradient id="specG" cx="35%" cy="28%" r="45%">
        <Stop offset="0%"   stopColor="#88aaff" stopOpacity="0.35" />
        <Stop offset="60%"  stopColor="#4466ff" stopOpacity="0.10" />
        <Stop offset="100%" stopColor="#0033cc" stopOpacity="0"    />
      </RadialGradient>
      {/* Atmosphere rim */}
      <RadialGradient id="atmG" cx="50%" cy="50%" r="50%">
        <Stop offset="72%"  stopColor="#0044ff" stopOpacity="0"    />
        <Stop offset="92%"  stopColor="#2255ff" stopOpacity="0.22" />
        <Stop offset="100%" stopColor="#0088ff" stopOpacity="0.08" />
      </RadialGradient>
      {/* Ring gradient */}
      <LinearGradient id="ringG" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%"   stopColor="#00ffdd" stopOpacity="0.1"  />
        <Stop offset="20%"  stopColor="#00ffdd" stopOpacity="0.7"  />
        <Stop offset="50%"  stopColor="#80fff5" stopOpacity="1"    />
        <Stop offset="80%"  stopColor="#00ffdd" stopOpacity="0.7"  />
        <Stop offset="100%" stopColor="#00ffdd" stopOpacity="0.1"  />
      </LinearGradient>
    </Defs>

    {/* Outer ambient glow */}
    <Circle cx={CX} cy={CY} r={GLOBE_R * 1.45} fill="#0033ff" fillOpacity="0.04" />
    <Circle cx={CX} cy={CY} r={GLOBE_R * 1.22} fill="#0044ff" fillOpacity="0.05" />

    {/* Ring — back half (behind globe) */}
    <Path d={RING_PATHS.back} fill="none" stroke="#00ffdd" strokeWidth="2" strokeOpacity="0.18" />

    {/* Globe sphere */}
    <Circle cx={CX} cy={CY} r={GLOBE_R} fill="url(#globeG)" />

    {/* Grid — latitude lines */}
    {grid.lat.map(({ la, d }) => (
      <Path
        key={`la${la}`} d={d} fill="none"
        stroke="#55aaff"
        strokeWidth={la === 0 ? 1 : 0.7}
        strokeOpacity={la === 0 ? 0.45 : 0.22}
      />
    ))}
    {/* Grid — longitude lines */}
    {grid.lon.map(({ lo, d }) => (
      <Path key={`lo${lo}`} d={d} fill="none" stroke="#55aaff" strokeWidth="0.7" strokeOpacity="0.22" />
    ))}

    {/* Continent-hint highlight patches (static, subtle) */}
    {/* North America hint */}
    <Ellipse cx={CX - GLOBE_R * 0.28} cy={CY - GLOBE_R * 0.18} rx={GLOBE_R * 0.22} ry={GLOBE_R * 0.26}
      fill="#2255ff" fillOpacity="0.12" />
    {/* Europe hint */}
    <Ellipse cx={CX + GLOBE_R * 0.08} cy={CY - GLOBE_R * 0.24} rx={GLOBE_R * 0.14} ry={GLOBE_R * 0.16}
      fill="#2255ff" fillOpacity="0.10" />
    {/* Asia hint */}
    <Ellipse cx={CX + GLOBE_R * 0.35} cy={CY - GLOBE_R * 0.10} rx={GLOBE_R * 0.28} ry={GLOBE_R * 0.22}
      fill="#2255ff" fillOpacity="0.09" />
    {/* Africa hint */}
    <Ellipse cx={CX + GLOBE_R * 0.06} cy={CY + GLOBE_R * 0.14} rx={GLOBE_R * 0.14} ry={GLOBE_R * 0.22}
      fill="#2255ff" fillOpacity="0.08" />

    {/* Specular + atmosphere overlays */}
    <Circle cx={CX} cy={CY} r={GLOBE_R}      fill="url(#specG)" />
    <Circle cx={CX} cy={CY} r={GLOBE_R}      fill="url(#atmG)" />
    {/* Crisp edge */}
    <Circle cx={CX} cy={CY} r={GLOBE_R}      fill="none" stroke="#4488ff" strokeWidth="1.5" strokeOpacity="0.5" />
    <Circle cx={CX} cy={CY} r={GLOBE_R + 6}  fill="none" stroke="#2266ff" strokeWidth="0.8" strokeOpacity="0.15" />
    <Circle cx={CX} cy={CY} r={GLOBE_R + 14} fill="none" stroke="#0044ff" strokeWidth="0.5" strokeOpacity="0.07" />

    {/* Ring — front half (in front of globe) */}
    <Path d={RING_PATHS.front} fill="none" stroke="url(#ringG)" strokeWidth="3" />
  </Svg>
), (prev, next) => prev.grid === next.grid);

// ─── DYNAMIC LAYER ────────────────────────────────────────────────────────────
const DynamicLayer = memo(({ sat1, sat2, userIconPos }) => (
  <Svg width={GLOBE_SIZE_W} height={GLOBE_SIZE_H} style={{ position: 'absolute', top: 0, left: 0 }}>

    {/* User icon on the globe surface */}
    {userIconPos && (
      <UserIcon x={userIconPos.x} y={userIconPos.y} size={GLOBE_R * 0.22} color="#00ff9d" />
    )}

    {/* Chat bubble satellite 1 — back half (dimmed) */}
    {sat1.behind && (
      <G opacity="0.25">
        <ChatBubble x={sat1.x} y={sat1.y} size={GLOBE_R * 0.30} color="#00ff9d" lines={2} flip={false} />
      </G>
    )}

    {/* Chat bubble satellite 2 — back half (dimmed) */}
    {sat2.behind && (
      <G opacity="0.25">
        <ChatBubble x={sat2.x} y={sat2.y} size={GLOBE_R * 0.25} color="#00ff9d" lines={2} flip={true} />
      </G>
    )}

    {/* Chat bubble satellite 1 — front half */}
    {!sat1.behind && (
      <ChatBubble x={sat1.x} y={sat1.y} size={GLOBE_R * 0.30} color="#00ff9d" lines={2} flip={false} />
    )}

    {/* Chat bubble satellite 2 — front half */}
    {!sat2.behind && (
      <ChatBubble x={sat2.x} y={sat2.y} size={GLOBE_R * 0.25} color="#00ff9d" lines={2} flip={true} />
    )}
  </Svg>
));

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function GlobeComponent() {
  const [frame, setFrame] = useState(() => {
    const grid = buildGridPaths(0);
    const sat1 = orbitPos(Math.PI * 1.35, RING_RX, RING_RY, RING_TILT);
    const sat2 = orbitPos(Math.PI * 0.25, RING_RX, RING_RY, RING_TILT);
    const userIconPos = { x: CX - GLOBE_R * 0.05, y: CY + GLOBE_R * 0.12 };
    return { grid, sat1, sat2, userIconPos };
  });

  const s = useRef({
    orbit: 0,
    rotDeg: 0,
    lastGrid: -999,
  }).current;

  const rafRef   = useRef(null);
  const lastRef  = useRef(null);
  const nextRef  = useRef(0);

  useEffect(() => {
    const step = (ts) => {
      rafRef.current = requestAnimationFrame(step);

      if (lastRef.current === null) lastRef.current = ts;
      const dt = Math.min(ts - lastRef.current, 50);
      lastRef.current = ts;

      // Advance state
      s.orbit  = (s.orbit  + dt * 0.00045) % (Math.PI * 2);
      s.rotDeg = (s.rotDeg + dt * 0.025)   % 360;

      // Throttle setState to TARGET_FPS
      if (ts < nextRef.current) return;
      nextRef.current = ts + FRAME_MS;

      // Grid rebuild every ~4° of rotation
      let grid = null;
      if (Math.abs(s.rotDeg - s.lastGrid) >= 4) {
        grid = buildGridPaths(s.rotDeg);
        s.lastGrid = s.rotDeg;
      }

      // Two satellites, offset by π on same ring
      const sat1 = orbitPos(s.orbit,              RING_RX, RING_RY, RING_TILT);
      const sat2 = orbitPos(s.orbit + Math.PI,    RING_RX, RING_RY, RING_TILT);

      // User icon tracks a fixed lat/lon on the rotating globe
      const uPos = project(10, 10, s.rotDeg);
      const userIconPos = uPos.z >= -GLOBE_R * 0.1
        ? { x: uPos.x, y: uPos.y }
        : null; // hide when on back side

      setFrame(prev => ({
        grid:        grid ?? prev.grid,
        sat1,
        sat2,
        userIconPos,
      }));
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const { grid, sat1, sat2, userIconPos } = frame;

  return (
    <View style={{ width: GLOBE_SIZE_W, height: GLOBE_SIZE_H, alignSelf: 'center' }}>
      <StaticShell grid={grid} />
      <DynamicLayer sat1={sat1} sat2={sat2} userIconPos={userIconPos} />
    </View>
  );
}