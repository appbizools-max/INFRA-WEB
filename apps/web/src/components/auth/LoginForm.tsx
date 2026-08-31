import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import type { ConfirmationResult } from "firebase/auth";
import { auth } from "../../lib/firebase";
import logoImg from "../../assets/App Logo.png";
import { Phone, Loader2, ArrowRight, Mail, User, CheckCircle2, Clock } from "lucide-react";

export function LoginForm() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login State
  const [loginMethod, setLoginMethod] = useState<'mobile' | 'email'>('mobile');
  const [loginStage, setLoginStage] = useState<'input' | 'otp'>('input');

  // Registration Sequential Stage
  // 0: Basic Info (Name, Email) -> send Email OTP
  // 1: Verify Email OTP
  // 2: Enter Mobile Number -> send SMS OTP
  // 3: Verify Mobile OTP
  const [regStage, setRegStage] = useState<0 | 1 | 2 | 3>(0);

  // Shared state
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Form State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // OTP State
  const [mobileOtp, setMobileOtp] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Timer State
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    localStorage.removeItem('infraops360_dev_user');
  }, []);

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
  const initRecaptcha = () => {
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        console.error("Failed to clear Recaptcha:", e);
      }
      window.recaptchaVerifier = undefined;
    }

    const container = document.getElementById('recaptcha-container');
    if (container) {
      container.innerHTML = '';
    }

    try {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible'
      });
    } catch (e) {
      console.error("Failed to init Recaptcha:", e);
    }
  };

  const handleSendMobileOtp = async (phone: string) => {
    initRecaptcha();
    const formattedNum = `+91${phone}`;
    const confirmation = await signInWithPhoneNumber(auth, formattedNum, window.recaptchaVerifier);
    setConfirmationResult(confirmation);
    return confirmation;
  };

  const checkUserExists = async (field: { email?: string, mobile?: string }) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const host = baseUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : baseUrl;
    const res = await fetch(`${host}/api/auth/check-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(field)
    });
    if (!res.ok) throw new Error('Failed to verify user existence');
    const data = await res.json();
    return data.exists;
  };

  const handleSendEmailOtp = async (mail: string) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const host = baseUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : baseUrl;
    const res = await fetch(`${host}/api/auth/send-email-otp`, {
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
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const host = baseUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : baseUrl;
    const res = await fetch(`${host}/api/auth/verify-email-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: mail, otp: otpCode })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Invalid Email OTP');
    }
    return data.token;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        if (loginStage === 'input') {
          // Send OTP
          if (loginMethod === 'mobile') {
            if (phoneNumber.length < 10) throw new Error('Invalid mobile number');
            const exists = await checkUserExists({ mobile: phoneNumber });
            if (!exists) {
              if (import.meta.env.DEV || window.location.hostname === 'localhost') {
                setMode('register');
                setRegStage(0);
                setName(`Admin ${phoneNumber.slice(-4)}`);
                setEmail(`admin.${phoneNumber}@infraops360.local`);
                setSuccessMsg(`Mobile +91 ${phoneNumber} is not registered yet. Switched to Create Account registration.`);
                return;
              }
              throw new Error('Mobile number is not registered. Please click "Create Account" below to register.');
            }

            await handleSendMobileOtp(phoneNumber);
            setSuccessMsg(`OTP sent to mobile +91 ${phoneNumber}`);
          } else {
            if (!email) throw new Error('Invalid email');
            const exists = await checkUserExists({ email: email });
            if (!exists) throw new Error('Email is not registered. Please create an account.');

            await handleSendEmailOtp(email);
            setSuccessMsg(`OTP sent to email ${email}`);
          }
          setTimer(180);
          setLoginStage('otp');
        } else {
          // Verify OTP
          if (loginMethod === 'mobile') {
            if (!mobileOtp) throw new Error('Enter OTP');
            try {
              await confirmationResult?.confirm(mobileOtp);
              navigate('/tenant/dashboard');
            } catch (err: any) {
              if (import.meta.env.DEV || window.location.hostname === 'localhost') {
                console.warn("Firebase verification failed. Bypassing in dev mode with dynamic phone UID:", err.message);
                const cleanPhone = (phoneNumber || '').replace(/\D/g, '');
                const mockUid = cleanPhone ? `phone-uid-${cleanPhone}` : `dev-uid-${Date.now()}`;
                const mockUser = {
                  uid: mockUid,
                  email: `${cleanPhone || 'admin'}@infraops360.local`,
                  displayName: `Phone User ${phoneNumber}`,
                  emailVerified: true
                };
                localStorage.setItem('infraops360_dev_user', JSON.stringify(mockUser));
                localStorage.setItem('infraops360_dev_token', 'MOCK_TOKEN_DEV');
                
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const host = baseUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : baseUrl;
                try {
                  await fetch(`${host}/api/tenant/profile/${mockUid}?mobile=${encodeURIComponent(phoneNumber)}`);
                } catch (e) {}
                window.location.href = '/tenant/dashboard';
                return;
              }
              throw err;
            }
          } else {
            if (!emailOtp) throw new Error('Enter OTP');
            const token = await handleVerifyEmailOtp(email, emailOtp);
            if (token) {
              if (token === 'MOCK_TOKEN_DEV') {
                const mockUid = `dev-uid-${email.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '')}`;
                const mockUser = {
                  uid: mockUid,
                  email: email,
                  displayName: email.split('@')[0],
                  emailVerified: true
                };
                localStorage.setItem('infraops360_dev_user', JSON.stringify(mockUser));
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const host = baseUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : baseUrl;
                await fetch(`${host}/api/tenant/profile/${mockUid}?email=${encodeURIComponent(email)}`);
                window.location.href = '/tenant/dashboard';
              } else {
                const { signInWithCustomToken } = await import('firebase/auth');
                await signInWithCustomToken(auth, token);
                navigate('/tenant/dashboard');
              }
            } else {
              throw new Error('Server configuration error. Cannot generate auth token.');
            }
          }
        }
      } else {
        // Sequential Registration Flow
        if (regStage === 0) {
          if (!name || !email || !termsAccepted) {
            throw new Error('Please fill all fields and accept terms.');
          }
          const exists = await checkUserExists({ email: email });
          if (exists) throw new Error('Email is already registered. Please log in.');

          await handleSendEmailOtp(email);
          setSuccessMsg(`OTP sent to email ${email}`);
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
          setSuccessMsg(`OTP sent to mobile +91 ${phoneNumber}`);
          setTimer(180);
          setRegStage(3);
        } else if (regStage === 3) {
          if (!mobileOtp) throw new Error('Enter Mobile OTP');

          // Verify Mobile OTP via Firebase (logs user in)
          let result;
          try {
            result = await confirmationResult?.confirm(mobileOtp);
          } catch (err: any) {
            if (import.meta.env.DEV || window.location.hostname === 'localhost') {
              console.warn("Firebase verification failed in registration. Bypassing in dev mode with dynamic phone UID:", err.message);
              const cleanPhone = (phoneNumber || '').replace(/\D/g, '');
              const mockUid = cleanPhone ? `phone-uid-${cleanPhone}` : `dev-uid-${Date.now()}`;
              const mockUser = {
                uid: mockUid,
                email: email || `${cleanPhone || 'admin'}@infraops360.local`,
                displayName: name || `Phone User ${phoneNumber}`,
                emailVerified: true
              };
              localStorage.setItem('infraops360_dev_user', JSON.stringify(mockUser));
              localStorage.setItem('infraops360_dev_token', 'MOCK_TOKEN_DEV');

              const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
              const host = baseUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : baseUrl;
              try {
                await fetch(`${host}/api/tenant/draft`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    firebaseUid: mockUid,
                    step: 1,
                    draftData: { adminName: name, email: email, mobile: phoneNumber }
                  })
                });
              } catch (e) {}
              window.location.href = '/tenant/dashboard';
              return;
            }
            throw err;
          }

          // Save draft info so they don't have to enter it again
          if (result?.user) {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const host = baseUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : baseUrl;
            await fetch(`${host}/api/tenant/draft`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                firebaseUid: result.user.uid,
                step: 1,
                draftData: { adminName: name, email: email, mobile: phoneNumber }
              })
            });
          }
          navigate('/tenant/dashboard');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed');
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          console.error("Failed to clear Recaptcha in catch:", e);
        }
        window.recaptchaVerifier = undefined;
      }
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setLoginStage('input');
    setRegStage(0);
    setMobileOtp('');
    setEmailOtp('');
    setError('');
    setSuccessMsg('');
    setTimer(0);
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="mb-6 text-center">
        <div className="flex justify-center mb-4">
          <img src={logoImg} alt="InfraOps360 Logo" width={160} height={45} style={{ height: 'auto' }} className="object-contain" />
        </div>
        <h2 className="text-xl font-black text-foreground uppercase tracking-wider">
          {mode === 'login' ? 'Tenant Login' : 'Create Account'}
        </h2>
        <p className="text-xs text-muted-foreground font-medium mt-1">
          {mode === 'login' ? 'Welcome back to the command center.' : 'Join the next-gen operations platform.'}
        </p>
      </div>

      <div id="recaptcha-container"></div>

      {error && (
        <div className="mb-4 p-3 bg-infra-red/10 border border-infra-red/20 text-infra-red text-xs font-bold rounded-sm uppercase tracking-wide flex flex-col space-y-2">
          <span>{error}</span>
          {error.includes('not registered') && (
            <button
              type="button"
              onClick={() => {
                setError('');
                setMode('register');
                setRegStage(0);
              }}
              className="text-left underline text-infra-green font-black hover:opacity-80 transition-opacity cursor-pointer mt-1 normal-case tracking-normal"
            >
              👉 Click here to Create an Account for +91 {phoneNumber}
            </button>
          )}
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 bg-infra-green/10 border border-infra-green/20 text-infra-green text-xs font-bold rounded-sm uppercase tracking-wide">
          {successMsg}
        </div>
      )}

      {/* Login Toggle Buttons */}
      {mode === 'login' && loginStage === 'input' && (
        <div className="flex bg-slate-100 p-1 rounded-sm mb-6">
          <button
            type="button"
            onClick={() => { setLoginMethod('mobile'); resetState(); }}
            className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-all ${loginMethod === 'mobile' ? 'bg-white shadow-sm text-infra-green' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Mobile OTP
          </button>
          <button
            type="button"
            onClick={() => { setLoginMethod('email'); resetState(); }}
            className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-all ${loginMethod === 'email' ? 'bg-white shadow-sm text-infra-green' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Email OTP
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* LOGIN MODE */}
        {mode === 'login' && (
          <>
            {loginStage === 'input' ? (
              <>
                {loginMethod === 'mobile' ? (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mobile Number</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">+91</span>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="w-full pl-12 pr-3 py-2.5 bg-background border border-input rounded-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-infra-green/50 focus:border-infra-green"
                        placeholder="10-digit number"
                        required
                        maxLength={10}
                      />
                      <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 bg-background border border-input rounded-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-infra-green/50 focus:border-infra-green"
                        placeholder="name@company.com"
                        required
                      />
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {loginMethod === 'mobile' ? `Mobile OTP (+91 ${phoneNumber})` : `Email OTP (${email})`}
                </label>
                <input
                  type="text"
                  value={loginMethod === 'mobile' ? mobileOtp : emailOtp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    if (loginMethod === 'mobile') setMobileOtp(val);
                    else setEmailOtp(val);
                  }}
                  className="w-full px-3 py-2.5 bg-background border border-input rounded-sm text-center tracking-[0.5em] text-lg font-black focus:outline-none focus:ring-2 focus:ring-infra-green/50 focus:border-infra-green"
                  placeholder="000000"
                  required
                  maxLength={6}
                />
              </div>
            )}
          </>
        )}

        {/* REGISTRATION MODE - SEQUENTIAL */}
        {mode === 'register' && (
          <>
            {regStage === 0 && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-background border border-input rounded-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-infra-green/50 focus:border-infra-green"
                      placeholder="John Doe"
                      required
                    />
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-background border border-input rounded-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-infra-green/50 focus:border-infra-green"
                      placeholder="name@company.com"
                      required
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="pt-2">
                  <label className="flex items-start space-x-2 cursor-pointer group">
                    <div className="relative flex items-center justify-center mt-0.5">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                      />
                      <div className="w-4 h-4 border-2 border-slate-300 rounded-sm peer-checked:bg-infra-green peer-checked:border-infra-green transition-colors" />
                      <CheckCircle2 className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100" />
                    </div>
                    <span className="text-xs text-slate-500 font-medium leading-relaxed">
                      I agree to the <span className="text-infra-green hover:underline">Terms & Conditions</span> and <span className="text-infra-green hover:underline">Privacy Policy</span>
                    </span>
                  </label>
                </div>
              </>
            )}

            {regStage === 1 && (
              <div className="space-y-1.5">
                <div className="mb-4 p-3 bg-slate-50 border border-slate-100 rounded-sm text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-infra-green">Step 1: Verify Email</p>
                </div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email OTP ({email})</label>
                <input
                  type="text"
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-3 py-2.5 bg-background border border-input rounded-sm text-center tracking-[0.5em] text-lg font-black focus:outline-none focus:ring-2 focus:ring-infra-green/50 focus:border-infra-green"
                  placeholder="000000"
                  required
                  maxLength={6}
                />
                {timer > 0 && (
                  <div className="flex items-center justify-end text-xs font-bold text-infra-green mt-1">
                    <Clock className="w-3 h-3 mr-1" />
                    Expires in: {formatTime(timer)}
                  </div>
                )}
                {timer === 0 && (
                  <div className="flex items-center justify-end text-xs font-bold text-infra-red mt-1">
                    OTP Expired
                  </div>
                )}
              </div>
            )}

            {regStage === 2 && (
              <div className="space-y-1.5">
                <div className="mb-4 p-3 bg-slate-50 border border-slate-100 rounded-sm text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-infra-green">Step 2: Enter Mobile Number</p>
                </div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mobile Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">+91</span>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full pl-12 pr-3 py-2.5 bg-background border border-input rounded-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-infra-green/50 focus:border-infra-green"
                    placeholder="10-digit number"
                    required
                    maxLength={10}
                  />
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            )}

            {regStage === 3 && (
              <div className="space-y-1.5">
                <div className="mb-4 p-3 bg-slate-50 border border-slate-100 rounded-sm text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-infra-green">Final Step: Verify Mobile</p>
                </div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mobile OTP (+91 {phoneNumber})</label>
                <input
                  type="text"
                  value={mobileOtp}
                  onChange={(e) => setMobileOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-3 py-2.5 bg-background border border-input rounded-sm text-center tracking-[0.5em] text-lg font-black focus:outline-none focus:ring-2 focus:ring-infra-green/50 focus:border-infra-green"
                  placeholder="000000"
                  required
                  maxLength={6}
                />
                {timer > 0 && (
                  <div className="flex items-center justify-end text-xs font-bold text-infra-green mt-1">
                    <Clock className="w-3 h-3 mr-1" />
                    Expires in: {formatTime(timer)}
                  </div>
                )}
                {timer === 0 && (
                  <div className="flex items-center justify-end text-xs font-bold text-infra-red mt-1">
                    OTP Expired
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-infra-green hover:bg-infra-green/90 text-white font-black uppercase tracking-widest py-3 px-4 rounded-sm flex items-center justify-center transition-all disabled:opacity-70 group mt-6"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {mode === 'login'
                ? (loginStage === 'otp' ? 'Verify & Login' : 'Send OTP')
                : (
                  regStage === 0 ? 'Continue to Email Verification' :
                    regStage === 1 ? 'Verify Email' :
                      regStage === 2 ? 'Send SMS OTP' : 'Verify & Complete Registration'
                )
              }
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>

      {/* Footer Navigation */}
      {(mode === 'login' && loginStage === 'input') || (mode === 'register' && regStage === 0) ? (
        <div className="mt-8 pt-6 border-t border-border/50 text-center">
          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); resetState(); }}
            className="text-xs text-muted-foreground hover:text-infra-green transition-colors font-medium"
          >
            {mode === 'login'
              ? "Don't have an account? Create account"
              : "Already have an account? Log in"}
          </button>
        </div>
      ) : (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              if (mode === 'login') {
                setLoginStage('input');
              } else {
                setRegStage(Math.max(0, regStage - 1) as any);
              }
            }}
            className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-infra-green transition-colors"
          >
            ← Back
          </button>
        </div>
      )}


    </div>
  );
}
