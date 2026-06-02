import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { COLORS } from '../constants/theme';

const { width } = Dimensions.get('window');
const GLOBE_SIZE = width * 0.72;

const IP_NODES = [
  { id: 1, label: '192.168.1.1', country: 'US', x: 0.62, y: 0.38, flag: '🇺🇸' },
  { id: 2, label: '185.220.101.x', country: 'DE', x: 0.52, y: 0.28, flag: '🇩🇪' },
  { id: 3, label: '103.21.244.x', country: 'JP', x: 0.78, y: 0.35, flag: '🇯🇵' },
  { id: 4, label: '41.60.233.x', country: 'NG', x: 0.50, y: 0.55, flag: '🇳🇬' },
  { id: 5, label: '200.148.x.x', country: 'BR', x: 0.38, y: 0.60, flag: '🇧🇷' },
  { id: 6, label: '122.56.x.x', country: 'AU', x: 0.74, y: 0.65, flag: '🇦🇺' },
];

function IPNode({ node, delay }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const lineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();

      // Pulse loop
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.8, duration: 900, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      ).start();

      // Line draw animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(lineAnim, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(lineAnim, { toValue: 0, duration: 600, useNativeDriver: false }),
          Animated.delay(1200),
        ])
      ).start();
    }, delay);
  }, []);

  const left = node.x * GLOBE_SIZE;
  const top = node.y * GLOBE_SIZE;

  // Line to center
  const cx = GLOBE_SIZE / 2;
  const cy = GLOBE_SIZE / 2;
  const dx = cx - left;
  const dy = cy - top;
  const lineLength = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return (
    <Animated.View style={[styles.nodeWrapper, { left, top, opacity }]}>
      {/* Line to center */}
      <Animated.View
        style={[
          styles.connectionLine,
          {
            width: lineAnim.interpolate({ inputRange: [0, 1], outputRange: [0, lineLength] }),
            transform: [{ rotate: `${angle}deg` }],
            left: 4,
            top: 4,
          },
        ]}
      />

      {/* Pulse ring */}
      <Animated.View
        style={[
          styles.nodePulse,
          { transform: [{ scale: pulse }], opacity: pulse.interpolate({ inputRange: [1, 1.8], outputRange: [0.6, 0] }) },
        ]}
      />

      {/* Dot */}
      <View style={styles.nodeDot} />

      {/* Label */}
      <View style={styles.nodeLabel}>
        <Text style={styles.nodeFlag}>{node.flag}</Text>
        <Text style={styles.nodeText}>{node.country}</Text>
      </View>
    </Animated.View>
  );
}

