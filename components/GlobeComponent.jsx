import React, { useEffect, useRef, useState, memo } from 'react';
import { View, Dimensions } from 'react-native';
import Svg, {
  Circle, Path, G, Defs,
  RadialGradient, LinearGradient, Stop, Text as SvgText,
} from 'react-native-svg';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const { width } = Dimensions.get('window');
const GLOBE_R      = width * 0.38;
const CX           = GLOBE_R + 32;
const CY           = GLOBE_R + 32;
const GLOBE_SIZE_W = GLOBE_R * 2 + 64;
const GLOBE_SIZE_H = GLOBE_R * 2 + 80;
const RING1_RX     = GLOBE_R + 30;
const RING1_RY     = RING1_RX * 0.32;
const RING2_RX     = GLOBE_R + 16;
const RING2_RY     = RING2_RX * 0.20;
const TARGET_FPS   = 30;
const FRAME_MS     = 1000 / TARGET_FPS;

// ─── THREAT NODES ─────────────────────────────────────────────────────────────
const THREAT_NODES = [
  { lat:  55.75, lon:  37.62, label: 'RU', sev: 'critical' },
  { lat:  39.90, lon: 116.39, label: 'CN', sev: 'critical' },
  { lat:  51.51, lon:  -0.13, label: 'GB', sev: 'low'      },
  { lat:  40.71, lon: -74.01, label: 'US', sev: 'low'      },
  { lat:  35.69, lon: 139.69, label: 'JP', sev: 'medium'   },
  { lat:  52.52, lon:  13.40, label: 'DE', sev: 'medium'   },
  { lat: -23.55, lon: -46.63, label: 'BR', sev: 'medium'   },
  { lat:  37.57, lon: 126.98, label: 'KR', sev: 'low'      },
  { lat:  25.20, lon:  55.27, label: 'AE', sev: 'medium'   },
  { lat: -33.87, lon: 151.21, label: 'AU', sev: 'low'      },
  { lat:  48.85, lon:   2.35, label: 'FR', sev: 'low'      },
  { lat:  28.61, lon:  77.21, label: 'IN', sev: 'medium'   },
];

const ARC_PAIRS    = [[0,2],[0,3],[1,4],[1,7],[2,5],[3,6],[8,1],[9,2]];
const FLASH_SPEEDS = ARC_PAIRS.map((_, i) => 0.004 + i * 0.0005);

// ─── PURE HELPERS ─────────────────────────────────────────────────────────────
const SEV_COLORS = { critical: '#ff3366', medium: '#ffaa00', low: '#00ff9d' };
const sevColor   = s => SEV_COLORS[s] ?? '#00ff9d';

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

function qBez(p1, cp, p2, t) {
  const mt = 1 - t;
  return {
    x: mt * mt * p1.x + 2 * mt * t * cp.x + t * t * p2.x,
    y: mt * mt * p1.y + 2 * mt * t * cp.y + t * t * p2.y,
  };
}

function arcCP(p1, p2) {
  const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
  const dx = mx - CX,           dy = my - CY;
  const len  = Math.sqrt(dx * dx + dy * dy) || 1;
  const lift = GLOBE_R * 0.26;
  return { x: mx - (dx / len) * lift, y: my - (dy / len) * lift - lift * 0.4 };
}

function orbitPos(angle, rx, ry, tiltRad = 0) {
  const px = Math.cos(angle) * rx;
  const py = Math.sin(angle) * ry;
  return {
    x:      CX + px * Math.cos(tiltRad) - py * Math.sin(tiltRad),
    y:      CY + px * Math.sin(tiltRad) + py * Math.cos(tiltRad),
    behind: py > 0,
  };
}

// ─── GRID LINES COMPUTED ONCE (module level, zero cost per frame) ─────────────
const LAT_LINES = [-60, -30, 0, 30, 60];
const LON_LINES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

