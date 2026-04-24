import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import Sidebar from '../components/Sidebar';
import { MASTER_ASSETS } from '../constants/assets'; // 🔥 Imported the central list

export default function InvestmentTool() {
  // State for Market Scanner & Trading Signals
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [highPrice, setHighPrice] = useState<number | ''>('');
  const [lowPrice, setLowPrice] = useState<number | ''>('');
  const [currentPrice, setCurrentPrice] = useState<number | ''>('');
  const [tradingResult, setTradingResult] = useState<any>(null);
  
  // Loading & Error States
  const [scanningMarket, setScanningMarket] = useState(false);
  const [tradingLoading, setTradingLoading] = useState(false);
  const [error, setError] = useState('');

  // State for Computational Benchmark
  const [nValue, setNValue] = useState<number | ''>(1000);
  const [algoResult, setAlgoResult] = useState<any>(null);
  const [algoLoading, setAlgoLoading] = useState(false);

  // --- 1. Auto-Scan Market Data when Asset is Selected ---
  useEffect(() => {
    if (!selectedAsset) return;

    const fetchAndCalculate = async () => {
      setScanningMarket(true);
      setError('');
      setTradingResult(null);

      try {
        // Fetch 1 month of daily candles to find the real 30-day High/Low
        const res = await api.get(`/market/candles/${selectedAsset}?period=1mo&interval=1d`);
        const candles = res.data.candles;
        
        if (!candles || candles.length === 0) throw new Error("No market data found.");

        // Calculate 30-day High, Low, and Current Close
        const maxHigh = Math.max(...candles.map((c: any) => c.high));
        const minLow = Math.min(...candles.map((c: any) => c.low));
        const current = candles[candles.length - 1].close;

        setHighPrice(maxHigh);
        setLowPrice(minLow);
        setCurrentPrice(current);

        // Instantly trigger the Fibonacci calculation with the real data
        calculateLevels(maxHigh, minLow, current);
        
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to scan market data.');
      } finally {
        setScanningMarket(false);
      }
    };

    fetchAndCalculate();
  }, [selectedAsset]);

  // --- 2. Calculate Fibonacci Levels ---
  const calculateLevels = async (high: number, low: number, current: number) => {
    setTradingLoading(true);
    try {
      const response = await api.post('/fibonacci/calculate', {
        high: high, low: low, current: current, n: 50, sensitivity: 1.0
      });
      if (response.data.error) throw new Error(response.data.error);
      setTradingResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to calculate levels');
    } finally {
      setTradingLoading(false);
    }
  };

  const handleManualCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    if (highPrice && lowPrice && currentPrice) {
      calculateLevels(Number(highPrice), Number(lowPrice), Number(currentPrice));
    }
  };

  // --- 3. Benchmark System Performance ---
  const handleRunBenchmark = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAlgoLoading(true);

    try {
      const response = await api.post('/fibonacci/compare', { n: Number(nValue) });
      setAlgoResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to run system benchmark');
    } finally {
      setAlgoLoading(false);
    }
  };

  return (
    <div className="flex w-full min-h-[calc(100vh-64px)] bg-slate-50 font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 w-full">
          
          <div className="mb-10">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Algorithmic Retracement Engine</h1>
            <p className="text-slate-500 mt-2">Scan live market data to identify key structural support and resistance levels.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 border border-red-200 flex items-start gap-3">
              <span className="mt-0.5">⚠️</span><span className="text-sm font-medium">{error}</span>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            
            {/* --- SECTION 1: MARKET SCANNER & TRADING SIGNALS --- */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-lg font-bold text-slate-800">Target Asset Scanner</h2>
                {scanningMarket && <span className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-widest"><span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span> Scanning...</span>}
              </div>
              
              <div className="p-6 flex-1">
                {/* Modern Dropdown Selector - 🔥 Now using MASTER_ASSETS */}
                <div className="mb-8">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Select Asset to Analyze</label>
                  <div className="relative">
                    <select
                      value={selectedAsset}
                      onChange={(e) => setSelectedAsset(e.target.value)}
                      className="w-full pl-4 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-bold text-slate-900 shadow-sm transition-all"
                    >
                      <option value="" disabled>Choose a market ticker...</option>
                      {MASTER_ASSETS.map(asset => (
                        <option key={asset.symbol} value={asset.symbol}>
                          {asset.symbol} - {asset.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleManualCalculate} className="space-y-5 border-t border-slate-100 pt-6">
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">30-Day High</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                        <input type="number" step="any" value={highPrice} onChange={e => setHighPrice(Number(e.target.value))} required className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"/>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">30-Day Low</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                        <input type="number" step="any" value={lowPrice} onChange={e => setLowPrice(Number(e.target.value))} required className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"/>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current Market Price</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                      <input type="number" step="any" value={currentPrice} onChange={e => setCurrentPrice(Number(e.target.value))} required className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono font-bold text-blue-600 focus:ring-2 focus:ring-blue-500"/>
                    </div>
                  </div>
                  <button type="submit" disabled={tradingLoading || scanningMarket || !highPrice} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50">
                    {tradingLoading ? 'Processing Matrix...' : 'Recalculate Levels'}
                  </button>
                </form>
              </div>

              {/* Actionable Trading Output */}
              {tradingResult && (
                <div className="bg-slate-900 p-6 border-t border-slate-800 animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Algorithmic Recommendation</span>
                    <span className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider ${
                      tradingResult.action === 'BUY' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      tradingResult.action === 'SELL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {tradingResult.action}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 font-medium mb-6 leading-relaxed">{tradingResult.message}</p>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                      <span className="text-sm text-slate-400 font-medium">Resistance (Take Profit)</span>
                      <span className="font-mono text-white font-bold">{formatCurrency(tradingResult.sell_level)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                      <span className="text-sm text-slate-400 font-medium">Support (Optimal Entry)</span>
                      <span className="font-mono text-white font-bold">{formatCurrency(tradingResult.buy_level)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* --- SECTION 2: FIBONACCI ENGINE --- */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-fit">
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-lg font-bold text-slate-800">Fibonacci Engine</h2>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">System Ready</span>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                  Test the Fibonacci engine's speed by simulating complex proof calculations. Set the Proof Depth (Integer n) to control how far the engine computes—higher numbers mean a more challenging proof!
                </p>
                <form onSubmit={handleRunBenchmark} className="space-y-5 mb-8">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Proof Depth <span className=\"font-normal\">(Integer n)</span></label>
                    <input type="number" value={nValue} onChange={e => setNValue(e.target.value === '' ? '' : Number(e.target.value))} required min="1" max="50000" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono font-medium text-slate-900" placeholder="e.g. 1000"/>
                    <span className="block text-xs text-slate-400 mt-1">Enter how many steps deep the Fibonacci proof should go (integer only).</span>
                  </div>
                  <button type="submit" disabled={algoLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50">
                    {algoLoading ? 'Running Proof Test...' : 'Run Proof Benchmark'}
                  </button>
                </form>
                {algoResult && (
                  <div className="bg-[#0D1117] text-slate-300 rounded-xl p-6 font-mono text-sm shadow-inner overflow-hidden animate-in fade-in">
                    <div className="flex items-center gap-2 mb-4 text-xs">
                      <span className="text-emerald-400">user@cryptoquantix:~$</span>
                      <span className="text-slate-300">./fibonacci-engine --proof-depth={algoResult.n}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-[#161B22] p-4 rounded-lg border border-slate-800">
                        <div className="text-xs text-slate-500 uppercase mb-2 tracking-widest">Matrix Engine Time</div>
                        <div className="text-xl text-white font-bold">{algoResult.matrix_time_seconds.toFixed(6)}s</div>
                        <div className="text-xs text-emerald-500 mt-2 font-bold bg-emerald-500/10 inline-block px-2 py-1 rounded">O(log n)</div>
                      </div>
                      <div className="bg-[#161B22] p-4 rounded-lg border border-slate-800">
                        <div className="text-xs text-slate-500 uppercase mb-2 tracking-widest">Classic Engine Time</div>
                        <div className="text-xl text-white font-bold">{algoResult.dp_time_seconds.toFixed(6)}s</div>
                        <div className="text-xs text-amber-500 mt-2 font-bold bg-amber-500/10 inline-block px-2 py-1 rounded">O(n)</div>
                      </div>
                    </div>
                    <div className="bg-[#161B22] p-4 rounded-lg border border-slate-800 break-all">
                      <span className="text-xs text-slate-500 uppercase tracking-widest block mb-2">Final Proof Value:</span>
                      <div className="text-slate-300 max-h-32 overflow-y-auto custom-scrollbar leading-relaxed">
                        {algoResult.matrix_result_value}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}