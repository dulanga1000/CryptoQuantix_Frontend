import React, { useState } from 'react';
import logo from '../assets/logo.png';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; 

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  
  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Status State
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setIsLoading(true);

    const endpoint = isLogin ? '/auth/login' : '/auth/register';

    try {
      const response = await api.post(endpoint, {
        username: username,
        password: password,
        fullName: fullName,
        email: email
      });

      if (isLogin) {
        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('refresh_token', response.data.refresh_token);
        localStorage.setItem('username', username);
        
        // 🔥 DISPATCH EVENT: Tells the Navbar to update instantly
        window.dispatchEvent(new Event('auth-change'));
        
        navigate('/dashboard');
      } else {
        setSuccess('Account created securely! You can now log in.');
        setIsLogin(true); 
        setPassword(''); 
      }
    } catch (err: any) {
      const serverMsg = err.response?.data?.msg || err.response?.data?.error;
      setError(serverMsg || 'An unexpected error occurred connecting to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* --- LEFT SIDE: Modern Branding (Hidden on Mobile) --- */}
      <div className="hidden lg:flex w-1/2 relative bg-slate-900 overflow-hidden items-center justify-center">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-slate-900 to-indigo-950 opacity-90"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-30 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-blue-400 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 right-0 w-full h-full opacity-20 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-purple-500 via-transparent to-transparent"></div>
        
        {/* Brand Content */}
        <div className="relative z-10 max-w-lg px-12 text-white">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-blue-500/30">
            <img src={logo} alt="CryptoQuantix Logo" className="w-16 h-16 object-contain" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-6">
            Institutional-grade analytics for the modern investor.
          </h1>
          <p className="text-lg text-slate-300 leading-relaxed mb-10">
            Join CryptoQuantix to access high-precision Fibonacci retracement engines and cryptographically secure portfolio tracking.
          </p>
          
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-900"></div>
              <div className="w-8 h-8 rounded-full bg-slate-600 border-2 border-slate-900"></div>
              <div className="w-8 h-8 rounded-full bg-slate-500 border-2 border-slate-900"></div>
            </div>
            <p>Trusted by quantitative analysts worldwide.</p>
          </div>
        </div>
      </div>

      {/* --- RIGHT SIDE: The Form --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 xl:p-24 relative">
        <div className="w-full max-w-md">
          
          {/* Mobile Logo (Visible only on small screens) - 🔥 NOW CENTERED */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              <img src={logo} alt="CryptoQuantix Logo" className="w-7 h-7 object-contain" />
            </div>
            <span className="font-bold text-xl text-slate-900">CryptoQuantix</span>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-slate-500 mt-2">
              {isLogin ? 'Enter your details to access your dashboard.' : 'Start your journey with professional trading tools.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
              <span className="text-red-500 mt-0.5">⚠️</span>
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 flex items-start gap-3">
              <span className="text-green-500 mt-0.5">✅</span>
              <p className="text-sm font-medium text-green-800">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Conditional Registration Fields */}
            {!isLogin && (
              <div className="grid grid-cols-1 gap-5 transition-all duration-300">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    placeholder="John Doe"
                    required={!isLogin}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    placeholder="john@example.com"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="Choose a unique username"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-semibold text-slate-700">Password</label>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none tracking-widest"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all flex justify-center items-center mt-4 disabled:opacity-70 shadow-lg shadow-slate-900/20"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          {/* Social Proof / Alternative Divider */}
          <div className="mt-10 pt-8 border-t border-slate-100 flex items-center justify-center gap-2 text-sm text-slate-600">
            <span>{isLogin ? "Don't have an account?" : "Already have an account?"}</span>
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
              className="font-bold text-slate-900 hover:text-blue-600 transition-colors"
            >
              {isLogin ? 'Sign up' : 'Log in instead'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}