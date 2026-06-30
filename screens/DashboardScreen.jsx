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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/theme';
import GlobeComponent from '../components/GlobeComponent';
import DashboardBackdrop from '../components/DashboardBackdrop';
import GlassCard from '../components/GlassCard';
import { useLanguage } from '../context/LanguageContext';

const VPN_KEY = '@cybershield_vpn_active';

const { width } = Dimensions.get('window');

function CircularProgress({ value, size = 64, color = COLORS.primary, label }) {
  const anim = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: value, duration: 1400, useNativeDriver: false }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.5, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const sz = Math.min(size, width * 0.16);

  return (
    <Animated.View style={[styles.circleWrap, { opacity: glow, shadowColor: color, shadowRadius: 10, shadowOpacity: 0.6, shadowOffset: { width: 0, height: 0 } }]}>
      <View style={[styles.circleOuter, { width: sz, height: sz, borderRadius: sz / 2, borderColor: `${color}30` }]}>
        <View style={[styles.circleInner, { width: sz - 14, height: sz - 14, borderRadius: (sz - 14) / 2, borderColor: color, borderTopColor: `${color}20`, borderRightColor: `${color}20` }]} />
        <Text style={[styles.circleValue, { color, fontSize: sz * 0.22 }]}>{value}%</Text>
        {label && <Text style={styles.circleLabel}>{label}</Text>}
      </View>
    </Animated.View>
  );
}

