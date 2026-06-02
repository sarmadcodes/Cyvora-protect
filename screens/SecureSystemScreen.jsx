import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  StatusBar,
  ScrollView,
} from 'react-native';
import { COLORS } from '../constants/theme';
import GlassCard from '../components/GlassCard';

const { width } = Dimensions.get('window');
const RADAR_SIZE = width * 0.78;

const BLIPS = [
  { id: 1, x: 0.65, y: 0.3, safe: true },
  { id: 2, x: 0.28, y: 0.55, safe: true },
  { id: 3, x: 0.72, y: 0.68, safe: true },
  { id: 4, x: 0.45, y: 0.2, safe: true },
  { id: 5, x: 0.2, y: 0.35, safe: true },
];

function RadarSweep() {
  const sweep = useRef(new Animated.Value(0)).current;
  const [blipVisibility] = useState(BLIPS.map(() => new Animated.Value(0)));

  useEffect(() => {
    Animated.loop(
      Animated.timing(sweep, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true })
    ).start();

    // Make blips appear/fade as sweep passes
    BLIPS.forEach((blip, i) => {
      const delay = blip.x * 2800 + 200;
      const animateBlip = () => {
        setTimeout(() => {
          Animated.sequence([
            Animated.timing(blipVisibility[i], { toValue: 1, duration: 100, useNativeDriver: true }),
            Animated.timing(blipVisibility[i], { toValue: 0.3, duration: 2500, useNativeDriver: true }),
          ]).start(() => animateBlip());
        }, delay);
      };
      animateBlip();
    });
  }, []);

  const spinDeg = sweep.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.radarContainer}>
      {/* Concentric rings */}
      {[1, 0.75, 0.5, 0.25].map((scale, i) => (
        <View
          key={i}
          style={[
            styles.radarRing,
            {
              width: RADAR_SIZE * scale,
              height: RADAR_SIZE * scale,
              borderRadius: (RADAR_SIZE * scale) / 2,
              opacity: 0.15 + i * 0.08,
            },
          ]}
        />
      ))}

      {/* Cross hairs */}
      <View style={styles.crossH} />
      <View style={styles.crossV} />

      {/* Degree marks */}
      {[0, 90, 180, 270].map((deg, i) => (
        <View
          key={i}
          style={[styles.degMark, { transform: [{ rotate: `${deg}deg` }, { translateY: -RADAR_SIZE * 0.46 }] }]}
        >
          <Text style={styles.degText}>{deg === 0 ? '0' : deg === 90 ? '90' : deg === 180 ? '180' : '270'}</Text>
        </View>
      ))}

      {/* Sweep beam */}
      <Animated.View
        style={[styles.sweepContainer, { transform: [{ rotate: spinDeg }] }]}
      >
        <View style={styles.sweepLine} />
        <View style={styles.sweepGlow} />
      </Animated.View>

      {/* Blips */}
      {BLIPS.map((blip, i) => (
        <Animated.View
          key={blip.id}
          style={[
            styles.blip,
            {
              left: blip.x * RADAR_SIZE - 6,
              top: blip.y * RADAR_SIZE - 6,
              opacity: blipVisibility[i],
            },
          ]}
        >
          <View style={styles.blipDot} />
          <View style={styles.blipPulse} />
        </Animated.View>
      ))}

      {/* Center */}
      <View style={styles.radarCenter} />
    </View>
  );
}

