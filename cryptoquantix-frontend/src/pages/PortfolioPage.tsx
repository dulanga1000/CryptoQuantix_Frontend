import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { formatCurrency, formatPercent } from '../utils/formatters';
import Sidebar from '../components/Sidebar';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Realistic list of verified assets
const POPULAR_ASSETS = [
  { symbol: 'BTC-USD', name: 'Bitcoin', type: 'Crypto' },
  { symbol: 'ETH-USD', name: 'Ethereum', type: 'Crypto' },
  { symbol: 'SOL-USD', name: 'Solana', type: 'Crypto' },
  { symbol: 'XRP-USD', name: 'XRP', type: 'Crypto' },
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'Stock' },
  { symbol: 'TSLA', name: 'Tesla Inc.', type: 'Stock' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', type: 'Stock' },
  { symbol: 'SPY', name: 'S&P 500 ETF', type: 'Index' },
];

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  
  // Form State
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  
  // Realistic Feature: Live Price Fetching for the form
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [fetchingLivePrice, setFetchingLivePrice] = useState(false);

  const fetchData = async () => {
    try {
      const response = await api.get('/analytics/portfolio');
      setPortfolio(response.data);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch live price when a user selects a symbol in the dropdown
  useEffect(() => {
    if (!symbol) {
      setLivePrice(null);
      return;
    }
    const fetchCurrentPrice = async () => {
      setFetchingLivePrice(true);
      try {
        const res = await api.get(`/market/price/${symbol}`);
        setLivePrice(res.data.price);
      } catch (err) {
        setLivePrice(null);
      } finally {
        setFetchingLivePrice(false);
      }
    };
    fetchCurrentPrice();
  }, [symbol]);

  const handleAddTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    const numQty = parseFloat(quantity);
    const numPrice = parseFloat(buyPrice);

    if (!symbol || isNaN(numQty) || isNaN(numPrice)) {
      alert("Please enter a valid symbol, quantity, and price.");
      return;
    }

    try {
      await api.post('/analytics/portfolio/trade', {
        symbol: symbol.toUpperCase().trim(),
        quantity: numQty,
        buy_price: numPrice
      });
      setSymbol(''); setQuantity(''); setBuyPrice(''); setLivePrice(null);
      fetchData(); 
    } catch (err: any) {
      alert(err.response?.data?.msg || "Trade failed.");
    }
  };

  const handleDownloadReport = async () => {
    setDownloading(true);
    try {
      const response = await api.get('/reports/portfolio/download', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'CryptoQuantix_Portfolio_Report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to generate PDF report.");
    } finally {
      setDownloading(false);
    }
  };

  const chartData = portfolio?.assets?.map((asset: any) => ({
    name: asset.symbol,
    value: asset.quantity * asset.current_price
  })) || [];

  if (loading) {
    return (
      <div className="flex w-full min-h-[calc(100vh-64px)] bg-slate-50 font-sans">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 animate-pulse">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium">Loading Portfolio Data...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex w-full min-h-[calc(100vh-64px)] bg-slate-50 font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 w-full">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Portfolio Overview</h1>
              <p className="text-slate-500 mt-1">Manage your holdings and track performance.</p>
            </div>
            <button 
              onClick={handleDownloadReport} 
              disabled={downloading}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm font-bold py-2.5 px-6 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {downloading ? (
                <span className="flex items-center gap-2">⏳ Generating PDF...</span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  Export Report
                </span>
              )}
            </button>
          </div>

          {/* Premium Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg></div>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Total Capital</p>
              <p className="text-3xl font-extrabold text-slate-900">{formatCurrency(portfolio?.total_invested || 0)}</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-blue-600"><svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z"/></svg></div>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Current Value</p>
              <p className="text-3xl font-extrabold text-blue-600">{formatCurrency(portfolio?.total_value || 0)}</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-600"><svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg></div>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Net P&L</p>
              <p className={`text-3xl font-extrabold ${portfolio?.overall_p_l >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {portfolio?.overall_p_l > 0 ? '+' : ''}{formatCurrency(portfolio?.overall_p_l || 0)}
              </p>
            </div>
          </div>

          {/* Asset Allocation Chart */}
          {portfolio?.assets?.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 flex flex-col items-center">
              <h3 className="text-lg font-bold text-slate-900 w-full text-left mb-2">Asset Allocation</h3>
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value" stroke="none">
                      {chartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(value || 0)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tables and Forms Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Holdings Table */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900">Current Holdings</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Asset</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Qty</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Avg Buy</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {portfolio?.assets.map((asset: any) => {
                      const isProfit = asset.p_l >= 0;
                      return (
                        <tr key={asset.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                {asset.symbol.charAt(0)}
                              </div>
                              <span className="font-bold text-slate-900">{asset.symbol}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-medium text-right">{asset.quantity}</td>
                          <td className="px-6 py-4 text-slate-600 font-medium text-right">{formatCurrency(asset.buy_price)}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex flex-col items-end">
                              <span className={`font-bold ${isProfit ? 'text-emerald-600' : 'text-red-600'}`}>
                                {isProfit ? '+' : ''}{formatCurrency(asset.p_l)}
                              </span>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${isProfit ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                {formatPercent(asset.p_l_percent / 100)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {portfolio?.assets?.length === 0 && (
                      <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">No open positions in your portfolio.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Smart Add Trade Form */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Record Transaction</h3>
              <form onSubmit={handleAddTrade} className="space-y-5">
                
                {/* 🔥 Realistic Dropdown Component */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Select Asset</label>
                  <div className="relative">
                    <select
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value)}
                      required
                      className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-medium text-slate-900"
                    >
                      <option value="" disabled>Choose ticker...</option>
                      {POPULAR_ASSETS.map(asset => (
                        <option key={asset.symbol} value={asset.symbol}>
                          {asset.symbol} - {asset.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Quantity</label>
                  <input type="number" step="any" placeholder="e.g., 0.5" value={quantity} onChange={e => setQuantity(e.target.value)} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-900"/>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-1.5">
                    <label className="block text-sm font-bold text-slate-700">Buy Price (USD)</label>
                    {/* Live Price Helper */}
                    {symbol && (
                      <div className="text-xs text-slate-500 font-medium">
                        {fetchingLivePrice ? 'Fetching live price...' : livePrice ? (
                          <button type="button" onClick={() => setBuyPrice(livePrice.toString())} className="text-blue-600 hover:text-blue-800 transition-colors">
                            Use Current: {formatCurrency(livePrice)}
                          </button>
                        ) : null}
                      </div>
                    )}
                  </div>
                  <input type="number" step="any" placeholder="0.00" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-900"/>
                </div>

                <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-slate-900/20 mt-2">
                  Add to Portfolio
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}