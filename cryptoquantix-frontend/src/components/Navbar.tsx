import React, { useState } from 'react';
import logo from '../assets/logo.png';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation(); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- AUTH & USER STATE ---
  const isAuthenticated = !!localStorage.getItem('access_token');
  // Fetch the username from storage (default to 'User' if not found)
  const username = localStorage.getItem('username') || 'User';

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username'); // Clear username on logout
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  // Navigation links removed as requested

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#0A0E17]/80 backdrop-blur-xl border-b border-slate-800 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo / Brand */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <img src={logo} alt="CryptoQuantix Logo" className="w-8 h-8 rounded-lg shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all object-cover" />
              <span className="text-xl font-extrabold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                CryptoQuantix
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          {/* Navigation links removed as requested */}

          {/* Right Side Actions (Desktop) */}
          <div className="hidden md:flex items-center space-x-4 ml-auto">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                {/* User Profile Pill only (no Mainnet, no Logout) */}
                <div className="flex items-center gap-3 pl-1">
                  <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-800/40 border border-slate-700/50 cursor-default hover:bg-slate-800/60 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white uppercase shadow-inner">
                      {username.charAt(0)}
                    </div>
                    <span className="text-sm font-semibold text-slate-200">{username}</span>
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/auth" className="text-slate-300 hover:text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                  Sign In
                </Link>
                <Link to="/auth" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-400 hover:text-white p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#0A0E17] border-b border-slate-800 animate-in slide-in-from-top-2">
          <div className="px-4 pt-2 pb-6 space-y-1">
            {isAuthenticated ? (
              <>
                {/* Mobile User Profile */}
                <div className="flex items-center gap-3 px-3 py-4 mb-2 border-b border-slate-800">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-lg font-bold text-white uppercase shadow-inner">
                    {username.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-400">Signed in as</div>
                    <div className="text-base font-bold text-white">{username}</div>
                  </div>
                </div>

                {/* No navigation links for mobile menu as requested */}
                <div className="border-t border-slate-800 mt-4 pt-4">
                  <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-3 text-base font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-md">
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-3 pt-2">
                <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center text-slate-300 hover:text-white px-4 py-3 rounded-lg font-semibold bg-slate-800/50">
                  Sign In
                </Link>
                <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center bg-blue-600 text-white px-4 py-3 rounded-lg font-bold">
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}