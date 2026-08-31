import { Platform, NativeModules } from 'react-native';
import { DEV_MACHINE_IP, BACKEND_PORT } from './config';

/**
 * Dynamically resolves the backend server URL.
 *
 * Priority:
 *  1. expo-constants hostUri (best for Expo Go)
 *  2. React Native Metro scriptURL
 *  3. config.ts DEV_MACHINE_IP  ← reliable for physical devices (native build)
 *  4. 10.0.2.2 for Android emulator
 */
const getBaseUrl = (): string => {
  // 1. Prioritize DEV_MACHINE_IP from config.ts for reliable local connections
  if (DEV_MACHINE_IP) {
    console.log(`[API] Using DEV_MACHINE_IP → http://${DEV_MACHINE_IP}:${BACKEND_PORT}`);
    return `http://${DEV_MACHINE_IP}:${BACKEND_PORT}`;
  }

  const constants = (Platform.constants || {}) as any;

  // 2. Try Platform.constants.ServerHost for Metro bundler host
  if (constants.ServerHost) {
    let host = constants.ServerHost.split(':')[0];
    if (host && host !== 'null' && host !== 'localhost' && host !== '127.0.0.1') {
      console.log(`[API] Dynamically resolved via ServerHost → http://${host}:${BACKEND_PORT}`);
      return `http://${host}:${BACKEND_PORT}`;
    }
  }

  // 3. Default Android loopback
  return `http://10.0.2.2:${BACKEND_PORT}`;
};

export const getApiBaseUrl = (): string => getBaseUrl();
export const BASE_URL = getBaseUrl();

/**
 * Authenticated API Fetch Helper for Mobile App
 * Automatically retrieves current Firebase ID token and attaches Authorization header
 */
export const mobileApiFetch = async (endpoint: string, options: RequestInit = {}) => {
  let token: string | null = null;
  try {
    const authModule = require('@react-native-firebase/auth').default;
    const authInstance = authModule();
    const currentUser = authInstance.currentUser;
    if (currentUser) {
      token = await currentUser.getIdToken(false);
    }
  } catch (err) {
    console.warn('[mobileApiFetch] Warning: Failed to retrieve Firebase token:', err);
  }

  if (!token) {
    token = 'MOCK_TOKEN_DEV';
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const activeBaseUrl = getBaseUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${activeBaseUrl}${endpoint}`;
  return fetch(url, { ...options, headers });
};