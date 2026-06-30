import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from './constants/theme';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import SecureSystemScreen from './screens/SecureSystemScreen';
import ThreatFeedScreen from './screens/ThreatFeedScreen';
import DeviceLockScreen from './screens/DeviceLockScreen';
import SettingsScreen from './screens/SettingsScreen';
import BottomNav from './navigation/BottomNav';
import LoadingOverlay from './components/LoadingOverlay';

const SCREENS = {
  Dashboard: DashboardScreen,
  Secure:    SecureSystemScreen,
  Threats:   ThreatFeedScreen,
  Devices:   DeviceLockScreen,
  Settings:  SettingsScreen,
};

function AppContent() {
  const [phase,      setPhase]      = useState('splash');
  const [activeTab,  setActiveTab]  = useState('Dashboard');
  const [loadingTab, setLoadingTab] = useState(null);
  const { t } = useLanguage();
  const { user } = useAuth();

  // When user is cleared (logout), go back to login
  useEffect(() => {
    if (phase === 'app' && !user) {
      setPhase('login');
      setActiveTab('Dashboard');
    }
  }, [user, phase]);

  const loadingMessages = {
    Dashboard: t.loadingNetwork,
    Secure:    t.loadingSystem,
    Threats:   t.loadingThreats,
    Devices:   t.loadingDevices,
    Settings:  t.loadingSettings,
  };

  const handleTabChange = useCallback((tab) => {
    if (tab === activeTab || loadingTab) return;
    setActiveTab(tab);
    setLoadingTab(tab);
  }, [activeTab, loadingTab]);

  const handleLoadingDone = useCallback(() => {
    setLoadingTab(null);
  }, []);

  if (phase === 'splash') {
    return <SplashScreen onFinish={() => setPhase(user ? 'app' : 'login')} />;
  }
  if (phase === 'login') {
    return <LoginScreen onLoginSuccess={() => setPhase('app')} />;
  }

  const ActiveScreen = SCREENS[activeTab] || DashboardScreen;

  return (
    <View style={styles.root}>
      <View style={styles.screen}>
        <ActiveScreen />
        <LoadingOverlay
          visible={!!loadingTab}
          tab={loadingTab || activeTab}
          onDone={handleLoadingDone}
          duration={600}
        />
      </View>
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.bg },
  screen: { flex: 1 },
});