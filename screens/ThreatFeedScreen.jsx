import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
  FlatList,
} from 'react-native';
import { COLORS } from '../constants/theme';
import GlassCard from '../components/GlassCard';
import { useLanguage } from '../context/LanguageContext';

const { width } = Dimensions.get('window');

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function rInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function rHex(len) { return [...Array(len)].map(() => rInt(0,15).toString(16).padStart(1,'0')).join(''); }
function rIP() {
  const pools = [
    () => `${rInt(1,223)}.${rInt(0,255)}.${rInt(0,255)}.${rInt(1,254)}`,
    () => `185.220.${rInt(100,103)}.${rInt(1,254)}`,
    () => `45.${rInt(30,90)}.${rInt(0,255)}.${rInt(1,254)}`,
    () => `91.108.${rInt(4,56)}.${rInt(1,254)}`,
    () => `195.206.${rInt(100,120)}.${rInt(1,254)}`,
    () => `176.10.${rInt(90,120)}.${rInt(1,254)}`,
    () => `5.188.${rInt(200,220)}.${rInt(1,254)}`,
    () => `103.${rInt(20,80)}.${rInt(100,250)}.${rInt(1,254)}`,
    () => `198.${rInt(20,60)}.${rInt(50,120)}.${rInt(1,254)}`,
  ];
  return pools[rInt(0, pools.length - 1)]();
}
function rPort() { return rInt(1024, 65535); }
function getTime() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}:${String(n.getSeconds()).padStart(2,'0')}`;
}

const GEO = ['[RU]','[CN]','[KP]','[IR]','[NL]','[DE]','[BR]','[UA]','[RO]','[TR]'];
const PROTOCOLS = ['TCP','UDP','ICMP','TLS','HTTP','SSH','RDP','FTP'];

// ─── LOG LINE GENERATORS (defensive SOC / IDS style) ─────────────────────────
const LOG_TEMPLATES = [
  (ip) => ({ status:'BLOCKED', line:`${ip}:${rPort()} → 10.0.0.1:22   proto=TCP  [SYN_FLOOD] rule=FW-001`, severity:'critical' }),
  (ip) => ({ status:'MONITORED', line:`${ip}:${rPort()} → 0.0.0.0:0    proto=ICMP [PING_SWEEP] score=0.${rInt(70,99)}`, severity:'medium' }),
  (ip) => ({ status:'BLOCKED', line:`${ip}:${rPort()} → 10.0.0.1:3389  proto=RDP  [BRUTE_FORCE] attempts=${rInt(200,999)}`, severity:'critical' }),
  (ip) => ({ status:'MONITORED', line:`${ip}:${rPort()} → 10.0.0.${rInt(2,254)}:${rPort()} proto=UDP  [DNS_TUNNEL] entropy=0.${rInt(80,99)}`, severity:'medium' }),
  (ip) => ({ status:'BLOCKED', line:`${ip}:${rPort()} → 10.0.0.1:443   proto=TLS  [MALWARE_C2] sig=0x${rHex(8)}`, severity:'critical' }),
  (ip) => ({ status:'BLOCKED', line:`${ip}:${rPort()} → 10.0.0.1:8080  proto=HTTP [TOR_EXIT] ruleset=GEO_BL`, severity:'high' }),
  (ip) => ({ status:'MONITORED', line:`${ip}:${rPort()} → 10.0.0.${rInt(2,254)}:${rPort()} proto=TCP  [PORT_SCAN] pps=${rInt(100,900)}/s`, severity:'medium' }),
  (ip) => ({ status:'BLOCKED', line:`${ip}:${rPort()} → 10.0.0.1:21    proto=FTP  [ANON_LOGIN] blocked=auto`, severity:'high' }),
  (ip) => ({ status:'MONITORED', line:`${ip}:${rPort()} → 10.0.0.1:25   proto=SMTP [SPAM_RELAY] score=${rInt(60,99)}%`, severity:'medium' }),
  (ip) => ({ status:'BLOCKED', line:`${ip}:${rPort()} → 10.0.0.1:1433  proto=TCP  [SQL_PROBE] CVE-${rInt(2019,2024)}-${rInt(1000,9999)}`, severity:'critical' }),
  (ip) => ({ status:'MONITORED', line:`${ip}:${rPort()} → 10.0.0.${rInt(2,254)}:${rPort()} proto=TLS  [ANOMALY] ttl=${rInt(1,32)} flagged`, severity:'medium' }),
  (ip) => ({ status:'BLOCKED', line:`${ip}:${rPort()} → 10.0.0.1:23    proto=TCP  [TELNET_SCAN] null-routed`, severity:'high' }),
];

// ─── INITIAL LOG POOL ─────────────────────────────────────────────────────────
function genInitialLogs() {
  return Array.from({ length: 18 }, (_, i) => {
    const ip = rIP();
    const tmpl = LOG_TEMPLATES[i % LOG_TEMPLATES.length](ip);
    const geo = GEO[i % GEO.length];
    return { id: i, ip, geo, time: '09:4' + rInt(0,9) + ':' + rInt(10,59), ...tmpl };
  });
}

// ─── PERSISTENT STORE (survives tab switches / unmounts) ──────────────────────
const persistentStats = { blocked: 0, allowed: 0, monitored: 158 };
let persistentUptime = 0;
let persistentLogs = genInitialLogs();
let persistentIdRef = 100;

// ─── STATUS COLOR ─────────────────────────────────────────────────────────────
function statusColor(s) {
  if (s === 'BLOCKED')   return COLORS.danger;
  if (s === 'MONITORED') return COLORS.warning;
  return COLORS.secondary;
}

// ─── BLINKING CURSOR ─────────────────────────────────────────────────────────
function Cursor() {
  const blink = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(blink, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(blink, { toValue: 1, duration: 500, useNativeDriver: true }),
    ])).start();
  }, []);
  return <Animated.Text style={[styles.cursor, { opacity: blink }]}>█</Animated.Text>;
}

// ─── SINGLE TERMINAL LOG ROW ──────────────────────────────────────────────────
function TermRow({ item, isNew }) {
  const opacity   = useRef(new Animated.Value(isNew ? 0 : 1)).current;
  const slideX    = useRef(new Animated.Value(isNew ? -16 : 0)).current;
  const flashBg   = useRef(new Animated.Value(isNew ? 1 : 0)).current;

  useEffect(() => {
    if (!isNew) return;
    Animated.parallel([
      Animated.timing(opacity,  { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(slideX,   { toValue: 0, tension: 120, friction: 10, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(flashBg, { toValue: 1, duration: 0,   useNativeDriver: false }),
        Animated.timing(flashBg, { toValue: 0, duration: 700, useNativeDriver: false }),
      ]),
    ]).start();
  }, []);

  const sc = statusColor(item.status);
  const dimGreen   = '#1aff6a';
  const brightGreen= '#00ff9d';

  const bgFlash = flashBg.interpolate({ inputRange:[0,1], outputRange:['rgba(0,255,100,0)','rgba(0,255,100,0.07)'] });

  return (
    <Animated.View style={[styles.termRow, { opacity, transform:[{translateX:slideX}] }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: bgFlash, borderRadius: 6 }]} />

      {/* Timestamp + geo */}
      <View style={styles.termMeta}>
        <Text style={styles.termTime}>{item.time}</Text>
        <Text style={[styles.termGeo, { color: sc + 'cc' }]}>{item.geo}</Text>
      </View>

      {/* Status badge */}
      <View style={[styles.termBadge, { borderColor: sc + '60', backgroundColor: sc + '14' }]}>
        <Text style={[styles.termBadgeText, { color: sc }]}>{item.status}</Text>
      </View>

      {/* Log line */}
      <View style={styles.termLineWrap}>
        <Text style={styles.termPromptChar}>{'>'}</Text>
        <Text style={[styles.termLineText, { color: item.severity === 'critical' ? brightGreen : dimGreen }]}
          numberOfLines={2}>
          {item.line}
        </Text>
        {isNew && <Cursor />}
      </View>
    </Animated.View>
  );
}

// ─── LIVE TICKER ─────────────────────────────────────────────────────────────
function LiveTicker() {
  const x = useRef(new Animated.Value(0)).current;
  const msg = '  ◈  FIREWALL ACTIVE  ◈  IDS SCANNING  ◈  ENCRYPTION ON  ◈  THREAT INTEL: LIVE  ◈  VPN TUNNEL SECURED  ◈  ZERO TRUST MODE  ◈  ';
  useEffect(() => {
    Animated.loop(Animated.timing(x, { toValue: -width * 2.2, duration: 18000, useNativeDriver: true })).start();
  }, []);
  return (
    <View style={styles.ticker}>
      <View style={styles.tickerBadge}>
        <View style={styles.tickerDot} />
        <Text style={styles.tickerBadgeText}>LIVE</Text>
      </View>
      <View style={styles.tickerOverflow}>
        <Animated.Text style={[styles.tickerText, { transform:[{translateX:x}] }]}>{msg}{msg}</Animated.Text>
      </View>
    </View>
  );
}

// ─── STAT CARD ───────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon, pulse }) {
  const glow = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    if (!pulse) return;
    Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1,   duration: 900, useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0.4, duration: 900, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <GlassCard style={styles.statCard} accentColor={color}>
      <View style={styles.statInner}>
        <Animated.View style={[styles.statIconBox, { borderColor: color + '60', backgroundColor: color + '14',
          shadowColor: color, shadowOpacity: pulse ? glow : 0, shadowRadius: 8, shadowOffset:{width:0,height:0} }]}>
          <Text style={[styles.statIcon, { color }]}>{icon}</Text>
        </Animated.View>
        <Text style={[styles.statValue, { color }]}>{typeof value === 'number' ? value.toLocaleString() : value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </GlassCard>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────
export default function ThreatFeedScreen() {
  const { t } = useLanguage();

  const [logs,    setLogs]    = useState(persistentLogs);           // ← from module store
  const [newIds,  setNewIds]  = useState(new Set());
  const [stats,   setStats]   = useState({ ...persistentStats });   // ← from module store
  const [uptime,  setUptime]  = useState(persistentUptime);         // ← from module store
  const idRef = useRef(persistentIdRef);

  // Uptime counter
  useEffect(() => {
    const timer = setInterval(() => {
      persistentUptime += 1;                                        // ← write back to store
      setUptime(persistentUptime);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Live log injection
  useEffect(() => {
    const interval = setInterval(() => {
      const ip    = rIP();
      const tmpl  = LOG_TEMPLATES[rInt(0, LOG_TEMPLATES.length - 1)](ip);
      const geo   = GEO[rInt(0, GEO.length - 1)];
      const entry = { id: idRef.current++, ip, geo, time: getTime(), ...tmpl };

      persistentIdRef = idRef.current;                              // ← persist id counter

      persistentLogs = [entry, ...persistentLogs.slice(0, 60)];    // ← persist logs
      setLogs(persistentLogs);
      setNewIds(new Set([entry.id]));

      if (tmpl.status === 'BLOCKED')   persistentStats.blocked   += 1; // ← persist stats
      if (tmpl.status === 'ALLOWED')   persistentStats.allowed   += 1;
      if (tmpl.status === 'MONITORED') persistentStats.monitored += 1;

      setStats({ ...persistentStats });
    }, rInt(800, 1600));
    return () => clearInterval(interval);
  }, []);

  // Format uptime
  const h = String(Math.floor(uptime / 3600)).padStart(2,'0');
  const m = String(Math.floor((uptime % 3600) / 60)).padStart(2,'0');
  const s = String(uptime % 60).padStart(2,'0');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>{t.appSub || 'Cyvora Protect'}</Text>
          <Text style={styles.headerTitle}>{t.threatFeed || 'THREAT FEED'}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.uptimePill}>
            <Text style={styles.uptimeLabel}>UPTIME</Text>
            <Text style={styles.uptimeValue}>{h}:{m}:{s}</Text>
          </View>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
      </View>

      {/* ── TICKER ── */}
      <LiveTicker />

      {/* ── STAT CARDS ── */}
      <View style={styles.statsRow}>
        <StatCard label="BLOCKED"   value={stats.blocked}   color={COLORS.danger}    icon="⊗" pulse={stats.blocked > 0} />
        <StatCard label="ALLOWED"   value={stats.allowed}   color={COLORS.secondary} icon="✓" pulse={false} />
        <StatCard label="MONITORED" value={stats.monitored} color={COLORS.warning}   icon="◉" pulse />
      </View>

      {/* ── TERMINAL PANEL ── */}
      <View style={styles.termPanel}>
        {/* Terminal header bar */}
        <View style={styles.termHeader}>
          <View style={styles.termDots}>
            <View style={[styles.termDot, { backgroundColor: COLORS.danger }]} />
            <View style={[styles.termDot, { backgroundColor: COLORS.warning }]} />
            <View style={[styles.termDot, { backgroundColor: COLORS.secondary }]} />
          </View>
          <Text style={styles.termTitle}>IDS_MONITOR — LIVE EVENT STREAM</Text>
          <View style={styles.termBps}>
            <View style={[styles.termDot, { backgroundColor: COLORS.secondary, width: 5, height: 5 }]} />
            <Text style={styles.termBpsText}>STREAM ACTIVE</Text>
          </View>
        </View>

        {/* Scrollable log list */}
        <FlatList
          data={logs}
          keyExtractor={item => String(item.id)}
          style={styles.termScroll}
          contentContainerStyle={styles.termContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TermRow item={item} isNew={newIds.has(item.id)} />
          )}
          ListFooterComponent={<View style={{ height: 24 }} />}
        />
      </View>
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 10,
  },
  headerSub:  { color: COLORS.primary, fontSize: 9, letterSpacing: 3, fontFamily: 'monospace', marginBottom: 2 },
  headerTitle:{ color: COLORS.text, fontSize: 22, fontWeight: '800', letterSpacing: 1 },
  headerRight:{ flexDirection: 'row', alignItems: 'center', gap: 8 },
  uptimePill: {
    backgroundColor: 'rgba(0,212,255,0.08)', borderWidth: 1, borderColor: 'rgba(0,212,255,0.25)',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, alignItems: 'center',
  },
  uptimeLabel:{ color: COLORS.textDim, fontSize: 7, letterSpacing: 2, fontFamily: 'monospace' },
  uptimeValue:{ color: COLORS.primary, fontSize: 11, fontWeight: '900', fontFamily: 'monospace', letterSpacing: 1 },
  liveIndicator: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,51,102,0.12)', borderWidth: 1, borderColor: 'rgba(255,51,102,0.35)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  liveDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.danger,
    shadowColor: COLORS.danger, shadowOffset:{width:0,height:0}, shadowOpacity:1, shadowRadius:4,
  },
  liveText: { color: COLORS.danger, fontSize: 9, fontWeight: '700', letterSpacing: 2, fontFamily: 'monospace' },

  // Ticker
  ticker: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)', borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.border,
    paddingVertical: 7, overflow: 'hidden',
  },
  tickerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.danger, paddingHorizontal: 10, paddingVertical: 4, zIndex: 2,
  },
  tickerDot:      { width: 5, height: 5, borderRadius: 3, backgroundColor: '#fff' },
  tickerBadgeText:{ color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 1, fontFamily: 'monospace' },
  tickerOverflow: { flex: 1, overflow: 'hidden' },
  tickerText:     { color: 'rgba(0,255,157,0.55)', fontSize: 9, fontFamily: 'monospace', letterSpacing: 1.5 },

  // Stat cards
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  statCard: { flex: 1 },
  statInner:{ alignItems: 'center', paddingVertical: 12, paddingHorizontal: 6 },
  statIconBox:{
    width: 32, height: 32, borderRadius: 8, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  statIcon:  { fontSize: 14, fontWeight: '700' },
  statValue: { fontSize: 22, fontWeight: '900', fontFamily: 'monospace', letterSpacing: 1 },
  statLabel: { color: COLORS.textDim, fontSize: 8, letterSpacing: 2, fontFamily: 'monospace', marginTop: 2 },

  // Terminal panel
  termPanel: {
    flex: 1, marginHorizontal: 12, marginBottom: 12,
    backgroundColor: 'rgba(0,4,12,0.92)',
    borderWidth: 1, borderColor: 'rgba(0,255,100,0.18)',
    borderRadius: 12, overflow: 'hidden',
  },
  termHeader: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,255,100,0.05)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,255,100,0.15)',
    paddingHorizontal: 12, paddingVertical: 9, gap: 8,
  },
  termDots:   { flexDirection: 'row', gap: 5 },
  termDot:    { width: 8, height: 8, borderRadius: 4 },
  termTitle:  { flex: 1, color: 'rgba(0,255,100,0.6)', fontSize: 8, fontFamily: 'monospace', letterSpacing: 2 },
  termBps:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  termBpsText:{ color: 'rgba(0,255,100,0.5)', fontSize: 7, fontFamily: 'monospace', letterSpacing: 1 },

  termScroll: { flex: 1 },
  termContent:{ paddingHorizontal: 10, paddingTop: 8 },

  // Terminal row
  termRow: {
    marginBottom: 6, paddingHorizontal: 8, paddingVertical: 7,
    borderRadius: 6, borderLeftWidth: 2, borderLeftColor: 'rgba(0,255,100,0.25)',
    backgroundColor: 'rgba(0,20,8,0.5)',
    overflow: 'hidden',
  },
  termMeta:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  termTime:     { color: 'rgba(0,255,100,0.45)', fontSize: 9, fontFamily: 'monospace', letterSpacing: 1 },
  termGeo:      { fontSize: 8, fontFamily: 'monospace', fontWeight: '700', letterSpacing: 1 },
  termBadge:    { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 4 },
  termBadgeText:{ fontSize: 8, fontWeight: '900', letterSpacing: 1.5, fontFamily: 'monospace' },
  termLineWrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 5 },
  termPromptChar:{ color: 'rgba(0,255,100,0.5)', fontSize: 10, fontFamily: 'monospace', lineHeight: 16 },
  termLineText: { flex: 1, fontSize: 10, fontFamily: 'monospace', lineHeight: 15, letterSpacing: 0.3 },
  cursor:       { color: '#00ff9d', fontSize: 10, fontFamily: 'monospace' },
});