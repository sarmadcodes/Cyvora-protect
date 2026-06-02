import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { COLORS } from '../constants/theme';

const { width } = Dimensions.get('window');

const TABS = [
  { key: 'Dashboard', label: 'Dashboard', icon: '⊕' },
  { key: 'Secure', label: 'Network', icon: '◎' },
  { key: 'Threats', label: 'Alerts', icon: '⚠' },
  { key: 'Devices', label: 'Devices', icon: '⬡' },
];

function TabItem({ tab, isActive, onPress, alertCount }) {
  const scale = useRef(new Animated.Value(isActive ? 1 : 0.9)).current;
  const glow = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: isActive ? 1 : 0.88, useNativeDriver: true }),
      Animated.timing(glow, { toValue: isActive ? 1 : 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [isActive]);

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={() => onPress(tab.key)}
      activeOpacity={0.7}
    >
      <Animated.View style={[
        styles.tabIconWrap,
        {
          transform: [{ scale }],
          backgroundColor: isActive ? 'rgba(0,212,255,0.12)' : 'transparent',
          borderColor: isActive ? 'rgba(0,212,255,0.35)' : 'transparent',
          shadowColor: COLORS.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.8] }),
          shadowRadius: 10,
        }
      ]}>
        <Text style={[styles.tabIcon, { color: isActive ? COLORS.primary : COLORS.textDim }]}>
          {tab.icon}
        </Text>
        {alertCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{alertCount}</Text>
          </View>
        )}
      </Animated.View>
      <Text style={[styles.tabLabel, { color: isActive ? COLORS.primary : COLORS.textDim }]}>
        {tab.label}
      </Text>
    </TouchableOpacity>
  );
}

export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <View style={styles.container}>
      {/* Top border glow */}
      <View style={styles.topGlow} />
      <View style={styles.navRow}>
        {TABS.map(tab => (
          <TabItem
            key={tab.key}
            tab={tab}
            isActive={activeTab === tab.key}
            onPress={onTabChange}
            alertCount={tab.key === 'Threats' ? 5 : 0}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(2, 11, 24, 0.97)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,212,255,0.15)',
    paddingBottom: 28,
  },
  topGlow: {
    height: 1,
    backgroundColor: COLORS.primary,
    opacity: 0.2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  navRow: {
    flexDirection: 'row',
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  tabIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
    position: 'relative',
  },
  tabIcon: {
    fontSize: 20,
    fontWeight: '300',
  },
  tabLabel: {
    fontSize: 9,
    fontFamily: 'monospace',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: COLORS.bg,
  },
  badgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '900',
  },
});
