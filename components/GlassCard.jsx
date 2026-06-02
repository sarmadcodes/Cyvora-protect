import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

export default function GlassCard({ children, style, accentColor, title, titleRight }) {
  const accent = accentColor || COLORS.primary;
  return (
    <View style={[styles.card, { borderColor: `${accent}30` }, style]}>
      {/* Top accent line */}
      <View style={[styles.accentLine, { backgroundColor: accent }]} />
      {/* Shine overlay */}
      <View style={styles.shine} />
      {title && (
        <View style={styles.header}>
          <Text style={[styles.title, { color: accent }]}>{title}</Text>
          {titleRight}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(6, 18, 40, 0.88)',
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
    backdropFilter: 'blur(10px)',
  },
  accentLine: {
    height: 2,
    width: '100%',
    opacity: 0.8,
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
  },
});