export default function GlobeComponent() {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 20000, easing: Easing.linear, useNativeDriver: true })
    ).start();

    Animated.loop(
      Animated.timing(ring1, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true })
    ).start();

    Animated.loop(
      Animated.timing(ring2, { toValue: 1, duration: 4500, easing: Easing.linear, useNativeDriver: true })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.6, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const ring1Spin = ring1.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const ring2Spin = ring2.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });

  return (
    <View style={styles.container}>
      {/* Outer ambient glow */}
      <Animated.View style={[styles.ambientGlow, { opacity: glowPulse }]} />

      {/* Orbital rings */}
      <Animated.View style={[styles.orbitalRing, styles.orbitalRing1, { transform: [{ rotateX: '70deg' }, { rotateZ: ring1Spin }] }]} />
      <Animated.View style={[styles.orbitalRing, styles.orbitalRing2, { transform: [{ rotateX: '50deg' }, { rotateZ: ring2Spin }] }]} />

      {/* Globe body */}
      <View style={styles.globe}>
        {/* Grid lines */}
        <Animated.View style={[styles.gridContainer, { transform: [{ rotate: spin }] }]}>
          {[0, 30, 60, 90, 120, 150].map((deg, i) => (
            <View
              key={i}
              style={[styles.meridian, { transform: [{ rotate: `${deg}deg` }] }]}
            />
          ))}
          {[0.2, 0.35, 0.5, 0.65, 0.8].map((pos, i) => (
            <View key={`p-${i}`} style={[styles.parallel, { top: `${pos * 100}%` }]} />
          ))}
        </Animated.View>

        {/* Globe gradient overlay */}
        <View style={styles.globeOverlay} />
        <View style={styles.globeShine} />

        {/* IP Nodes */}
        {IP_NODES.map((node, i) => (
          <IPNode key={node.id} node={node} delay={800 + i * 300} />
        ))}

        {/* Center dot */}
        <View style={styles.centerDot} />
      </View>

      {/* Satellite dots orbiting */}
      <Animated.View style={[styles.satelliteOrbit, { transform: [{ rotate: ring1Spin }] }]}>
        <View style={[styles.satellite, { top: -6, left: GLOBE_SIZE * 0.44 }]} />
      </Animated.View>
      <Animated.View style={[styles.satelliteOrbit, { transform: [{ rotate: ring2Spin }] }]}>
        <View style={[styles.satellite, styles.satelliteSmall, { bottom: -5, left: GLOBE_SIZE * 0.62 }]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: GLOBE_SIZE + 60,
    height: GLOBE_SIZE + 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambientGlow: {
    position: 'absolute',
    width: GLOBE_SIZE + 80,
    height: GLOBE_SIZE + 80,
    borderRadius: (GLOBE_SIZE + 80) / 2,
    backgroundColor: 'rgba(0, 102, 255, 0.08)',
  },
  orbitalRing: {
    position: 'absolute',
    borderRadius: (GLOBE_SIZE + 40) / 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
    borderStyle: 'dashed',
  },
  orbitalRing1: {
    width: GLOBE_SIZE + 40,
    height: GLOBE_SIZE + 40,
    borderColor: 'rgba(0, 212, 255, 0.18)',
  },
  orbitalRing2: {
    width: GLOBE_SIZE + 20,
    height: GLOBE_SIZE * 0.5,
    borderColor: 'rgba(0, 255, 157, 0.15)',
  },
  globe: {
    width: GLOBE_SIZE,
    height: GLOBE_SIZE,
    borderRadius: GLOBE_SIZE / 2,
    backgroundColor: 'rgba(0, 20, 60, 0.9)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 212, 255, 0.5)',
    overflow: 'hidden',
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 20,
  },
  gridContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  meridian: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(0, 212, 255, 0.12)',
    top: '50%',
    left: 0,
  },
  parallel: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(0, 212, 255, 0.10)',
    left: 0,
  },
  globeOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: GLOBE_SIZE / 2,
    backgroundColor: 'transparent',
    borderWidth: 0,
    // Radial dark edges
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
  },
  globeShine: {
    position: 'absolute',
    top: '8%',
    left: '12%',
    width: '40%',
    height: '35%',
    borderRadius: 100,
    backgroundColor: 'rgba(0, 212, 255, 0.07)',
    transform: [{ skewX: '-10deg' }],
  },
  nodeWrapper: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 10,
  },
  connectionLine: {
    position: 'absolute',
    height: 1.5,
    backgroundColor: 'rgba(0, 212, 255, 0.5)',
    transformOrigin: 'left center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  nodePulse: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0, 212, 255, 0.3)',
  },
  nodeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    zIndex: 5,
  },
  nodeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 10, 30, 0.85)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginTop: 4,
    gap: 3,
  },
  nodeFlag: { fontSize: 9 },
  nodeText: {
    color: COLORS.primary,
    fontSize: 9,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  centerDot: {
    position: 'absolute',
    top: GLOBE_SIZE / 2 - 5,
    left: GLOBE_SIZE / 2 - 5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.secondary,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  satelliteOrbit: {
    position: 'absolute',
    width: GLOBE_SIZE + 40,
    height: GLOBE_SIZE + 40,
  },
  satellite: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    transform: [{ rotate: '45deg' }],
  },
  satelliteSmall: {
    width: 8,
    height: 8,
    backgroundColor: COLORS.secondary,
    shadowColor: COLORS.secondary,
  },
});