function buildGridPaths(rot) {
  const lat = LAT_LINES.map(la => {
    let d = '';
    for (let lo = 0; lo <= 360; lo += 12) {
      const p = project(la, lo, rot);
      d += lo === 0 ? `M${p.x|0} ${p.y|0}` : ` L${p.x|0} ${p.y|0}`;
    }
    return { la, d };
  });
  const lon = LON_LINES.map(lo => {
    let d = '';
    for (let la = -90; la <= 90; la += 12) {
      const p = project(la, lo, rot);
      d += la === -90 ? `M${p.x|0} ${p.y|0}` : ` L${p.x|0} ${p.y|0}`;
    }
    return { lo, d };
  });
  return { lat, lon };
}

// Static ring paths (never change)
const f = v => v.toFixed(1);
const RING1_BACK  = `M${f(CX-RING1_RX)} ${f(CY)} A${f(RING1_RX)} ${f(RING1_RY)} 0 0 0 ${f(CX+RING1_RX)} ${f(CY)}`;
const RING1_FRONT = `M${f(CX-RING1_RX)} ${f(CY)} A${f(RING1_RX)} ${f(RING1_RY)} 0 0 1 ${f(CX+RING1_RX)} ${f(CY)}`;
const RING2_BACK  = `M${f(CX-RING2_RX)} ${f(CY)} A${f(RING2_RX)} ${f(RING2_RY)} 0 0 0 ${f(CX+RING2_RX)} ${f(CY)}`;
const RING2_FRONT = `M${f(CX-RING2_RX)} ${f(CY)} A${f(RING2_RX)} ${f(RING2_RY)} 0 0 1 ${f(CX+RING2_RX)} ${f(CY)}`;
const RING2_TILT  = 22 * (Math.PI / 180);

