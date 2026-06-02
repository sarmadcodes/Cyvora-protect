import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { COLORS } from '../constants/theme';
import GlassCard from '../components/GlassCard';

const { width } = Dimensions.get('window');

const INITIAL_LOGS = [
  { id: 1, type: 'BLOCKED', ip: '185.220.101.47', country: '🇷🇺 RU', action: 'Port scan attempt', time: '09:41:02', severity: 'high' },
  { id: 2, type: 'ALLOWED', ip: '192.168.1.14', country: '🇺🇸 US', action: 'HTTPS request', time: '09:41:05', severity: 'safe' },
  { id: 3, type: 'BLOCKED', ip: '45.33.32.156', country: '🇨🇳 CN', action: 'Brute force SSH', time: '09:41:08', severity: 'critical' },
  { id: 4, type: 'MONITORED', ip: '103.21.244.0', country: '🇯🇵 JP', action: 'DNS query flood', time: '09:41:12', severity: 'medium' },
  { id: 5, type: 'BLOCKED', ip: '91.108.4.200', country: '🇳🇱 NL', action: 'Tor exit node', time: '09:41:15', severity: 'high' },
  { id: 6, type: 'ALLOWED', ip: '8.8.8.8', country: '🇺🇸 US', action: 'DNS resolution', time: '09:41:18', severity: 'safe' },
  { id: 7, type: 'BLOCKED', ip: '198.20.70.114', country: '🇩🇪 DE', action: 'Malware C2', time: '09:41:21', severity: 'critical' },
  { id: 8, type: 'MONITORED', ip: '200.148.52.32', country: '🇧🇷 BR', action: 'Suspicious packet', time: '09:41:24', severity: 'medium' },
];

const NEW_LOG_TEMPLATES = [
  (t) => ({ type: 'BLOCKED', ip: `${r(200)}.${r(200)}.${r(200)}.${r(200)}`, country: '🇷🇺 RU', action: 'Intrusion attempt', time: t, severity: 'high' }),
  (t) => ({ type: 'ALLOWED', ip: `192.168.1.${r(200)}`, country: '🇺🇸 US', action: 'API request', time: t, severity: 'safe' }),
  (t) => ({ type: 'BLOCKED', ip: `${r(200)}.${r(200)}.${r(200)}.${r(200)}`, country: '🇨🇳 CN', action: 'DDoS packet', time: t, severity: 'critical' }),
  (t) => ({ type: 'MONITORED', ip: `${r(200)}.${r(200)}.${r(200)}.${r(200)}`, country: '🇩🇪 DE', action: 'Probe detected', time: t, severity: 'medium' }),
];

function r(n) { return Math.floor(Math.random() * n) + 1; }

function getTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
}

function severityColor(sev) {
  switch (sev) {
    case 'critical': return COLORS.danger;
    case 'high': return '#FF6B35';
    case 'medium': return COLORS.warning;
    case 'safe': return COLORS.secondary;
    default: return COLORS.primary;
  }
}

function typeColor(type) {
  switch (type) {
    case 'BLOCKED': return COLORS.danger;
    case 'ALLOWED': return COLORS.secondary;
    case 'MONITORED': return COLORS.warning;
    default: return COLORS.primary;
  }
}

function LogEntry({ log, isNew }) {
  const opacity = useRef(new Animated.Value(isNew ? 0 : 1)).current;
  const translateX = useRef(new Animated.Value(isNew ? -20 : 0)).current;

  useEffect(() => {
    if (isNew) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
      ]).start();
    }
  }, []);

  const sColor = severityColor(log.severity);
  const tColor = typeColor(log.type);

  return (
    <Animated.View style={[styles.logEntry, { opacity, transform: [{ translateX }], borderLeftColor: sColor }]}>
      <View style={styles.logHeader}>
        <View style={[styles.typeBadge, { backgroundColor: `${tColor}18`, borderColor: `${tColor}40` }]}>
          <Text style={[styles.typeText, { color: tColor }]}>{log.type}</Text>
        </View>
        <Text style={styles.logIp}>{log.ip}</Text>
        <Text style={styles.logCountry}>{log.country}</Text>
        <Text style={styles.logTime}>{log.time}</Text>
      </View>
      <Text style={styles.logAction}>{log.action}</Text>
      <View style={[styles.severityDot, { backgroundColor: sColor }]} />
    </Animated.View>
  );
}

function LiveTicker() {
  const tickerX = useRef(new Animated.Value(0)).current;
  const TICKER_MSG = '  ⚠ BLOCKED: 185.220.x.x (RU)  •  ✓ SECURED: 192.168.1.x  •  🛡 FIREWALL ACTIVE  •  ⚠ PROBE: 45.33.x.x (CN)  •  ✓ VPN TUNNEL STABLE  •  🔒 ENCRYPTED: AES-256  •  ';

  useEffect(() => {
    Animated.loop(
      Animated.timing(tickerX, { toValue: -width * 2, duration: 14000, useNativeDriver: true })
    ).start();
  }, []);

  return (
    <View style={styles.ticker}>
      <View style={styles.tickerBadge}>
        <View style={styles.tickerDot} />
        <Text style={styles.tickerBadgeText}>LIVE</Text>
      </View>
      <View style={styles.tickerOverflow}>
        <Animated.Text style={[styles.tickerText, { transform: [{ translateX: tickerX }] }]}>
          {TICKER_MSG}{TICKER_MSG}
        </Animated.Text>
      </View>
    </View>
  );
}

