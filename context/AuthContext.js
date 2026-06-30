import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = '@cybershield_session';

// ─────────────────────────────────────────────────────────────────────────────
//  SWITCH THIS when testing vs building
//  true  = Expo Go (uses production server, no build needed)
//  false = Production APK build
const DEV_MODE = true;
// ─────────────────────────────────────────────────────────────────────────────

export const API_BASE = DEV_MODE
  ? 'http://168.231.126.16'   // same production server, works in Expo Go too
  : 'http://168.231.126.16';  // same for now — swap to https://yourdomain.com when ready

const TIMEOUT_MS = 10000;

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Check your server is running and API_BASE is correct.');
    }
    throw new Error('Cannot reach server. Check your IP address and that the backend is running.');
  } finally {
    clearTimeout(timer);
  }
}

const AuthContext = createContext({
  user:   null,
  token:  null,
  login:  async () => {},
  signup: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [user,   setUser]   = useState(null);
  const [token,  setToken]  = useState(null);
  const [loaded, setLoaded] = useState(false);

  // Restore session on app launch
  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY)
      .then(raw => {
        if (raw) {
          const { user: u, token: tk } = JSON.parse(raw);
          setUser(u);
          setToken(tk);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const login = useCallback(async (email, password) => {
    console.log('[Auth] Logging in →', `${API_BASE}/api/auth/login`);
    const res = await fetchWithTimeout(`${API_BASE}/api/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    });

    let data;
    try { data = await res.json(); }
    catch { throw new Error('Invalid response from server'); }

    console.log('[Auth] Login response:', data);
    if (!data.success) throw new Error(data.message || 'Login failed');
    setUser(data.user);
    setToken(data.token);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ user: data.user, token: data.token })).catch(() => {});
    return data;
  }, []);

  const signup = useCallback(async (name, email, password) => {
    console.log('[Auth] Signing up →', `${API_BASE}/api/auth/signup`);
    const res = await fetchWithTimeout(`${API_BASE}/api/auth/signup`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, email, password }),
    });

    let data;
    try { data = await res.json(); }
    catch { throw new Error('Invalid response from server'); }

    console.log('[Auth] Signup response:', data);
    if (!data.success) throw new Error(data.message || 'Signup failed');
    setUser(data.user);
    setToken(data.token);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ user: data.user, token: data.token })).catch(() => {});
    return data;
  }, []);

  const logout = useCallback(() => {
    console.log('[Auth] Logging out');
    setUser(null);
    setToken(null);
    AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
  }, []);

  if (!loaded) return null;

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}