// ─── LAYER A: STATIC SHELL (renders once, never updates) ─────────────────────
const StaticShell = memo(({ grid }) => (
  <Svg
    width={GLOBE_SIZE_W}
    height={GLOBE_SIZE_H}
    style={{ position: 'absolute', top: 0, left: 0 }}
  >
    <Defs>
      <RadialGradient id="gG" cx="38%" cy="35%" r="65%">
        <Stop offset="0%"   stopColor="#003060" stopOpacity="1" />
        <Stop offset="55%"  stopColor="#001535" stopOpacity="1" />
        <Stop offset="100%" stopColor="#000a1a" stopOpacity="1" />
      </RadialGradient>
      <RadialGradient id="aG" cx="50%" cy="50%" r="50%">
        <Stop offset="74%"  stopColor="#00d4ff" stopOpacity="0"    />
        <Stop offset="100%" stopColor="#0088ff" stopOpacity="0.28" />
      </RadialGradient>
      <RadialGradient id="sG" cx="36%" cy="30%" r="50%">
        <Stop offset="0%"   stopColor="#80e8ff" stopOpacity="0.18" />
        <Stop offset="100%" stopColor="#00d4ff" stopOpacity="0"    />
      </RadialGradient>
      <LinearGradient id="r1G" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%"   stopColor="#00d4ff" stopOpacity="0.1"  />
        <Stop offset="25%"  stopColor="#00d4ff" stopOpacity="0.65" />
        <Stop offset="50%"  stopColor="#80f0ff" stopOpacity="1"    />
        <Stop offset="75%"  stopColor="#00d4ff" stopOpacity="0.65" />
        <Stop offset="100%" stopColor="#00d4ff" stopOpacity="0.1"  />
      </LinearGradient>
      <LinearGradient id="r2G" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%"   stopColor="#00ff9d" stopOpacity="0.05" />
        <Stop offset="50%"  stopColor="#00ff9d" stopOpacity="0.55" />
        <Stop offset="100%" stopColor="#00ff9d" stopOpacity="0.05" />
      </LinearGradient>
      <RadialGradient id="satG" cx="50%" cy="50%" r="50%">
        <Stop offset="0%"   stopColor="#00ffff" stopOpacity="0.7" />
        <Stop offset="100%" stopColor="#00d4ff" stopOpacity="0"   />
      </RadialGradient>
    </Defs>

    {/* Ambient glow */}
    <Circle cx={CX} cy={CY} r={GLOBE_R * 1.55} fill="#00aaff" fillOpacity="0.03" />
    <Circle cx={CX} cy={CY} r={GLOBE_R * 1.3}  fill="#00aaff" fillOpacity="0.04" />

    {/* Rings — back halves */}
    <Path d={RING1_BACK} fill="none" stroke="#00d4ff" strokeWidth="1.5" strokeOpacity="0.15" strokeDasharray="5 5" />
    <Path d={RING2_BACK} fill="none" stroke="#00ff9d" strokeWidth="1"   strokeOpacity="0.10" strokeDasharray="3 6" />

    {/* Globe sphere */}
    <Circle cx={CX} cy={CY} r={GLOBE_R} fill="url(#gG)" />

    {/* Grid lines (updated when rot changes, but in a dedicated sub-component) */}
    {grid.lat.map(({ la, d }) => (
      <Path key={`la${la}`} d={d} fill="none" stroke="#00d4ff"
        strokeWidth={la === 0 ? 0.9 : 0.5}
        strokeOpacity={la === 0 ? 0.30 : 0.12} />
    ))}
    {grid.lon.map(({ lo, d }) => (
      <Path key={`lo${lo}`} d={d} fill="none" stroke="#00d4ff" strokeWidth="0.5" strokeOpacity="0.12" />
    ))}

    {/* Atmosphere & specular overlays */}
    <Circle cx={CX} cy={CY} r={GLOBE_R}      fill="url(#aG)" />
    <Circle cx={CX} cy={CY} r={GLOBE_R}      fill="url(#sG)" />
    <Circle cx={CX} cy={CY} r={GLOBE_R}      fill="none" stroke="#00d4ff" strokeWidth="1.2" strokeOpacity="0.35" />
    <Circle cx={CX} cy={CY} r={GLOBE_R + 5}  fill="none" stroke="#00aaff" strokeWidth="0.8" strokeOpacity="0.14" />
    <Circle cx={CX} cy={CY} r={GLOBE_R + 11} fill="none" stroke="#0088ff" strokeWidth="0.4" strokeOpacity="0.07" />

    {/* Rings — front halves (on top of globe) */}
    <Path d={RING1_FRONT} fill="none" stroke="url(#r1G)" strokeWidth="2.5" />
    <Path d={RING2_FRONT} fill="none" stroke="url(#r2G)" strokeWidth="1.2" />
  </Svg>
), (prev, next) => {
  // Only re-render when grid paths actually change
  // We throttle grid updates to every ~6° of rotation change
  return prev.grid === next.grid;
});

