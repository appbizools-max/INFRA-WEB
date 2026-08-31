import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView, Modal, FlatList, LogBox, Image, Dimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { getAuth } from '@react-native-firebase/auth';
import { BASE_URL } from '../../services/api';

// Ignore harmless React Native warnings
LogBox.ignoreLogs([
  'InteractionManager has been deprecated'
]);
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import CustomDropdown from '../../general/components/CustomDropdown';

export default function RegistrationWizardScreen({ navigation }: any) {
  const [step, setStep] = useState(1);
  // Step 1 State
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [customIndustry, setCustomIndustry] = useState('');
  
  const industryOptions = [
    'Logistics',
    'Mining',
    'Port Operations',
    'Rail Logistics',
    'EPC / Infrastructure',
    'Construction',
    'Manufacturing'
  ];
  const [country, setCountry] = useState('');
  const [state, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setCompanyLogo(result.assets[0].uri);
    }
  };

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const countryOptions = ['United States', 'United Kingdom', 'India', 'Australia'];

  const getStateOptions = (selectedCountry: string) => {
    switch (selectedCountry) {
      case 'India':
        return ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'];
      case 'United States':
        return ['California', 'New York', 'Texas', 'Florida', 'Illinois', 'Pennsylvania', 'Ohio', 'Georgia', 'North Carolina', 'Michigan'];
      case 'United Kingdom':
        return ['England', 'Scotland', 'Wales', 'Northern Ireland'];
      case 'Australia':
        return ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia', 'Tasmania'];
      default:
        return ['Select a country first'];
    }
  };

  const stateOptions = getStateOptions(country);
  const companySizeOptions = ['1-10 Employees', '11-50 Employees', '51-200 Employees', '201-500 Employees', '500+ Employees'];
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [msmeNumber, setMsmeNumber] = useState('');
  const [adminName, setAdminName] = useState('');
  const [designation, setDesignation] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Step 3 State
  const [plans, setPlans] = useState<any[]>([]);
  const [subscriptionPlanId, setSubscriptionPlanId] = useState<number | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  React.useEffect(() => {
    // Fetch subscription plans
    // Android uses local machine IP for physical devices or emulator
    const baseUrl = BASE_URL;
    const apiUrl = `${baseUrl}/api/plans`;
    
    fetch(apiUrl)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setPlans(data);
      })
      .catch(err => console.error('Failed to fetch plans', err));

    // Fetch existing draft if any reliably using onAuthStateChanged
    const subscriber = getAuth().onAuthStateChanged(user => {
      if (user) {
        if (user.email) setEmail(user.email);
        if (user.phoneNumber) setMobile(user.phoneNumber);
        
        const mobParam = user.phoneNumber ? encodeURIComponent(user.phoneNumber) : '';
        const emlParam = user.email ? encodeURIComponent(user.email) : '';
        
        fetch(`${baseUrl}/api/tenant/status/${user.uid}?mobile=${mobParam}&email=${emlParam}`)
          .then(res => res.json())
          .then(data => {
            if (data.status === 'complete' || data.status === 'completed') {
              navigation.navigate('Home');
            } else if (data.status === 'draft' && data.data) {
              const d = data.data;
              if (d.companyName) setCompanyName(d.companyName);
              if (d.companyAddress) setCompanyAddress(d.companyAddress);
              if (d.industryType) {
                if (industryOptions.includes(d.industryType)) {
                  setSelectedIndustry(d.industryType);
                } else {
                  setSelectedIndustry('Other');
                  setCustomIndustry(d.industryType);
                }
              }
              if (d.country) setCountry(d.country);
              if (d.state) setStateName(d.state);
              if (d.pincode) setPincode(d.pincode);
              if (d.city) setCity(d.city);
              if (d.companySize) setCompanySize(d.companySize);
              if (d.companyWebsite) setCompanyWebsite(d.companyWebsite);
              if (d.gstNumber) setGstNumber(d.gstNumber);
              if (d.panNumber) setPanNumber(d.panNumber);
              if (d.msmeNumber) setMsmeNumber(d.msmeNumber);
              if (d.adminName) setAdminName(d.adminName);
              if (d.designation) setDesignation(d.designation);
              if (d.mobile) setMobile(d.mobile);
              if (d.email) setEmail(d.email);
              if (d.subdomain) setSubdomain(d.subdomain);
              // If they completed step 1 (data.step === 1), move to step 2. If 2, move to 3. Otherwise stay on 1.
              setStep(data.step === 1 ? 2 : data.step === 2 ? 3 : 1);
            }
          })
          .catch(err => console.error('Failed to fetch draft', err));
      }
    });
    return subscriber;
  }, []);

  // Removed auto-save based on user feedback

  const saveDraft = async (currentStep: number) => {
    const user = getAuth().currentUser;
    if (!user) return;
    const baseUrl = BASE_URL;
    try {
      const res = await fetch(`${baseUrl}/api/tenant/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUid: user.uid,
          step: currentStep,
          draftData: {
            companyName,
            companyAddress,
            industryType: selectedIndustry === 'Other' ? customIndustry : selectedIndustry,
            country, state, pincode, city, companySize, companyWebsite,
            gstNumber, panNumber, msmeNumber, adminName, designation, mobile, email, subdomain
          }
        })
      });
      if (!res.ok) {
        const errorData = await res.json();
        alert('Failed to save draft: ' + (errorData.error || res.statusText));
      }
    } catch (e: any) {
      alert('Network Error saving draft: ' + e.message);
      console.error('Failed to save draft:', e);
    }
  };

  const nextStep = () => {
    setErrorMsg('');
    if (step === 1) {
      if (!companyName.trim() || !companyAddress.trim()) {
        setErrorMsg('Company Name and Company Address are required.');
        return;
      }
    } else if (step === 2) {
      if (!adminName.trim() || !designation.trim() || !mobile.trim() || !email.trim() || !subdomain.trim()) {
        setErrorMsg('Please fill in all required fields marked with *');
        return;
      }
    }
    if (step < 3) {
      saveDraft(step);
      setStep(step + 1);
    }
  };

  const handlePincodeChange = async (val: string) => {
    
    setPincode(val);
    if (val.length === 6 && /^\d+$/.test(val)) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${val}`);
        const data = await res.json();
        if (data && data[0] && data[0].Status === 'Success') {
          const postOffice = data[0].PostOffice[0];
          setStateName(postOffice.State);
          setCity(postOffice.District || postOffice.Block || postOffice.Name);
          setCountry('India');
        }
      } catch (err) {
        console.error('Failed to fetch pincode details', err);
      }
    }
  };

  const prevStep = () => {
    if (step > 1) {
      saveDraft(step - 1);
      setStep(step - 1);
    }
  };

  const finishRegistration = async () => {
    if (!subscriptionPlanId) {
      setErrorMsg('Please select a subscription plan');
      return;
    }
    if (!termsAccepted) {
      setErrorMsg('You must accept the terms and conditions');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const baseUrl = BASE_URL;
      const apiUrl = `${baseUrl}/api/tenant/register`;

      const user = getAuth().currentUser;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          companyName,
          companyAddress,
          industryType: selectedIndustry === 'Other' ? customIndustry : selectedIndustry,
          country,
          state,
          pincode,
          city,
          companyWebsite,
          companySize,
          gstNumber,
          panNumber,
          msmeNumber,
          adminName,
          designation,
          mobile,
          email,
          subscriptionPlanId,
          subdomain
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register');
      }

      navigation.goBack();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      {/* MAIN CONTENT (SCROLLABLE) */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView bounces={false} contentContainerStyle={{ paddingBottom: 24 }}>
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Company Registration</Text>
            <TouchableOpacity style={styles.backButton}>
              <Ionicons name="help-circle-outline" size={24} color="#1E3A8A" />
            </TouchableOpacity>
          </View>
          {/* PROGRESS BAR */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }]} />
            </View>
            <View style={styles.stepsRow}>
              <StepIndicator currentStep={step} stepNumber={1} label="Choose a Plan" />
              <StepIndicator currentStep={step} stepNumber={2} label="Confirm Details" />
              <StepIndicator currentStep={step} stepNumber={3} label="Review & Pay" />
            </View>
          </View>
          <View style={styles.scrollContent}>
            <View style={styles.card}>              {step === 1 && (
                <View style={styles.stepContainer}>
                  <View style={styles.stepHeader}>
                    <View style={styles.iconBox}>
                      <MaterialCommunityIcons name="office-building" size={28} color="#1E3A8A" />
                    </View>
                    <View style={styles.stepTitleBox}>
                      <Text style={styles.stepTitle}>Company Profile</Text>
                      <Text style={styles.stepSubtitle}>Complete your company profile to create your tenant.</Text>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>COMPANY NAME <Text style={styles.asterisk}>*</Text></Text>
                    <View style={styles.inputContainer}>
                      <MaterialCommunityIcons name="office-building-marker-outline" size={20} color="#1E3A8A" style={styles.inputIcon} />
                      <TextInput
                        style={styles.inputText}
                        placeholder="e.g. ABC Logistics Pvt Ltd"
                        value={companyName}
                        onChangeText={(val) => {
                          setCompanyName(val);
                          setSubdomain(val.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 30));
                        }}
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>COMPANY ADDRESS <Text style={styles.asterisk}>*</Text></Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="business-outline" size={20} color="#1E3A8A" style={styles.inputIcon} />
                      <TextInput
                        style={styles.inputText}
                        placeholder="e.g. 123 Tech Park, 4th Avenue"
                        value={companyAddress}
                        onChangeText={setCompanyAddress}
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>GST NUMBER (OPTIONAL)</Text>
                    <View style={styles.inputContainer}>
                      <MaterialCommunityIcons name="file-document-outline" size={20} color="#1E3A8A" style={styles.inputIcon} />
                      <TextInput
                        style={styles.inputText}
                        placeholder="e.g. 27AAAAA1111A1Z1"
                        value={gstNumber}
                        onChangeText={(val) => setGstNumber(val.toUpperCase())}
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                  </View>

                  <View style={styles.rowInputs}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                      <Text style={styles.label}>PAN NUMBER (OPTIONAL)</Text>
                      <View style={styles.inputContainer}>
                        <MaterialCommunityIcons name="card-account-details-outline" size={20} color="#1E3A8A" style={styles.inputIcon} />
                        <TextInput
                          style={styles.inputText}
                          placeholder="e.g. ABCDE1234F"
                          value={panNumber}
                          onChangeText={(val) => setPanNumber(val.toUpperCase())}
                          placeholderTextColor="#94A3B8"
                          maxLength={10}
                        />
                      </View>
                    </View>

                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.label}>MSME REG NO (OPTIONAL)</Text>
                      <View style={styles.inputContainer}>
                        <MaterialCommunityIcons name="certificate-outline" size={20} color="#1E3A8A" style={styles.inputIcon} />
                        <TextInput
                          style={styles.inputText}
                          placeholder="UDYAM-XX-00..."
                          value={msmeNumber}
                          onChangeText={setMsmeNumber}
                          placeholderTextColor="#94A3B8"
                        />
                      </View>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>COMPANY LOGO (OPTIONAL)</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                      <View style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {companyLogo ? (
                          <Image source={{ uri: companyLogo }} style={{ width: '100%', height: '100%' }} />
                        ) : (
                          <MaterialCommunityIcons name="office-building" size={24} color="#CBD5E1" />
                        )}
                      </View>
                      <TouchableOpacity onPress={pickImage} style={{ marginLeft: 16, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, backgroundColor: '#F8FAFC' }}>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#64748B' }}>Upload Logo</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={{ height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 }} />

                  <View style={styles.rowInputs}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <CustomDropdown
                        label="Industry Type (Optional)"
                        selectedValue={selectedIndustry}
                        options={[...industryOptions, 'Other']}
                        onValueChange={(val) => setSelectedIndustry(val)}
                        placeholder="Select Industry"
                        iconName="business-outline"
                      />
                    </View>

                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.label}>PINCODE / ZIP (OPTIONAL)</Text>
                      <View style={styles.inputContainer}>
                        <Ionicons name="location-outline" size={20} color="#1E3A8A" style={styles.inputIcon} />
                        <TextInput
                          style={styles.inputText}
                          placeholder="e.g. 400001"
                          value={pincode}
                          onChangeText={handlePincodeChange}
                          placeholderTextColor="#94A3B8"
                          keyboardType="numeric"
                          maxLength={6}
                        />
                      </View>
                    </View>
                  </View>

                  {selectedIndustry === 'Other' && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>SPECIFY INDUSTRY (OPTIONAL)</Text>
                      <View style={styles.inputContainer}>
                        <MaterialCommunityIcons name="domain" size={20} color="#1E3A8A" style={styles.inputIcon} />
                        <TextInput
                          style={styles.inputText}
                          placeholder="Specify your industry"
                          value={customIndustry}
                          onChangeText={setCustomIndustry}
                          placeholderTextColor="#94A3B8"
                        />
                      </View>
                    </View>
                  )}

                  <CustomDropdown
                    label="Country (Optional)"
                    selectedValue={country}
                    options={countryOptions}
                    onValueChange={(val) => {
                      if (country !== val) {
                        setCountry(val);
                        setStateName('');
                      }
                    }}
                    placeholder="Select country"
                    iconName="globe-outline"
                  />

                  <CustomDropdown
                    label="State / Province (Optional)"
                    selectedValue={state}
                    options={stateOptions}
                    onValueChange={(val) => setStateName(val)}
                    placeholder={country ? "Select state" : "Select country first"}
                    iconName="map-outline"
                    enabled={country !== ''}
                  />

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>CITY (OPTIONAL)</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="location-outline" size={20} color="#1E3A8A" style={styles.inputIcon} />
                      <TextInput
                        style={styles.inputText}
                        placeholder="e.g. Mumbai"
                        value={city}
                        onChangeText={setCity}
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                  </View>

                  <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={22} color="#1E3A8A" style={{ marginTop: 2 }} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.infoBoxTitle}>Onboarding Note</Text>
                      <Text style={styles.infoBoxText}>Everything else (GST, PAN, fleet, workflows, etc.) can be configured later through the onboarding wizard after login.</Text>
                    </View>
                  </View>
                </View>
              )}

              {step === 2 && (
                <View style={styles.stepContainer}>
                  <View style={styles.stepHeader}>
                    <View style={styles.iconBox}>
                      <Ionicons name="person" size={24} color="#1E3A8A" />
                    </View>
                    <View style={styles.stepTitleBox}>
                      <Text style={styles.stepTitle}>Administrator Details</Text>
                      <Text style={styles.stepSubtitle}>Set up the primary account admin.</Text>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Company Subdomain <Text style={styles.asterisk}>*</Text></Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. abclogistics"
                      value={subdomain}
                      onChangeText={(val) => setSubdomain(val.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Full Name <Text style={styles.asterisk}>*</Text></Text>
                    <TextInput
                      style={styles.input}
                      placeholder="John Doe"
                      value={adminName}
                      onChangeText={setAdminName}
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Designation <Text style={styles.asterisk}>*</Text></Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Operations Manager"
                      value={designation}
                      onChangeText={setDesignation}
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                   <View style={styles.inputGroup}>
                    <Text style={styles.label}>Mobile Number <Text style={styles.asterisk}>*</Text></Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: '#F1F5F9', color: '#64748B' }]}
                      placeholder="+91 90000 00000"
                      value={mobile}
                      editable={false}
                      keyboardType="phone-pad"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email Address <Text style={styles.asterisk}>*</Text></Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: '#F1F5F9', color: '#64748B' }]}
                      placeholder="admin@company.com"
                      value={email}
                      editable={false}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>
              )}

              {step === 3 && (() => {
                const cfgMap: Record<string, { ionicon: string; tag: string; accent: string; dark: string; saveTag: string; feats: string[]; vol: string; fleet: string; users: string; storage: string; support: string }> = {
                  Starter: { 
                    ionicon: 'paper-plane-outline', tag: 'Ideal for individuals', accent: '#3B82F6', dark: '#1E3A8A', saveTag: 'Save 15%',
                    vol: '2,500 Tons', fleet: '5 vehicles', users: '3 Seats', storage: '10 GB', support: 'Email',
                    feats: ['2,500 Tons/month', '5 vehicles', '3 user seats', 'Trip & fuel logs', 'Basic reports', 'Email support'] 
                  },
                  Professional: { 
                    ionicon: 'briefcase-outline', tag: 'Growing Teams', accent: '#3B82F6', dark: '#1E3A8A', saveTag: 'Save 20%',
                    vol: '25,000 Tons', fleet: '20 vehicles', users: '10 Seats', storage: '50 GB', support: 'Priority',
                    feats: ['25,000 Tons/month', '20 vehicles', '10 user seats', 'Advanced analytics', 'GPS tracking', 'Priority support'] 
                  },
                  Enterprise: { 
                    ionicon: 'shield-outline', tag: 'Large Scale Fleets', accent: '#3B82F6', dark: '#1E3A8A', saveTag: 'Save 25%',
                    vol: '1,00,000 Tons', fleet: '50 vehicles', users: '25 Seats', storage: '200 GB', support: 'Dedicated',
                    feats: ['1,00,000 Tons/month', '50 vehicles', '25 user seats', 'Custom workflows', 'Multi-site ops', 'Dedicated manager'] 
                  },
                  Corporate: { 
                    ionicon: 'diamond-outline', tag: 'Contact Sales', accent: '#3B82F6', dark: '#1E3A8A', saveTag: 'Custom Quote',
                    vol: '5,00,000 Tons', fleet: 'Unlimited', users: 'Unlimited', storage: '1 TB', support: '24/7 SLA',
                    feats: ['5,00,000 Tons/month', 'Unlimited vehicles', 'Unlimited users', 'White-label portal', 'API & integrations', '24/7 SLA support'] 
                  },
                };

                // Find active plan configuration
                const activePlan = plans.find((p: any) => p.id === subscriptionPlanId) || plans[0] || {};
                const activeCfg = cfgMap[activePlan.name] || cfgMap['Starter'];

                // Dynamic width calculation to prevent layout wrapping to vertical on any device sizes
                const SCREEN_W = Dimensions.get('window').width;
                const GRID_CARD_W = (SCREEN_W - 64 - 12) / 2; // Subtract page padding (32 on each side) and grid gap (12)
                const METRIC_BOX_W = (SCREEN_W - 64 - 36 - 12) / 2; // Divide by 2 to place 2 metrics boxes side-by-side

                return (
                  <View style={styles.reviewContainer}>

                    {/* Choose Subscription Plan Header */}
                    <View style={styles.pricingMockupHeader}>
                      <Text style={styles.pricingMockupTitle}>Choose Subscription Plan</Text>
                      <Text style={styles.pricingMockupSubtitle}>Select the plan that works best for you. Upgrade anytime.</Text>
                    </View>

                    {errorMsg ? (
                      <View style={styles.mockupErrorBox}>
                        <Text style={styles.mockupErrorText}>⚠ {errorMsg}</Text>
                      </View>
                    ) : null}

                    {/* Step 1: 2x2 Grid Plan Picker (2 lines) */}
                    <View style={styles.gridContainer2x2}>
                      {plans.map((plan: any) => {
                        const isSelected = subscriptionPlanId === plan.id;
                        const isPopular = plan.name === 'Professional';
                        const cfg = cfgMap[plan.name] || cfgMap['Starter'];

                        return (
                          <TouchableOpacity
                            key={plan.id}
                            onPress={() => setSubscriptionPlanId(plan.id)}
                            style={[
                              styles.gridTabCard,
                              { width: GRID_CARD_W },
                              isSelected && styles.gridTabCardActive
                            ]}
                            activeOpacity={0.85}
                          >
                            <View style={styles.gridTabHeader}>
                              <Ionicons 
                                name={cfg.ionicon as any} 
                                size={22} 
                                color={isSelected ? '#3B82F6' : '#94A3B8'} 
                              />
                              <View style={[
                                styles.checkIndicatorOuter,
                                isSelected && styles.checkIndicatorActive
                              ]}>
                                {isSelected && (
                                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                                )}
                              </View>
                            </View>

                            <Text style={styles.gridTabPlanName}>{plan.name}</Text>
                            <View style={styles.gridTabPriceRow}>
                              <Text style={styles.gridTabPrice}>₹{plan.price_monthly.toLocaleString()}</Text>
                              <Text style={styles.gridTabPriceUnit}>/year</Text>
                            </View>

                            {isPopular && (
                              <View style={styles.badgePopularMockup}>
                                <Text style={styles.badgePopularTextMockup}>Popular</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Step 2: Selected Plan Specification Box */}
                    {activePlan.id ? (
                      <View style={styles.detailsMockupCard}>
                        {/* Header block with plane icon */}
                        <View style={styles.detailsMockupHeader}>
                          <View style={styles.detailsIconBubble}>
                            <Ionicons name={activeCfg.ionicon as any} size={24} color="#3B82F6" />
                          </View>
                          <View style={{ marginLeft: 12, flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <Text style={styles.detailsMockupTitle}>{activePlan.name} Plan</Text>
                              <View style={styles.detailsPillBadge}>
                                <Text style={styles.detailsPillText}>{activeCfg.tag}</Text>
                              </View>
                            </View>
                            <Text style={styles.detailsMockupSubtitleText}>Everything you need to get started and grow.</Text>
                          </View>
                        </View>

                        {/* Large Price Highlight */}
                        <View style={styles.detailsPriceHighlightRow}>
                          <Text style={styles.detailsPriceValue}>₹{activePlan.price_monthly.toLocaleString()}</Text>
                          <Text style={styles.detailsPriceSuffix}>/year</Text>
                          <Text style={styles.detailsSaveTag}>({activeCfg.saveTag})</Text>
                        </View>

                        {/* Two Columns Limits Card Grid (Volume & Fleet) */}
                        <View style={styles.detailsMetricsGrid}>
                          <View style={[styles.detailsMetricBox, { width: METRIC_BOX_W }]}>
                            <View style={styles.metricLabelRow}>
                              <Ionicons name="cube-outline" size={14} color="#94A3B8" />
                              <Text style={styles.detailsMetricLabelText}>Volume</Text>
                            </View>
                            <Text style={styles.detailsMetricValText}>
                              {activePlan.included_tonnage ? activePlan.included_tonnage.toLocaleString() + ' Tons' : activeCfg.vol}
                            </Text>
                          </View>

                          <View style={[styles.detailsMetricBox, { width: METRIC_BOX_W }]}>
                            <View style={styles.metricLabelRow}>
                              <Ionicons name="bus-outline" size={14} color="#94A3B8" />
                              <Text style={styles.detailsMetricLabelText}>Fleet Limit</Text>
                            </View>
                            <Text style={styles.detailsMetricValText}>
                              {activePlan.included_equipment === -1 ? 'Unlimited' : (activePlan.included_equipment ? activePlan.included_equipment.toLocaleString() + ' Equip' : activeCfg.fleet + ' Equip')}
                            </Text>
                          </View>
                        </View>

                        {/* Included Features Section */}
                        <Text style={styles.mockupFeaturesLabel}>What's included in {activePlan.name} Plan</Text>
                        <View style={styles.mockupFeaturesList}>
                          {activeCfg.feats.map((feat, index) => (
                            <View key={index} style={styles.mockupFeatureRowItem}>
                              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                              <Text style={styles.mockupFeatureTextItem}>{feat}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ) : null}

                    {/* Step 3: Accordion Detail Information */}
                    <View style={styles.infoAccordionCard}>
                      <View style={styles.infoAccordionHeader}>
                        <Ionicons name="information-circle" size={18} color="#1D4ED8" />
                        <Text style={styles.infoAccordionHeaderText}>Plan Details & Additional Information</Text>
                      </View>

                      <View style={styles.infoAccordionBody}>
                        <View style={styles.accordionColumnsRow}>
                          
                          {/* Left Column: Billing Information */}
                          <View style={styles.accordionColumn}>
                            <Text style={styles.infoBlockHeading}>Billing Info</Text>
                            
                            <View style={styles.infoRowItem}>
                              <Text style={styles.infoRowLabel}>Cycle</Text>
                              <Text style={styles.infoRowValue}>Annually</Text>
                            </View>
                            <View style={styles.infoRowItem}>
                              <Text style={styles.infoRowLabel}>Method</Text>
                              <Text style={styles.infoRowValue}>Card</Text>
                            </View>
                            <View style={styles.infoRowItem}>
                              <Text style={styles.infoRowLabel}>Next Date</Text>
                              <Text style={styles.infoRowValue}>12 Oct 2026</Text>
                            </View>
                            <View style={styles.infoRowItem}>
                              <Text style={styles.infoRowLabel}>Amount</Text>
                              <Text style={[styles.infoRowValue, { color: '#1D4ED8', fontWeight: 'bold' }]}>
                                ₹{activePlan.price_monthly ? activePlan.price_monthly.toLocaleString() : '0'}
                              </Text>
                            </View>
                          </View>

                          {/* Vertical Column Divider */}
                          <View style={styles.accordionVerticalDivider} />

                          {/* Right Column: Additional Information */}
                          <View style={styles.accordionColumn}>
                            <Text style={styles.infoBlockHeading}>Additional Info</Text>

                            <View style={styles.infoRowItem}>
                              <Text style={styles.infoRowLabel}>Renewal</Text>
                              <Text style={styles.infoRowValue}>Auto</Text>
                            </View>
                            <View style={styles.infoRowItem}>
                              <Text style={styles.infoRowLabel}>Owner</Text>
                              <Text style={styles.infoRowValue}>Admin</Text>
                            </View>
                            <View style={styles.infoRowItem}>
                              <Text style={styles.infoRowLabel}>Plan ID</Text>
                              <Text style={styles.infoRowValue} numberOfLines={1}>PLAN-{activePlan.name ? activePlan.name.toUpperCase().substring(0, 3) : 'STR'}</Text>
                            </View>
                            <View style={styles.infoRowItem}>
                              <Text style={styles.infoRowLabel}>Help?</Text>
                              <Text style={[styles.infoRowValue, { color: '#1D4ED8', textDecorationLine: 'underline', fontSize: 10 }]} numberOfLines={1}>
                                support
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Terms */}
                    <TouchableOpacity
                      style={styles.termsContainer}
                      onPress={() => setTermsAccepted(!termsAccepted)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.checkbox, termsAccepted && styles.checkboxActive]}>
                        {termsAccepted && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                      </View>
                      <Text style={styles.termsText}>
                        I agree to the <Text style={styles.termsLink}>Terms &amp; Conditions</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>. <Text style={styles.asterisk}>*</Text>
                      </Text>
                    </TouchableOpacity>

                  </View>
                );
              })()}


            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* FOOTER */}
      <View style={styles.bottomContainer}>
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.footerBtn, step === 1 && styles.footerBtnDisabled]}
            onPress={prevStep}
            disabled={step === 1}
          >
            <Text style={[styles.footerBtnText, step === 1 && styles.footerBtnTextDisabled]}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryBtn, isSubmitting && { opacity: 0.7 }]}
            onPress={step === 3 ? finishRegistration : nextStep}
            disabled={isSubmitting}
          >
            <Text style={styles.primaryBtnText}>{isSubmitting ? 'Submitting...' : step === 3 ? 'Complete' : 'Continue'}</Text>
            {!isSubmitting && step !== 3 ? <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} /> : null}
          </TouchableOpacity>
        </View>


      </View>

    </SafeAreaView>
  );
}

const StepIndicator = ({ currentStep, stepNumber, label }: any) => {
  const isCompleted = currentStep > stepNumber;
  const isActive = currentStep === stepNumber;

  return (
    <View style={styles.stepIndicatorWrapper}>
      <View style={[
        styles.stepCircle,
        isActive ? styles.stepCircleActive :
          isCompleted ? styles.stepCircleCompleted : styles.stepCircleInactive
      ]}>
        {isCompleted ? (
          <Text style={[styles.stepNumber, { color: '#1E3A8A' }]}>{stepNumber}</Text>
        ) : (
          <Text style={[
            styles.stepNumber,
            isActive ? styles.stepNumberActive : styles.stepNumberInactive
          ]}>{stepNumber}</Text>
        )}
      </View>
      <Text style={[
        styles.stepLabel,
        (isActive || isCompleted) ? styles.stepLabelActive : styles.stepLabelInactive
      ]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1E3A8A',
  },
  progressContainer: {
    paddingHorizontal: 40,
    paddingVertical: 20,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  progressTrack: {
    height: 2,
    backgroundColor: '#E2E8F0',
    position: 'absolute',
    top: 38,
    left: 65,
    right: 65,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0B46CD',
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepIndicatorWrapper: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  stepCircleActive: {
    borderColor: '#0B46CD',
    backgroundColor: '#0B46CD',
  },
  stepCircleCompleted: {
    borderColor: '#0B46CD',
    backgroundColor: '#0B46CD',
  },
  stepCircleInactive: {
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepNumberInactive: {
    color: '#94A3B8',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: '#0B46CD',
    fontWeight: '700',
  },
  stepLabelInactive: {
    color: '#94A3B8',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  stepContainer: {
    width: '100%',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepTitleBox: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 2,
  },
  stepSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#334155',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  asterisk: {
    color: '#EF4444',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
  },
  inputIcon: {
    paddingLeft: 14,
    paddingRight: 8,
  },
  inputText: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 14,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
  },
  pickerMock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingRight: 14,
  },
  pickerText: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
  },
  placeholderText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0F2FE',
    marginTop: 8,
    marginBottom: 10,
  },
  infoBoxTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  infoBoxText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  comingSoonContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  reviewContainer: {
    paddingVertical: 10,
  },

  /* ── Mockup Pricing Header ── */
  pricingMockupHeader: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  pricingMockupTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  pricingMockupSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 12,
    lineHeight: 18,
  },
  mockupErrorBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  mockupErrorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },

  gridContainer2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  gridTabCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 110,
    marginBottom: 12,
  },
  gridTabCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  gridTabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkIndicatorOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkIndicatorActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  gridTabPlanName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  gridTabPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  gridTabPrice: {
    fontSize: 15,
    fontWeight: '900',
    color: '#2563EB',
  },
  gridTabPriceUnit: {
    fontSize: 11,
    color: '#64748B',
    marginLeft: 2,
    fontWeight: '600',
  },
  badgePopularMockup: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderTopLeftRadius: 8,
  },
  badgePopularTextMockup: {
    fontSize: 8,
    fontWeight: '900',
    color: '#1E40AF',
    textTransform: 'uppercase',
  },

  /* ── Selected Plan Specifications Card ── */
  detailsMockupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 18,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  detailsMockupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailsIconBubble: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsMockupTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  detailsPillBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  detailsPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2563EB',
  },
  detailsMockupSubtitleText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  detailsPriceHighlightRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 20,
  },
  detailsPriceValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  detailsPriceSuffix: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 4,
    fontWeight: '600',
  },
  detailsSaveTag: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '800',
    marginLeft: 8,
  },
  detailsMetricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 20,
  },
  detailsMetricBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 4,
  },
  detailsMetricLabelText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94A3B8',
  },
  detailsMetricValText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 20,
  },
  mockupFeaturesLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#334155',
    marginBottom: 12,
  },
  mockupFeaturesList: {
    gap: 10,
  },
  mockupFeatureRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mockupFeatureTextItem: {
    fontSize: 12.5,
    color: '#475569',
    fontWeight: '600',
    flex: 1,
  },

  /* ── Plan Details Accordion ── */
  infoAccordionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  infoAccordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: '#DBEAFE',
  },
  infoAccordionHeaderText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1E3A8A',
    marginLeft: 8,
    letterSpacing: 0.2,
  },
  infoAccordionBody: {
    padding: 16,
  },
  infoBlockHeading: {
    fontSize: 11,
    fontWeight: '900',
    color: '#2563EB',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  infoRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoRowLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  infoRowValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'right',
  },
  accordionColumnsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  accordionColumn: {
    flex: 1,
  },
  accordionVerticalDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },


  /* ── Kept for other steps ── */
  reviewContainer: {
    paddingVertical: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  reviewHeaderIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  reviewSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  reviewBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
  },
  reviewSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 12,
    marginTop: 8,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  reviewValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  reviewValueHighlight: {
    color: '#1D4ED8',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },

  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  termsLink: {
    color: '#1E3A8A',
    fontWeight: '700',
  },
  bottomContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 16,
    paddingBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  secureFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    paddingTop: 12,
    backgroundColor: '#F8FAFC',
  },
  secureText: {
    fontSize: 11,
    color: '#64748B',
  },
  stepFooterText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  footerBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  footerBtnDisabled: {
    opacity: 0.5,
  },
  footerBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  footerBtnTextDisabled: {
    color: '#94A3B8',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B46CD',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  modalItemText: {
    fontSize: 15,
    color: '#334155',
  },
  inlineDropdown: {
    backgroundColor: '#F8FAFC',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    maxHeight: 180,
  },
  inlineDropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  inlineDropdownText: {
    fontSize: 13,
    color: '#334155',
  },
  logoUploadContainer: {
    marginBottom: 24,
  },
  logoUploadBtn: {
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
  },
  logoPlaceholder: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoUploadText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  logoUploadSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748b',
  },
  logoUploadedText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10b981',
  }
});