export default function SecureSystemScreen() {
  const [scanText, setScanText] = useState('SCANNING...');
  const textOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const texts = ['SCANNING...', 'ANALYZING...', 'VERIFYING...', 'ALL CLEAR'];
    let idx = 0;
    const cycle = () => {
      setTimeout(() => {
        Animated.timing(textOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
          idx = (idx + 1) % texts.length;
          setScanText(texts[idx]);
          Animated.timing(textOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start(() => {
            if (idx < texts.length - 1) cycle();
            else {
              setTimeout(() => { idx = 0; setScanText(texts[0]); cycle(); }, 3000);
            }
          });
        });
      }, 2200);
    };
    cycle();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSub}>CYBERSHIELD OS</Text>
            <Text style={styles.headerTitle}>Secure System</Text>
          </View>
          <View style={styles.shieldBadge}>
            <Text style={styles.shieldIcon}>🛡</Text>
          </View>
        </View>

        {/* Protection status */}
        <GlassCard style={styles.protectionCard} accentColor={COLORS.secondary}>
          <View style={styles.protectionInner}>
            <View style={styles.shieldBig}>
              <Text style={styles.shieldBigIcon}>✓</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.protectedPct}>100%</Text>
              <Text style={styles.protectedLabel}>PROTECTED</Text>
              <View style={styles.protectedBar}>
                <View style={[styles.protectedBarFill, { width: '100%' }]} />
              </View>
            </View>
          </View>
        </GlassCard>

        {/* Radar */}
        <View style={styles.radarSection}>
          <RadarSweep />
          <Animated.Text style={[styles.scanText, { opacity: textOpacity }]}>{scanText}</Animated.Text>
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <GlassCard style={styles.miniCard} accentColor={COLORS.secondary}>
            <View style={styles.miniCardInner}>
              <Text style={styles.miniCardTitle}>THREATS</Text>
              <Text style={[styles.miniCardValue, { color: COLORS.secondary }]}>0</Text>
              <Text style={styles.miniCardIcon}>🛡</Text>
              <Text style={styles.miniCardSub}>None detected</Text>
            </View>
          </GlassCard>

          <GlassCard style={styles.miniCard} accentColor={COLORS.primary}>
            <View style={styles.miniCardInner}>
              <Text style={styles.miniCardTitle}>SECURITY</Text>
              <Text style={[styles.miniCardValue, { color: COLORS.primary }]}>100%</Text>
              <Text style={styles.miniCardSub}>Encryption Active</Text>
              <Text style={[styles.miniCardSub2, { color: COLORS.secondary }]}>Firewall ON</Text>
            </View>
          </GlassCard>

          <GlassCard style={styles.miniCard} accentColor={COLORS.primary}>
            <View style={styles.miniCardInner}>
              <Text style={styles.miniCardTitle}>DEVICES</Text>
              <Text style={[styles.miniCardValue, { color: COLORS.primary }]}>128</Text>
              <Text style={styles.miniCardSub}>Active • Scanning</Text>
            </View>
          </GlassCard>

          <GlassCard style={styles.miniCard} accentColor={COLORS.accent}>
            <View style={styles.miniCardInner}>
              <Text style={styles.miniCardTitle}>SATELLITES</Text>
              <Text style={[styles.miniCardValue, { color: COLORS.accent }]}>34</Text>
              <Text style={styles.miniCardSub}>Online</Text>
              <Text style={styles.miniCardIcon}>🛰</Text>
            </View>
          </GlassCard>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 16,
  },
  headerSub: { color: COLORS.primary, fontSize: 9, letterSpacing: 3, fontFamily: 'monospace', marginBottom: 2 },
  headerTitle: { color: COLORS.text, fontSize: 22, fontWeight: '800', letterSpacing: 1 },
  shieldBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryDim,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldIcon: { fontSize: 22 },
  protectionCard: { marginBottom: 16 },
  protectionInner: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  shieldBig: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,255,157,0.1)',
    borderWidth: 2,
    borderColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  shieldBigIcon: { fontSize: 28, color: COLORS.secondary, fontWeight: '800' },
  protectedPct: { color: COLORS.text, fontSize: 36, fontWeight: '900', letterSpacing: 1 },
  protectedLabel: { color: COLORS.secondary, fontSize: 12, fontWeight: '700', letterSpacing: 3, fontFamily: 'monospace' },
  protectedBar: {
    height: 4,
    backgroundColor: 'rgba(0,255,157,0.15)',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
    width: '100%',
  },
  protectedBarFill: {
    height: '100%',
    backgroundColor: COLORS.secondary,
    borderRadius: 2,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  radarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  radarContainer: {
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  radarRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  crossH: {
    position: 'absolute',
    width: RADAR_SIZE,
    height: 1,
    backgroundColor: 'rgba(0,212,255,0.2)',
  },
  crossV: {
    position: 'absolute',
    width: 1,
    height: RADAR_SIZE,
    backgroundColor: 'rgba(0,212,255,0.2)',
  },
  degMark: {
    position: 'absolute',
    top: RADAR_SIZE / 2,
    left: RADAR_SIZE / 2 - 10,
  },
  degText: {
    color: 'rgba(0,212,255,0.4)',
    fontSize: 9,
    fontFamily: 'monospace',
  },
  sweepContainer: {
    position: 'absolute',
    width: RADAR_SIZE / 2,
    height: RADAR_SIZE / 2,
    top: RADAR_SIZE / 2,
    left: RADAR_SIZE / 2,
    transformOrigin: '0% 0%',
  },
  sweepLine: {
    position: 'absolute',
    width: RADAR_SIZE / 2,
    height: 2,
    backgroundColor: 'rgba(0, 212, 255, 0.9)',
    top: 0,
    left: 0,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  sweepGlow: {
    position: 'absolute',
    width: RADAR_SIZE / 2,
    height: 40,
    top: -20,
    left: 0,
    backgroundColor: 'rgba(0, 212, 255, 0.06)',
  },
  blip: {
    position: 'absolute',
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.secondary,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  blipPulse: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    opacity: 0.4,
  },
  radarCenter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.text,
  },
  scanText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 6,
    fontFamily: 'monospace',
    marginTop: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  miniCard: { width: (width - 42) / 2 },
  miniCardInner: { padding: 14 },
  miniCardTitle: {
    color: COLORS.textDim,
    fontSize: 9,
    letterSpacing: 2,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  miniCardValue: {
    fontSize: 28,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  miniCardIcon: { fontSize: 18, marginTop: 4 },
  miniCardSub: { color: COLORS.textSub, fontSize: 10, fontFamily: 'monospace', marginTop: 2 },
  miniCardSub2: { fontSize: 10, fontFamily: 'monospace', marginTop: 2 },
});
