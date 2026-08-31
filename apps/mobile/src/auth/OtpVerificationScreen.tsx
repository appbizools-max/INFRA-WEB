import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ImageBackground, Image, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function OtpVerificationScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { confirmation, phoneNumber } = route.params;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  async function confirmCode() {
    if (code.length < 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP.');
      return;
    }

    setLoading(true);
    try {
      await confirmation.confirm(code);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Invalid OTP', 'The code you entered is incorrect. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ImageBackground
      source={require('../../assets/LoginTheme.png')}
      style={styles.container}
      imageStyle={{ opacity: 0.6, resizeMode: 'cover', height: '65%', top: -40 }}
    >
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.7)', '#FFFFFF']}
        locations={[0, 0.3, 0.55]}
        style={styles.overlay}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 20) }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Simple clean back button without the ugly circular background */}
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={28} color="#0F172A" />
            </TouchableOpacity>

            {/* Logo Area */}
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/App Logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* Titles */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Verify OTP</Text>
              <Text style={styles.subtitle}>Enter the 6-digit code sent securely to</Text>
              
              <View style={styles.phoneRow}>
                <Text style={styles.phoneNumberText}>{phoneNumber}</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.changeBtn}>
                  <Text style={styles.changeBtnText}>Change</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Form Area matching PhoneLoginScreen */}
            <View style={styles.formContainer}>
              <Text style={styles.label}>One-Time Password</Text>
              
              <View style={styles.inputWrapper}>
                <Ionicons name="keypad-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="------"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={code}
                  onChangeText={setCode}
                />
              </View>

              <TouchableOpacity 
                style={[styles.loginBtn, (!code || loading) && styles.loginBtnDisabled]} 
                onPress={confirmCode}
                disabled={!code || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginBtnText}>Verify & Login</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              {timer > 0 ? (
                <Text style={styles.timerText}>Resend OTP in {timer}s</Text>
              ) : (
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <Text style={styles.resendText}>Resend OTP</Text>
                </TouchableOpacity>
              )}
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  overlay: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    flexGrow: 1,
  },
  backButton: {
    marginTop: 20,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 200,
    height: 60,
  },
  titleContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Geist',
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Geist',
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneNumberText: {
    fontFamily: 'Geist',
    fontSize: 15,
    fontWeight: '700',
    color: '#1E3A8A',
    marginRight: 8,
  },
  changeBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  changeBtnText: {
    fontFamily: 'Geist',
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 4,
    marginBottom: 32,
  },
  label: {
    fontFamily: 'Geist',
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    marginBottom: 24,
    height: 52,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'GeistMono',
    fontSize: 22,
    color: '#0F172A',
    letterSpacing: 10,
  },
  loginBtn: {
    backgroundColor: '#1E3A8A',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginBtnText: {
    fontFamily: 'Geist',
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footer: {
    alignItems: 'center',
  },
  timerText: {
    fontFamily: 'Geist',
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  resendText: {
    fontFamily: 'Geist',
    fontSize: 14,
    color: '#1E3A8A',
    fontWeight: '700',
  }
});
