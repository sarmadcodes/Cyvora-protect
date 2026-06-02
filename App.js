import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from './constants/theme';
import SplashScreen from './screens/SplashScreen';
import DashboardScreen from './screens/DashboardScreen';
import SecureSystemScreen from './screens/SecureSystemScreen';
import ThreatFeedScreen from './screens/ThreatFeedScreen';
import DeviceLockScreen from './screens/DeviceLockScreen';
import BottomNav from './navigation/BottomNav';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('Dashboard');

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'Dashboard': return <DashboardScreen />;
      case 'Secure':    return <SecureSystemScreen />;
      case 'Threats':   return <ThreatFeedScreen />;
      case 'Devices':   return <DeviceLockScreen />;
      default:          return <DashboardScreen />;
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.screen}>
        {renderScreen()}
      </View>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.bg },
  screen: { flex: 1 },
});
