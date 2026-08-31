import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoImg from "../../assets/App Logo.png";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const host = baseUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : baseUrl;
      
      const res = await fetch(`${host}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (res.ok && data.token) {
        sessionStorage.setItem('saas_admin_jwt', data.token);
        navigate("/saas-admin/dashboard");
      } else {
        setError(data.error || "Invalid admin credentials");
      }
    } catch (err: any) {
      setError("Network error connecting to auth server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background flex-col-reverse lg:flex-row">
      {/* Left side: Graphic */}
      <div className="flex-1 relative bg-slate-900 flex flex-col justify-center p-8 lg:p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]"></div>
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 w-full max-w-xl mx-auto xl:ml-auto xl:mr-16 text-left">
          <div className="inline-block px-2 py-0.5 mb-4 border-2 border-slate-500 text-slate-400 font-black uppercase tracking-widest text-[10px]">
            Platform Control
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-white uppercase tracking-widest mb-4 leading-tight">
            System Admin <span className="text-slate-400 block mt-1">Terminal</span>
          </h1>
          <p className="text-sm text-slate-400 font-medium max-w-lg leading-relaxed border-l-4 border-slate-700 pl-4 mb-10">
            Secure access terminal for platform administrators. Manage tenants, modules, and platform-wide configurations.
          </p>
        </div>
      </div>

      {/* Right side: Form */}
      <div className="flex-1 flex flex-col justify-center px-4 py-8 sm:px-6 lg:flex-none lg:w-[440px] xl:w-[500px] bg-white z-10 shadow-2xl relative">
        <div className="w-full max-w-sm mx-auto">
          <div className="mb-8 text-center">
            <div className="flex justify-center mb-4">
              <img src={logoImg} alt="InfraOps360 Logo" width={160} height={45} style={{ height: 'auto' }} className="object-contain" />
            </div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-wider">Admin Login</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">Authorized personnel only.</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-sm uppercase tracking-wide">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all"
                  placeholder="admin@easyapps360.com"
                  required
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all"
                  placeholder="••••••••"
                  required
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest py-3 px-4 rounded-sm flex items-center justify-center transition-all disabled:opacity-70 mt-6"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Authenticate
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
