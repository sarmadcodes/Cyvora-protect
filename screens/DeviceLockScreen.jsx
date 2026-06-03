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
import * as Device from 'expo-device';
import * as Network from 'expo-network';
import { COLORS } from '../constants/theme';
import GlassCard from '../components/GlassCard';
import { useLanguage } from '../context/LanguageContext';

const { width } = Dimensions.get('window');

// Connected / monitored devices (read-only view)
const NETWORK_DEVICES = [
  { id: 2, name: 'Router — TP-Link AX6000', ip: '192.168.1.1',  icon: '⬡', status: 'online',  threat: false },
  { id: 3, name: 'MacBook Pro 16"',         ip: '192.168.1.14', icon: '□', status: 'online',  threat: false },
  { id: 4, name: 'Smart TV 4K',             ip: '192.168.1.33', icon: '▬', status: 'online',  threat: false },
  { id: 5, name: 'Unknown Device',          ip: '192.168.1.55', icon: '?', status: 'unknown', threat: true  },
];

function DetailRow({ label, value, valueColor, mono = true }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text
        style={[
          styles.detailValue,
          mono && { fontFamily: 'monospace' },
          valueColor && { color: valueColor },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
    </View>
  );
}

function MyDeviceCard({ t, deviceInfo }) {
  const [locked, setLocked]   = useState(false);
  const [locking, setLocking] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const cardGlow     = useRef(new Animated.Value(0)).current;
  const iconPulse    = useRef(new Animated.Value(1)).current;

  const handleLock = () => {
    if (locking || locked) return;
    setLocking(true);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1800,
      useNativeDriver: false,
    }).start();
    setTimeout(() => {
      setLocking(false);
      setLocked(true);
      progressAnim.setValue(1);
      Animated.spring(iconPulse, { toValue: 1.18, useNativeDriver: true }).start(() =>
        Animated.spring(iconPulse, { toValue: 1, useNativeDriver: true }).start()
      );
      Animated.loop(
        Animated.sequence([
          Animated.timing(cardGlow, { toValue: 1, duration: 1600, useNativeDriver: true }),
          Animated.timing(cardGlow, { toValue: 0.25, duration: 1600, useNativeDriver: true }),
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

  const accentColor = locked
    ? COLORS.secondary
    : locking
    ? COLORS.warning
    : COLORS.primary;

  const statusText = locked
    ? t.securedEncrypted
    : locking
    ? t.securingDevice
    : `ONLINE  ●  AES-256`;

  // Pick a device icon based on the real OS
  const deviceIcon = deviceInfo.os?.toLowerCase().includes('ios') ? '📱' : '📱';

  return (
    <GlassCard style={styles.myDeviceCard} accentColor={accentColor}>
      {/* Header row */}
      <View style={styles.myDeviceHeader}>
        <Animated.View
          style={[
            styles.deviceIconWrap,
            {
              transform: [{ scale: iconPulse }],
              borderColor: accentColor,
              backgroundColor: locked
                ? 'rgba(0,255,157,0.08)'
                : 'rgba(0,212,255,0.07)',
              shadowColor: accentColor,
              shadowOpacity: cardGlow,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 0 },
            },
          ]}
        >
          <Text style={styles.deviceIconEmoji}>{deviceIcon}</Text>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: locked ? COLORS.secondary : COLORS.primary,
              },
            ]}
          />
        </Animated.View>

        <View style={styles.deviceNameBlock}>
          {/* Real device name */}
          <Text style={styles.deviceName} numberOfLines={1} adjustsFontSizeToFit>
            {deviceInfo.name || 'My Device'}
          </Text>
          {/* Real model */}
          <Text style={styles.deviceModel} numberOfLines={1}>
            {deviceInfo.model || '—'}
          </Text>
          <Text style={[styles.deviceStatusText, { color: accentColor }]}>
            {statusText}
          </Text>
        </View>

        <View
          style={[
            styles.lockIndicator,
            {
              borderColor: accentColor,
              backgroundColor: locked
                ? 'rgba(0,255,157,0.07)'
                : 'transparent',
            },
          ]}
        >
          <Text style={[styles.lockIndicatorIcon, { color: accentColor }]}>
            {locked ? '🔒' : '🔓'}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      {(locking || locked) && (
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: locked
                  ? '100%'
                  : progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                backgroundColor: locked ? COLORS.secondary : COLORS.warning,
              },
            ]}
          />
        </View>
      )}

      {/* Detail rows — only real data */}
      <View style={styles.detailsBlock}>
        <DetailRow
          label="DEVICE"
          value={deviceInfo.name || 'Unknown'}
          valueColor={COLORS.text}
        />
        <View style={styles.detailDivider} />
        <DetailRow
          label="MODEL"
          value={deviceInfo.model || 'Unknown'}
          valueColor={COLORS.textSub}
        />
        <View style={styles.detailDivider} />
        <DetailRow
          label="OS"
          value={deviceInfo.os || 'Unknown'}
          valueColor={COLORS.textSub}
        />
        <View style={styles.detailDivider} />
        <DetailRow
          label="LOCAL IP"
          value={deviceInfo.ip || 'Fetching...'}
          valueColor={COLORS.primary}
        />
      </View>

      {/* Action button */}
      <TouchableOpacity
        style={[
          styles.lockBtn,
          {
            borderColor: accentColor,
            backgroundColor: locked
              ? 'rgba(0,255,157,0.08)'
              : 'rgba(0,212,255,0.07)',
          },
        ]}
        onPress={locked ? handleUnlock : handleLock}
        activeOpacity={0.7}
        disabled={locking}
      >
        <Text style={[styles.lockBtnText, { color: accentColor }]}>
          {locked
            ? `🔓  ${t.unlock}`
            : locking
            ? `◌  ${t.securingDevice}`
            : `🔒  ${t.lock}`}
        </Text>
      </TouchableOpacity>
    </GlassCard>
  );
}

