import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Switch,
  StatusBar,
  Dimensions,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/theme';
import GlassCard from '../components/GlassCard';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const SETTINGS_KEY = '@cybershield_settings';

// ─── SECTION LABEL ────────────────────────────────────────────────
function SectionLabel({ text }) {
  return <Text style={styles.sectionLabel}>{text}</Text>;
}

// ─── TOGGLE ROW ───────────────────────────────────────────────────
function ToggleRow({ icon, title, subtitle, value, onToggle, accentColor, last }) {
  const accent = accentColor || COLORS.primary;
  return (
    <>
      <View style={styles.row}>
        <View style={[styles.rowIcon, { backgroundColor: `${accent}14`, borderColor: `${accent}28` }]}>
          <Text style={[styles.rowIconText, { color: accent }]}>{icon}</Text>
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>{title}</Text>
          {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
        </View>
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: 'rgba(255,255,255,0.08)', true: `${accent}55` }}
          thumbColor={value ? accent : COLORS.textDim}
          ios_backgroundColor="rgba(255,255,255,0.08)"
        />
      </View>
      {!last && <View style={styles.divider} />}
    </>
  );
}

// ─── TAP ROW ──────────────────────────────────────────────────────
function TapRow({ icon, title, subtitle, accentColor, onPress, last }) {
  const accent = accentColor || COLORS.primary;
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
        activeOpacity={1}
      >
        <Animated.View style={[styles.row, { transform: [{ scale }] }]}>
          <View style={[styles.rowIcon, { backgroundColor: `${accent}14`, borderColor: `${accent}28` }]}>
            <Text style={[styles.rowIconText, { color: accent }]}>{icon}</Text>
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>{title}</Text>
            {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
          </View>
          <Text style={[styles.arrow, { color: accent }]}>›</Text>
        </Animated.View>
      </TouchableOpacity>
      {!last && <View style={styles.divider} />}
    </>
  );
}

