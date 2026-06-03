import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { Lock, Mail, AlertTriangle, ArrowRight, Loader2, Key } from 'lucide-react';
import { motion } from 'motion/react';

export const Login: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all details');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Verification failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login_container" className="min-h-screen flex items-center justify-center bg-slate-900 px-4 select-none relative overflow-hidden font-sans">
      {/* Decorative background radial pattern */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px]"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-emerald-500/10 blur-[120px]"></div>

      <motion.div 
        id="login_card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="max-w-md w-full bg-slate-950/85 backdrop-blur-md rounded-2xl p-8 border border-slate-800 shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 bg-indigo-600 rounded-xl items-center justify-center shadow-lg mb-4 text-white font-bold text-2xl tracking-wider ring-4 ring-indigo-500/20">
            EM
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-white font-sans">
            Welcome to StaffSync
          </h2>
          <p className="text-xs text-slate-400 mt-1.5">
            MERN + TS Employee Management Workspace
          </p>
        </div>

        {error && (
          <motion.div 
            id="login_error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 p-3.5 bg-rose-950/45 border border-rose-900 rounded-xl flex items-start space-x-3 text-rose-200 text-xs"
          >
            <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-rose-400 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-slate-500">
                <Mail className="h-4 w-4" />
              </span>
              <input
                id="input_login_email"
                type="email"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/40 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-xl text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
                placeholder="you@ems.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-slate-500">
                <Lock className="h-4 w-4" />
              </span>
              <input
                id="input_login_password"
                type="password"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/40 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-xl text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            id="btn_login_submit"
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-indigo-800 text-white font-medium text-sm rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg active:shadow-inner cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>Authenticating Profile...</span>
              </>
            ) : (
              <>
                <span>Sign In to System</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Test account seed credentials panel */}
        <div id="seed_pills" className="mt-8 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-900/65 rounded-xl border border-slate-800/60 p-4">
            <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center mb-2.5">
              <Key className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
              System Demo Credentials
            </h4>
            <div className="space-y-1.5 font-mono text-[10px] text-slate-400 leading-normal">
              <div className="flex justify-between border-b border-slate-800/40 pb-1">
                <span className="text-slate-500 font-sans">Permission:</span>
                <span className="text-amber-400 font-semibold select-none">Admin Creator</span>
              </div>
              <div className="flex justify-between">
                <span>Email:</span>
                <span className="text-slate-200 select-all">admin@ems.com</span>
              </div>
              <div className="flex justify-between">
                <span>Pass:</span>
                <span className="text-slate-200 select-all">adminpassword123</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
