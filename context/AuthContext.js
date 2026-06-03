import React, { createContext, useContext, useState, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
//  API BASE URL — update this to match your environment:
//
//  Android emulator  →  'http://10.0.2.2:5000'
//  iOS simulator     →  'http://localhost:5000'
//  Physical device   →  'http://YOUR_PC_LOCAL_IP:5000'
//                        (run `ipconfig` on Windows or `ifconfig` on Mac/Linux
//                         and use the IPv4 address on your Wi-Fi adapter,
//                         e.g. 'http://192.168.1.42:5000')
//
//  ⚠️  Your phone and PC must be on the SAME Wi-Fi network.
// ─────────────────────────────────────────────────────────────────────────────
export const API_BASE = 'http://192.168.100.192:5000';

const TIMEOUT_MS = 10000; // 10 seconds — avoids infinite loading

// Wraps fetch with a timeout so the app never hangs forever
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
    // Network unreachable, refused connection, etc.
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
  const [user,  setUser]  = useState(null);
  const [token, setToken] = useState(null);

  const login = useCallback(async (email, password) => {
    const res  = await fetchWithTimeout(`${API_BASE}/api/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('Invalid response from server');
    }

    if (!data.success) throw new Error(data.message || 'Login failed');
    setUser(data.user);
    setToken(data.token);
    return data;
  }, []);

  const signup = useCallback(async (name, email, password) => {
    const res = await fetchWithTimeout(`${API_BASE}/api/auth/signup`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, email, password }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('Invalid response from server');
    }

    if (!data.success) throw new Error(data.message || 'Signup failed');
    setUser(data.user);
    setToken(data.token);
    return data;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}