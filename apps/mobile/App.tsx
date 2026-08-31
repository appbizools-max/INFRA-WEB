import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import AuthNavigator from './src/general/navigation/AuthNavigator';
import DrawerNavigator from './src/general/navigation/DrawerNavigator';
import RegistrationWizardScreen from './src/tenant/registration/RegistrationWizardScreen';

import { LogBox } from 'react-native';

// Ignore non-critical framework & SDK deprecation warnings in Metro logs
LogBox.ignoreLogs([
  'requestIdleCallback',
  'InteractionManager',
  'This method is deprecated',
  'Method called was',
  'migrating-to-v22'
]);

const Stack = createNativeStackNavigator();

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);

  useEffect(() => {
    // Safety fallback: Unblock loading after 2 seconds max
    const fallbackTimer = setTimeout(() => {
      setInitializing(false);
    }, 2000);

    let subscriber: (() => void) | null = null;
    try {
      subscriber = auth().onAuthStateChanged((userState) => {
        setUser(userState);
        setInitializing(false);
        clearTimeout(fallbackTimer);
      });
    } catch (err) {
      console.warn('[App] Firebase auth state listener warning:', err);
      setInitializing(false);
    }

    return () => {
      clearTimeout(fallbackTimer);
      if (subscriber) subscriber();
    };
  }, []);

  if (initializing) {
    // Show a native-looking loading state while Firebase initializes
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ color: '#94A3B8', marginTop: 12, fontSize: 13, fontWeight: '600' }}>Starting InfraOps360...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
            <Stack.Screen name="Auth" component={AuthNavigator} />
          ) : (
            <Stack.Group>
              <Stack.Screen name="Home" component={DrawerNavigator} />
              <Stack.Screen name="RegistrationWizard" component={RegistrationWizardScreen} />
            </Stack.Group>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
