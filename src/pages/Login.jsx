import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KeyRound, User, Lock, AlertCircle, Wrench } from 'lucide-react';
import tataLogo from '../assets/tata_logo.png';

const IMAGES = [
  '/images/plant_1.png',
  '/images/plant_2.png',
  '/images/plant_3.png',
  '/images/plant_4.png'
];

const Login = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Slideshow timer
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveImageIndex((prevIndex) => (prevIndex + 1) % IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const loggedUser = await login(userId, password);
      // Redirect users according to role after login
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (id) => {
    setUserId(id);
    setPassword('pass');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans overflow-hidden">
      
      {/* LEFT PANEL: Slideshow & Jishu Hozen Overlay (60% width on large screens) */}
      <div className="relative md:w-3/5 w-full h-[40vh] md:h-screen bg-slate-950 flex flex-col justify-between p-8 md:p-12 text-white shrink-0 overflow-hidden select-none">
        
        {/* Slideshow background images */}
        {IMAGES.map((imgSrc, idx) => (
          <div
            key={idx}
            style={{ 
              backgroundImage: `url(${imgSrc})`,
              transition: 'opacity 1.5s ease-in-out, transform 6s ease-out'
            }}
            className={`absolute inset-0 bg-cover bg-center ${
              idx === activeImageIndex ? 'opacity-40 scale-105' : 'opacity-0 scale-100'
            }`}
          />
        ))}

        {/* Ambient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-950/50 pointer-events-none" />

        {/* Logo and Brand Title on Top */}
        <div className="relative z-10 flex items-center gap-3">
          <img src={tataLogo} alt="Tata Motors Logo" className="w-10 h-10 object-contain shrink-0" />
          <div>
            <h1 className="text-xl font-extrabold tracking-wider leading-none">TATA MOTORS</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Lucknow Plant</p>
          </div>
        </div>

        {/* Big Overlay Title in Middle/Bottom */}
        <div className="relative z-10 mt-auto mb-6 md:mb-12 max-w-lg">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 backdrop-blur-sm mb-4">
            <Wrench className="w-3.5 h-3.5" />
            <span>Autonomous Maintenance Portal</span>
          </span>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Jishu Hozen
          </h2>
          <p className="text-slate-350 text-sm md:text-base mt-2 font-medium leading-relaxed">
            Enterprise-grade TPM (Total Productive Maintenance) floor system for machine scheduling, cleaning validation, and quality audit compliance.
          </p>
        </div>

      </div>

      {/* RIGHT PANEL: Blue Background with Login Form (40% width on large screens) */}
      <div className="md:w-2/5 w-full bg-gradient-to-br from-blue-700 to-indigo-900 flex items-center justify-center p-6 md:p-12 relative">
        {/* Glow decoration */}
        <div className="absolute top-1/4 right-1/4 w-80 h-80 rounded-full bg-blue-500/20 blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md space-y-6 z-10">
          <div className="text-center md:text-left space-y-2 text-white">
            <h3 className="text-2xl font-extrabold tracking-tight">Sign In</h3>
            <p className="text-sm text-blue-250 font-medium">
              Enter credentials to access your JishuHozen dashboard
            </p>
          </div>

          <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl shadow-black/20 text-white">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">{error}</span>
                </div>
              )}

              {/* User ID field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-blue-200 uppercase tracking-wider block">
                  User ID (Ticket No.)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-350">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/40 border border-white/10 text-white placeholder-blue-300/40 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all font-semibold"
                    placeholder="Enter User ID (e.g. 100001)"
                    required
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-blue-200 uppercase tracking-wider block">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-350">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/40 border border-white/10 text-white placeholder-blue-300/40 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all font-semibold"
                    placeholder="Enter Password"
                    required
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-blue-500 hover:bg-blue-400 active:bg-blue-600 text-white font-bold text-sm tracking-wider shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Access */}
            <div className="mt-6 pt-5 border-t border-white/10 space-y-2.5">
              <span className="text-[10px] font-bold text-blue-250 uppercase tracking-widest block text-center">
                Demo Accounts (Quick Select)
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('LI0000001')}
                  className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-blue-200 border border-white/10 hover:border-white/20 transition-colors text-left font-semibold"
                >
                  <span className="block text-[10px] text-blue-350 font-bold uppercase">Line Incharge</span>
                  LI0000001
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('SU0000001')}
                  className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-blue-200 border border-white/10 hover:border-white/20 transition-colors text-left font-semibold"
                >
                  <span className="block text-[10px] text-blue-350 font-bold uppercase">Supervisor</span>
                  SU0000001
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('TL01')}
                  className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-blue-200 border border-white/10 hover:border-white/20 transition-colors text-left font-semibold"
                >
                  <span className="block text-[10px] text-blue-350 font-bold uppercase">Team Leader</span>
                  TL01
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('JH01')}
                  className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-blue-200 border border-white/10 hover:border-white/20 transition-colors text-left font-semibold"
                >
                  <span className="block text-[10px] text-blue-350 font-bold uppercase">JH Owner</span>
                  JH01
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
