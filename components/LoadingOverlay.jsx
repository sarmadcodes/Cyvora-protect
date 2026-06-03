import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { COLORS } from '../constants/theme';

const { width } = Dimensions.get('window');

// A single shimmer block — the core skeleton unit
function SkeletonBlock({ style, delay = 0, shimmerAnim }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    }, delay);
  }, []);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <Animated.View style={[styles.skeletonBlock, style, { opacity }]}>
      <Animated.View
        style={[
          styles.shimmer,
          { transform: [{ translateX: shimmerTranslate }] },
        ]}
      />
    </Animated.View>
  );
}

// Skeleton layouts per tab
function DashboardSkeleton({ shimmer }) {
  return (
    <View style={styles.skeletonContainer}>
      {/* Header */}
      <View style={styles.skeletonHeader}>
        <View>
          <SkeletonBlock style={{ width: 80, height: 8, borderRadius: 4 }} delay={0} shimmerAnim={shimmer} />
          <SkeletonBlock style={{ width: 140, height: 22, borderRadius: 6, marginTop: 6 }} delay={40} shimmerAnim={shimmer} />
        </View>
        <SkeletonBlock style={{ width: 80, height: 26, borderRadius: 14 }} delay={80} shimmerAnim={shimmer} />
      </View>
      {/* Globe placeholder */}
      <View style={styles.skeletonCenter}>
        <SkeletonBlock style={{ width: 220, height: 220, borderRadius: 110 }} delay={100} shimmerAnim={shimmer} />
      </View>
      {/* VPN card */}
      <SkeletonBlock style={{ height: 76, borderRadius: 14, marginBottom: 10 }} delay={160} shimmerAnim={shimmer} />
      {/* Two stat cards */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
        <SkeletonBlock style={{ flex: 1, height: 90, borderRadius: 14 }} delay={200} shimmerAnim={shimmer} />
        <SkeletonBlock style={{ flex: 1, height: 90, borderRadius: 14 }} delay={240} shimmerAnim={shimmer} />
      </View>
      {/* Network card */}
      <SkeletonBlock style={{ height: 110, borderRadius: 14 }} delay={280} shimmerAnim={shimmer} />
    </View>
  );
}

function SecureSkeleton({ shimmer }) {
  return (
    <View style={styles.skeletonContainer}>
      <View style={styles.skeletonHeader}>
        <View>
          <SkeletonBlock style={{ width: 80, height: 8, borderRadius: 4 }} delay={0} shimmerAnim={shimmer} />
          <SkeletonBlock style={{ width: 160, height: 22, borderRadius: 6, marginTop: 6 }} delay={40} shimmerAnim={shimmer} />
        </View>
        <SkeletonBlock style={{ width: 44, height: 44, borderRadius: 22 }} delay={80} shimmerAnim={shimmer} />
      </View>
      {/* Protection card */}
      <SkeletonBlock style={{ height: 80, borderRadius: 14, marginBottom: 16 }} delay={100} shimmerAnim={shimmer} />
      {/* Radar */}
      <View style={styles.skeletonCenter}>
        <SkeletonBlock style={{ width: 240, height: 240, borderRadius: 120 }} delay={140} shimmerAnim={shimmer} />
      </View>
      {/* 4 mini cards */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
        {[0,1,2,3].map(i => (
          <SkeletonBlock key={i} style={{ width: (width - 42) / 2, height: 80, borderRadius: 14 }} delay={200 + i * 40} shimmerAnim={shimmer} />
        ))}
      </View>
    </View>
  );
}

function ThreatsSkeleton({ shimmer }) {
  return (
    <View style={styles.skeletonContainer}>
      <View style={styles.skeletonHeader}>
        <View>
          <SkeletonBlock style={{ width: 80, height: 8, borderRadius: 4 }} delay={0} shimmerAnim={shimmer} />
          <SkeletonBlock style={{ width: 140, height: 22, borderRadius: 6, marginTop: 6 }} delay={40} shimmerAnim={shimmer} />
        </View>
        <SkeletonBlock style={{ width: 60, height: 26, borderRadius: 14 }} delay={80} shimmerAnim={shimmer} />
      </View>
      {/* Ticker */}
      <SkeletonBlock style={{ height: 34, borderRadius: 0, marginBottom: 12 }} delay={100} shimmerAnim={shimmer} />
      {/* 3 stat cards */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        {[0,1,2].map(i => (
          <SkeletonBlock key={i} style={{ flex: 1, height: 72, borderRadius: 14 }} delay={120 + i * 40} shimmerAnim={shimmer} />
        ))}
      </View>
      {/* Log entries */}
      {[0,1,2,3,4].map(i => (
        <SkeletonBlock key={i} style={{ height: 58, borderRadius: 8, marginBottom: 7 }} delay={220 + i * 35} shimmerAnim={shimmer} />
      ))}
    </View>
  );
}

function DevicesSkeleton({ shimmer }) {
  return (
    <View style={styles.skeletonContainer}>
      <View style={styles.skeletonHeader}>
        <View>
          <SkeletonBlock style={{ width: 80, height: 8, borderRadius: 4 }} delay={0} shimmerAnim={shimmer} />
          <SkeletonBlock style={{ width: 160, height: 22, borderRadius: 6, marginTop: 6 }} delay={40} shimmerAnim={shimmer} />
        </View>
        <SkeletonBlock style={{ width: 100, height: 34, borderRadius: 10 }} delay={80} shimmerAnim={shimmer} />
      </View>
      {/* Summary bar */}
      <SkeletonBlock style={{ height: 56, borderRadius: 0, marginBottom: 16 }} delay={100} shimmerAnim={shimmer} />
      {/* Main device card */}
      <SkeletonBlock style={{ height: 280, borderRadius: 14, marginBottom: 16 }} delay={140} shimmerAnim={shimmer} />
      {/* Network label */}
      <SkeletonBlock style={{ width: 140, height: 8, borderRadius: 4, marginBottom: 10 }} delay={180} shimmerAnim={shimmer} />
      {/* Network list */}
      <SkeletonBlock style={{ height: 180, borderRadius: 14 }} delay={200} shimmerAnim={shimmer} />
    </View>
  );
}

function SettingsSkeleton({ shimmer }) {
  return (
    <View style={styles.skeletonContainer}>
      <View style={styles.skeletonHeader}>
        <View>
          <SkeletonBlock style={{ width: 80, height: 8, borderRadius: 4 }} delay={0} shimmerAnim={shimmer} />
          <SkeletonBlock style={{ width: 120, height: 22, borderRadius: 6, marginTop: 6 }} delay={40} shimmerAnim={shimmer} />
        </View>
        <SkeletonBlock style={{ width: 60, height: 26, borderRadius: 14 }} delay={80} shimmerAnim={shimmer} />
      </View>
      {/* Language card */}
      <SkeletonBlock style={{ width: 100, height: 8, borderRadius: 4, marginBottom: 8, marginTop: 8 }} delay={100} shimmerAnim={shimmer} />
      <SkeletonBlock style={{ height: 90, borderRadius: 14, marginBottom: 16 }} delay={120} shimmerAnim={shimmer} />
      {/* Toggle groups */}
      {[100, 80, 56].map((h, i) => (
        <React.Fragment key={i}>
          <SkeletonBlock style={{ width: 80, height: 8, borderRadius: 4, marginBottom: 8 }} delay={160 + i * 40} shimmerAnim={shimmer} />
          <SkeletonBlock style={{ height: h, borderRadius: 14, marginBottom: 14 }} delay={180 + i * 40} shimmerAnim={shimmer} />
        </React.Fragment>
      ))}
    </View>
  );
}

const SKELETONS = {
  Dashboard: DashboardSkeleton,
  Secure:    SecureSkeleton,
  Threats:   ThreatsSkeleton,
  Devices:   DevicesSkeleton,
  Settings:  SettingsSkeleton,
};

export default function LoadingOverlay({ visible, onDone, duration = 600, tab = 'Dashboard' }) {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const shimmer        = useRef(new Animated.Value(0)).current;
  const shimmerLoop    = useRef(null);
  const timerRef       = useRef(null);

  useEffect(() => {
    if (!visible) {
      overlayOpacity.setValue(0);
      shimmer.setValue(0);
      shimmerLoop.current && shimmerLoop.current.stop();
      return;
    }

    overlayOpacity.setValue(1);
    shimmer.setValue(0);

    // Continuous shimmer sweep
    shimmerLoop.current = Animated.loop(
      Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true })
    );
    shimmerLoop.current.start();

    // Fade out and call onDone
    timerRef.current = setTimeout(() => {
      shimmerLoop.current && shimmerLoop.current.stop();
      Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        onDone && onDone();
      });
    }, duration);

    return () => {
      clearTimeout(timerRef.current);
      shimmerLoop.current && shimmerLoop.current.stop();
    };
  }, [visible]);

  if (!visible) return null;

  const SkeletonLayout = SKELETONS[tab] || DashboardSkeleton;

  return (
    <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
      <SkeletonLayout shimmer={shimmer} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.bg,
    zIndex: 999,
  },
  skeletonContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 14,
    paddingHorizontal: 4,
  },
  skeletonCenter: {
    alignItems: 'center',
    marginBottom: 16,
  },
  skeletonBlock: {
    backgroundColor: 'rgba(0,212,255,0.07)',
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 120,
    backgroundColor: 'rgba(0,212,255,0.10)',
    // Diagonal shimmer via skew
    transform: [{ skewX: '-15deg' }],
  },
});