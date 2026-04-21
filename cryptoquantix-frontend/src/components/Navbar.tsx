import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

export default function Navbar() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAuthenticated = !!localStorage.getItem('access_token');
  const username = localStorage.getItem('username') || 'User';

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#030303]/70 backdrop-blur-xl saturate-150 transition-all duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo / Brand - Minimalist & Geometric */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="relative p-[1px] rounded-lg bg-gradient-to-b from-white/20 to-transparent">
                <img 
                  src={logo} 
                  alt="CQ" 
                  className="w-8 h-8 rounded-[7px] object-cover bg-[#0a0a0a]" 
                />
              </div>
              <span className="text-lg font-semibold tracking-[-0.02em] text-white">
                CryptoQuantix
              </span>
            </Link>
          </div>

          {/* Right Side Actions - Realistic Component Styling */}
          <div className="hidden md:flex items-center gap-6 ml-auto">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                
                {/* Modern User Chip */}
                <div className="group flex items-center gap-2.5 py-1.5 pl-1.5 pr-3 rounded-full bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.06] transition-all duration-300 cursor-pointer">
                  {/* The Avatar with 'Status' indicator */}
                  <div className="relative">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[11px] font-bold text-white shadow-inner">
                      {username.charAt(0).toUpperCase()}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border-[1.5px] border-[#030303]"></span>
                  </div>
                  
                  <div className="flex flex-col items-start leading-none">
                    <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                      {username}
                    </span>
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link 
                  to="/auth" 
                  className="text-[13px] font-medium text-slate-400 hover:text-white px-4 py-2 transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  to="/auth" 
                  className="h-9 px-5 flex items-center justify-center rounded-full bg-white text-[13px] font-bold text-black hover:bg-slate-200 transition-all active:scale-[0.98]"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button - Minimal Icon */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <div className="w-5 h-4 flex flex-col justify-between items-end">
                <span className={`h-[2px] bg-current transition-all duration-300 ${isMobileMenuOpen ? 'w-5 translate-y-2 -rotate-45' : 'w-5'}`} />
                <span className={`h-[2px] bg-current transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : 'w-3'}`} />
                <span className={`h-[2px] bg-current transition-all duration-300 ${isMobileMenuOpen ? 'w-5 -translate-y-1.5 rotate-45' : 'w-4'}`} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Sleek Overlay */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-64 border-b border-white/[0.06]' : 'max-h-0'}`}>
        <div className="px-4 py-6 bg-[#030303] flex flex-col gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
               <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-lg font-bold text-white uppercase">
                  {username.charAt(0)}
               </div>
               <span className="text-lg font-semibold text-white">{username}</span>
            </div>
          ) : (
            <>
              <Link to="/auth" className="w-full text-center py-3 rounded-xl border border-white/[0.08] text-slate-300 font-medium">Sign In</Link>
              <Link to="/auth" className="w-full text-center py-3 rounded-xl bg-white text-black font-bold">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}