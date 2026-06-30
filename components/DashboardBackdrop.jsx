import React, { memo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Rect, Circle, Line } from 'react-native-svg';

// Static, GPU-cheap decorative backdrop for the dashboard. No animation, so it
// adds atmosphere behind the globe without any per-frame cost.
function DashboardBackdrop() {
  const { width, height } = useWindowDimensions();
  const W = width, H = height;
  const gx = W / 2, gy = H * 0.26;        // focal point — behind the globe
  const gridGap = 34;
  const vLines = Math.ceil(W / gridGap);
  const hLines = Math.ceil(H / gridGap);

  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, width: W, height: H }}>
      <Svg width={W} height={H}>
        <Defs>
          <LinearGradient id="bgFade" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#04122a" />
            <Stop offset="45%" stopColor="#020b18" />
            <Stop offset="100%" stopColor="#01070f" />
          </LinearGradient>
          <RadialGradient id="halo" cx="50%" cy="26%" r="55%">
            <Stop offset="0%" stopColor="#0a8ad0" stopOpacity="0.34" />
            <Stop offset="45%" stopColor="#063a78" stopOpacity="0.14" />
            <Stop offset="100%" stopColor="#020b18" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="cornerA" cx="12%" cy="92%" r="40%">
            <Stop offset="0%" stopColor="#00ff9d" stopOpacity="0.10" />
            <Stop offset="100%" stopColor="#020b18" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="cornerB" cx="92%" cy="78%" r="42%">
            <Stop offset="0%" stopColor="#0066ff" stopOpacity="0.12" />
            <Stop offset="100%" stopColor="#020b18" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="gridMask" cx="50%" cy="24%" r="60%">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* base gradient + glows */}
        <Rect x="0" y="0" width={W} height={H} fill="url(#bgFade)" />
        <Rect x="0" y="0" width={W} height={H} fill="url(#cornerA)" />
        <Rect x="0" y="0" width={W} height={H} fill="url(#cornerB)" />

        {/* faint tech grid, fading toward the globe focal point */}
        <Svg width={W} height={H} opacity={0.5}>
          {Array.from({ length: vLines + 1 }, (_, i) => (
            <Line key={`v${i}`} x1={i * gridGap} y1="0" x2={i * gridGap} y2={H}
              stroke="#1aa8e0" strokeWidth="0.5" strokeOpacity="0.10" />
          ))}
          {Array.from({ length: hLines + 1 }, (_, i) => (
            <Line key={`h${i}`} x1="0" y1={i * gridGap} x2={W} y2={i * gridGap}
              stroke="#1aa8e0" strokeWidth="0.5" strokeOpacity="0.10" />
          ))}
        </Svg>

        {/* radar rings around the globe */}
        <Circle cx={gx} cy={gy} r={W * 0.46} fill="none" stroke="#37ecff" strokeWidth="0.8" strokeOpacity="0.10" />
        <Circle cx={gx} cy={gy} r={W * 0.60} fill="none" stroke="#37ecff" strokeWidth="0.8" strokeOpacity="0.06" />

        {/* main halo on top so the globe sits in a pool of light */}
        <Rect x="0" y="0" width={W} height={H} fill="url(#halo)" />
      </Svg>
    </View>
  );
}

export default memo(DashboardBackdrop);
