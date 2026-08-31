import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import PhoneLoginScreen from '../../auth/PhoneLoginScreen';
import OtpVerificationScreen from '../../auth/OtpVerificationScreen';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="PhoneLogin" component={PhoneLoginScreen} />
      <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
    </Stack.Navigator>
  );
}
