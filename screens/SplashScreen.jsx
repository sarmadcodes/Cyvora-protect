import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { COLORS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

const BOOT_LINES = [
  'Initializing Cyvora Protect v4.2.1...',
  'Loading encryption modules... OK',
  'Connecting to servers network... OK',
  'Establishing VPN tunnels... OK',
  'Running threat scan... OK',
  'Firewall active. All systems nominal.',
  'SECURE CONNECTION ESTABLISHED',
];

export default function SplashScreen({ onFinish }) {
  const [visibleLines, setVisibleLines] = useState([]);
  const [showLogo, setShowLogo] = useState(false);
  const [showBar, setShowBar] = useState(false);
  const [barProgress] = useState(new Animated.Value(0));
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const ringScale1 = useRef(new Animated.Value(0.3)).current;
  const ringScale2 = useRef(new Animated.Value(0.3)).current;
  const ringScale3 = useRef(new Animated.Value(0.3)).current;
  const ringOpacity1 = useRef(new Animated.Value(0)).current;
  const ringOpacity2 = useRef(new Animated.Value(0)).current;
  const ringOpacity3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Show logo first
    setTimeout(() => {
      setShowLogo(true);
      Animated.parallel([
        Animated.spring(logoOpacity, { toValue: 1, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      ]).start();

      // Ring pulse animations
      const pulseRing = (scale, opacity, delay) => {
        setTimeout(() => {
          Animated.loop(
            Animated.sequence([
              Animated.parallel([
                Animated.timing(scale, { toValue: 1.8, duration: 1800, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0, duration: 1800, useNativeDriver: true }),
              ]),
              Animated.parallel([
                Animated.timing(scale, { toValue: 0.3, duration: 0, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.7, duration: 0, useNativeDriver: true }),
              ]),
            ])
          ).start();
        }, delay);
      };
      pulseRing(ringScale1, ringOpacity1, 300);
      pulseRing(ringScale2, ringOpacity2, 900);
      pulseRing(ringScale3, ringOpacity3, 1500);
    }, 400);

    // Show boot lines sequentially
    BOOT_LINES.forEach((line, i) => {
      setTimeout(() => {
        setVisibleLines(prev => [...prev, line]);
        if (i === BOOT_LINES.length - 1) {
          setShowBar(true);
          Animated.timing(barProgress, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: false,
          }).start(() => {
            setTimeout(() => {
              Animated.timing(screenOpacity, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
              }).start(() => onFinish && onFinish());
            }, 400);
          });
        }
      }, 700 + i * 380);
    });
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDeep} />

      {/* Logo area */}
      {showLogo && (
        <View style={styles.logoArea}>
          {/* Pulse rings */}
          <Animated.View style={[
            styles.ring,
            { transform: [{ scale: ringScale1 }], opacity: ringOpacity1, width: 160, height: 160, borderRadius: 80 }
          ]} />
          <Animated.View style={[
            styles.ring,
            { transform: [{ scale: ringScale2 }], opacity: ringOpacity2, width: 160, height: 160, borderRadius: 80 }
          ]} />
          <Animated.View style={[
            styles.ring,
            { transform: [{ scale: ringScale3 }], opacity: ringOpacity3, width: 160, height: 160, borderRadius: 80 }
          ]} />

          <Animated.View style={[
            styles.logoContainer,
            { opacity: logoOpacity, transform: [{ scale: logoScale }] }
          ]}>
            <View style={styles.shieldOuter}>
              <View style={styles.shieldInner}>
                <Text style={styles.shieldIcon}>⬡</Text>
                <Text style={styles.shieldCheck}>✓</Text>
              </View>
            </View>
          </Animated.View>

          <Animated.Text style={[styles.logoTitle, { opacity: logoOpacity }]}>
            Cyvora Protect
          </Animated.Text>
          <Animated.Text style={[styles.logoSub, { opacity: logoOpacity }]}>
            ADVANCED THREAT INTELLIGENCE
          </Animated.Text>
        </View>
      )}

      {/* Boot terminal */}
      <View style={styles.terminal}>
        <View style={styles.terminalHeader}>
          <View style={[styles.termDot, { backgroundColor: COLORS.danger }]} />
          <View style={[styles.termDot, { backgroundColor: COLORS.warning }]} />
          <View style={[styles.termDot, { backgroundColor: COLORS.secondary }]} />
          <Text style={styles.termTitle}>BOOT_SEQUENCE.SH</Text>
        </View>
        <View style={styles.terminalBody}>
          {visibleLines.map((line, i) => (
            <Text
              key={i}
              style={[
                styles.termLine,
                i === visibleLines.length - 1 && styles.termLineLast,
                line.includes('ESTABLISHED') && styles.termLineSuccess,
              ]}
            >
              {i === visibleLines.length - 1 && !line.includes('ESTABLISHED') ? (
                <Text style={styles.cursor}>{'> '}</Text>
              ) : (
                <Text style={styles.termPrefix}>{'  '}</Text>
              )}
              {line}
            </Text>
          ))}
        </View>
      </View>

      {/* Progress bar */}
      {showBar && (
        <View style={styles.progressContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: barProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
          <View style={styles.progressGlow} />
        </View>
      )}

      <Text style={styles.versionText}>v4.2.1 — BUILD 2024.12</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDeep,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 48,
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  shieldOuter: {
    width: 90,
    height: 90,
    borderRadius: 20,
    backgroundColor: COLORS.primaryDim,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
  },
  shieldInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldIcon: {
    fontSize: 52,
    color: COLORS.primary,
    position: 'absolute',
    opacity: 0.3,
  },
  shieldCheck: {
    fontSize: 36,
    color: COLORS.secondary,
    fontWeight: '700',
  },
  logoTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 8,
    fontFamily: 'monospace',
    marginBottom: 6,
  },
  logoSub: {
    fontSize: 10,
    color: COLORS.textSub,
    letterSpacing: 4,
    fontFamily: 'monospace',
  },
  terminal: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: 24,
  },
  terminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,212,255,0.06)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  termDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  termTitle: {
    color: COLORS.textDim,
    fontSize: 10,
    letterSpacing: 3,
    fontFamily: 'monospace',
    marginLeft: 8,
  },
  terminalBody: {
    padding: 14,
    minHeight: 180,
  },
  termLine: {
    color: COLORS.textSub,
    fontSize: 11.5,
    fontFamily: 'monospace',
    lineHeight: 20,
    letterSpacing: 0.5,
  },
  termLineLast: {
    color: COLORS.primary,
  },
  termLineSuccess: {
    color: COLORS.secondary,
    fontWeight: '700',
    letterSpacing: 2,
  },
  cursor: {
    color: COLORS.primary,
  },
  termPrefix: {
    color: 'transparent',
  },
  progressContainer: {
    width: '100%',
    height: 3,
    backgroundColor: COLORS.primaryDim,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 32,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  progressGlow: {
    position: 'absolute',
    right: 0,
    top: -4,
    width: 20,
    height: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 5,
    opacity: 0.5,
  },
  versionText: {
    position: 'absolute',
    bottom: 40,
    color: COLORS.textDim,
    fontSize: 10,
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
});
