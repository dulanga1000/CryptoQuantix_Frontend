import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

export default function DashboardPage() {
  const navigate = useNavigate();
  // Using an object to hold both name and username safely
  const [user, setUser] = useState<{ username: string; full_name?: string }>({ username: '' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get('/auth/me');
        setUser(response.data);
      } catch (error) {
        console.error("Not authenticated");
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Use the full name if they provided one during registration, otherwise fallback to username
  const displayName = user.full_name || user.username;

  return (
    <div className="flex w-full min-h-[calc(100vh-64px)] bg-slate-50 font-sans">
      <Sidebar />
      
      <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
        
        {/* Welcome Banner */}
        <div className="mb-10 p-8 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-900 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
            <svg width="300" height="300" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><path fill="#FFFFFF" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.3,-46.3C90.8,-33.5,96.7,-18.1,97.2,-2.5C97.7,13.1,92.8,29,83.1,41.7C73.4,54.4,58.8,63.9,43.4,71.2C28,78.5,11.8,83.6,-3.6,89.5C-19,95.4,-33.6,102.1,-46.8,96.3C-60,90.5,-71.8,72.2,-80.6,54.6C-89.4,37,-95.2,20.1,-96.2,2.8C-97.2,-14.5,-93.4,-32.2,-83.4,-46.1C-73.4,-60,-57.2,-70.1,-41.8,-76.5C-26.4,-82.9,-11.8,-85.6,2.2,-89.6C16.2,-93.6,30.6,-83.6,44.7,-76.4Z" transform="translate(100 100)" /></svg>
          </div>
          
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">
              {isLoading ? 'Loading workspace...' : `Welcome back, ${displayName}`}
            </h1>
            <p className="text-indigo-200 text-lg max-w-2xl">
              Your quantitative analytics workspace is ready. Select a module below to begin analyzing live market data.
            </p>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Available Modules</h2>
        </div>

        {/* Dashboard Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          
          {/* Module 1: Market Data */}
          <div 
            onClick={() => navigate('/market-data')}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
          >
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Live Markets</h3>
            <p className="text-sm text-slate-500 leading-relaxed">Access real-time asset pricing, historical charts, and live order book data streams.</p>
          </div>

          {/* Module 2: Portfolio */}
          <div 
            onClick={() => navigate('/portfolio')}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
          >
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">My Portfolio</h3>
            <p className="text-sm text-slate-500 leading-relaxed">Track asset allocations, monitor real-time P&L, and generate automated PDF reports.</p>
          </div>

          {/* Module 3: Fibonacci */}
          <div 
            onClick={() => navigate('/investment')}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
          >
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Fibonacci Engine</h3>
            <p className="text-sm text-slate-500 leading-relaxed">Calculate high-precision algorithmic trading signals and support/resistance retracements.</p>
          </div>

          {/* Module 4: Cryptography */}
          <div 
            onClick={() => navigate('/crypto')}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
          >
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">ECC Cryptography</h3>
            <p className="text-sm text-slate-500 leading-relaxed">Verify secure data transactions using the Tonelli-Shanks modular square root algorithm.</p>
          </div>

        </div>
      </main>
    </div>
  );
}