export default function ThreatFeedScreen() {
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [newIds, setNewIds] = useState(new Set());
  const [stats, setStats] = useState({ blocked: 847, allowed: 3241, monitored: 156 });
  const scrollRef = useRef(null);

  useEffect(() => {
    let idCounter = 100;
    const interval = setInterval(() => {
      const template = NEW_LOG_TEMPLATES[Math.floor(Math.random() * NEW_LOG_TEMPLATES.length)];
      const newLog = { ...template(getTime()), id: idCounter++ };
      setLogs(prev => [newLog, ...prev.slice(0, 24)]);
      setNewIds(prev => new Set([newLog.id]));

      setStats(prev => ({
        blocked: newLog.type === 'BLOCKED' ? prev.blocked + 1 : prev.blocked,
        allowed: newLog.type === 'ALLOWED' ? prev.allowed + 1 : prev.allowed,
        monitored: newLog.type === 'MONITORED' ? prev.monitored + 1 : prev.monitored,
      }));
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>CYBERSHIELD OS</Text>
          <Text style={styles.headerTitle}>Threat Feed</Text>
        </View>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      {/* Live ticker */}
      <LiveTicker />

      {/* Summary cards */}
      <View style={styles.summaryRow}>
        <GlassCard style={styles.summaryCard} accentColor={COLORS.danger}>
          <View style={styles.summaryInner}>
            <Text style={styles.summaryLabel}>BLOCKED</Text>
            <Text style={[styles.summaryValue, { color: COLORS.danger }]}>{stats.blocked.toLocaleString()}</Text>
            <Text style={styles.summaryIcon}>🚫</Text>
          </View>
        </GlassCard>
        <GlassCard style={styles.summaryCard} accentColor={COLORS.secondary}>
          <View style={styles.summaryInner}>
            <Text style={styles.summaryLabel}>ALLOWED</Text>
            <Text style={[styles.summaryValue, { color: COLORS.secondary }]}>{stats.allowed.toLocaleString()}</Text>
            <Text style={styles.summaryIcon}>✅</Text>
          </View>
        </GlassCard>
        <GlassCard style={styles.summaryCard} accentColor={COLORS.warning}>
          <View style={styles.summaryInner}>
            <Text style={styles.summaryLabel}>MONITORED</Text>
            <Text style={[styles.summaryValue, { color: COLORS.warning }]}>{stats.monitored}</Text>
            <Text style={styles.summaryIcon}>👁</Text>
          </View>
        </GlassCard>
      </View>

      {/* Log list */}
      <ScrollView
        ref={scrollRef}
        style={styles.logList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.logContent}
      >
        <Text style={styles.logListTitle}>EVENT LOG — REAL-TIME</Text>
        {logs.map(log => (
          <LogEntry key={log.id} log={log} isNew={newIds.has(log.id)} />
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
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,51,102,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,51,102,0.35)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.danger,
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  liveText: { color: COLORS.danger, fontSize: 9, fontWeight: '700', letterSpacing: 2, fontFamily: 'monospace' },
  ticker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  tickerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.danger,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
    zIndex: 2,
  },
  tickerDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#fff' },
  tickerBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 1, fontFamily: 'monospace' },
  tickerOverflow: { flex: 1, overflow: 'hidden' },
  tickerText: { color: COLORS.textSub, fontSize: 10, fontFamily: 'monospace', letterSpacing: 1, whiteSpace: 'nowrap' },
  summaryRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  summaryCard: { flex: 1 },
  summaryInner: { padding: 12, alignItems: 'center' },
  summaryLabel: { color: COLORS.textDim, fontSize: 8, letterSpacing: 1.5, fontFamily: 'monospace', marginBottom: 4 },
  summaryValue: { fontSize: 20, fontWeight: '900', fontFamily: 'monospace' },
  summaryIcon: { fontSize: 14, marginTop: 4 },
  logList: { flex: 1 },
  logContent: { paddingHorizontal: 16 },
  logListTitle: {
    color: COLORS.textDim,
    fontSize: 9,
    letterSpacing: 3,
    fontFamily: 'monospace',
    marginBottom: 10,
    marginTop: 4,
  },
  logEntry: {
    backgroundColor: 'rgba(6,18,40,0.8)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 3,
    borderRadius: 8,
    padding: 12,
    marginBottom: 7,
    position: 'relative',
    overflow: 'hidden',
  },
  logHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  typeBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  typeText: { fontSize: 8, fontWeight: '800', letterSpacing: 1, fontFamily: 'monospace' },
  logIp: { color: COLORS.text, fontSize: 10, fontFamily: 'monospace', flex: 1 },
  logCountry: { color: COLORS.textSub, fontSize: 10, fontFamily: 'monospace' },
  logTime: { color: COLORS.textDim, fontSize: 9, fontFamily: 'monospace' },
  logAction: { color: COLORS.textSub, fontSize: 11, fontFamily: 'monospace' },
  severityDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
