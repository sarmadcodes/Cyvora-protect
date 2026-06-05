import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TextInput,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

// ─── CYBER INPUT ───────────────────────────────────────────────────
function CyberInput({ label, value, onChangeText, secureTextEntry, error }) {
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;
  const labelY     = useRef(new Animated.Value(value ? -20 : 0)).current;
  const labelScale = useRef(new Animated.Value(value ? 0.8 : 1)).current;

  const animateFocus = (isFocused) => {
    Animated.parallel([
      Animated.timing(borderAnim, { toValue: isFocused ? 1 : 0, duration: 200, useNativeDriver: false }),
      Animated.timing(labelY,     { toValue: isFocused || value ? -20 : 0, duration: 180, useNativeDriver: true }),
      Animated.timing(labelScale, { toValue: isFocused || value ? 0.8 : 1, duration: 180, useNativeDriver: true }),
    ]).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [error ? COLORS.danger : COLORS.border, error ? COLORS.danger : COLORS.primary],
  });

  return (
    <View style={inputStyles.wrapper}>
      <Animated.Text style={[
        inputStyles.label,
        { color: focused ? COLORS.primary : COLORS.textDim },
        { transform: [{ translateY: labelY }, { scale: labelScale }] },
      ]}>
        {label}
      </Animated.Text>
      <Animated.View style={[inputStyles.box, { borderColor }]}>
        <TextInput
          style={inputStyles.input}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => { setFocused(true);  animateFocus(true);  }}
          onBlur={() =>  { setFocused(false); animateFocus(false); }}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor="transparent"
        />
      </Animated.View>
      {error ? <Text style={inputStyles.error}>{error}</Text> : null}
    </View>
  );
}

const inputStyles = StyleSheet.create({
  wrapper:  { marginBottom: 28, position: 'relative' },
  label: {
    position: 'absolute', top: 14, left: 14,
    fontSize: 11, fontFamily: 'monospace', letterSpacing: 2, zIndex: 1,
  },
  box: {
    borderWidth: 1, borderRadius: 8,
    backgroundColor: 'rgba(0, 10, 30, 0.5)',
  },
  input: {
    color: COLORS.text, fontSize: 14, fontFamily: 'monospace',
    paddingHorizontal: 14, paddingVertical: 14, letterSpacing: 1,
  },
  error: {
    color: COLORS.danger, fontSize: 9, fontFamily: 'monospace',
    letterSpacing: 1, marginTop: 5, marginLeft: 2,
  },
});

