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
import { useLanguage } from '../context/LanguageContext';

const { width } = Dimensions.get('window');

// Proper Unicode icons that render reliably on both iOS and Android
const ICONS = {
  Dashboard: '⊞',
  Secure:    '◈',
  Threats:   '⚠',
  Devices:   '▣',
  Settings:  '⚙',
};

function TabItem({ tabKey, label, icon, isActive, onPress, alertCount }) {
  const scale = useRef(new Animated.Value(isActive ? 1 : 0.88)).current;
  const glow  = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: isActive ? 1 : 0.88,
        useNativeDriver: true,
        tension: 140,
        friction: 9,
      }),
      Animated.timing(glow, {
        toValue: isActive ? 1 : 0,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isActive]);

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={() => onPress(tabKey)}
      activeOpacity={0.7}
    >
      <Animated.View style={[
        styles.tabIconWrap,
        {
          transform: [{ scale }],
          backgroundColor: isActive ? 'rgba(0,212,255,0.13)' : 'transparent',
          borderColor: isActive ? 'rgba(0,212,255,0.4)' : 'transparent',
          shadowColor: COLORS.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.75] }),
          shadowRadius: 10,
        },
      ]}>
        <Text style={[
          styles.tabIcon,
          { color: isActive ? COLORS.primary : COLORS.textDim },
        ]}>
          {icon}
        </Text>
        {alertCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{alertCount}</Text>
          </View>
        )}
      </Animated.View>
      <Text
        style={[styles.tabLabel, { color: isActive ? COLORS.primary : COLORS.textDim }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function BottomNav({ activeTab, onTabChange }) {
  const { t } = useLanguage();

  const TABS = [
    { key: 'Dashboard', label: t.navDashboard, icon: ICONS.Dashboard },
    { key: 'Secure',    label: t.navNetwork,   icon: ICONS.Secure    },
    { key: 'Threats',   label: t.navAlerts,    icon: ICONS.Threats   },
    { key: 'Devices',   label: t.navDevices,   icon: ICONS.Devices   },
    { key: 'Settings',  label: t.navSettings,  icon: ICONS.Settings  },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.topGlow} />
      <View style={styles.navRow}>
        {TABS.map(tab => (
          <TabItem
            key={tab.key}
            tabKey={tab.key}
            label={tab.label}
            icon={tab.icon}
            isActive={activeTab === tab.key}
            onPress={onTabChange}
            alertCount={tab.key === 'Threats' ? 5 : 0}
          />
        ))}
      </View>
    </View>
  );
}

const TAB_ICON_SIZE = Math.min(42, width / 9);

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(2,11,24,0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,212,255,0.16)',
    paddingBottom: 28,
  },
  topGlow: {
    height: 1,
    backgroundColor: COLORS.primary,
    opacity: 0.15,
  },
  navRow: {
    flexDirection: 'row',
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  tabIconWrap: {
    width: TAB_ICON_SIZE,
    height: TAB_ICON_SIZE,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
    position: 'relative',
  },
  tabIcon: {
    fontSize: 18,
    lineHeight: 22,
  },
  tabLabel: {
    fontSize: Math.max(8, Math.min(10, width / 44)),
    fontFamily: 'monospace',
    letterSpacing: 0.2,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -5,
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