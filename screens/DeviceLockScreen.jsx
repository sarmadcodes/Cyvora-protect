import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { COLORS } from '../constants/theme';
import GlassCard from '../components/GlassCard';

const { width } = Dimensions.get('window');

const DEVICES = [
  { id: 1, name: 'MacBook Pro 16"', type: 'laptop', icon: '💻', ip: '192.168.1.14', os: 'macOS 14.2', status: 'online' },
  { id: 2, name: 'iPhone 15 Pro', type: 'mobile', icon: '📱', ip: '192.168.1.21', os: 'iOS 17.2', status: 'online' },
  { id: 3, name: 'Desktop Workstation', type: 'desktop', icon: '🖥', ip: '192.168.1.8', os: 'Windows 11', status: 'online' },
  { id: 4, name: 'NAS Storage', type: 'server', icon: '🗄', ip: '192.168.1.2', os: 'TrueNAS', status: 'online' },
  { id: 5, name: 'Smart TV 4K', type: 'tv', icon: '📺', ip: '192.168.1.33', os: 'webOS 23', status: 'online' },
  { id: 6, name: 'iPad Pro M2', type: 'tablet', icon: '⬛', ip: '192.168.1.28', os: 'iPadOS 17', status: 'online' },
];

function LockIcon({ locked, locking }) {
  const scale = useRef(new Animated.Value(1)).current;
  const shackleAnim = useRef(new Animated.Value(locked ? 0 : 1)).current;

  useEffect(() => {
    if (locking) {
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.3, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
        Animated.timing(shackleAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    } else if (!locked) {
      shackleAnim.setValue(1);
    }
  }, [locked, locking]);

  const color = locked ? COLORS.secondary : COLORS.textDim;

  return (
    <Animated.View style={[styles.lockIconWrap, { transform: [{ scale }] }]}>
      <View style={[styles.lockBody, {
        borderColor: color,
        backgroundColor: locked ? 'rgba(0,255,157,0.1)' : 'transparent',
        shadowColor: locked ? COLORS.secondary : 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: locked ? 0.8 : 0,
        shadowRadius: locked ? 10 : 0,
      }]}>
        <Text style={[styles.lockChar, { color }]}>{locked ? '🔒' : '🔓'}</Text>
      </View>
    </Animated.View>
  );
}

function DeviceCard({ device }) {
  const [locked, setLocked] = useState(false);
  const [locking, setLocking] = useState(false);
  const cardGlow = useRef(new Animated.Value(0)).current;
  const scanLine = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const handleLock = () => {
    if (locking || locked) return;
    setLocking(true);

    // Progress bar
    Animated.timing(progressAnim, { toValue: 1, duration: 1800, useNativeDriver: false }).start();

    // Scan line
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLine, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(scanLine, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    ).start();

    setTimeout(() => {
      setLocking(false);
      setLocked(true);
      scanLine.stopAnimation();
      Animated.loop(
        Animated.sequence([
          Animated.timing(cardGlow, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(cardGlow, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
    }, 1900);
  };

  const handleUnlock = () => {
    if (!locked) return;
    setLocked(false);
    cardGlow.stopAnimation();
    cardGlow.setValue(0);
    progressAnim.setValue(0);
  };

  const borderColor = locked ? COLORS.secondary : locking ? COLORS.warning : COLORS.border;

  return (
    <Animated.View style={[
      styles.deviceCard,
      {
        borderColor,
        shadowColor: locked ? COLORS.secondary : locking ? COLORS.warning : 'transparent',
        shadowOpacity: cardGlow,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 0 },
      }
    ]}>
      {/* Scan line animation */}
      {locking && (
        <Animated.View style={[
          styles.scanLine,
          {
            top: scanLine.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            opacity: scanLine.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 0] }),
          }
        ]} />
      )}

      {/* Locked green overlay */}
      {locked && <View style={styles.lockedOverlay} />}

      <View style={styles.deviceHeader}>
        <View style={styles.deviceIconWrap}>
          <Text style={styles.deviceEmoji}>{device.icon}</Text>
          <View style={[styles.deviceStatusDot, {
            backgroundColor: locked ? COLORS.secondary : device.status === 'online' ? COLORS.primary : COLORS.textDim
          }]} />
        </View>
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{device.name}</Text>
          <Text style={styles.deviceIp}>{device.ip}</Text>
          <Text style={styles.deviceOs}>{device.os}</Text>
        </View>
        <LockIcon locked={locked} locking={locking} />
      </View>

      {/* Progress bar when locking */}
      {(locking || locked) && (
        <View style={styles.lockProgress}>
          <Animated.View style={[
            styles.lockProgressFill,
            {
              width: locked ? '100%' : progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              backgroundColor: locked ? COLORS.secondary : COLORS.warning,
            }
          ]} />
        </View>
      )}

      <View style={styles.deviceFooter}>
        <Text style={[styles.deviceStatusText, {
          color: locked ? COLORS.secondary : locking ? COLORS.warning : COLORS.textDim
        }]}>
          {locked ? '● SECURED & ENCRYPTED' : locking ? '◌ SECURING...' : `● ${device.status.toUpperCase()}`}
        </Text>

        <TouchableOpacity
          style={[
            styles.lockBtn,
            {
              backgroundColor: locked ? 'rgba(0,255,157,0.1)' : 'rgba(0,212,255,0.08)',
              borderColor: locked ? COLORS.secondary : COLORS.primary,
            }
          ]}
          onPress={locked ? handleUnlock : handleLock}
          activeOpacity={0.7}
          disabled={locking}
        >
          <Text style={[styles.lockBtnText, { color: locked ? COLORS.secondary : COLORS.primary }]}>
            {locked ? 'UNLOCK' : locking ? '...' : 'LOCK'}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export default function DeviceLockScreen() {
  const [allLocked, setAllLocked] = useState(false);
  const [lockingAll, setLockingAll] = useState(false);
  const headerPulse = useRef(new Animated.Value(1)).current;

  const handleLockAll = () => {
    if (lockingAll) return;
    setLockingAll(true);
    Animated.loop(
      Animated.sequence([
        Animated.timing(headerPulse, { toValue: 1.05, duration: 500, useNativeDriver: true }),
        Animated.timing(headerPulse, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
    setTimeout(() => {
      setAllLocked(true);
      setLockingAll(false);
      headerPulse.stopAnimation();
      headerPulse.setValue(1);
    }, 2200);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>CYBERSHIELD OS</Text>
          <Text style={styles.headerTitle}>Device Control</Text>
        </View>
        <Animated.View style={{ transform: [{ scale: headerPulse }] }}>
          <TouchableOpacity style={styles.lockAllBtn} onPress={handleLockAll} activeOpacity={0.8}>
            <Text style={styles.lockAllIcon}>{allLocked ? '🔒' : '🔓'}</Text>
            <Text style={styles.lockAllText}>{lockingAll ? 'LOCKING...' : allLocked ? 'ALL LOCKED' : 'LOCK ALL'}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Summary */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: COLORS.primary }]}>{DEVICES.length}</Text>
          <Text style={styles.summaryLabel}>TOTAL</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: COLORS.secondary }]}>{allLocked ? DEVICES.length : 0}</Text>
          <Text style={styles.summaryLabel}>SECURED</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: COLORS.danger }]}>0</Text>
          <Text style={styles.summaryLabel}>THREATS</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: COLORS.primary }]}>128</Text>
          <Text style={styles.summaryLabel}>MONITORED</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.sectionLabel}>CONNECTED DEVICES</Text>
        {DEVICES.map(device => (
          <DeviceCard key={device.id} device={device} />
        ))}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
  },
  headerSub: { color: COLORS.primary, fontSize: 9, letterSpacing: 3, fontFamily: 'monospace', marginBottom: 2 },
  headerTitle: { color: COLORS.text, fontSize: 22, fontWeight: '800', letterSpacing: 1 },
  lockAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,212,255,0.08)',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  lockAllIcon: { fontSize: 16 },
  lockAllText: { color: COLORS.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, fontFamily: 'monospace' },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6,18,40,0.9)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryNum: { fontSize: 20, fontWeight: '900', fontFamily: 'monospace' },
  summaryLabel: { color: COLORS.textDim, fontSize: 8, letterSpacing: 1.5, fontFamily: 'monospace', marginTop: 2 },
  summaryDivider: { width: 1, height: 30, backgroundColor: COLORS.border },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },
  sectionLabel: { color: COLORS.textDim, fontSize: 9, letterSpacing: 3, fontFamily: 'monospace', marginBottom: 12 },
  deviceCard: {
    backgroundColor: 'rgba(6,18,40,0.9)',
    borderWidth: 1.5,
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.warning,
    zIndex: 10,
    shadowColor: COLORS.warning,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 255, 157, 0.025)',
    zIndex: 1,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    zIndex: 2,
  },
  deviceIconWrap: { position: 'relative' },
  deviceEmoji: { fontSize: 30 },
  deviceStatusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: COLORS.bg,
  },
  deviceInfo: { flex: 1 },
  deviceName: { color: COLORS.text, fontSize: 14, fontWeight: '700', marginBottom: 2 },
  deviceIp: { color: COLORS.primary, fontSize: 11, fontFamily: 'monospace' },
  deviceOs: { color: COLORS.textDim, fontSize: 10, fontFamily: 'monospace' },
  lockIconWrap: {},
  lockBody: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockChar: { fontSize: 20 },
  lockProgress: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: 14,
    borderRadius: 1,
    overflow: 'hidden',
    zIndex: 2,
  },
  lockProgressFill: {
    height: '100%',
    borderRadius: 1,
  },
  deviceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    zIndex: 2,
  },
  deviceStatusText: { fontSize: 10, fontFamily: 'monospace', letterSpacing: 1 },
  lockBtn: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  lockBtnText: { fontSize: 9, fontWeight: '800', letterSpacing: 2, fontFamily: 'monospace' },
});