// ─── LOGIN FORM ────────────────────────────────────────────────────
function LoginForm({ onLoginSuccess, onSwitchToSignUp }) {
  const { login } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const btnOpacity   = useRef(new Animated.Value(1)).current;

  const shakeBtn = () => {
    Animated.sequence([
      Animated.timing(btnOpacity, { toValue: 0.4, duration: 80, useNativeDriver: true }),
      Animated.timing(btnOpacity, { toValue: 1,   duration: 80, useNativeDriver: true }),
      Animated.timing(btnOpacity, { toValue: 0.4, duration: 80, useNativeDriver: true }),
      Animated.timing(btnOpacity, { toValue: 1,   duration: 80, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    const errs = {};
    if (!email.trim())    errs.email    = 'Email required';
    if (!password.trim()) errs.password = 'Password required';
    if (Object.keys(errs).length) { setErrors(errs); shakeBtn(); return; }

    setErrors({});
    setLoading(true);
    progressAnim.setValue(0);

    // Pulse the bar to show activity while waiting for API
    Animated.timing(progressAnim, { toValue: 0.6, duration: 600, useNativeDriver: false }).start();

    try {
      await login(email.trim(), password);
      // Instantly fill to 100% and enter app
      Animated.timing(progressAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start(() => {
        onLoginSuccess();
      });
    } catch (err) {
      setLoading(false);
      progressAnim.setValue(0);
      setErrors({ password: err.message || 'Invalid credentials' });
      shakeBtn();
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View>
      <CyberInput
        label="EMAIL"
        value={email}
        onChangeText={t => { setEmail(t); setErrors(p => ({ ...p, email: '' })); }}
        error={errors.email}
      />
      <CyberInput
        label="PASSWORD"
        value={password}
        onChangeText={t => { setPassword(t); setErrors(p => ({ ...p, password: '' })); }}
        secureTextEntry
        error={errors.password}
      />

      <TouchableOpacity activeOpacity={0.8} onPress={handleLogin} disabled={loading}>
        <Animated.View style={[formStyles.primaryBtn, { opacity: btnOpacity, borderColor: COLORS.primary }]}>
          <Text style={[formStyles.primaryBtnText, { color: COLORS.primary }]}>
            {loading ? 'AUTHENTICATING...' : 'INITIATE ACCESS →'}
          </Text>
          {loading && (
            <View style={[formStyles.progressTrack, { backgroundColor: 'rgba(0,212,255,0.1)' }]}>
              <Animated.View style={[formStyles.progressFill, { width: progressWidth, backgroundColor: COLORS.primary }]} />
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>

      <View style={formStyles.divider}>
        <View style={formStyles.line} />
        <Text style={formStyles.orText}>OR</Text>
        <View style={formStyles.line} />
      </View>

      <TouchableOpacity onPress={onSwitchToSignUp} activeOpacity={0.7}>
        <View style={formStyles.secondaryBtn}>
          <Text style={formStyles.secondaryBtnText}>CREATE ACCOUNT</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ─── SIGN UP FORM ──────────────────────────────────────────────────
function SignUpForm({ onSwitchToLogin, onSignUpSuccess }) {
  const { signup } = useAuth();
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const doneOpacity  = useRef(new Animated.Value(0)).current;

  const handleSignUp = async () => {
    const errs = {};
    if (!name.trim())                         errs.name     = 'Name required';
    if (!email.trim() || !email.includes('@')) errs.email    = 'Valid email required';
    if (!password || password.length < 8)      errs.password = 'Min 8 characters';
    if (confirm !== password)                  errs.confirm  = 'Passwords do not match';

    if (Object.keys(errs).length) { setErrors(errs); return; }

    setErrors({});
    setLoading(true);
    progressAnim.setValue(0);

    // Pulse the bar to show activity while waiting for API
    Animated.timing(progressAnim, { toValue: 0.6, duration: 600, useNativeDriver: false }).start();

    try {
      await signup(name.trim(), email.trim(), password);
      // Fill to 100% then show success and enter app
      Animated.timing(progressAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start(() => {
        setLoading(false);
        setDone(true);
        Animated.timing(doneOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start(() => {
          setTimeout(() => onSignUpSuccess(), 600);
        });
      });
    } catch (err) {
      setLoading(false);
      progressAnim.setValue(0);
      // Show server error under email field (e.g. "Email already registered")
      setErrors({ email: err.message || 'Signup failed' });
    }
  };

  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  if (done) {
    return (
      <Animated.View style={[formStyles.successBox, { opacity: doneOpacity }]}>
        <View style={[formStyles.successIcon, { borderColor: COLORS.secondary }]}>
          <Text style={[formStyles.successIconText, { color: COLORS.secondary }]}>✓</Text>
        </View>
        <Text style={[formStyles.successTitle, { color: COLORS.secondary }]}>NODE REGISTERED</Text>
        <Text style={formStyles.successSub}>Identity verified. Entering Cyvora Protect...</Text>
      </Animated.View>
    );
  }

  return (
    <View>
      <CyberInput label="NAME"     value={name}     onChangeText={t => { setName(t);     setErrors(p => ({ ...p, name: '' }));     }} error={errors.name}     />
      <CyberInput label="EMAIL"    value={email}    onChangeText={t => { setEmail(t);    setErrors(p => ({ ...p, email: '' }));    }} error={errors.email}    />
      <CyberInput label="PASSWORD" value={password} onChangeText={t => { setPassword(t); setErrors(p => ({ ...p, password: '' })); }} secureTextEntry error={errors.password} />
      <CyberInput label="CONFIRM PASSWORD" value={confirm} onChangeText={t => { setConfirm(t); setErrors(p => ({ ...p, confirm: '' })); }} secureTextEntry error={errors.confirm} />

      <TouchableOpacity activeOpacity={0.8} onPress={handleSignUp} disabled={loading}>
        <Animated.View style={[formStyles.primaryBtn, { borderColor: COLORS.secondary }]}>
          <Text style={[formStyles.primaryBtnText, { color: COLORS.secondary }]}>
            {loading ? 'REGISTERING...' : 'CREATE NODE →'}
          </Text>
          {loading && (
            <View style={[formStyles.progressTrack, { backgroundColor: 'rgba(0,255,157,0.1)' }]}>
              <Animated.View style={[formStyles.progressFill, { width: progressWidth, backgroundColor: COLORS.secondary }]} />
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>

      <TouchableOpacity onPress={onSwitchToLogin} activeOpacity={0.7} style={{ marginTop: 14, alignItems: 'center' }}>
        <Text style={{ color: COLORS.textDim, fontSize: 10, fontFamily: 'monospace', letterSpacing: 2 }}>
          ← BACK TO LOGIN
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const formStyles = StyleSheet.create({
  primaryBtn: {
    borderWidth: 1.5, borderRadius: 8,
    paddingVertical: 15, alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    overflow: 'hidden', marginBottom: 16,
  },
  primaryBtnText: { fontSize: 11, fontWeight: '900', letterSpacing: 3, fontFamily: 'monospace' },
  progressTrack:  { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 },
  progressFill:   { height: '100%' },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  line:    { flex: 1, height: 1, backgroundColor: COLORS.border },
  orText:  { color: COLORS.textDim, fontSize: 10, fontFamily: 'monospace', letterSpacing: 2 },
  secondaryBtn: {
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 8, paddingVertical: 14, alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  secondaryBtnText: { color: COLORS.textDim, fontSize: 11, fontFamily: 'monospace', letterSpacing: 3 },
  successBox:       { alignItems: 'center', paddingVertical: 20 },
  successIcon: {
    width: 72, height: 72, borderRadius: 36, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    backgroundColor: 'rgba(0,255,157,0.08)',
  },
  successIconText: { fontSize: 32, fontWeight: '700' },
  successTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 4, fontFamily: 'monospace', marginBottom: 8 },
  successSub:   { color: COLORS.textSub, fontSize: 11, fontFamily: 'monospace', textAlign: 'center', marginBottom: 18 },
});

// ─── MAIN SCREEN ───────────────────────────────────────────────────
export default function LoginScreen({ onLoginSuccess }) {
  const [mode, setMode] = useState('login');

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const logoGlow  = useRef(new Animated.Value(0.5)).current;
  const tabSlide  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoGlow, { toValue: 1,   duration: 2200, useNativeDriver: true }),
        Animated.timing(logoGlow, { toValue: 0.5, duration: 2200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const switchMode = (newMode) => {
    Animated.timing(tabSlide, {
      toValue: newMode === 'login' ? 0 : 1, duration: 220, useNativeDriver: false,
    }).start();
    setMode(newMode);
  };

  const tabLeft = tabSlide.interpolate({ inputRange: [0, 1], outputRange: ['0%', '50%'] });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={styles.grid} pointerEvents="none">
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={`h${i}`} style={[styles.gridH, { top: `${i * 14}%` }]} />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={`v${i}`} style={[styles.gridV, { left: `${i * 20}%` }]} />
        ))}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Animated.View style={[styles.logoWrap, { opacity: logoGlow }]}>
              <Text style={styles.logoCheck}>✓</Text>
            </Animated.View>
            <Text style={styles.appName}>Cyvora Protect</Text>
            <Text style={styles.tagline}>ADVANCED THREAT INTELLIGENCE OS</Text>
            <View style={styles.badges}>
              {['AES-256', 'TLS 1.3', 'ZERO-TRUST'].map((b, i) => (
                <View key={b} style={styles.badge}>
                  <View style={[styles.badgeDot, { backgroundColor: i % 2 === 0 ? COLORS.secondary : COLORS.primary }]} />
                  <Text style={styles.badgeText}>{b}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={[styles.accentLine, { backgroundColor: mode === 'login' ? COLORS.primary : COLORS.secondary }]} />
            <View style={styles.tabs}>
              <Animated.View style={[styles.tabIndicator, { left: tabLeft, backgroundColor: mode === 'login' ? COLORS.primary : COLORS.secondary }]} />
              {['login', 'signup'].map((t) => (
                <TouchableOpacity key={t} style={styles.tab} onPress={() => switchMode(t)} activeOpacity={0.7}>
                  <Text style={[styles.tabText, mode === t && styles.tabTextActive]}>
                    {t === 'login' ? 'LOGIN' : 'SIGN UP'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.form}>
              <View style={styles.formHeader}>
                <Text style={[styles.formTitle, { color: mode === 'login' ? COLORS.primary : COLORS.secondary }]}>
                  {mode === 'login' ? 'SECURE ACCESS' : 'NEW NODE'}
                </Text>
                <Text style={styles.formSub}>
                  {mode === 'login' ? 'Enter credentials to connect' : 'Register a new identity'}
                </Text>
              </View>
              {mode === 'login'
                ? <LoginForm onLoginSuccess={onLoginSuccess} onSwitchToSignUp={() => switchMode('signup')} />
                : <SignUpForm onSwitchToLogin={() => switchMode('login')} onSignUpSuccess={onLoginSuccess} />
              }
            </View>
          </Animated.View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>v4.2.1 — Cyvora Protect</Text>
            <View style={styles.footerRow}>
              <View style={[styles.badgeDot, { backgroundColor: COLORS.secondary }]} />
              <Text style={[styles.footerText, { color: COLORS.secondary }]}>SECURE CHANNEL ACTIVE</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDeep },
  grid:  { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  gridH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(0,212,255,0.03)' },
  gridV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(0,212,255,0.03)' },
  scroll: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 30 },
  header: { alignItems: 'center', marginBottom: 28 },
  logoWrap: {
    width: 72, height: 72, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.primary,
    backgroundColor: 'rgba(0,212,255,0.07)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  logoCheck: { fontSize: 30, color: COLORS.secondary, fontWeight: '800' },
  appName:   { fontSize: 22, fontWeight: '900', color: COLORS.text, letterSpacing: 8, fontFamily: 'monospace', marginBottom: 4 },
  tagline:   { fontSize: 8, color: COLORS.textDim, letterSpacing: 2.5, fontFamily: 'monospace', marginBottom: 14 },
  badges:    { flexDirection: 'row', gap: 6 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4,
  },
  badgeDot:  { width: 5, height: 5, borderRadius: 3 },
  badgeText: { color: COLORS.textDim, fontSize: 8, fontFamily: 'monospace', letterSpacing: 1 },
  card: {
    backgroundColor: 'rgba(6,18,40,0.9)',
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, overflow: 'hidden', marginBottom: 20,
  },
  accentLine:    { height: 2 },
  tabs:          { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border, position: 'relative', overflow: 'hidden' },
  tabIndicator:  { position: 'absolute', bottom: 0, width: '50%', height: '100%', opacity: 0.12 },
  tab:           { flex: 1, paddingVertical: 13, alignItems: 'center' },
  tabText:       { color: COLORS.textDim, fontSize: 10, fontFamily: 'monospace', letterSpacing: 3 },
  tabTextActive: { color: COLORS.bg, fontWeight: '800' },
  form:          { padding: 20 },
  formHeader:    { marginBottom: 22 },
  formTitle:     { fontSize: 13, fontWeight: '900', letterSpacing: 4, fontFamily: 'monospace', marginBottom: 4 },
  formSub:       { color: COLORS.textDim, fontSize: 10, fontFamily: 'monospace', letterSpacing: 1 },
  footer:        { alignItems: 'center', gap: 5 },
  footerRow:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footerText:    { color: COLORS.textDim, fontSize: 8, fontFamily: 'monospace', letterSpacing: 2 },
});