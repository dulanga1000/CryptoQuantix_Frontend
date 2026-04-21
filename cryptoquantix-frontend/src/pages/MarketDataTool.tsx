import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import { formatCurrency, formatPercent } from '../utils/formatters';
import Sidebar from '../components/Sidebar';
import { MASTER_ASSETS } from '../constants/assets';

export default function MarketDataTool() {
  const [symbol, setSymbol] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [priceData, setPriceData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchMarketPrice = async (targetSymbol: string) => {
    if (!targetSymbol) return;
    setLoading(true); setError(''); setIsDropdownOpen(false);

    try {
      const response = await api.get(`/market/price/${targetSymbol}`);
      setPriceData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch market data.');
      setPriceData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const cleanSymbol = searchQuery.toUpperCase().trim();
    setSymbol(cleanSymbol);
    fetchMarketPrice(cleanSymbol);
  };

  // 🔥 UPDATED: Now filtering directly from your single source of truth
  const filteredAssets = MASTER_ASSETS.filter(asset => 
    asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isPositive = priceData?.change >= 0;

  return (
    <div className="flex w-full min-h-[calc(100vh-64px)] bg-slate-50 font-sans">
      <Sidebar />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto p-6 lg:p-10 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 mt-10 font-sans">
      
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Live Market Terminal</h2>
          <p className="text-sm text-slate-500">Search for an asset to view real-time pricing and 24h statistics.</p>
        </div>
      </div>
      
      <form onSubmit={handleManualSubmit} className="flex gap-4 mb-8 relative z-50">
        <div className="flex-1 relative" ref={dropdownRef}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              onClick={() => {
                setSearchQuery('');
                setIsDropdownOpen(true);
              }}
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-slate-900"
              placeholder="Search by name or ticker (e.g., BTC, Apple)"
            />
          </div>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl max-h-72 overflow-y-auto z-50 divide-y divide-slate-50">
              {filteredAssets.length > 0 ? (
                filteredAssets.map((asset) => (
                  <div 
                    key={asset.symbol}
                    onClick={() => {
                      setSearchQuery(asset.symbol);
                      setSymbol(asset.symbol);
                      fetchMarketPrice(asset.symbol);
                    }}
                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600">
                        {asset.symbol.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{asset.symbol}</p>
                        <p className="text-xs text-slate-500">{asset.name}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-500 rounded-md">
                      {asset.type}
                    </span>
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-sm text-slate-500">
                  No assets found. Press "Analyze" to search live market.
                </div>
              )}
            </div>
          )}
        </div>

        <button 
          type="submit" 
          disabled={loading || !searchQuery.trim()}
          className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-slate-900/20 flex items-center gap-2"
        >
          {loading ? 'Loading...' : 'Analyze'}
        </button>
      </form>

      {error && (
        <div className="p-4 mb-8 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-start gap-3">
          <span className="mt-0.5">⚠️</span><span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Highly Detailed Market Terminal Card */}
      {priceData && !loading && (
        <div className="animate-in fade-in zoom-in duration-300">
          
          {/* Main Price Header */}
          <div className="relative overflow-hidden bg-slate-900 p-8 rounded-t-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-500 rounded-full mix-blend-screen filter blur-[80px] opacity-10"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-white/10 border border-white/10 text-blue-300 text-xs font-bold uppercase tracking-widest rounded-full">Live Data</span>
              </div>
              <h3 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">{symbol}</h3>
            </div>
            
            <div className="relative z-10 md:text-right w-full md:w-auto border-t border-slate-700 md:border-t-0 pt-6 md:pt-0">
              <p className="text-sm text-slate-400 font-medium uppercase tracking-wider mb-1">Market Price</p>
              <div className="flex items-end justify-start md:justify-end gap-3">
                <p className="text-5xl font-mono font-bold text-white tracking-tight">
                  {formatCurrency(priceData.price)}
                </p>
                <span className={`text-lg font-bold mb-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isPositive ? '↑' : '↓'} {formatPercent(Math.abs(priceData.change_percent) / 100)}
                </span>
              </div>
            </div>
          </div>

          {/* 24h Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-200 border border-slate-200 border-t-0 rounded-b-2xl overflow-hidden">
            
            <div className="bg-white p-6 flex flex-col justify-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">24h Change</span>
              <span className={`text-xl font-semibold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                {isPositive ? '+' : ''}{formatCurrency(priceData.change)}
              </span>
            </div>

            <div className="bg-white p-6 flex flex-col justify-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">24h High</span>
              <span className="text-xl font-semibold text-slate-800">{formatCurrency(priceData.high_24h)}</span>
            </div>

            <div className="bg-white p-6 flex flex-col justify-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">24h Low</span>
              <span className="text-xl font-semibold text-slate-800">{formatCurrency(priceData.low_24h)}</span>
            </div>

            <div className="bg-white p-6 flex flex-col justify-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Volume</span>
              <span className="text-xl font-semibold text-slate-800">
                {new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(priceData.volume)}
              </span>
            </div>

          </div>
        </div>
      )}
        </div>
      </main>
    </div>
  );
}