function VPNToggle() {
  const { t } = useLanguage();
  const [active, setActive] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Load persisted VPN state on mount
  useEffect(() => {
    AsyncStorage.getItem(VPN_KEY).then(val => {
      if (val === 'true') {
        setActive(true);
        Animated.loop(
          Animated.sequence([
            Animated.timing(glow, { toValue: 1, duration: 1200, useNativeDriver: true }),
            Animated.timing(glow, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
          ])
        ).start();
        Animated.loop(
          Animated.timing(tunnelAnim, { toValue: 1, duration: 1200, useNativeDriver: true })
        ).start();
      }
    }).catch(() => {});
  }, []);
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const tunnelAnim = useRef(new Animated.Value(0)).current;

  const handleToggle = () => {
    if (connecting) return;
    Animated.spring(scale, { toValue: 0.92, useNativeDriver: true }).start(() =>
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()
    );
    if (!active) {
      setConnecting(true);
      Animated.loop(
        Animated.sequence([
          Animated.timing(ring1, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(ring1, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.delay(400),
          Animated.timing(ring2, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(ring2, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();
      setTimeout(() => {
        setConnecting(false);
        setActive(true);
        AsyncStorage.setItem(VPN_KEY, 'true').catch(() => {});
        ring1.stopAnimation(); ring2.stopAnimation();
        Animated.loop(
          Animated.sequence([
            Animated.timing(glow, { toValue: 1, duration: 1200, useNativeDriver: true }),
            Animated.timing(glow, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
          ])
        ).start();
        Animated.loop(
          Animated.timing(tunnelAnim, { toValue: 1, duration: 1200, useNativeDriver: true })
        ).start();
      }, 2200);
    } else {
      setActive(false);
      AsyncStorage.setItem(VPN_KEY, 'false').catch(() => {});
      glow.stopAnimation(); tunnelAnim.stopAnimation();
      glow.setValue(0);
    }
  };

  const btnColor = active ? COLORS.secondary : connecting ? COLORS.warning : COLORS.textDim;
  const statusText = active ? `● ${t.vpnSecured}` : connecting ? `◌ ${t.vpnConnecting}` : `○ ${t.vpnOffline}`;

  return (
    <GlassCard style={styles.vpnCard} accentColor={active ? COLORS.secondary : COLORS.primary}>
      <View style={styles.vpnInner}>
        <View style={styles.vpnLeft}>
          <Text style={styles.vpnLabel}>{t.vpnTunnel}</Text>
          <Text style={[styles.vpnStatus, { color: btnColor }]}>{statusText}</Text>
          {active && (
            <View style={styles.tunnelDots}>
              {[0,1,2,3,4].map(i => (
                <Animated.View key={i} style={[styles.tunnelDot, {
                  opacity: tunnelAnim.interpolate({
                    inputRange: [0,1],
                    outputRange: [i*0.2>0.5?0.1:0.8, i*0.2>0.5?0.8:0.1],
                  }),
                }]} />
              ))}
            </View>
          )}
          <Text style={styles.vpnServer}>
            {active ? t.vpnServer : connecting ? t.vpnRouting : t.vpnNotConnected}
          </Text>
        </View>
        <Animated.View style={{ transform: [{ scale }] }}>
          <TouchableOpacity onPress={handleToggle} activeOpacity={0.8}>
            <Animated.View style={[
              styles.vpnBtn,
              { borderColor: btnColor },
              active && { shadowColor: COLORS.secondary, shadowRadius: 16, shadowOpacity: glow, shadowOffset: { width: 0, height: 0 } },
            ]}>
              {connecting && (
                <>
                  <Animated.View style={[styles.vpnRing, { transform: [{ scale: ring1.interpolate({ inputRange: [0,1], outputRange: [1,1.8] }) }], opacity: ring1.interpolate({ inputRange: [0,1], outputRange: [0.7,0] }), borderColor: COLORS.warning }]} />
                  <Animated.View style={[styles.vpnRing, { transform: [{ scale: ring2.interpolate({ inputRange: [0,1], outputRange: [1,1.8] }) }], opacity: ring2.interpolate({ inputRange: [0,1], outputRange: [0.7,0] }), borderColor: COLORS.warning }]} />
                </>
              )}
              <View style={[styles.vpnIconBox, { borderColor: btnColor }]}>
                <Text style={[styles.vpnIconText, { color: btnColor }]}>
                  {active ? t.vpnOn : connecting ? '...' : t.vpnOff}
                </Text>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </GlassCard>
  );
}

export default function DashboardScreen() {
  const { t } = useLanguage();
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(headerY, { toValue: 0, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <DashboardBackdrop />

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity, transform: [{ translateY: headerY }] }]}>
        <View>
          <Text style={styles.headerSub}>{t.appSub}</Text>
          <Text style={styles.headerTitle}>{t.dashboard}</Text>
        </View>
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{t.statusProtected}</Text>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        removeClippedSubviews
        overScrollMode="never"
      >

        {/* Globe */}
        <View style={styles.globeSection}>
          <GlobeComponent />
          <Text style={styles.globeLabel}>{t.globalNetworkMonitor}</Text>
          <Text style={styles.globeSub}>{t.activeConnections}</Text>
        </View>

        {/* VPN */}
        <VPNToggle />

        {/* Stats row */}
        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard} accentColor={COLORS.primary} title="CPU">
            <View style={styles.statBody}>
              <CircularProgress value={67} size={60} color={COLORS.primary} />
              <View style={styles.statInfo}>
                <Text style={styles.statValue}>Intel i9</Text>
                <Text style={styles.statSub}>12-core  5.4GHz</Text>
                <Text style={[styles.statBadge, { color: COLORS.primary, backgroundColor: 'rgba(0,212,255,0.1)', borderWidth: 1, borderColor: 'rgba(0,212,255,0.25)' }]}>{t.normal}</Text>
              </View>
            </View>
          </GlassCard>
          <GlassCard style={styles.statCard} accentColor={COLORS.accent} title="RAM">
            <View style={styles.statBody}>
              <CircularProgress value={43} size={60} color={COLORS.accent} />
              <View style={styles.statInfo}>
                <Text style={styles.statValue}>32 GB</Text>
                <Text style={styles.statSub}>13.8 GB used</Text>
                <Text style={[styles.statBadge, { color: COLORS.secondary, backgroundColor: 'rgba(0,255,157,0.08)', borderWidth: 1, borderColor: 'rgba(0,255,157,0.2)' }]}>{t.optimal}</Text>
              </View>
            </View>
          </GlassCard>
        </View>

        {/* Network Traffic */}
        <GlassCard style={styles.networkCard} accentColor={COLORS.accent} title={t.networkTraffic}>
          <View style={styles.networkBody}>
            <View style={styles.networkRow}>
              <Text style={styles.netIcon}>^</Text>
              <Text style={styles.netLabel}>{t.upload}</Text>
              <View style={styles.netBarBg}>
                <View style={[styles.netBar, { width: '68%', backgroundColor: COLORS.primary }]} />
              </View>
              <Text style={styles.netValue}>34 MB/s</Text>
            </View>
            <View style={styles.networkRow}>
              <Text style={[styles.netIcon, { color: COLORS.secondary }]}>v</Text>
              <Text style={styles.netLabel}>{t.download}</Text>
              <View style={styles.netBarBg}>
                <View style={[styles.netBar, { width: '44%', backgroundColor: COLORS.secondary }]} />
              </View>
              <Text style={styles.netValue}>14 MB/s</Text>
            </View>
            <View style={styles.barChart}>
              {[30,55,45,70,60,80,65,88,72,90].map((h,i) => (
                <View key={i} style={[styles.barChartBar, { height: h * 0.5, backgroundColor: i===9 ? COLORS.primary : `rgba(0,212,255,${0.2+i*0.07})` }]} />
              ))}
            </View>
          </View>
        </GlassCard>

        {/* Energy */}
        <GlassCard style={styles.energyCard} accentColor={COLORS.secondary} title={t.energy}>
          <View style={styles.energyBody}>
            <CircularProgress value={82} size={72} color={COLORS.secondary} label="+6%" />
            <View style={styles.energyInfo}>
              <Text style={styles.energyLabel}>{t.systemLoad}</Text>
              <View style={styles.energyRow}>
                <Text style={styles.energyKey}>{t.usage}</Text>
                <Text style={[styles.energyVal, { color: COLORS.secondary }]}>82%</Text>
              </View>
              <View style={styles.energyRow}>
                <Text style={styles.energyKey}>{t.peak}</Text>
                <Text style={[styles.energyVal, { color: COLORS.primary }]}>91%</Text>
              </View>
              <View style={styles.energyRow}>
                <Text style={styles.energyKey}>{t.trend}</Text>
                <Text style={[styles.energyVal, { color: COLORS.secondary }]}>+6%</Text>
              </View>
            </View>
          </View>
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
  headerSub: { color: COLORS.primary, fontSize: 9, letterSpacing: 3, fontFamily: 'monospace', marginBottom: 2 },
  headerTitle: { color: COLORS.text, fontSize: 22, fontWeight: '800', letterSpacing: 1 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,255,157,0.1)',
    borderWidth: 1, borderColor: 'rgba(0,255,157,0.3)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, gap: 6,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.secondary, shadowColor: COLORS.secondary, shadowOffset: { width:0, height:0 }, shadowOpacity: 1, shadowRadius: 4 },
  statusText: { color: COLORS.secondary, fontSize: 9, fontWeight: '700', letterSpacing: 2, fontFamily: 'monospace' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  globeSection: { alignItems: 'center', marginBottom: 8 },
  globeLabel: { color: COLORS.textSub, fontSize: 10, letterSpacing: 3, fontFamily: 'monospace', marginTop: 4 },
  globeSub: { color: COLORS.primary, fontSize: 10, letterSpacing: 1, fontFamily: 'monospace', marginTop: 2 },
  vpnCard: { marginBottom: 12 },
  vpnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  vpnLeft: { flex: 1 },
  vpnLabel: { color: COLORS.textDim, fontSize: 9, letterSpacing: 3, fontFamily: 'monospace', marginBottom: 4 },
  vpnStatus: { fontSize: 13, fontWeight: '700', fontFamily: 'monospace', letterSpacing: 1 },
  tunnelDots: { flexDirection: 'row', gap: 4, marginVertical: 6 },
  tunnelDot: { width: 20, height: 3, borderRadius: 2, backgroundColor: COLORS.secondary },
  vpnServer: { color: COLORS.textDim, fontSize: 10, fontFamily: 'monospace', marginTop: 2 },
  vpnBtn: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  vpnRing: { position: 'absolute', width: 64, height: 64, borderRadius: 32, borderWidth: 2 },
  vpnIconBox: { width: 36, height: 20, borderRadius: 4, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  vpnIconText: { fontSize: 10, fontWeight: '900', letterSpacing: 1, fontFamily: 'monospace' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard: { flex: 1 },
  statBody: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  circleWrap: {},
  circleOuter: { borderWidth: 2, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  circleInner: { position: 'absolute', borderWidth: 3, borderLeftColor: 'transparent', borderBottomColor: 'transparent', transform: [{ rotate: '-45deg' }] },
  circleValue: { fontWeight: '800', fontFamily: 'monospace' },
  circleLabel: { color: COLORS.textDim, fontSize: 8, fontFamily: 'monospace' },
  statInfo: { flex: 1, gap: 2 },
  statValue: { color: COLORS.text, fontSize: 13, fontWeight: '700', fontFamily: 'monospace' },
  statSub: { color: COLORS.textDim, fontSize: 10, fontFamily: 'monospace' },
  statBadge: { alignSelf: 'flex-start', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, fontSize: 8, fontWeight: '700', letterSpacing: 1, fontFamily: 'monospace', marginTop: 4 },
  networkCard: { marginBottom: 12 },
  networkBody: { padding: 14 },
  networkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  netIcon: { color: COLORS.primary, fontSize: 12, fontWeight: '700', width: 12, fontFamily: 'monospace' },
  netLabel: { color: COLORS.textSub, fontSize: 10, fontFamily: 'monospace', width: 56 },
  netBarBg: { flex: 1, height: 5, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' },
  netBar: { height: '100%', borderRadius: 3 },
  netValue: { color: COLORS.text, fontSize: 10, fontFamily: 'monospace', width: 44, textAlign: 'right' },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 46, gap: 3, marginTop: 8 },
  barChartBar: { flex: 1, borderRadius: 2 },
  energyCard: { marginBottom: 12 },
  energyBody: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 16 },
  energyInfo: { flex: 1 },
  energyLabel: { color: COLORS.textDim, fontSize: 9, letterSpacing: 2, fontFamily: 'monospace', marginBottom: 8 },
  energyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  energyKey: { color: COLORS.textSub, fontSize: 11, fontFamily: 'monospace' },
  energyVal: { fontSize: 11, fontWeight: '700', fontFamily: 'monospace' },
});