function NetworkDeviceRow({ device, t }) {
  const pulse = useRef(
    new Animated.Value(device.threat ? 1 : 0.6)
  ).current;

  useEffect(() => {
    if (device.threat) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0.3,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, []);

  const dotColor = device.threat
    ? COLORS.danger
    : device.status === 'online'
    ? COLORS.secondary
    : COLORS.textDim;

  return (
    <View
      style={[
        styles.netDeviceRow,
        device.threat && { borderColor: 'rgba(255,51,102,0.35)' },
      ]}
    >
      <View
        style={[
          styles.netDeviceIcon,
          {
            borderColor: device.threat ? COLORS.danger : COLORS.border,
          },
        ]}
      >
        <Text
          style={[
            styles.netDeviceIconText,
            {
              color: device.threat ? COLORS.danger : COLORS.textSub,
            },
          ]}
        >
          {device.icon}
        </Text>
      </View>
      <View style={styles.netDeviceInfo}>
        <Text
          style={[
            styles.netDeviceName,
            device.threat && { color: COLORS.danger },
          ]}
        >
          {device.name}
        </Text>
        <Text style={styles.netDeviceIp}>{device.ip}</Text>
      </View>
      <Animated.View
        style={[
          styles.netStatusDot,
          { backgroundColor: dotColor, opacity: pulse },
        ]}
      />
      {device.threat && (
        <View style={styles.threatBadge}>
          <Text style={styles.threatBadgeText}>!</Text>
        </View>
      )}
    </View>
  );
}

export default function DeviceLockScreen() {
  const { t } = useLanguage();
  const fadeIn = useRef(new Animated.Value(0)).current;

  // Real device info state
  const [deviceInfo, setDeviceInfo] = useState({
    name:  null,
    model: null,
    os:    null,
    ip:    null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    async function fetchDeviceInfo() {
      try {
        // Real device name (e.g. "John's iPhone" or "Samsung Galaxy S24")
        const name = Device.deviceName || Device.modelName || 'My Device';

        // Real model (e.g. "Apple iPhone 15 Pro" or "Samsung SM-S928B")
        const manufacturer = Device.manufacturer || '';
        const modelName    = Device.modelName    || '';
        const model        = manufacturer
          ? `${manufacturer} ${modelName}`.trim()
          : modelName || 'Unknown Model';

        // OS string (e.g. "iOS 17.4" or "Android 14")
        const osName    = Device.osName    || '';
        const osVersion = Device.osVersion || '';
        const os        = `${osName} ${osVersion}`.trim() || 'Unknown OS';

        // Real local IP address
        const networkState = await Network.getNetworkStateAsync();
        let ip = '—';
        if (networkState.isConnected) {
          ip = await Network.getIpAddressAsync();
        }

        setDeviceInfo({ name, model, os, ip });
      } catch (err) {
        // Graceful fallback if anything fails
        setDeviceInfo({
          name:  Device.modelName || 'My Device',
          model: 'Unknown Model',
          os:    'Unknown OS',
          ip:    'Unavailable',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchDeviceInfo();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>{t.appSub}</Text>
          <Text style={styles.headerTitle}>{t.deviceControl}</Text>
        </View>
        <View style={styles.headerBadge}>
          <View style={styles.headerBadgeDot} />
          <Text style={styles.headerBadgeText}>
            {loading ? 'SCANNING...' : 'VERIFIED'}
          </Text>
        </View>
      </View>

      {/* Summary bar */}
      <View style={styles.summaryBar}>
        {[
          { num: '1',   label: t.total,         color: COLORS.primary   },
          { num: '1',   label: t.secured,       color: COLORS.secondary },
          { num: '0',   label: t.threatCount,   color: COLORS.danger    },
          { num: '128', label: t.monitoredCount, color: COLORS.primary  },
        ].map((item, i, arr) => (
          <React.Fragment key={i}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNum, { color: item.color }]}>
                {item.num}
              </Text>
              <Text style={styles.summaryLabel} numberOfLines={1}>
                {item.label}
              </Text>
            </View>
            {i < arr.length - 1 && (
              <View style={styles.summaryDivider} />
            )}
          </React.Fragment>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* My Device */}
        <Text style={styles.sectionLabel}>{t.connectedDevices}</Text>
        <Animated.View style={{ opacity: fadeIn }}>
          {loading ? (
            /* Loading placeholder */
            <GlassCard style={styles.myDeviceCard} accentColor={COLORS.primary}>
              <View style={styles.loadingPlaceholder}>
                <View style={styles.loadingDot} />
                <Text style={styles.loadingText}>SCANNING DEVICE...</Text>
              </View>
            </GlassCard>
          ) : (
            <MyDeviceCard t={t} deviceInfo={deviceInfo} />
          )}
        </Animated.View>

        {/* Network */}
        <Text style={[styles.sectionLabel, { marginTop: 22 }]}>
          NETWORK DEVICES
        </Text>
        <GlassCard style={styles.networkCard} accentColor={COLORS.primary}>
          {NETWORK_DEVICES.map((d, i) => (
            <React.Fragment key={d.id}>
              <NetworkDeviceRow device={d} t={t} />
              {i < NETWORK_DEVICES.length - 1 && (
                <View style={styles.netDivider} />
              )}
            </React.Fragment>
          ))}
        </GlassCard>

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
  headerSub: {
    color: COLORS.primary,
    fontSize: 9,
    letterSpacing: 3,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,255,157,0.3)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(0,255,157,0.07)',
  },
  headerBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.secondary,
  },
  headerBadgeText: {
    color: COLORS.secondary,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontFamily: 'monospace',
  },

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
  summaryItem:    { flex: 1, alignItems: 'center' },
  summaryNum:     { fontSize: 20, fontWeight: '900', fontFamily: 'monospace' },
  summaryLabel: {
    color: COLORS.textDim,
    fontSize: 8,
    letterSpacing: 1,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  summaryDivider: { width: 1, height: 30, backgroundColor: COLORS.border },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },
  sectionLabel: {
    color: COLORS.textDim,
    fontSize: 9,
    letterSpacing: 3,
    fontFamily: 'monospace',
    marginBottom: 10,
  },

  // Loading placeholder
  loadingPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 40,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    opacity: 0.8,
  },
  loadingText: {
    color: COLORS.primary,
    fontSize: 11,
    fontFamily: 'monospace',
    letterSpacing: 3,
  },

  // My device card
  myDeviceCard:   { marginBottom: 6 },
  myDeviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  deviceIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  deviceIconEmoji: { fontSize: 26 },
  statusDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: COLORS.bg,
  },
  deviceNameBlock:  { flex: 1 },
  deviceName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  deviceModel: {
    color: COLORS.textDim,
    fontSize: 10,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  deviceStatusText: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
    letterSpacing: 1,
  },
  lockIndicator: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIndicatorIcon: { fontSize: 20 },

  progressTrack: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: 16,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 1 },

  detailsBlock: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  detailLabel: {
    color: COLORS.textDim,
    fontSize: 9,
    letterSpacing: 2.5,
    fontFamily: 'monospace',
    flex: 0,
    marginRight: 8,
  },
  detailValue: {
    color: COLORS.text,
    fontSize: 11,
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'right',
  },
  detailDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 12,
  },

  lockBtn: {
    margin: 16,
    marginTop: 12,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  lockBtnText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },

  // Network devices
  networkCard: { marginBottom: 4 },
  netDeviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  netDeviceIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  netDeviceIconText: { fontSize: 14 },
  netDeviceInfo:     { flex: 1 },
  netDeviceName: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  netDeviceIp: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 1,
  },
  netStatusDot: { width: 8, height: 8, borderRadius: 4 },
  netDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 14,
  },
  threatBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  threatBadgeText: { color: '#fff', fontSize: 11, fontWeight: '900' },
});