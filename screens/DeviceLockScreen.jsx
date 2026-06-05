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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Network from 'expo-network';
import { COLORS } from '../constants/theme';
import GlassCard from '../components/GlassCard';
import { useLanguage } from '../context/LanguageContext';

const { width } = Dimensions.get('window');

const IMEI_STORAGE_KEY   = '@cybershield_imei';
const LOCK_STORAGE_KEY   = '@cybershield_device_locked';

// Only 3 servers as requested
const SERVERS = [
  { id: 1, name: 'AMS-NL-01', location: 'Amsterdam, NL', ip: '185.220.101.10', load: 18, status: 'online', type: 'VPN Gateway'   },
  { id: 2, name: 'FRA-DE-02', location: 'Frankfurt, DE', ip: '91.108.56.22',   load: 34, status: 'online', type: 'Firewall Node' },
  { id: 3, name: 'NYC-US-01', location: 'New York, US',  ip: '104.21.44.180',  load: 61, status: 'online', type: 'Threat Intel'  },
];

// ─── IMEI Modal ───────────────────────────────────────────────────────────────
function ImeiModal({ visible, currentImei, onSave, onClose }) {
  const [input, setInput] = useState(currentImei || '');
  const [error, setError] = useState('');
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const opacAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setInput(currentImei || '');
      setError('');
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 120, friction: 9, useNativeDriver: true }),
        Animated.timing(opacAnim,  { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.88);
      opacAnim.setValue(0);
    }
  }, [visible]);

  const handleSave = () => {
    const clean = input.replace(/\s+/g, '').replace(/-/g, '');
    if (clean.length !== 15 || !/^\d+$/.test(clean)) {
      setError('IMEI must be exactly 15 digits');
      return;
    }
    const formatted = `${clean.slice(0,6)} ${clean.slice(6,8)} ${clean.slice(8,14)} ${clean.slice(14)}`;
    onSave(formatted);
    onClose();
  };

  const handleClear = () => {
    setInput('');
    onSave('');
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.modalCard, { transform: [{ scale: scaleAnim }], opacity: opacAnim }]}>
          <View style={[styles.modalAccent, { backgroundColor: COLORS.primary }]} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>ENTER IMEI</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.modalSub}>Find it in Settings → About Phone, or dial *#06#</Text>
          <View style={[styles.imeiInputWrap, error ? { borderColor: COLORS.danger } : {}]}>
            <Text style={styles.imeiInputPrefix}>IMEI</Text>
            <TextInput
              style={styles.imeiInput}
              value={input}
              onChangeText={(v) => { setInput(v); setError(''); }}
              placeholder="123456789012345"
              placeholderTextColor={COLORS.textDim}
              keyboardType="numeric"
              maxLength={20}
              autoFocus
              selectionColor={COLORS.primary}
            />
          </View>
          {error ? (
            <Text style={styles.imeiError}>{error}</Text>
          ) : (
            <Text style={styles.imeiHint}>15 digits — spaces and dashes are stripped automatically</Text>
          )}
          <View style={styles.modalBtns}>
            {currentImei ? (
              <TouchableOpacity style={styles.modalBtnSecondary} onPress={handleClear}>
                <Text style={styles.modalBtnSecondaryText}>CLEAR</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={[styles.modalBtnPrimary, { flex: currentImei ? 1 : undefined }]} onPress={handleSave}>
              <Text style={styles.modalBtnPrimaryText}>SAVE IMEI</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Detail Row ───────────────────────────────────────────────────────────────
function DetailRow({ label, value, valueColor, mono = true, onEdit }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <View style={styles.detailRight}>
        <Text
          style={[styles.detailValue, mono && { fontFamily: 'monospace' }, valueColor && { color: valueColor }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {value}
        </Text>
        {onEdit && (
          <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
            <Text style={styles.editBtnText}>{value && value !== '—' ? '✎' : '+'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── My Device Card ───────────────────────────────────────────────────────────
// locked / setLocked are passed in from the parent so state survives tab changes
function MyDeviceCard({ t, deviceInfo, imei, onEditImei, locked, setLocked }) {
  const [locking, setLocking] = useState(false);
  const progressAnim = useRef(new Animated.Value(locked ? 1 : 0)).current;
  const cardGlow     = useRef(new Animated.Value(0)).current;
  const iconPulse    = useRef(new Animated.Value(1)).current;
  const glowLoop     = useRef(null);

  // Re-sync the glow loop whenever the locked state changes
  useEffect(() => {
    if (locked) {
      progressAnim.setValue(1);
      glowLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(cardGlow, { toValue: 1, duration: 1600, useNativeDriver: true }),
          Animated.timing(cardGlow, { toValue: 0.25, duration: 1600, useNativeDriver: true }),
        ])
      );
      glowLoop.current.start();
    } else {
      glowLoop.current && glowLoop.current.stop();
      cardGlow.setValue(0);
      progressAnim.setValue(0);
    }
    return () => { glowLoop.current && glowLoop.current.stop(); };
  }, [locked]);

  const handleLock = () => {
    if (locking || locked) return;
    setLocking(true);
    progressAnim.setValue(0);
    Animated.timing(progressAnim, { toValue: 1, duration: 1800, useNativeDriver: false }).start();
    setTimeout(() => {
      setLocking(false);
      setLocked(true);           // persisted by parent
      Animated.spring(iconPulse, { toValue: 1.18, useNativeDriver: true }).start(() =>
        Animated.spring(iconPulse, { toValue: 1, useNativeDriver: true }).start()
      );
    }, 1900);
  };

  const handleUnlock = () => {
    if (!locked) return;
    setLocked(false);            // persisted by parent
  };

  const accentColor = locked ? COLORS.secondary : locking ? COLORS.warning : COLORS.primary;
  const statusText  = locked ? t.securedEncrypted : locking ? t.securingDevice : 'ONLINE  ●  AES-256';

  return (
    <GlassCard style={styles.myDeviceCard} accentColor={accentColor}>
      <View style={styles.myDeviceHeader}>
        <Animated.View style={[styles.deviceIconWrap, {
          transform: [{ scale: iconPulse }],
          borderColor: accentColor,
          backgroundColor: locked ? 'rgba(0,255,157,0.08)' : 'rgba(0,212,255,0.07)',
          shadowColor: accentColor,
          shadowOpacity: cardGlow,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 0 },
        }]}>
          <Text style={styles.deviceIconEmoji}>📱</Text>
          <View style={[styles.statusDot, { backgroundColor: locked ? COLORS.secondary : COLORS.primary }]} />
        </Animated.View>

        <View style={styles.deviceNameBlock}>
          <Text style={styles.deviceName} numberOfLines={1} adjustsFontSizeToFit>
            {deviceInfo.name || 'My Device'}
          </Text>
          <Text style={styles.deviceModel} numberOfLines={1}>
            {deviceInfo.model || '—'}
          </Text>
          <Text style={[styles.deviceStatusText, { color: accentColor }]}>{statusText}</Text>
        </View>

        <View style={[styles.lockIndicator, { borderColor: accentColor, backgroundColor: locked ? 'rgba(0,255,157,0.07)' : 'transparent' }]}>
          <Text style={[styles.lockIndicatorIcon, { color: accentColor }]}>{locked ? '🔒' : '🔓'}</Text>
        </View>
      </View>

      {(locking || locked) && (
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, {
            width: locked ? '100%' : progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            backgroundColor: locked ? COLORS.secondary : COLORS.warning,
          }]} />
        </View>
      )}

      <View style={styles.detailsBlock}>
        <DetailRow label="IMEI"     value={imei || '—'}             valueColor={imei ? COLORS.text : COLORS.textDim} onEdit={onEditImei} />
        <View style={styles.detailDivider} />
        <DetailRow label="LOCAL IP" value={deviceInfo.ip || '—'}    valueColor={COLORS.primary} />
        <View style={styles.detailDivider} />
        <DetailRow label="MODEL"    value={deviceInfo.model || '—'} valueColor={COLORS.textSub} />
        <View style={styles.detailDivider} />
        <DetailRow label="OS"       value={deviceInfo.os || '—'}    valueColor={COLORS.textSub} />
      </View>

      <TouchableOpacity
        style={[styles.lockBtn, { borderColor: accentColor, backgroundColor: locked ? 'rgba(0,255,157,0.08)' : 'rgba(0,212,255,0.07)' }]}
        onPress={locked ? handleUnlock : handleLock}
        activeOpacity={0.7}
        disabled={locking}
      >
        <Text style={[styles.lockBtnText, { color: accentColor }]}>
          {locked ? `🔓  ${t.unlock}` : locking ? `◌  ${t.securingDevice}` : `🔒  ${t.lock}`}
        </Text>
      </TouchableOpacity>
    </GlassCard>
  );
}

// ─── Server Row ───────────────────────────────────────────────────────────────
function ServerRow({ server, last }) {
  const loadColor = server.load > 70 ? COLORS.danger : server.load > 45 ? COLORS.warning : COLORS.secondary;
  return (
    <>
      <View style={styles.serverRow}>
        <View style={[styles.serverIconWrap, { borderColor: COLORS.primary }]}>
          <Text style={[styles.serverIcon, { color: COLORS.primary }]}>◈</Text>
        </View>
        <View style={styles.serverInfo}>
          <Text style={styles.serverName}>{server.name}</Text>
          <Text style={styles.serverIp}>{server.ip}  ·  {server.location}</Text>
          <Text style={styles.serverType}>{server.type}</Text>
        </View>
        <View style={styles.serverLoadWrap}>
          <Text style={[styles.serverLoadPct, { color: loadColor }]}>{server.load}%</Text>
          <View style={styles.serverLoadBar}>
            <View style={[styles.serverLoadFill, { width: `${server.load}%`, backgroundColor: loadColor }]} />
          </View>
          <View style={[styles.serverStatusDot, { backgroundColor: COLORS.secondary }]} />
        </View>
      </View>
      {!last && <View style={styles.netDivider} />}
    </>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DeviceLockScreen() {
  const { t } = useLanguage();
  const fadeIn = useRef(new Animated.Value(0)).current;

  const [deviceInfo,    setDeviceInfo]    = useState({ name: null, model: null, os: null, ip: null });
  const [loadingDevice, setLoadingDevice] = useState(true);
  const [imei,          setImei]          = useState('');
  const [showImeiModal, setShowImeiModal] = useState(false);

  // ── Lock state lives HERE (persisted to AsyncStorage) so it survives tab switches
  const [locked, setLockedState] = useState(false);

  const setLocked = async (val) => {
    setLockedState(val);
    try {
      await AsyncStorage.setItem(LOCK_STORAGE_KEY, val ? '1' : '0');
    } catch (_) {}
  };

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    async function init() {
      try {
        const savedLock = await AsyncStorage.getItem(LOCK_STORAGE_KEY);
        if (savedLock === '1') setLockedState(true);

        const savedImei = await AsyncStorage.getItem(IMEI_STORAGE_KEY);
        if (savedImei) setImei(savedImei);
      } catch (_) {}

      try {
        const name         = Device.deviceName || Device.modelName || 'My Device';
        const manufacturer = Device.manufacturer || '';
        const modelName    = Device.modelName    || '';
        const model        = manufacturer ? `${manufacturer} ${modelName}`.trim() : modelName || 'Unknown';
        const osName       = Device.osName    || '';
        const osVersion    = Device.osVersion || '';
        const os           = `${osName} ${osVersion}`.trim() || 'Unknown';

        const networkState = await Network.getNetworkStateAsync();
        let ip = '—';
        if (networkState.isConnected) ip = await Network.getIpAddressAsync();

        setDeviceInfo({ name, model, os, ip });
      } catch (_) {
        setDeviceInfo({ name: Device.modelName || 'My Device', model: 'Unknown', os: 'Unknown', ip: '—' });
      } finally {
        setLoadingDevice(false);
      }
    }

    init();
  }, []);

  const handleSaveImei = async (value) => {
    setImei(value);
    try {
      if (value) await AsyncStorage.setItem(IMEI_STORAGE_KEY, value);
      else       await AsyncStorage.removeItem(IMEI_STORAGE_KEY);
    } catch (_) {}
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>{t.appSub}</Text>
          <Text style={styles.headerTitle}>{t.deviceControl}</Text>
        </View>
        <View style={styles.headerBadge}>
          <View style={styles.headerBadgeDot} />
          <Text style={styles.headerBadgeText}>{loadingDevice ? 'SCANNING...' : 'VERIFIED'}</Text>
        </View>
      </View>

      <View style={styles.summaryBar}>
        {[
          { num: '1',   label: t.total,         color: COLORS.primary   },
          { num: '1',   label: t.secured,        color: COLORS.secondary },
          { num: '0',   label: t.threatCount,    color: COLORS.danger    },
          { num: '128', label: t.monitoredCount, color: COLORS.primary   },
        ].map((item, i, arr) => (
          <React.Fragment key={i}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNum, { color: item.color }]}>{item.num}</Text>
              <Text style={styles.summaryLabel} numberOfLines={1}>{item.label}</Text>
            </View>
            {i < arr.length - 1 && <View style={styles.summaryDivider} />}
          </React.Fragment>
        ))}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionLabel}>{t.connectedDevices}</Text>
        <Animated.View style={{ opacity: fadeIn }}>
          {loadingDevice ? (
            <GlassCard style={styles.myDeviceCard} accentColor={COLORS.primary}>
              <View style={styles.loadingPlaceholder}>
                <View style={styles.loadingDot} />
                <Text style={styles.loadingText}>SCANNING DEVICE...</Text>
              </View>
            </GlassCard>
          ) : (
            <MyDeviceCard
              t={t}
              deviceInfo={deviceInfo}
              imei={imei}
              onEditImei={() => setShowImeiModal(true)}
              locked={locked}
              setLocked={setLocked}
            />
          )}
        </Animated.View>

        <Text style={[styles.sectionLabel, { marginTop: 22 }]}>CONNECTED SERVERS</Text>
        <GlassCard style={styles.networkCard} accentColor={COLORS.primary}>
          {SERVERS.map((s, i) => (
            <ServerRow key={s.id} server={s} last={i === SERVERS.length - 1} />
          ))}
        </GlassCard>

        <View style={{ height: 30 }} />
      </ScrollView>

      <ImeiModal
        visible={showImeiModal}
        currentImei={imei}
        onSave={handleSaveImei}
        onClose={() => setShowImeiModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  headerSub:       { color: COLORS.primary, fontSize: 9, letterSpacing: 3, fontFamily: 'monospace', marginBottom: 2 },
  headerTitle:     { color: COLORS.text, fontSize: 22, fontWeight: '800', letterSpacing: 1 },
  headerBadge:     { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: 'rgba(0,255,157,0.3)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: 'rgba(0,255,157,0.07)' },
  headerBadgeDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.secondary },
  headerBadgeText: { color: COLORS.secondary, fontSize: 8, fontWeight: '700', letterSpacing: 1.5, fontFamily: 'monospace' },

  summaryBar:     { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(6,18,40,0.9)', borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.border, paddingVertical: 12, paddingHorizontal: 20 },
  summaryItem:    { flex: 1, alignItems: 'center' },
  summaryNum:     { fontSize: 20, fontWeight: '900', fontFamily: 'monospace' },
  summaryLabel:   { color: COLORS.textDim, fontSize: 8, letterSpacing: 1, fontFamily: 'monospace', marginTop: 2 },
  summaryDivider: { width: 1, height: 30, backgroundColor: COLORS.border },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },
  sectionLabel:  { color: COLORS.textDim, fontSize: 9, letterSpacing: 3, fontFamily: 'monospace', marginBottom: 10 },

  loadingPlaceholder: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 40 },
  loadingDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, opacity: 0.8 },
  loadingText: { color: COLORS.primary, fontSize: 11, fontFamily: 'monospace', letterSpacing: 3 },

  myDeviceCard:    { marginBottom: 6 },
  myDeviceHeader:  { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  deviceIconWrap:  { width: 58, height: 58, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  deviceIconEmoji: { fontSize: 26 },
  statusDot:       { position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: COLORS.bg },
  deviceNameBlock: { flex: 1 },
  deviceName:      { color: COLORS.text, fontSize: 14, fontWeight: '800', marginBottom: 2, letterSpacing: 0.3 },
  deviceModel:     { color: COLORS.textDim, fontSize: 10, fontFamily: 'monospace', marginBottom: 4 },
  deviceStatusText:{ fontSize: 10, fontFamily: 'monospace', fontWeight: '700', letterSpacing: 1 },
  lockIndicator:   { width: 46, height: 46, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  lockIndicatorIcon:{ fontSize: 20 },

  progressTrack: { height: 2, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 16, borderRadius: 1, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 1 },

  detailsBlock:  { marginHorizontal: 16, marginTop: 8, marginBottom: 4, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  detailRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10 },
  detailLabel:   { color: COLORS.textDim, fontSize: 9, letterSpacing: 2.5, fontFamily: 'monospace', marginRight: 8 },
  detailRight:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 },
  detailValue:   { color: COLORS.text, fontSize: 11, letterSpacing: 0.5, flexShrink: 1, textAlign: 'right' },
  detailDivider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 12 },

  editBtn:     { width: 24, height: 24, borderRadius: 6, borderWidth: 1, borderColor: COLORS.primary, backgroundColor: 'rgba(0,212,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  editBtnText: { color: COLORS.primary, fontSize: 12, lineHeight: 16 },

  lockBtn:     { margin: 16, marginTop: 12, borderWidth: 1.5, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  lockBtnText: { fontSize: 12, fontWeight: '800', letterSpacing: 2, fontFamily: 'monospace' },

  networkCard:    { marginBottom: 4 },
  serverRow:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  serverIconWrap: { width: 34, height: 34, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,212,255,0.06)' },
  serverIcon:     { fontSize: 15 },
  serverInfo:     { flex: 1 },
  serverName:     { color: COLORS.text, fontSize: 12, fontWeight: '700', fontFamily: 'monospace', marginBottom: 2 },
  serverIp:       { color: COLORS.primary, fontSize: 9, fontFamily: 'monospace', letterSpacing: 0.5, marginBottom: 2 },
  serverType:     { color: COLORS.textDim, fontSize: 9, fontFamily: 'monospace', letterSpacing: 1 },
  serverLoadWrap: { alignItems: 'flex-end', gap: 4, minWidth: 48 },
  serverLoadPct:  { fontSize: 11, fontWeight: '900', fontFamily: 'monospace' },
  serverLoadBar:  { width: 44, height: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' },
  serverLoadFill: { height: '100%', borderRadius: 2 },
  serverStatusDot:{ width: 7, height: 7, borderRadius: 4, shadowColor: COLORS.secondary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 4 },
  netDivider:     { height: 1, backgroundColor: COLORS.border, marginHorizontal: 14 },

  modalBackdrop:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end', paddingBottom: 32 },
  modalCard:            { marginHorizontal: 16, backgroundColor: 'rgba(6,18,40,0.98)', borderRadius: 18, borderWidth: 1.5, borderColor: COLORS.border, overflow: 'hidden' },
  modalAccent:          { height: 2, width: '100%', opacity: 0.9 },
  modalHeader:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 4 },
  modalTitle:           { color: COLORS.text, fontSize: 16, fontWeight: '900', letterSpacing: 3, fontFamily: 'monospace' },
  modalClose:           { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  modalCloseText:       { color: COLORS.textDim, fontSize: 12 },
  modalSub:             { color: COLORS.textDim, fontSize: 10, fontFamily: 'monospace', letterSpacing: 0.5, paddingHorizontal: 20, marginBottom: 16 },
  imeiInputWrap:        { marginHorizontal: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 10, backgroundColor: 'rgba(0,212,255,0.05)', overflow: 'hidden' },
  imeiInputPrefix:      { color: COLORS.primary, fontSize: 9, fontWeight: '900', letterSpacing: 2, fontFamily: 'monospace', paddingHorizontal: 12, paddingVertical: 14, borderRightWidth: 1, borderRightColor: COLORS.border },
  imeiInput:            { flex: 1, color: COLORS.text, fontSize: 15, fontFamily: 'monospace', letterSpacing: 1.5, paddingHorizontal: 14, paddingVertical: 13 },
  imeiError:            { color: COLORS.danger, fontSize: 10, fontFamily: 'monospace', letterSpacing: 1, paddingHorizontal: 20, marginBottom: 14 },
  imeiHint:             { color: COLORS.textDim, fontSize: 9, fontFamily: 'monospace', letterSpacing: 0.3, paddingHorizontal: 20, marginBottom: 14 },
  modalBtns:            { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 20, paddingTop: 4 },
  modalBtnPrimary:      { flex: 1, backgroundColor: 'rgba(0,212,255,0.1)', borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  modalBtnPrimaryText:  { color: COLORS.primary, fontSize: 11, fontWeight: '900', letterSpacing: 2.5, fontFamily: 'monospace' },
  modalBtnSecondary:    { paddingHorizontal: 16, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  modalBtnSecondaryText:{ color: COLORS.textDim, fontSize: 11, fontWeight: '700', letterSpacing: 2, fontFamily: 'monospace' },
});