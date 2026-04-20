// ...existing code...
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo-white.png';

export default function HomePage() {
  const navigate = useNavigate();
  const handleLaunchPlatform = () => {
    const isAuthenticated = !!localStorage.getItem('access_token');
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };
  return (
    // The outer wrapper is now a flex container that perfectly centers its children vertically and horizontally
    <div className="flex flex-col items-center justify-center min-h-[85vh] w-full bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900 mt-8">
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative w-full">
        
        {/* Decorative Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 pointer-events-none flex justify-center items-center">
          <div className="absolute w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse -translate-x-32"></div>
          <div className="absolute w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse translate-x-32" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* --- Hero Section --- */}
        <div className="text-center max-w-4xl mx-auto relative z-10 flex flex-col items-center">
          {/* Logo replaces the old badge */}
          <div className="flex items-center justify-center mb-8">
            <img src={logo} alt="CryptoQuantix Logo" className="w-28 h-28 rounded-2xl shadow-lg shadow-blue-500/20 object-cover" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-8 leading-tight">
            Smart Investment & <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
              Cryptography Analyzer
            </span>
          </h1>
          
          <p className="text-xl text-slate-600 mb-12 leading-relaxed max-w-2xl text-center">
            Empower your trading strategy with high-precision algorithmic retracement levels and secure your assets with state-of-the-art cryptographic verification.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              type="button"
              onClick={handleLaunchPlatform}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              Launch Platform
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </button>
            <a 
              href="#features" 
              className="bg-white hover:bg-slate-50 text-slate-700 font-semibold py-4 px-8 rounded-xl shadow-sm border border-slate-200 transition-all flex items-center justify-center"
            >
              Explore Features
            </a>
          </div>
        </div>

        {/* --- Feature Cards Section --- */}
        <div id="features" className="mt-20 grid md:grid-cols-3 gap-8 relative z-10">
          
          {/* Feature 1: Trading Engine */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Algorithmic Trading Signals</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              Identify optimal market entry and exit points using dynamic programming and matrix exponentiation to calculate high-precision Fibonacci retracement levels.
            </p>
          </div>

          {/* Feature 2: Cryptography */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Military-Grade Cryptography</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              Secure your transaction data with Elliptic Curve Cryptography (ECC), powered by Tonelli-Shanks algorithms for foundational modular arithmetic.
            </p>
          </div>

          {/* Feature 3: Analytics */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Real-time Portfolio Analytics</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              Track live market data, monitor your profit and loss in real-time, and generate automated, downloadable PDF performance reports.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}