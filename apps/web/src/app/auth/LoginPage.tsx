import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoginForm } from "../../components/auth/LoginForm";

export default function LoginPage() {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && currentUser) {
      navigate('/tenant/dashboard');
    }
  }, [currentUser, loading, navigate]);

  return (

    <div className="min-h-screen flex bg-background flex-col-reverse lg:flex-row">
      {/* Left side: Industrial Graphic / Image */}
      <div className="flex-1 relative bg-black flex flex-col justify-center p-8 lg:p-12 border-t-8 lg:border-t-0 lg:border-r-8 border-infra-green overflow-hidden">
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#46b351_1px,transparent_1px)] [background-size:24px_24px]"></div>

        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-infra-green/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-infra-orange/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 w-full max-w-xl mx-auto xl:ml-auto xl:mr-16 text-left">
          <div className="inline-block px-2 py-0.5 mb-4 border-2 border-infra-green text-infra-green font-black uppercase tracking-widest text-[10px]">
            System v2.0
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-white uppercase tracking-widest mb-4 leading-tight">
            Next-Gen <span className="text-infra-green block mt-1">Operations</span>
            Command Center
          </h1>
          <p className="text-sm text-gray-300 font-medium max-w-lg leading-relaxed border-l-4 border-infra-orange pl-4 mb-10">
            Centralized intelligence for fleet tracking, fuel management, HR administration, and financial operations. Empowering your workforce at an industrial scale.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white/5 p-4 border border-white/10 rounded-sm backdrop-blur-sm">
            <div className="text-left">
              <div className="text-2xl font-black text-white mb-1 flex items-center">
                99.9<span className="text-infra-green text-lg ml-1">%</span>
              </div>
              <div className="text-[10px] font-bold text-infra-green uppercase tracking-wider">Uptime SLA</div>
            </div>
            <div className="text-left">
              <div className="text-2xl font-black text-white mb-1 flex items-center">
                &lt;50<span className="text-infra-red text-lg ml-1">ms</span>
              </div>
              <div className="text-[10px] font-bold text-infra-red uppercase tracking-wider">Latency</div>
            </div>
            <div className="text-left">
              <div className="text-2xl font-black text-white mb-1 flex items-center">
                256<span className="text-infra-orange text-lg ml-1">-bit</span>
              </div>
              <div className="text-[10px] font-bold text-infra-orange uppercase tracking-wider">Encryption</div>
            </div>
          </div>
        </div>
      </div>


      {/* Right side: Form */}
      <div className="flex-1 flex flex-col justify-center px-4 py-8 sm:px-6 lg:flex-none lg:w-[440px] xl:w-[500px] bg-white z-10 shadow-2xl relative">
        <LoginForm />
      </div>
    </div>
  );
}