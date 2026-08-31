import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ImageBackground, Image, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getAuth, signInWithPhoneNumber } from '@react-native-firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BASE_URL } from '../services/api';

export default function PhoneLoginScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login State
  const [loginMethod, setLoginMethod] = useState<'mobile' | 'email'>('mobile');
  const [loginStage, setLoginStage] = useState<'input' | 'otp'>('input');


  const [regStage, setRegStage] = useState<0 | 1 | 2 | 3>(0);

  // Shared state
  const [loading, setLoading] = useState(false);

  // Form State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // OTP State
  const [mobileOtp, setMobileOtp] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  // Timer State
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getBackendUrl = () => {
    return BASE_URL;
  };

  const handleSendMobileOtp = async (phone: string) => {
    const formattedNum = `+91${phone}`;
    const confirmation = await signInWithPhoneNumber(getAuth(), formattedNum);
    setConfirmationResult(confirmation);
    return confirmation;
  };

  const checkUserExists = async (field: { email?: string, mobile?: string }) => {
    const res = await fetch(`${getBackendUrl()}/api/auth/check-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(field)
    });
    if (!res.ok) throw new Error('Failed to verify user existence');
    const data = await res.json();
    return data.exists;
  };
  const handleSendEmailOtp = async (mail: string) => {
    const res = await fetch(`${getBackendUrl()}/api/auth/send-email-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: mail })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to send email OTP');
    }
  };

  const handleVerifyEmailOtp = async (mail: string, otpCode: string) => {
    const res = await fetch(`${getBackendUrl()}/api/auth/verify-email-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: mail, otp: otpCode })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Invalid Email OTP');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      if (mode === 'login') {
        if (loginStage === 'input') {
          // Send OTP
          if (loginMethod === 'mobile') {
            if (phoneNumber.length < 10) throw new Error('Invalid mobile number');
            const exists = await checkUserExists({ mobile: phoneNumber });
            if (!exists) throw new Error('Mobile number is not registered. Please create an account.');

            await handleSendMobileOtp(phoneNumber);
            Alert.alert('Success', 'OTP sent to your mobile number.');
          } else {
            if (!email) throw new Error('Invalid email');
            const exists = await checkUserExists({ email: email });
            if (!exists) throw new Error('Email is not registered. Please create an account.');

            await handleSendEmailOtp(email);
            Alert.alert('Success', 'OTP sent to your email address.');
          }
          setTimer(180);
          setLoginStage('otp');
        } else {
          // Verify OTP
          if (loginMethod === 'mobile') {
            if (!mobileOtp) throw new Error('Enter OTP');
            await confirmationResult?.confirm(mobileOtp);
          } else {
            if (!emailOtp) throw new Error('Enter OTP');
            await handleVerifyEmailOtp(email, emailOtp);
            throw new Error('Email login requires backend custom token integration. Please login with Mobile.');
          }
        }
      } else {
        // Sequential Registration
        if (regStage === 0) {
          if (!name || !email || !termsAccepted) {
            throw new Error('Please fill all fields and accept terms.');
          }
          const exists = await checkUserExists({ email: email });
          if (exists) throw new Error('Email is already registered. Please log in.');

          await handleSendEmailOtp(email);
          Alert.alert('Success', 'OTP sent to your email address.');
          setTimer(180);
          setRegStage(1);
        } else if (regStage === 1) {
          if (!emailOtp) throw new Error('Enter Email OTP');
          await handleVerifyEmailOtp(email, emailOtp);
          setRegStage(2);
        } else if (regStage === 2) {
          if (phoneNumber.length < 10) throw new Error('Invalid mobile number');
          const exists = await checkUserExists({ mobile: phoneNumber });
          if (exists) throw new Error('Mobile number is already registered.');

          await handleSendMobileOtp(phoneNumber);
          Alert.alert('Success', 'OTP sent to your mobile number.');
          setTimer(180);
          setRegStage(3);
        } else if (regStage === 3) {
          if (!mobileOtp) throw new Error('Enter Mobile OTP');
          const result = await confirmationResult?.confirm(mobileOtp);

          if (result?.user) {
            await fetch(`${getBackendUrl()}/api/tenant/draft`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                firebaseUid: result.user.uid,
                step: 1,
                draftData: { adminName: name, email: email, mobile: phoneNumber }
              })
            });
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setLoginStage('input');
    setRegStage(0);
    setMobileOtp('');
    setEmailOtp('');
    setTimer(0);
  };

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
            contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 50) }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
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
              <Text style={styles.title}>{mode === 'login' ? 'Tenant Login' : 'Create Account'}</Text>
              <Text style={styles.subtitle}>
                {mode === 'login' ? 'Welcome back to the command center' : 'Join the next-gen operations platform'}
              </Text>
            </View>

            {/* Toggle Modes */}
            {mode === 'login' && loginStage === 'input' && (
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tabButton, loginMethod === 'mobile' && styles.activeTabButton]}
                  onPress={() => { setLoginMethod('mobile'); resetState(); }}
                >
                  <Text style={[styles.tabText, loginMethod === 'mobile' && styles.activeTabText]}>Mobile OTP</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabButton, loginMethod === 'email' && styles.activeTabButton]}
                  onPress={() => { setLoginMethod('email'); resetState(); }}
                >
                  <Text style={[styles.tabText, loginMethod === 'email' && styles.activeTabText]}>Email OTP</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Form Area */}
            <View style={styles.formContainer}>

              {/* LOGIN MODE */}
              {mode === 'login' && (
                <>
                  {loginStage === 'input' ? (
                    <>
                      {loginMethod === 'mobile' ? (
                        <>
                          <Text style={styles.label}>Mobile Number</Text>
                          <View style={[styles.inputWrapper, { paddingLeft: 0 }]}>
                            <View style={styles.prefixContainer}>
                              <Text style={styles.prefixText}>+91</Text>
                            </View>
                            <TextInput
                              style={styles.input}
                              placeholder="Enter 10 digit number"
                              placeholderTextColor="#9CA3AF"
                              keyboardType="phone-pad"
                              maxLength={10}
                              value={phoneNumber}
                              onChangeText={(v) => setPhoneNumber(v.replace(/\D/g, '').slice(0, 10))}
                            />
                          </View>
                        </>
                      ) : (
                        <>
                          <Text style={styles.label}>Email Address</Text>
                          <View style={styles.inputWrapper}>
                            <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                            <TextInput
                              style={styles.input}
                              placeholder="name@company.com"
                              placeholderTextColor="#9CA3AF"
                              keyboardType="email-address"
                              autoCapitalize="none"
                              value={email}
                              onChangeText={setEmail}
                            />
                          </View>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <Text style={styles.label}>
                        {loginMethod === 'mobile' ? `Mobile OTP (+91 ${phoneNumber})` : `Email OTP (${email})`}
                      </Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={[styles.input, styles.otpInput]}
                          placeholder="000000"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="number-pad"
                          maxLength={6}
                          value={loginMethod === 'mobile' ? mobileOtp : emailOtp}
                          onChangeText={(v) => {
                            const val = v.replace(/\D/g, '').slice(0, 6);
                            if (loginMethod === 'mobile') setMobileOtp(val);
                            else setEmailOtp(val);
                          }}
                        />
                      </View>

                      {timer > 0 ? (
                        <Text style={styles.timerText}>
                          <Ionicons name="time-outline" size={12} color="#10B981" /> Expires in: {formatTime(timer)}
                        </Text>
                      ) : (
                        <Text style={styles.timerExpiredText}>OTP Expired</Text>
                      )}
                    </>
                  )}
                </>
              )}

              {/* REGISTRATION MODE - SEQUENTIAL */}
              {mode === 'register' && (
                <>
                  {regStage === 0 && (
                    <>
                      <Text style={styles.label}>Full Name</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="John Doe"
                          placeholderTextColor="#9CA3AF"
                          value={name}
                          onChangeText={setName}
                        />
                      </View>

                      <Text style={styles.label}>Email Address</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="name@company.com"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          value={email}
                          onChangeText={setEmail}
                        />
                      </View>

                      <TouchableOpacity style={styles.checkboxRow} onPress={() => setTermsAccepted(!termsAccepted)}>
                        <Ionicons name={termsAccepted ? "checkbox" : "square-outline"} size={20} color={termsAccepted ? "#10B981" : "#D1D5DB"} />
                        <Text style={styles.checkboxText}>I agree to the Terms & Conditions</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {regStage === 1 && (
                    <>
                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxTitle}>Step 1: Verify Email</Text>
                      </View>
                      <Text style={styles.label}>Email OTP ({email})</Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={[styles.input, styles.otpInput]}
                          placeholder="000000"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="number-pad"
                          maxLength={6}
                          value={emailOtp}
                          onChangeText={(v) => setEmailOtp(v.replace(/\D/g, '').slice(0, 6))}
                        />
                      </View>
                      {timer > 0 ? (
                        <Text style={styles.timerText}>
                          <Ionicons name="time-outline" size={12} color="#10B981" /> Expires in: {formatTime(timer)}
                        </Text>
                      ) : (
                        <Text style={styles.timerExpiredText}>OTP Expired</Text>
                      )}
                    </>
                  )}

                  {regStage === 2 && (
                    <>
                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxTitle}>Step 2: Enter Mobile Number</Text>
                      </View>
                      <Text style={styles.label}>Mobile Number</Text>
                      <View style={[styles.inputWrapper, { paddingLeft: 0 }]}>
                        <View style={styles.prefixContainer}>
                          <Text style={styles.prefixText}>+91</Text>
                        </View>
                        <TextInput
                          style={styles.input}
                          placeholder="Enter 10 digit number"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="phone-pad"
                          maxLength={10}
                          value={phoneNumber}
                          onChangeText={(v) => setPhoneNumber(v.replace(/\D/g, '').slice(0, 10))}
                        />
                      </View>
                    </>
                  )}

                  {regStage === 3 && (
                    <>
                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxTitle}>Final Step: Verify Mobile</Text>
                      </View>
                      <Text style={styles.label}>Mobile OTP (+91 {phoneNumber})</Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={[styles.input, styles.otpInput]}
                          placeholder="000000"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="number-pad"
                          maxLength={6}
                          value={mobileOtp}
                          onChangeText={(v) => setMobileOtp(v.replace(/\D/g, '').slice(0, 6))}
                        />
                      </View>
                      {timer > 0 ? (
                        <Text style={styles.timerText}>
                          <Ionicons name="time-outline" size={12} color="#10B981" /> Expires in: {formatTime(timer)}
                        </Text>
                      ) : (
                        <Text style={styles.timerExpiredText}>OTP Expired</Text>
                      )}
                    </>
                  )}
                </>
              )}

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {mode === 'login'
                      ? (loginStage === 'otp' ? 'Verify & Login' : 'Send OTP')
                      : (
                        regStage === 0 ? 'Continue' :
                          regStage === 1 ? 'Verify Email' :
                            regStage === 2 ? 'Send SMS OTP' : 'Complete Registration'
                      )
                    }
                  </Text>
                )}
              </TouchableOpacity>

              {/* Navigation Back or Toggle Mode */}
              {(mode === 'login' && loginStage === 'input') || (mode === 'register' && regStage === 0) ? (
                <View style={styles.footerRow}>
                  <TouchableOpacity onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); resetState(); }}>
                    <Text style={styles.footerLink}>
                      {mode === 'login' ? "Don't have an account? Create account" : "Already have an account? Log in"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.footerRow}>
                  <TouchableOpacity onPress={() => {
                    if (mode === 'login') {
                      setLoginStage('input');
                    } else {
                      setRegStage(Math.max(0, regStage - 1) as any);
                    }
                  }}>
                    <Text style={styles.footerLink}>← Back</Text>
                  </TouchableOpacity>
                </View>
              )}

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  overlay: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 24 },
  logo: { width: 140, height: 140 },
  titleContainer: { alignItems: 'center', marginBottom: 24 },
  title: { fontFamily: 'Geist', fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  subtitle: { fontFamily: 'Geist', fontSize: 12, color: '#64748b', textAlign: 'center' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 8, padding: 4, marginBottom: 24 },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  activeTabButton: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  tabText: { fontFamily: 'Geist', fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },
  activeTabText: { color: '#10B981' },
  formContainer: { flex: 1 },
  label: { fontFamily: 'Geist', fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, height: 52, marginBottom: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontFamily: 'Geist', fontSize: 14, color: '#111827' },
  otpInput: { fontSize: 24, fontWeight: '800', letterSpacing: 8, textAlign: 'center' },
  prefixContainer: { paddingHorizontal: 16, borderRightWidth: 1, borderRightColor: '#E2E8F0', marginRight: 12, height: '100%', justifyContent: 'center' },
  prefixText: { fontFamily: 'GeistMono', fontSize: 14, fontWeight: '600', color: '#4B5563' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 8 },
  checkboxText: { fontFamily: 'Geist', fontSize: 12, color: '#4B5563', marginLeft: 8, fontWeight: '500' },
  primaryButton: { backgroundColor: '#10B981', height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 12, shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  buttonDisabled: { backgroundColor: '#9CA3AF', shadowOpacity: 0 },
  primaryButtonText: { fontFamily: 'Geist', fontSize: 15, fontWeight: '800', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 1 },
  infoBox: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#F1F5F9' },
  infoBoxTitle: { fontFamily: 'Geist', fontSize: 12, fontWeight: '700', color: '#64748b' },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 32, paddingBottom: 40 },
  footerLink: { fontFamily: 'Geist', fontSize: 13, fontWeight: '600', color: '#64748b' },
  timerText: { fontFamily: 'Geist', fontSize: 12, fontWeight: '700', color: '#10B981', textAlign: 'right', marginTop: -8, marginBottom: 16 },
  timerExpiredText: { fontFamily: 'Geist', fontSize: 12, fontWeight: '700', color: '#EF4444', textAlign: 'right', marginTop: -8, marginBottom: 16 },
  devCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
    marginBottom: 32
  },
  devCardTitle: {
    fontFamily: 'Geist',
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  devCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8
  },
  devCardBtnText: {
    fontFamily: 'Geist',
    fontSize: 12,
    fontWeight: '700',
    color: '#334155'
  },
  devCardBtnSubText: {
    fontFamily: 'GeistMono',
    fontSize: 9,
    fontWeight: '600',
    color: '#94A3B8'
  },
  devCardNote: {
    fontFamily: 'Geist',
    fontSize: 9,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 6,
    lineHeight: 12
  }
});