// ─── LANGUAGE SELECTOR ────────────────────────────────────────────
function LanguageSelector({ lang, setLang, t }) {
  return (
    <GlassCard style={styles.card} accentColor={COLORS.accent}>
      <View style={styles.langHeader}>
        <Text style={styles.langTitle}>{t.langTitle}</Text>
        <Text style={styles.langSub}>{t.langSub}</Text>
      </View>
      <View style={styles.langRow}>
        {[
          { code: 'en', label: t.langEN, flag: 'EN' },
          { code: 'es', label: t.langES, flag: 'ES' },
        ].map(({ code, label, flag }) => {
          const isActive = lang === code;
          return (
            <TouchableOpacity
              key={code}
              style={[styles.langBtn, isActive && { borderColor: COLORS.primary, backgroundColor: 'rgba(0,212,255,0.1)' }]}
              onPress={() => setLang(code)}
              activeOpacity={0.8}
            >
              <View style={[styles.langFlagBox, { borderColor: isActive ? COLORS.primary : COLORS.border }]}>
                <Text style={[styles.langFlagText, { color: isActive ? COLORS.primary : COLORS.textDim }]}>{flag}</Text>
              </View>
              <Text style={[styles.langLabel, isActive && { color: COLORS.primary }]}>{label}</Text>
              {isActive && <View style={styles.langActiveDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </GlassCard>
  );
}

// ─── PROFILE CARD ─────────────────────────────────────────────────
function ProfileCard({ user }) {
  // Generate initials from name
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const pulseAnim = useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <GlassCard style={styles.profileCard} accentColor={COLORS.primary}>
      <View style={styles.profileInner}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <Animated.View style={[styles.avatarRing, { transform: [{ scale: pulseAnim }] }]} />
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.avatarOnline} />
        </View>

        {/* Info */}
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.name || 'Unknown Node'}</Text>
          <Text style={styles.profileEmail}>{user?.email || '—'}</Text>
          <View style={styles.profileMeta}>
            <View style={styles.profileBadge}>
              <View style={[styles.profileBadgeDot, { backgroundColor: COLORS.secondary }]} />
              <Text style={[styles.profileBadgeText, { color: COLORS.secondary }]}>ACTIVE NODE</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.profileStats}>
        {[
          { label: 'STATUS',    value: 'SECURED',  color: COLORS.secondary },
          { label: 'CLEARANCE', value: 'LEVEL 1',  color: COLORS.primary   },
          { label: 'SESSION',   value: 'ACTIVE',   color: COLORS.warning   },
        ].map((stat, i) => (
          <React.Fragment key={stat.label}>
            {i > 0 && <View style={styles.statDivider} />}
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>
    </GlassCard>
  );
}

// ─── LOGOUT CONFIRM MODAL ─────────────────────────────────────────
function LogoutModal({ visible, onConfirm, onCancel, t }) {
  const scaleAnim  = useRef(new Animated.Value(0.85)).current;
  const opacAnim   = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 120, friction: 8, useNativeDriver: true }),
        Animated.timing(opacAnim,  { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.85);
      opacAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.modalBox, { opacity: opacAnim, transform: [{ scale: scaleAnim }] }]}>
          {/* Top danger line */}
          <View style={[styles.modalAccent, { backgroundColor: COLORS.danger }]} />

          <View style={styles.modalIcon}>
            <Text style={styles.modalIconText}>⚠</Text>
          </View>

          <Text style={styles.modalTitle}>TERMINATE SESSION?</Text>
          <Text style={styles.modalSub}>
            You will be signed out of Cyvora Protect.{'\n'}All active connections will be closed.
          </Text>

          {/* Divider */}
          <View style={[styles.divider, { marginHorizontal: 0, marginBottom: 16 }]} />

          <View style={styles.modalBtns}>
            <TouchableOpacity style={styles.modalCancel} onPress={onCancel} activeOpacity={0.8}>
              <Text style={styles.modalCancelText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalConfirm} onPress={onConfirm} activeOpacity={0.8}>
              <Text style={styles.modalConfirmText}>SIGN OUT</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────
export default function SettingsScreen({ onLogout }) {
  const { lang, setLang, t } = useLanguage();
  const { user, logout }     = useAuth();

  const [saved,          setSaved]          = useState(false);
  const [twoFA,          setTwoFA]          = useState(true);
  const [biometric,      setBiometric]      = useState(true);
  const [threatAlerts,   setThreatAlerts]   = useState(true);
  const [vpnAuto,        setVpnAuto]        = useState(true);
  const [dnsFilter,      setDnsFilter]      = useState(true);
  const [encryptLogs,    setEncryptLogs]    = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Load persisted settings on mount
  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY).then(raw => {
      if (!raw) return;
      try {
        const s = JSON.parse(raw);
        if (s.twoFA        !== undefined) setTwoFA(s.twoFA);
        if (s.biometric    !== undefined) setBiometric(s.biometric);
        if (s.threatAlerts !== undefined) setThreatAlerts(s.threatAlerts);
        if (s.vpnAuto      !== undefined) setVpnAuto(s.vpnAuto);
        if (s.dnsFilter    !== undefined) setDnsFilter(s.dnsFilter);
        if (s.encryptLogs  !== undefined) setEncryptLogs(s.encryptLogs);
      } catch (_) {}
    }).catch(() => {});
  }, []);

  const saveSettings = (patch) => {
    AsyncStorage.getItem(SETTINGS_KEY).then(raw => {
      const current = raw ? JSON.parse(raw) : {};
      AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...patch })).catch(() => {});
    }).catch(() => {});
  };

  const makeToggle = (setter, key) => (val) => {
    setter(val);
    saveSettings({ [key]: val });
  };

  const saveBtnScale = useRef(new Animated.Value(1)).current;

  const handleSave = () => {
    Animated.sequence([
      Animated.spring(saveBtnScale, { toValue: 0.95, useNativeDriver: true }),
      Animated.spring(saveBtnScale, { toValue: 1,    useNativeDriver: true }),
    ]).start();
    setSaved(true);
    setTimeout(() => setSaved(false), 2800);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    logout();
    // Call parent handler to navigate back to login
    if (onLogout) onLogout();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>{t.appSub}</Text>
          <Text style={styles.headerTitle}>{t.settings}</Text>
        </View>
        <View style={styles.versionBadge}>
          <View style={styles.versionDot} />
          <Text style={styles.versionText}>v4.2.1</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── PROFILE CARD (real user data) ── */}
        <SectionLabel text={t.sectionAccount} />
        <ProfileCard user={user} />

        {/* ── LANGUAGE ── */}
        <SectionLabel text={t.sectionLanguage} />
        <LanguageSelector lang={lang} setLang={setLang} t={t} />

        {/* ── SECURITY ── */}
        <SectionLabel text={t.sectionSecurity} />
        <GlassCard style={styles.card} accentColor={COLORS.secondary}>
          <ToggleRow icon="⊛" title={t.twoFA}       subtitle={t.twoFASub}       value={twoFA}       onToggle={makeToggle(setTwoFA, 'twoFA')}             accentColor={COLORS.secondary} />
          <ToggleRow icon="⊙" title={t.biometric}   subtitle={t.biometricSub}   value={biometric}   onToggle={makeToggle(setBiometric, 'biometric')}     accentColor={COLORS.secondary} />
          <ToggleRow icon="▣" title={t.encryptLogs} subtitle={t.encryptLogsSub} value={encryptLogs} onToggle={makeToggle(setEncryptLogs, 'encryptLogs')} accentColor={COLORS.secondary} last />
        </GlassCard>

        {/* ── NETWORK ── */}
        <SectionLabel text={t.sectionNetwork} />
        <GlassCard style={styles.card} accentColor={COLORS.accent}>
          <ToggleRow icon="⬡" title={t.vpnAuto}   subtitle={t.vpnAutoSub}   value={vpnAuto}   onToggle={makeToggle(setVpnAuto, 'vpnAuto')}     accentColor={COLORS.accent} />
          <ToggleRow icon="◈" title={t.dnsFilter} subtitle={t.dnsFilterSub} value={dnsFilter} onToggle={makeToggle(setDnsFilter, 'dnsFilter')} accentColor={COLORS.accent} last />
        </GlassCard>

        {/* ── NOTIFICATIONS ── */}
        <SectionLabel text={t.sectionNotifications} />
        <GlassCard style={styles.card} accentColor={COLORS.warning}>
          <ToggleRow icon="⚠" title={t.threatAlerts} subtitle={t.threatAlertsSub} value={threatAlerts} onToggle={makeToggle(setThreatAlerts, 'threatAlerts')} accentColor={COLORS.warning} last />
        </GlassCard>

        {/* ── DANGER ZONE ── */}
        <SectionLabel text={t.sectionDanger} />
        <GlassCard style={styles.card} accentColor={COLORS.danger}>
          <TapRow
            icon="⊗"
            title={t.signOut}
            subtitle={t.signOutSub}
            accentColor={COLORS.danger}
            last
            onPress={() => setShowLogoutModal(true)}
          />
        </GlassCard>

        {/* ── SAVE BUTTON ── */}
        <TouchableOpacity onPress={handleSave} activeOpacity={0.85}>
          <Animated.View style={[
            styles.saveBtn,
            { transform: [{ scale: saveBtnScale }] },
            saved && { borderColor: COLORS.secondary, backgroundColor: 'rgba(0,255,157,0.08)' },
          ]}>
            <Text style={[styles.saveBtnText, saved && { color: COLORS.secondary }]}>
              {saved ? `✓  ${t.saved}` : t.saveBtn}
            </Text>
          </Animated.View>
        </TouchableOpacity>

        <Text style={styles.footer}>{t.version}</Text>
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Logout confirmation modal */}
      <LogoutModal
        visible={showLogoutModal}
        onConfirm={handleLogoutConfirm}
        onCancel={() => setShowLogoutModal(false)}
        t={t}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12,
  },
  headerSub:    { color: COLORS.primary, fontSize: 9, letterSpacing: 3, fontFamily: 'monospace', marginBottom: 2 },
  headerTitle:  { color: COLORS.text, fontSize: 22, fontWeight: '800', letterSpacing: 1 },
  versionBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  versionDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.secondary,
    shadowColor: COLORS.secondary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 4,
  },
  versionText:   { color: COLORS.textDim, fontSize: 9, fontFamily: 'monospace', letterSpacing: 1 },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 4 },
  sectionLabel:  { color: COLORS.textDim, fontSize: 9, letterSpacing: 3, fontFamily: 'monospace', marginBottom: 8, marginTop: 18, marginLeft: 2 },
  card:          { marginBottom: 4 },

  // ── Profile Card ──
  profileCard:  { marginBottom: 4 },
  profileInner: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  avatarWrap:   { position: 'relative', alignItems: 'center', justifyContent: 'center', width: 64, height: 64 },
  avatarRing: {
    position: 'absolute', width: 64, height: 64, borderRadius: 32,
    borderWidth: 1.5, borderColor: 'rgba(0,212,255,0.4)',
  },
  avatar: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: 'rgba(0,212,255,0.12)',
    borderWidth: 2, borderColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 10,
  },
  avatarText:   { color: COLORS.primary, fontSize: 18, fontWeight: '900', fontFamily: 'monospace', letterSpacing: 1 },
  avatarOnline: {
    position: 'absolute', bottom: 2, right: 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: COLORS.secondary,
    borderWidth: 2, borderColor: COLORS.bg,
    shadowColor: COLORS.secondary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 4,
  },
  profileInfo:   { flex: 1 },
  profileName:   { color: COLORS.text, fontSize: 16, fontWeight: '800', fontFamily: 'monospace', letterSpacing: 0.5, marginBottom: 2 },
  profileEmail:  { color: COLORS.textSub, fontSize: 10, fontFamily: 'monospace', letterSpacing: 0.5, marginBottom: 8 },
  profileMeta:   { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  profileBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,255,157,0.1)', borderWidth: 1, borderColor: 'rgba(0,255,157,0.25)', borderRadius: 20, paddingHorizontal: 7, paddingVertical: 3 },
  profileBadgeDot:  { width: 5, height: 5, borderRadius: 3 },
  profileBadgeText: { fontSize: 8, fontWeight: '800', letterSpacing: 1, fontFamily: 'monospace' },

  profileStats: {
    flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.border,
    paddingVertical: 12, paddingHorizontal: 16,
  },
  statItem:    { flex: 1, alignItems: 'center' },
  statValue:   { fontSize: 11, fontWeight: '900', fontFamily: 'monospace', letterSpacing: 1, marginBottom: 2 },
  statLabel:   { color: COLORS.textDim, fontSize: 8, fontFamily: 'monospace', letterSpacing: 1.5 },
  statDivider: { width: 1, backgroundColor: COLORS.border, marginVertical: 4 },

  // ── Language ──
  langHeader: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10 },
  langTitle:  { color: COLORS.text, fontSize: 13, fontWeight: '700', fontFamily: 'monospace', letterSpacing: 1 },
  langSub:    { color: COLORS.textDim, fontSize: 10, fontFamily: 'monospace', marginTop: 2 },
  langRow:    { flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingBottom: 14 },
  langBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 14,
    backgroundColor: 'rgba(0,10,30,0.5)', position: 'relative',
  },
  langFlagBox:   { width: 34, height: 22, borderWidth: 1, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  langFlagText:  { fontSize: 10, fontWeight: '900', fontFamily: 'monospace', letterSpacing: 1 },
  langLabel:     { color: COLORS.textSub, fontSize: 13, fontWeight: '700', fontFamily: 'monospace', flex: 1 },
  langActiveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.primary, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 4 },

  // ── Rows ──
  row:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
  rowIcon:     { width: 38, height: 38, borderRadius: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  rowIconText: { fontSize: 16, lineHeight: 20 },
  rowText:     { flex: 1 },
  rowTitle:    { color: COLORS.text, fontSize: 13, fontWeight: '600', fontFamily: 'monospace', letterSpacing: 0.3 },
  rowSub:      { color: COLORS.textDim, fontSize: 10, fontFamily: 'monospace', marginTop: 2 },
  arrow:       { fontSize: 22, fontWeight: '300', marginRight: 2 },
  divider:     { height: 1, backgroundColor: COLORS.border, marginHorizontal: 14 },

  // ── Save Button ──
  saveBtn: {
    borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 10,
    paddingVertical: 16, alignItems: 'center',
    backgroundColor: 'rgba(0,212,255,0.07)',
    marginTop: 24, marginBottom: 8,
  },
  saveBtnText: { color: COLORS.primary, fontSize: 12, fontWeight: '900', letterSpacing: 3, fontFamily: 'monospace' },
  footer:      { color: COLORS.textDim, fontSize: 9, fontFamily: 'monospace', letterSpacing: 2, textAlign: 'center', marginTop: 10 },

  // ── Logout Modal ──
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(1,8,16,0.92)',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32,
  },
  modalBox: {
    width: '100%', backgroundColor: 'rgba(6,18,40,0.98)',
    borderWidth: 1, borderColor: 'rgba(255,51,102,0.35)',
    borderRadius: 14, overflow: 'hidden',
    shadowColor: COLORS.danger, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 20,
  },
  modalAccent:    { height: 2, width: '100%' },
  modalIcon: {
    alignSelf: 'center', marginTop: 24, marginBottom: 12,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,51,102,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,51,102,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  modalIconText:    { fontSize: 24, color: COLORS.danger },
  modalTitle: {
    color: COLORS.text, fontSize: 14, fontWeight: '900',
    letterSpacing: 3, fontFamily: 'monospace',
    textAlign: 'center', marginBottom: 10,
  },
  modalSub: {
    color: COLORS.textSub, fontSize: 11, fontFamily: 'monospace',
    textAlign: 'center', lineHeight: 18,
    paddingHorizontal: 16, marginBottom: 20,
  },
  modalBtns:      { flexDirection: 'row', gap: 10, padding: 16, paddingTop: 0 },
  modalCancel: {
    flex: 1, paddingVertical: 13, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  modalCancelText:  { color: COLORS.textSub, fontSize: 11, fontWeight: '700', letterSpacing: 2, fontFamily: 'monospace' },
  modalConfirm: {
    flex: 1, paddingVertical: 13, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,51,102,0.5)', borderRadius: 8,
    backgroundColor: 'rgba(255,51,102,0.1)',
  },
  modalConfirmText: { color: COLORS.danger, fontSize: 11, fontWeight: '900', letterSpacing: 2, fontFamily: 'monospace' },
});