// ─── LAYER B: DYNAMIC LAYER (nodes, arcs, satellites) ─────────────────────────
const DynamicLayer = memo(({ proj, arcs, sat1, sat2, sat1Trail, pulse }) => (
  <Svg
    width={GLOBE_SIZE_W}
    height={GLOBE_SIZE_H}
    style={{ position: 'absolute', top: 0, left: 0 }}
  >
    <Defs>
      <RadialGradient id="satGd" cx="50%" cy="50%" r="50%">
        <Stop offset="0%"   stopColor="#00ffff" stopOpacity="0.7" />
        <Stop offset="100%" stopColor="#00d4ff" stopOpacity="0"   />
      </RadialGradient>
    </Defs>

    {/* Arcs */}
    {arcs.map((arc, i) => (
      <G key={`arc${i}`}>
        <Path d={arc.d} fill="none" stroke={arc.col}
          strokeWidth="1.2" strokeOpacity={arc.opacity * 0.45} strokeDasharray="5 4" />
        <Circle cx={arc.fx} cy={arc.fy} r={5}   fill={arc.col} fillOpacity={arc.opacity * 0.18} />
        <Circle cx={arc.fx} cy={arc.fy} r={2.5} fill={arc.col} fillOpacity={arc.opacity * 0.9}  />
        <Circle cx={arc.fx} cy={arc.fy} r={1.1} fill="#fff"    fillOpacity={arc.opacity * 0.85} />
      </G>
    ))}

    {/* Nodes — back */}
    {proj.filter(n => n.z < 0).map((n, i) => (
      <Circle key={`nb${i}`} cx={n.x|0} cy={n.y|0} r={2.5} fill={n.col} fillOpacity="0.16" />
    ))}

    {/* Nodes — front */}
    {proj.filter(n => n.z >= 0).map((n, i) => {
      const depth = (n.z + GLOBE_R) / (2 * GLOBE_R);
      const pr    = 3.5 + pulse * 6;
      const po    = Math.max(0, (0.72 - pulse * 0.68) * depth);
      return (
        <G key={`nf${i}`}>
          <Circle cx={n.x|0} cy={n.y|0} r={pr}  fill="none" stroke={n.col} strokeWidth="1" strokeOpacity={po} />
          <Circle cx={n.x|0} cy={n.y|0} r={8}   fill={n.col} fillOpacity={0.07 * depth} />
          <Circle cx={n.x|0} cy={n.y|0} r={3.8} fill={n.col} fillOpacity={0.85 + 0.15 * depth} />
          <Circle cx={n.x|0} cy={n.y|0} r={1.6} fill="#fff"  fillOpacity={0.88 * depth} />
          <SvgText
            x={(n.x|0) + 8} y={(n.y|0) - 5}
            fontSize={9} fontFamily="monospace" fontWeight="700"
            fill={n.col} fillOpacity={Math.max(0.55, depth)} letterSpacing={1}
          >
            {n.label}
          </SvgText>
        </G>
      );
    })}

    {/* Satellite 1 trail */}
    {!sat1.behind && sat1Trail.map((tp, i) =>
      !tp.behind && (
        <Circle key={`tr${i}`}
          cx={tp.x|0} cy={tp.y|0}
          r={Math.max(0.5, 2.2 - i * 0.3)}
          fill="#00d4ff"
          fillOpacity={Math.max(0, 0.5 - i * 0.09)}
        />
      )
    )}

    {/* Satellite 1 */}
    {!sat1.behind && (
      <G>
        <Circle cx={sat1.x|0} cy={sat1.y|0} r={14} fill="url(#satGd)" />
        <Circle cx={sat1.x|0} cy={sat1.y|0} r={5}  fill="#00ffff" fillOpacity="0.9" />
        <Circle cx={sat1.x|0} cy={sat1.y|0} r={2}  fill="#ffffff" />
      </G>
    )}

    {/* Satellite 2 */}
    {!sat2.behind && (
      <G>
        <Circle cx={sat2.x|0} cy={sat2.y|0} r={7}   fill="#00ff9d" fillOpacity="0.2" />
        <Circle cx={sat2.x|0} cy={sat2.y|0} r={3.2} fill="#00ff9d" fillOpacity="0.9" />
        <Circle cx={sat2.x|0} cy={sat2.y|0} r={1.3} fill="#ffffff" />
      </G>
    )}
  </Svg>
));

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function GlobeComponent() {
  const [frame, setFrame] = useState(() => {
    const rot    = 0;
    const orbit1 = 0;
    const orbit2 = 1.2;
    const flashT = ARC_PAIRS.map((_, i) => i / ARC_PAIRS.length);
    const grid   = buildGridPaths(rot);
    const proj   = THREAT_NODES.map(n => ({ ...n, col: sevColor(n.sev), ...project(n.lat, n.lon, rot) }));
    return { rot, pulse: 0, orbit1, orbit2, flashT, grid, proj };
  });

  const s = useRef({
    rot: 0, pulse: 0, pDir: 1,
    orbit1: 0, orbit2: 1.2,
    flashT: ARC_PAIRS.map((_, i) => i / ARC_PAIRS.length),
    lastGrid: -999,  // last rot value at which grid was rebuilt
  }).current;

  const rafRef  = useRef(null);
  const lastRef = useRef(null);
  const nextRef = useRef(0); // earliest timestamp for next setState

  useEffect(() => {
    const step = (ts) => {
      rafRef.current = requestAnimationFrame(step);

      if (lastRef.current === null) lastRef.current = ts;
      const dt = Math.min(ts - lastRef.current, 50);
      lastRef.current = ts;

      // Advance physics
      s.rot    = (s.rot + dt * 0.003) % 360;
      s.pulse += dt * 0.0007 * s.pDir;
      if (s.pulse >= 1) { s.pulse = 1; s.pDir = -1; }
      if (s.pulse <= 0) { s.pulse = 0; s.pDir =  1; }
      s.orbit1 = (s.orbit1 + dt * 0.00055) % (Math.PI * 2);
      s.orbit2 = (s.orbit2 - dt * 0.00038 + Math.PI * 2) % (Math.PI * 2);
      s.flashT = s.flashT.map((t, i) => { const nt = t + FLASH_SPEEDS[i]; return nt > 1 ? nt - 1 : nt; });

      // Throttle React setState to TARGET_FPS
      if (ts < nextRef.current) return;
      nextRef.current = ts + FRAME_MS;

      // Recompute grid only when rot shifts by >3° (saves most of the trig work)
      const rot = s.rot;
      let grid = null;
      if (Math.abs(rot - s.lastGrid) >= 3) {
        grid = buildGridPaths(rot);
        s.lastGrid = rot;
      }

      // Project nodes (12 nodes × 3 trig calls)
      const proj = THREAT_NODES.map(n => ({
        ...n,
        col: sevColor(n.sev),
        ...project(n.lat, n.lon, rot),
      }));

      // Build arcs (8 pairs)
      const arcs = ARC_PAIRS.map(([a, b], i) => {
        const p1 = proj[a], p2 = proj[b];
        if (p1.z < -GLOBE_R * 0.2 && p2.z < -GLOBE_R * 0.2) return null;
        const cp      = arcCP(p1, p2);
        const fp      = qBez(p1, cp, p2, s.flashT[i]);
        const opacity = Math.min(1, (Math.max(p1.z, p2.z) + GLOBE_R) / (GLOBE_R * 1.4));
        return {
          d:   `M${p1.x|0} ${p1.y|0} Q${cp.x|0} ${cp.y|0} ${p2.x|0} ${p2.y|0}`,
          col: sevColor(proj[a].sev),
          fx: fp.x, fy: fp.y,
          opacity,
        };
      }).filter(Boolean);

      // Satellites
      const sat1      = orbitPos(s.orbit1, RING1_RX, RING1_RY);
      const sat2      = orbitPos(s.orbit2, RING2_RX, RING2_RY, RING2_TILT);
      const sat1Trail = Array.from({ length: 5 }, (_, i) =>
        orbitPos(s.orbit1 - (i + 1) * 0.15, RING1_RX, RING1_RY)
      );

      setFrame(prev => ({
        rot,
        pulse:  s.pulse,
        orbit1: s.orbit1,
        orbit2: s.orbit2,
        flashT: s.flashT,
        grid:   grid ?? prev.grid,  // reuse last grid if not rebuilt
        proj, arcs, sat1, sat2, sat1Trail,
      }));
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const { grid, proj, arcs, sat1, sat2, sat1Trail, pulse } = frame;

  return (
    <View style={{ width: GLOBE_SIZE_W, height: GLOBE_SIZE_H, alignSelf: 'center' }}>
      {/* Layer A — static shell (re-renders only when grid changes) */}
      <StaticShell grid={grid} />

      {/* Layer B — dynamic content (nodes, arcs, satellites) */}
      {proj && arcs && sat1 && (
        <DynamicLayer
          proj={proj}
          arcs={arcs}
          sat1={sat1}
          sat2={sat2}
          sat1Trail={sat1Trail}
          pulse={pulse}
        />
      )}
    </View>
  );
}