import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, User, Globe, Map, MapPin, Info, Users, Briefcase, UploadCloud, Eye, EyeOff, Send, Shield, Gem, HelpCircle, Check, Phone, Mail, AlertCircle } from 'lucide-react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import type { ConfirmationResult } from 'firebase/auth';
import { useAuth } from '../../../context/AuthContext';
import { auth } from '../../../lib/firebase';
export default function RegistrationWizard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [step, setStep] = useState(1);
  // Step 1 State
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [customIndustry, setCustomIndustry] = useState('');
  const [country, setCountry] = useState('India');

  const INDUSTRIES = [
    'Logistics',
    'Mining',
    'Port Operations',
    'Rail Logistics',
    'EPC / Infrastructure',
    'Construction',
    'Manufacturing'
  ];
  const [state, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCompanyLogo(URL.createObjectURL(file));
    }
  };
  // Step 2 State
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  // 2FA Auth State for Step 2
  const [isMobileVerified, setIsMobileVerified] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(true);
  const [mobileOtp, setMobileOtp] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [showMobileOtp, setShowMobileOtp] = useState(false);
  const [showEmailOtp, setShowEmailOtp] = useState(false);
  const [mobileConfirmationResult, setMobileConfirmationResult] = useState<ConfirmationResult | null>(null);
  // Step 3 State
  const [plans, setPlans] = useState<any[]>([]);
  const [subscriptionPlanId, setSubscriptionPlanId] = useState<number | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [startFreeTrial, setStartFreeTrial] = useState(true); // Default to true as a 14-days free trial option for all plans
  const [billingCycleMonths, setBillingCycleMonths] = useState<number>(12);
  // Dynamic Fields Config States
  const [formConfig, setFormConfig] = useState<any[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const isFieldVisible = (key: string) => {
    const cfg = formConfig.find(f => f.fieldKey === key);
    return cfg ? !cfg.isHidden : true;
  };
  const isFieldRequired = (key: string) => {
    const cfg = formConfig.find(f => f.fieldKey === key);
    return cfg ? cfg.isRequired : false;
  };
  React.useEffect(() => {
    // Fetch dynamic field configurations for registration
    fetch('http://localhost:5000/api/admin/form-config/registration')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setFormConfig(data);
      })
      .catch(err => console.error('Failed to fetch registration form config', err));

    // Fetch subscription plans
    fetch('http://localhost:5000/api/plans')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setPlans(data);
      })
      .catch(err => console.error('Failed to fetch plans', err));

    if (currentUser) {
      if (currentUser.email) {
        setEmail(currentUser.email);
        setIsEmailVerified(true);
      }
      fetch(`http://localhost:5000/api/tenant/status/${currentUser.uid}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === 'draft' && data.data) {
            const d = data.data;
            if (d.companyName) setCompanyName(d.companyName);
            if (d.companyAddress) setCompanyAddress(d.companyAddress);
            if (d.industryType) {
              if (INDUSTRIES.includes(d.industryType)) {
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
            if (d.customFieldValues) setCustomFieldValues(d.customFieldValues);
            
            // Always start at Step 1 for a clean registration flow
            setStep(1);
          }
        })
        .catch(err => console.error('Failed to fetch draft', err));
    }
  }, [currentUser]);

  const saveDraft = async (currentStep: number) => {
    if (!currentUser) return;
    try {
      await fetch(`http://localhost:5000/api/tenant/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUid: currentUser.uid,
          step: currentStep,
          draftData: {
            companyName,
            companyAddress,
            industryType: selectedIndustry === 'Other' ? customIndustry : selectedIndustry,
            country, state, pincode, city, companySize, companyWebsite,
            gstNumber, panNumber, msmeNumber, adminName, designation, mobile, email, subdomain,
            customFieldValues
          }
        })
      });
    } catch (e) {
      console.error('Failed to save draft:', e);
    }
  };

  const initRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'reg-recaptcha-container', {
          'size': 'invisible'
        });
      } catch (e) {
        console.error("Failed to init Recaptcha:", e);
      }
    }
  };

  const handleSendMobileOtp = async () => {
    if (mobile.length < 10) { setErrorMsg('Invalid mobile number'); return; }
    setErrorMsg('');
    try {
      initRecaptcha();
      const formattedNum = `+91${mobile}`;
      const confirmation = await signInWithPhoneNumber(auth, formattedNum, window.recaptchaVerifier);
      setMobileConfirmationResult(confirmation);
      setShowMobileOtp(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send Mobile OTP');
    }
  };

  const handleVerifyMobileOtp = async () => {
    if (!mobileOtp) {
      setFieldErrors(prev => ({ ...prev, mobileOtp: 'Please enter 6-digit Mobile OTP' }));
      return;
    }
    try {
      await mobileConfirmationResult?.confirm(mobileOtp);
      setIsMobileVerified(true);
      setShowMobileOtp(false);
      setErrorMsg('');
      setFieldErrors(prev => ({ ...prev, mobileOtp: '', mobile: '' }));
    } catch (err: any) {
      if (import.meta.env.DEV || window.location.hostname === 'localhost') {
        console.warn("Mobile verification failed in RegistrationWizard. Bypassing in dev:", err.message);
        setIsMobileVerified(true);
        setShowMobileOtp(false);
        setErrorMsg('');
        setFieldErrors(prev => ({ ...prev, mobileOtp: '', mobile: '' }));
        return;
      }
      const msg = 'Invalid Mobile OTP. Please check the code and try again.';
      setErrorMsg(msg);
      setFieldErrors(prev => ({ ...prev, mobileOtp: msg }));
    }
  };

  const handleSendEmailOtp = async () => {
    if (!email) { setErrorMsg('Invalid email'); return; }
    setErrorMsg('');
    try {
      const res = await fetch(`http://localhost:5000/api/auth/send-email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!res.ok) throw new Error('Failed to send email OTP');
      setShowEmailOtp(true);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtp) {
      setFieldErrors(prev => ({ ...prev, emailOtp: 'Please enter 6-digit Email OTP' }));
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/auth/verify-email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: emailOtp })
      });
      if (!res.ok) throw new Error('Invalid Email OTP');
      setIsEmailVerified(true);
      setShowEmailOtp(false);
      setErrorMsg('');
      setFieldErrors(prev => ({ ...prev, emailOtp: '', email: '' }));
    } catch (err: any) {
      const msg = 'Invalid Email OTP. Please check the 6-digit code and try again.';
      setErrorMsg(msg);
      setFieldErrors(prev => ({ ...prev, emailOtp: msg }));
    }
  };

  const nextStep = () => {
    setErrorMsg('');
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (isFieldVisible('companyName') && !companyName.trim()) {
        newErrors.companyName = 'Company Name is required';
      }
      if (isFieldVisible('companyAddress') && !companyAddress.trim()) {
        newErrors.companyAddress = 'Company Address is required';
      }
      if (isFieldVisible('industryType') && (!selectedIndustry || (selectedIndustry === 'Other' && !customIndustry.trim()))) {
        newErrors.industryType = 'Industry Type is required';
      }
      if (isFieldVisible('pincode') && !pincode.trim()) {
        newErrors.pincode = 'Pincode is required';
      }
      if (isFieldVisible('state') && !state.trim()) {
        newErrors.state = 'State is required';
      }
      if (isFieldVisible('city') && !city.trim()) {
        newErrors.city = 'City is required';
      }
      if (isFieldVisible('gstNumber') && isFieldRequired('gstNumber') && !gstNumber.trim()) {
        newErrors.gstNumber = 'GST Number is required';
      }
      if (isFieldVisible('panNumber') && isFieldRequired('panNumber') && !panNumber.trim()) {
        newErrors.panNumber = 'PAN Number is required';
      }

      setFieldErrors(newErrors);
      if (Object.keys(newErrors).length > 0) {
        setErrorMsg('Please fill in all mandatory fields highlighted below before proceeding.');
        return;
      }
    } else if (step === 2) {
      if (isFieldVisible('adminName') && !adminName.trim()) {
        newErrors.adminName = 'Full Name is required';
      }
      if (isFieldVisible('mobile')) {
        if (!mobile.trim()) {
          newErrors.mobile = 'Mobile Number is required';
        } else if (!isMobileVerified) {
          newErrors.mobile = 'Please verify Mobile Number with OTP';
        }
      }
      if (isFieldVisible('email')) {
        if (!email.trim()) {
          newErrors.email = 'Email Address is required';
        } else if (!isEmailVerified) {
          newErrors.email = 'Please verify Email Address with OTP';
        }
      }

      // Validate Custom Fields
      const customFields = formConfig.filter(f => !f.isDefault && !f.isHidden);
      for (const cf of customFields) {
        const val = customFieldValues[cf.fieldKey];
        if (cf.isRequired && (!val || !val.trim())) {
          newErrors[cf.fieldKey] = `${cf.fieldLabel} is required`;
        }
      }

      setFieldErrors(newErrors);
      if (Object.keys(newErrors).length > 0) {
        setErrorMsg('Please fill in all mandatory fields and complete 2FA verification before proceeding.');
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

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
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

    const activePlan = plans.find(p => p.id === subscriptionPlanId) || {};

    try {
      if (startFreeTrial) {
        // 1. FREE TRIAL FLOW - No Razorpay checkouts, directly hit backend register with startFreeTrial: true
        const res = await fetch('http://localhost:5000/api/tenant/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firebaseUid: currentUser?.uid,
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
            subdomain,
            startFreeTrial: true,
            customFields: customFieldValues
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Trial registration failed');
        navigate('/tenant/dashboard');
      } else {
        // 2. PAID CHECKOUT FLOW - Create Razorpay order first
        const orderRes = await fetch('http://localhost:5000/api/payment/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: activePlan.price_monthly })
        });
        const orderData = await orderRes.json();
        if (!orderRes.ok) throw new Error(orderData.error || 'Failed to initialize payment order');

        // Load SDK
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
        }

        const options = {
          key: 'rzp_test_TDMPnPm4wjZUET',
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'InfraOps360',
          description: `${activePlan.name || 'Subscription'} Plan`,
          order_id: orderData.id,
          handler: async (response: any) => {
            try {
              setIsSubmitting(true);
              const registerRes = await fetch('http://localhost:5000/api/tenant/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  firebaseUid: currentUser?.uid,
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
                  subdomain,
                  startFreeTrial: false,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  customFields: customFieldValues
                })
              });
              const registerData = await registerRes.json();
              if (!registerRes.ok) throw new Error(registerData.error || 'Payment registration failed');
              navigate('/tenant/dashboard');
            } catch (err: any) {
              setErrorMsg(err.message);
              setIsSubmitting(false);
            }
          },
          prefill: {
            name: adminName,
            email: email,
            contact: mobile
          },
          theme: {
            color: '#1E3A8A'
          },
          modal: {
            ondismiss: () => {
              setIsSubmitting(false);
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (err: any) {
      setErrorMsg(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-full bg-white pb-16">
      {/* PAGE CONTAINER */}
      <div className={`mx-auto px-4 pt-6 transition-all duration-300 ${step === 3 ? 'max-w-[1400px]' : 'max-w-6xl'}`}>
        {/* BACK TO DASHBOARD LINK */}
        <button
          onClick={() => navigate('/tenant/dashboard')}
          className="inline-flex items-center text-slate-500 hover:text-slate-900 font-medium text-xs mb-3 transition-colors gap-1.5"
        >
          <ArrowLeft size={14} />
          Back to Dashboard
        </button>

        {/* TITLE & SUBTITLE */}
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Company Registration</h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">Create your organization workspace and invite your first administrator.</p>

        {/* STEPPER PROGRESS BAR */}
        <div className="my-8 flex items-center justify-center">
          <div className="flex items-center w-full max-w-xl justify-between relative">
            {/* STEP 1 */}
            <div className="flex items-center space-x-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-sm ${step > 1 ? 'bg-emerald-600 text-white' : step === 1 ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                {step > 1 ? <Check size={18} strokeWidth={2.5} /> : '1'}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900">Company</span>
                <span className={`text-[11px] font-medium ${step > 1 ? 'text-emerald-600 font-semibold' : step === 1 ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}>
                  {step > 1 ? 'Completed' : step === 1 ? 'In Progress' : 'Pending'}
                </span>
              </div>
            </div>

            {/* LINE 1-2 */}
            <div className={`flex-1 h-0.5 mx-4 transition-colors ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>

            {/* STEP 2 */}
            <div className="flex items-center space-x-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-sm ${step > 2 ? 'bg-emerald-600 text-white' : step === 2 ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                {step > 2 ? <Check size={18} strokeWidth={2.5} /> : '2'}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900">Administrator</span>
                <span className={`text-[11px] font-medium ${step > 2 ? 'text-emerald-600 font-semibold' : step === 2 ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}>
                  {step > 2 ? 'Completed' : step === 2 ? 'In Progress' : 'Pending'}
                </span>
              </div>
            </div>

            {/* LINE 2-3 */}
            <div className={`flex-1 h-0.5 mx-4 transition-colors ${step >= 3 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>

            {/* STEP 3 */}
            <div className="flex items-center space-x-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-sm ${step === 3 ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                3
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900">Review</span>
                <span className={`text-[11px] font-medium ${step === 3 ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}>
                  {step === 3 ? 'In Progress' : 'Pending'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* FORM CARD */}
        <div className={step === 3 ? '' : 'bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8'}>
          <div>

            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-500 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
                <button type="button" onClick={() => setErrorMsg('')} className="text-red-400 hover:text-red-600 font-bold ml-2">✕</button>
              </div>
            )}

              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mr-4">
                      <Building2 size={24} className="text-[#1E3A8A]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900">Company Profile</h2>
                      <p className="text-sm text-slate-500">Complete your company profile to create your tenant.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {isFieldVisible('companyName') && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2">Company Name <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                            <Building2 size={18} />
                          </div>
                          <input
                            type="text"
                            value={companyName}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCompanyName(val);
                              setSubdomain(val.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 30));
                              setFieldErrors(prev => ({ ...prev, companyName: '' }));
                            }}
                            placeholder="e.g. ABC Logistics Pvt Ltd"
                            className={`w-full pl-11 pr-4 py-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] transition-all font-medium text-slate-800 placeholder-slate-400 text-sm ${fieldErrors.companyName ? 'border-red-400 ring-1 ring-red-200' : 'border-slate-200'}`}
                          />
                        </div>
                        {fieldErrors.companyName && (
                          <p className="text-xs text-red-500 font-semibold mt-1 flex items-center gap-1">
                            ⚠ {fieldErrors.companyName}
                          </p>
                        )}
                      </div>
                    )}

                    {isFieldVisible('companyAddress') && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2">Company Address <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                            <MapPin size={18} />
                          </div>
                          <input
                            type="text"
                            value={companyAddress}
                            onChange={(e) => {
                              setCompanyAddress(e.target.value);
                              setFieldErrors(prev => ({ ...prev, companyAddress: '' }));
                            }}
                            placeholder="e.g. 123 Tech Park, 4th Avenue"
                            className={`w-full pl-11 pr-4 py-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] transition-all font-medium text-slate-800 placeholder-slate-400 text-sm ${fieldErrors.companyAddress ? 'border-red-400 ring-1 ring-red-200' : 'border-slate-200'}`}
                          />
                        </div>
                        {fieldErrors.companyAddress && (
                          <p className="text-xs text-red-500 font-semibold mt-1 flex items-center gap-1">
                            ⚠ {fieldErrors.companyAddress}
                          </p>
                        )}
                      </div>
                    )}

                    {(isFieldVisible('gstNumber') || isFieldVisible('panNumber')) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {isFieldVisible('gstNumber') && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2">GST Number {isFieldRequired('gstNumber') ? <span className="text-red-500">*</span> : '(Optional)'}</label>
                            <input
                              type="text"
                              value={gstNumber}
                              onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                              placeholder="e.g. 27AAAAA1111A1Z1"
                              className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition-all font-medium text-slate-800 placeholder-slate-400 text-sm"
                            />
                          </div>
                        )}
                        {isFieldVisible('panNumber') && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2">PAN Number {isFieldRequired('panNumber') ? <span className="text-red-500">*</span> : '(Optional)'}</label>
                            <input
                              type="text"
                              value={panNumber}
                              onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                              placeholder="e.g. ABCDE1234F"
                              maxLength={10}
                              className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition-all font-medium text-slate-800 placeholder-slate-400 text-sm"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {(isFieldVisible('msmeNumber') || isFieldVisible('companyLogo')) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {isFieldVisible('msmeNumber') && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2">MSME Registration No {isFieldRequired('msmeNumber') ? <span className="text-red-500">*</span> : '(Optional)'}</label>
                            <input
                              type="text"
                              value={msmeNumber}
                              onChange={(e) => setMsmeNumber(e.target.value)}
                              placeholder="e.g. UDYAM-XX-00-0000000"
                              className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition-all font-medium text-slate-800 placeholder-slate-400 text-sm"
                            />
                          </div>
                        )}
                        {isFieldVisible('companyLogo') && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2">Company Logo (Optional)</label>
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                {companyLogo ? (
                                  <img src={companyLogo} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                  <Building2 size={20} className="text-slate-300" />
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors"
                              >
                                Upload Logo
                              </button>
                              <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept="image/*"
                                className="hidden"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <hr className="border-slate-100 my-4" />

                    {(isFieldVisible('industryType') || isFieldVisible('pincode')) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {isFieldVisible('industryType') && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2">Industry Type <span className="text-red-500">*</span></label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                <Briefcase size={18} />
                              </div>
                              <select
                                value={selectedIndustry}
                                onChange={(e) => {
                                  setSelectedIndustry(e.target.value);
                                  setFieldErrors(prev => ({ ...prev, industryType: '' }));
                                }}
                                className={`w-full pl-11 pr-10 py-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] transition-all font-medium text-slate-800 appearance-none text-sm ${fieldErrors.industryType ? 'border-red-400 ring-1 ring-red-200' : 'border-slate-200'}`}
                              >
                                <option value="">Select Industry</option>
                                {INDUSTRIES.map(ind => (
                                  <option key={ind} value={ind}>{ind}</option>
                                ))}
                                <option value="Other">Other</option>
                              </select>
                            </div>
                            {fieldErrors.industryType && (
                              <p className="text-xs text-red-500 font-semibold mt-1 flex items-center gap-1">
                                ⚠ {fieldErrors.industryType}
                              </p>
                            )}

                            {selectedIndustry === 'Other' && (
                              <div className="mt-3 relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                  <Briefcase size={18} />
                                </div>
                                <input
                                  type="text"
                                  value={customIndustry}
                                  onChange={(e) => {
                                    setCustomIndustry(e.target.value);
                                    setFieldErrors(prev => ({ ...prev, industryType: '' }));
                                  }}
                                  placeholder="Please specify your industry"
                                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition-all font-medium text-slate-800 placeholder-slate-400 text-sm"
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {isFieldVisible('pincode') && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2">Pincode / Zip <span className="text-red-500">*</span></label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                <MapPin size={18} />
                              </div>
                              <input
                                type="text"
                                value={pincode}
                                onChange={(e) => {
                                  handlePincodeChange(e.target.value);
                                  setFieldErrors(prev => ({ ...prev, pincode: '' }));
                                }}
                                placeholder="e.g. 400001"
                                maxLength={6}
                                className={`w-full pl-11 pr-4 py-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] transition-all font-medium text-slate-800 placeholder-slate-400 text-sm ${fieldErrors.pincode ? 'border-red-400 ring-1 ring-red-200' : 'border-slate-200'}`}
                              />
                            </div>
                            {fieldErrors.pincode && (
                              <p className="text-xs text-red-500 font-semibold mt-1 flex items-center gap-1">
                                ⚠ {fieldErrors.pincode}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {(isFieldVisible('country') || isFieldVisible('state') || isFieldVisible('city')) && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {isFieldVisible('country') && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2">Country {isFieldRequired('country') ? <span className="text-red-500">*</span> : '(Optional)'}</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                <Globe size={18} />
                              </div>
                              <select
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition-all font-medium text-slate-800 appearance-none text-sm"
                              >
                                <option value="" disabled>Select country</option>
                                <option value="United States">United States</option>
                                <option value="United Kingdom">United Kingdom</option>
                                <option value="India">India</option>
                                <option value="Australia">Australia</option>
                              </select>
                            </div>
                          </div>
                        )}

                        {isFieldVisible('state') && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2">State / Province <span className="text-red-500">*</span></label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                <Map size={18} />
                              </div>
                              <input
                                type="text"
                                value={state}
                                onChange={(e) => {
                                  setStateName(e.target.value);
                                  setFieldErrors(prev => ({ ...prev, state: '' }));
                                }}
                                placeholder="e.g. Maharashtra"
                                className={`w-full pl-11 pr-4 py-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] transition-all font-medium text-slate-800 placeholder-slate-400 text-sm ${fieldErrors.state ? 'border-red-400 ring-1 ring-red-200' : 'border-slate-200'}`}
                              />
                            </div>
                            {fieldErrors.state && (
                              <p className="text-xs text-red-500 font-semibold mt-1 flex items-center gap-1">
                                ⚠ {fieldErrors.state}
                              </p>
                            )}
                          </div>
                        )}
                        {isFieldVisible('city') && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2">City <span className="text-red-500">*</span></label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                <MapPin size={18} />
                              </div>
                              <input
                                type="text"
                                value={city}
                                onChange={(e) => {
                                  setCity(e.target.value);
                                  setFieldErrors(prev => ({ ...prev, city: '' }));
                                }}
                                placeholder="e.g. Mumbai"
                                className={`w-full pl-11 pr-4 py-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] transition-all font-medium text-slate-800 placeholder-slate-400 text-sm ${fieldErrors.city ? 'border-red-400 ring-1 ring-red-200' : 'border-slate-200'}`}
                              />
                            </div>
                            {fieldErrors.city && (
                              <p className="text-xs text-red-500 font-semibold mt-1 flex items-center gap-1">
                                ⚠ {fieldErrors.city}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex space-x-3 mt-2">
                      <Info size={20} className="text-[#1E3A8A] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-[#1E3A8A] text-sm">Onboarding Note</h4>
                        <p className="text-xs text-[#1E3A8A]/80 mt-1 leading-relaxed">Everything else (GST, PAN, fleet, workflows, etc.) can be configured later through the onboarding wizard after login.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center mb-6 pb-4 border-b border-slate-100">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mr-4 shrink-0">
                      <User size={22} />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900">Administrator Details</h2>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">Set up the primary administrator for this workspace.</p>
                    </div>
                  </div>
                  <div id="reg-recaptcha-container"></div>

                  {(isFieldVisible('adminName') || isFieldVisible('designation')) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {isFieldVisible('adminName') && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Full Name <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                              <User size={18} />
                            </div>
                            <input
                              type="text"
                              value={adminName}
                              onChange={(e) => {
                                setAdminName(e.target.value);
                                setFieldErrors(prev => ({ ...prev, adminName: '' }));
                              }}
                              placeholder="Usha"
                              className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.adminName ? 'border-red-400 ring-1 ring-red-200' : 'border-slate-200'}`}
                            />
                          </div>
                          {fieldErrors.adminName && (
                            <p className="text-xs text-red-500 font-semibold mt-1 flex items-center gap-1">
                              ⚠ {fieldErrors.adminName}
                            </p>
                          )}
                        </div>
                      )}
                      {isFieldVisible('designation') && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Designation</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                              <Briefcase size={18} />
                            </div>
                            <input
                              type="text"
                              value={designation}
                              onChange={(e) => setDesignation(e.target.value)}
                              placeholder="e.g. Operations Manager"
                              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {(isFieldVisible('mobile') || isFieldVisible('email')) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                      {isFieldVisible('mobile') && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Mobile Number <span className="text-red-500">*</span>
                          </label>
                          <div className="relative flex items-center">
                            <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                              <Phone size={18} />
                            </div>
                            <input
                              type="tel"
                              value={mobile}
                              onChange={(e) => {
                                setMobile(e.target.value);
                                setFieldErrors(prev => ({ ...prev, mobile: '' }));
                              }}
                              disabled={isMobileVerified || showMobileOtp}
                              placeholder="e.g. 9876543210"
                              className={`w-full pl-10 pr-10 py-3 bg-white border rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 ${fieldErrors.mobile ? 'border-red-400 ring-1 ring-red-200' : 'border-slate-200'}`}
                            />
                            {!isMobileVerified && !showMobileOtp && (
                              <button type="button" onClick={handleSendMobileOtp} className="absolute right-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors">
                                Verify
                              </button>
                            )}
                          </div>

                          {fieldErrors.mobile && !isMobileVerified && (
                            <p className="text-xs text-red-500 font-semibold mt-1 flex items-center gap-1">
                              ⚠ {fieldErrors.mobile}
                            </p>
                          )}
                          {showMobileOtp && !isMobileVerified && (
                            <div className="mt-2 space-y-1">
                              <div className="flex space-x-2 items-center">
                                <input
                                  type="text"
                                  value={mobileOtp}
                                  onChange={(e) => {
                                    setMobileOtp(e.target.value);
                                    setFieldErrors(prev => ({ ...prev, mobileOtp: '' }));
                                  }}
                                  placeholder="Enter 6-digit OTP"
                                  maxLength={6}
                                  className={`flex-1 min-w-0 px-3 py-2 bg-white border rounded-xl text-sm font-medium ${fieldErrors.mobileOtp ? 'border-red-400 ring-1 ring-red-200' : 'border-slate-200'}`}
                                />
                                <button type="button" onClick={handleVerifyMobileOtp} className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700">
                                  Confirm
                                </button>
                              </div>
                              {fieldErrors.mobileOtp && (
                                <p className="text-xs text-red-500 font-semibold flex items-center gap-1">
                                  ⚠ {fieldErrors.mobileOtp}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {isFieldVisible('email') && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Email Address <span className="text-red-500">*</span>
                          </label>
                          <div className="relative flex items-center">
                            <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                              <Mail size={18} />
                            </div>
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => {
                                setEmail(e.target.value);
                                setFieldErrors(prev => ({ ...prev, email: '' }));
                              }}
                              disabled={isEmailVerified || showEmailOtp}
                              placeholder="shaiksalman9951@gmail.com"
                              className={`w-full pl-10 pr-10 py-3 bg-white border rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 ${fieldErrors.email ? 'border-red-400 ring-1 ring-red-200' : 'border-slate-200'}`}
                            />
                            {!isEmailVerified && !showEmailOtp && (
                              <button type="button" onClick={handleSendEmailOtp} className="absolute right-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors">
                                Verify
                              </button>
                            )}
                          </div>

                          {fieldErrors.email && !isEmailVerified && (
                            <p className="text-xs text-red-500 font-semibold mt-1 flex items-center gap-1">
                              ⚠ {fieldErrors.email}
                            </p>
                          )}
                          {showEmailOtp && !isEmailVerified && (
                            <div className="mt-2 space-y-1">
                              <div className="flex space-x-2 items-center">
                                <input
                                  type="text"
                                  value={emailOtp}
                                  onChange={(e) => {
                                    setEmailOtp(e.target.value);
                                    setFieldErrors(prev => ({ ...prev, emailOtp: '' }));
                                  }}
                                  placeholder="Enter 6-digit OTP"
                                  maxLength={6}
                                  className={`flex-1 min-w-0 px-3 py-2 bg-white border rounded-xl text-sm font-medium ${fieldErrors.emailOtp ? 'border-red-400 ring-1 ring-red-200' : 'border-slate-200'}`}
                                />
                                <button type="button" onClick={handleVerifyEmailOtp} className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700">
                                  Confirm
                                </button>
                              </div>
                              {fieldErrors.emailOtp && (
                                <p className="text-xs text-red-500 font-semibold flex items-center gap-1">
                                  ⚠ {fieldErrors.emailOtp}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {isFieldVisible('subdomain') && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Company Subdomain (Optional)
                      </label>
                      <div className={`flex rounded-xl shadow-sm border focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 overflow-hidden bg-white ${fieldErrors.subdomain ? 'border-red-400' : 'border-slate-200'}`}>
                        <div className="pl-3.5 pr-2 flex items-center text-slate-400 bg-white">
                          <Globe size={18} />
                        </div>
                        <input
                          type="text"
                          value={subdomain}
                          onChange={(e) => {
                            setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                            setFieldErrors(prev => ({ ...prev, subdomain: '' }));
                          }}
                          placeholder="e.g. abclogistics"
                          className="w-full py-3 pr-3 text-sm font-medium text-slate-800 focus:outline-none bg-transparent"
                        />
                        <div className="px-4 py-3 bg-slate-50 border-l border-slate-200 text-slate-500 font-semibold text-xs flex items-center shrink-0">
                          .workspace360.com
                        </div>
                      </div>
                      {fieldErrors.subdomain && (
                        <p className="text-xs text-red-500 font-semibold mt-1 flex items-center gap-1">
                          ⚠ {fieldErrors.subdomain}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Render Custom Fields dynamically */}
                  {formConfig.some(f => !f.isDefault && !f.isHidden) && (
                    <div className="pt-4 border-t border-slate-100 mt-4 space-y-4">
                      <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Additional Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {formConfig.filter(f => !f.isDefault && !f.isHidden).map(cf => (
                          <div key={cf.fieldKey}>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                              {cf.fieldLabel} {cf.isRequired && <span className="text-red-500">*</span>}
                            </label>
                            {cf.fieldType === 'dropdown' ? (
                              <select
                                value={customFieldValues[cf.fieldKey] || ''}
                                onChange={(e) => setCustomFieldValues(prev => ({ ...prev, [cf.fieldKey]: e.target.value }))}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition-all font-medium text-sm text-slate-800"
                              >
                                <option value="">Select option</option>
                                {(cf.dropdownOptions || '').split(',').map((opt: string) => {
                                  const trimmed = opt.trim();
                                  return <option key={trimmed} value={trimmed}>{trimmed}</option>;
                                })}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={customFieldValues[cf.fieldKey] || ''}
                                onChange={(e) => setCustomFieldValues(prev => ({ ...prev, [cf.fieldKey]: e.target.value }))}
                                placeholder={`Enter ${cf.fieldLabel}`}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition-all font-medium text-sm text-slate-800"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  
                  {/* Left Column: Pricing Plans Grid (68% width) */}
                  <div className="lg:w-2/3 space-y-6">
                    {/* Section Header */}
                    <div>
                      <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md mb-2">
                        Step 3 of 3
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Choose the right plan for your operations</h2>
                      <p className="text-xs text-slate-500 mt-1 font-medium">Select the subscription tier that best matches your fleet and tonnage needs. Upgrade or downgrade anytime.</p>
                    </div>

                    {errorMsg && (
                      <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold border border-red-200 flex items-center gap-2">
                        <span className="text-red-500">⚠</span> {errorMsg}
                      </div>
                    )}

                    {/* 4 Plan Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                      {plans.map((plan: any) => {
                        const isSelected = subscriptionPlanId === plan.id || (!subscriptionPlanId && plan.name === 'Starter');
                        const isPopular = plan.name === 'Professional';
                        
                        const cfgMap: Record<string, { icon: React.ReactNode; subtitle: string; feats: string[] }> = {
                          Starter: {
                            icon: <Send size={20} className="text-blue-600" />,
                            subtitle: 'Perfect for small fleets',
                            feats: ['2,500 Tons/month', '5 Vehicles', '3 User seats', 'Trip & fuel logs', 'Basic reports', 'Email support']
                          },
                          Professional: {
                            icon: <Briefcase size={20} className="text-indigo-600" />,
                            subtitle: 'Growing businesses',
                            feats: ['25,000 Tons/month', '20 Vehicles', '10 User seats', 'Advanced analytics', 'GPS tracking', 'Priority support']
                          },
                          Enterprise: {
                            icon: <Building2 size={20} className="text-[#1E3A8A]" />,
                            subtitle: 'Large operations',
                            feats: ['1,00,000 Tons/month', '20 Vehicles', '25 User seats', 'Custom workflows', 'Multi-site ops', 'Dedicated manager']
                          },
                          Corporate: {
                            icon: <Gem size={20} className="text-amber-600" />,
                            subtitle: 'Enterprise grade',
                            feats: ['5,00,000 Tons/month', 'Unlimited vehicles', 'Unlimited users', 'White-label portal', 'API & integrations', '24/7 SLA support']
                          },
                        };
                        const cfg = cfgMap[plan.name] || {
                          icon: <Briefcase size={20} className="text-blue-600" />,
                          subtitle: 'Custom Tier',
                          feats: []
                        };

                        return (
                          <div
                            key={plan.id}
                            onClick={() => setSubscriptionPlanId(plan.id)}
                            className={`relative flex flex-col rounded-2xl bg-white cursor-pointer transition-all duration-200 p-5 ${isSelected
                                ? `ring-2 ring-blue-600 border-transparent shadow-lg shadow-blue-600/10`
                                : 'border border-slate-200/80 hover:border-slate-300 hover:shadow-md'
                              }`}
                          >
                            {isPopular && (
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[9px] font-extrabold uppercase tracking-widest px-3 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                                ★ MOST POPULAR
                              </div>
                            )}

                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                              {cfg.icon}
                            </div>

                            <h3 className="text-base font-bold text-slate-900 leading-tight">{plan.name}</h3>
                            <p className="text-[11px] font-medium text-slate-400 mb-4">{cfg.subtitle}</p>

                            <div className="mb-4">
                              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">₹{Number(plan.price_monthly).toLocaleString()}</span>
                              <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">/ month + GST</span>
                            </div>

                            <div className="space-y-2 flex-1 mb-6">
                              {cfg.feats.map((feat, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs font-semibold text-slate-600">
                                  <span className="text-emerald-500 font-bold shrink-0">✓</span>
                                  <span className="leading-snug">{feat}</span>
                                </div>
                              ))}
                            </div>

                            <button
                              type="button"
                              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${isSelected
                                  ? 'bg-blue-50 border-2 border-blue-600 text-blue-600 font-extrabold'
                                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                              {isSelected ? (
                                <>
                                  <Check size={14} className="text-blue-600 stroke-[3]" />
                                  SELECTED
                                </>
                              ) : (
                                'Select Plan'
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Metric definitions bar */}
                    <div className="flex flex-wrap items-center justify-between gap-4 py-3.5 px-5 bg-slate-50/80 rounded-2xl border border-slate-200/60 text-xs text-slate-500 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">🛡️</span>
                        <span><strong className="text-slate-800 font-bold">Volume</strong> <span className="text-slate-400">Monthly freight tonnage limit</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">🚛</span>
                        <span><strong className="text-slate-800 font-bold">Fleet</strong> <span className="text-slate-400">Tracked equipment units</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">👤</span>
                        <span><strong className="text-slate-800 font-bold">Users</strong> <span className="text-slate-400">Included active team logins</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Order Summary Card (32% width) */}
                  <div className="lg:w-1/3">
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-5 shadow-sm">
                      
                      {/* Card Header */}
                      <div>
                        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">ORDER SUMMARY</h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">Review your subscription details and billing cycles.</p>
                      </div>

                      {/* Selected Plan Highlight Box */}
                      {(() => {
                        const selectedPlan = plans.find(p => p.id === subscriptionPlanId) || plans[0] || { name: 'Starter', price_monthly: 2999 };
                        const monthlyBase = Number(selectedPlan.price_monthly || 2999);
                        const basePriceTotal = monthlyBase * billingCycleMonths;
                        const gstTotal = Math.round(basePriceTotal * 0.18);
                        const totalDue = basePriceTotal + gstTotal;
                        const cycleLabel = billingCycleMonths === 12 ? '/ year' : billingCycleMonths === 1 ? '/ month' : `/ ${billingCycleMonths} months`;

                        return (
                          <>
                            <div className="bg-emerald-50/40 border border-emerald-500/60 rounded-xl p-4 flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-sm font-bold text-slate-900">{selectedPlan.name} Plan</h4>
                                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded">
                                    14-DAY FREE TRIAL
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 font-medium">Start free. Cancel anytime.</p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-extrabold text-slate-900">₹{monthlyBase.toLocaleString()}/mo</span>
                                <CheckCircle2 size={18} className="text-emerald-500 fill-emerald-500 text-white shrink-0" />
                              </div>
                            </div>

                            {/* Pay Now Option */}
                            <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                                💳
                              </div>
                              <div>
                                <h5 className="text-xs font-bold text-slate-900">Pay now & Activate</h5>
                                <p className="text-[11px] text-slate-400 font-medium">Instant activation via Razorpay.</p>
                              </div>
                            </div>

                            {/* Breakdown */}
                            <div className="space-y-3 pt-2">
                              <div className="flex justify-between items-center text-xs font-semibold">
                                <span className="text-slate-500">Billing Cycle</span>
                                <select
                                  value={billingCycleMonths}
                                  onChange={(e) => setBillingCycleMonths(Number(e.target.value))}
                                  className="bg-slate-50 border border-slate-200 text-slate-900 font-bold rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                >
                                  <option value={1}>1 Month</option>
                                  <option value={3}>3 Months</option>
                                  <option value={6}>6 Months</option>
                                  <option value={9}>9 Months</option>
                                  <option value={12}>1 Year (Paid Annually)</option>
                                </select>
                              </div>

                              <div className="flex justify-between items-center text-xs font-semibold">
                                <span className="text-slate-500">Base Price</span>
                                <span className="text-slate-800">₹{basePriceTotal.toLocaleString()}.00</span>
                              </div>

                              <div className="flex justify-between items-center text-xs font-semibold">
                                <span className="text-slate-500">GST (18%)</span>
                                <span className="text-slate-800">₹{gstTotal.toLocaleString()}.00</span>
                              </div>

                              <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                                <span className="text-xs font-extrabold text-slate-900">Total Due</span>
                                <span className="text-lg font-black text-blue-600">₹{totalDue.toLocaleString()}.00 {cycleLabel}</span>
                              </div>
                            </div>

                            {/* 14-DAY FREE TRIAL GIFT BANNER */}
                            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-base">🎁</span>
                                <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">14-DAY FREE TRIAL</span>
                              </div>
                              <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">
                                ₹0.00 DUE TODAY
                              </span>
                            </div>

                            {/* TENANT DETAILS */}
                            <div className="border-t border-slate-100 pt-4 space-y-2.5">
                              <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">TENANT DETAILS</h5>
                              
                              <div className="flex justify-between items-center text-xs font-semibold">
                                <span className="text-slate-500">Subdomain</span>
                                <span className="text-slate-900 font-bold">{subdomain || 'abc'}.workspace360.com</span>
                              </div>

                              <div className="flex justify-between items-center text-xs font-semibold">
                                <span className="text-slate-500">Administrator</span>
                                <span className="text-slate-900 font-bold">{adminName || 'Usha'}</span>
                              </div>

                              <div className="flex justify-between items-center text-xs font-semibold">
                                <span className="text-slate-500">Company Size</span>
                                <span className="text-slate-900 font-bold">{companySize || 'Under 50'}</span>
                              </div>
                            </div>

                            {/* Terms */}
                            <label className="flex items-start gap-2.5 cursor-pointer pt-2 group">
                              <input
                                type="checkbox"
                                id="terms"
                                checked={termsAccepted}
                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                              />
                              <span className="text-[11px] text-slate-500 leading-snug font-medium">
                                I agree to the <a href="#" className="text-blue-600 font-bold hover:underline">Terms & Conditions</a> and <a href="#" className="text-blue-600 font-bold hover:underline">Privacy Policy</a>. <span className="text-red-500">*</span>
                              </span>
                            </label>

                            {/* Action Button */}
                            <div className="pt-2">
                              <button
                                type="button"
                                onClick={finishRegistration}
                                disabled={isSubmitting}
                                className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                {isSubmitting ? 'PROCESSING...' : 'START 14-DAYS FREE TRIAL'}
                                <ArrowRight size={16} />
                              </button>
                              <p className="text-[11px] text-slate-400 text-center font-medium mt-2">
                                No credit card required
                              </p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* FOOTER BUTTONS */}
            {step < 3 && (
              <div className="bg-slate-50/50 px-8 py-5 border-t border-slate-100 flex justify-between items-center">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={step === 1}
                  className={`font-semibold text-sm px-6 py-3 rounded-xl border transition-all inline-flex items-center gap-2 ${step === 1 ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-white' : 'border-slate-200 text-slate-700 hover:bg-slate-100 bg-white shadow-sm'}`}
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-8 py-3 rounded-xl shadow-lg shadow-blue-600/25 transition-all inline-flex items-center gap-2 disabled:opacity-50"
                >
                  Continue
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
  );
}
function StepIndicator({ currentStep, stepNumber, label }: any) {
  const isCompleted = currentStep > stepNumber;
  const isActive = currentStep === stepNumber;

  return (
    <div className="flex flex-col items-center relative z-10 bg-slate-50">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border transition-colors duration-300 ${isActive ? 'border-[#1E3A8A] bg-[#1E3A8A] text-white shadow-md' :
          isCompleted ? 'border-[#1E3A8A] bg-white text-[#1E3A8A]' : 'border-slate-200 bg-white text-slate-400'
        }`}>
        {stepNumber}
      </div>
      <span className={`text-[9px] uppercase tracking-wider font-bold mt-2 absolute -bottom-6 whitespace-nowrap transition-colors duration-300 ${isActive || isCompleted ? 'text-[#1E3A8A]' : 'text-slate-400'
        }`}>
        {label}
      </span>
    </div>
  );
}