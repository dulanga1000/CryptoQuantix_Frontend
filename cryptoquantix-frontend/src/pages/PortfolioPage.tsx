import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters'; // 🔥 Removed formatPercent
import Sidebar from '../components/Sidebar';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MASTER_ASSETS } from '../constants/assets'; 

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<any>(null);
  const [cryptoAssets, setCryptoAssets] = useState<any[]>([]);
  const [usdBalance, setUsdBalance] = useState<number>(0);
  
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  
  // Form State
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [livePrice, setLivePrice] = useState<number | null>(null);
  // 🔥 Removed fetchingLivePrice state

  const fetchData = async () => {
    try {
      const response = await api.get('/analytics/portfolio');
      setPortfolio(response.data);
      
      const usd = response.data.assets.find((a: any) => a.symbol === 'USD');
      setUsdBalance(usd ? usd.quantity : 0);
      
      const cryptos = response.data.assets.filter((a: any) => a.symbol !== 'USD' && a.quantity > 0);
      setCryptoAssets(cryptos);

    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!symbol) {
      setLivePrice(null);
      return;
    }
    const fetchCurrentPrice = async () => {
      try {
        const res = await api.get(`/market/price/${symbol}`);
        setLivePrice(res.data.price);
      } catch (err) {
        setLivePrice(null);
      }
    };
    fetchCurrentPrice();
  }, [symbol]);

  const totalCost = (parseFloat(quantity) || 0) * (parseFloat(buyPrice) || 0);
  const isInsufficientFunds = totalCost > usdBalance;

  const handleAddTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isInsufficientFunds) return;

    try {
      await api.post('/analytics/portfolio/trade', {
        symbol: symbol.toUpperCase().trim(),
        quantity: parseFloat(quantity),
        buy_price: parseFloat(buyPrice)
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

  const chartData = cryptoAssets.map((asset: any) => ({
    name: asset.symbol,
    value: asset.quantity * asset.current_price
  }));

  if (loading) {
    return (
      <div className="flex w-full min-h-[calc(100vh-64px)] bg-slate-50 font-sans">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 animate-pulse">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium">Loading Portfolio Ledger...</p>
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
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Portfolio Ledger</h1>
              <p className="text-slate-500 mt-1">Manage your holdings and track network performance.</p>
            </div>
            <button 
              onClick={handleDownloadReport} 
              disabled={downloading}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm font-bold py-2.5 px-6 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {downloading ? '⏳ Generating PDF...' : 'Export Report'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-800 text-white">
              <p className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-1">Purchasing Power</p>
              <p className="text-3xl font-extrabold text-emerald-400">{formatCurrency(usdBalance)}</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Total Invested</p>
              <p className="text-3xl font-extrabold text-slate-900">{formatCurrency(portfolio?.total_invested || 0)}</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Crypto Value</p>
              <p className="text-3xl font-extrabold text-blue-600">{formatCurrency(portfolio?.total_value || 0)}</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Net P&L</p>
              <p className={`text-3xl font-extrabold ${portfolio?.overall_p_l >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {portfolio?.overall_p_l > 0 ? '+' : ''}{formatCurrency(portfolio?.overall_p_l || 0)}
              </p>
            </div>
          </div>

          {cryptoAssets.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 flex flex-col items-center">
              <h3 className="text-lg font-bold text-slate-900 w-full text-left mb-2">Asset Allocation</h3>
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value" stroke="none">
                      {chartData.map((entry: any, index: number) => (
                        <Cell key={entry.name || `cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(value || 0)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900">Crypto Holdings</h3>
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
                    {cryptoAssets.map((asset: any) => {
                      const isProfit = asset.p_l >= 0;
                      return (
                        <tr key={asset.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
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
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {cryptoAssets.length === 0 && (
                      <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">No crypto assets held.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Smart Add Trade Form */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Execute Trade</h3>
              <form onSubmit={handleAddTrade} className="space-y-5">
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Select Asset</label>
                  <select value={symbol} onChange={(e) => setSymbol(e.target.value)} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-900">
                    <option value="" disabled>Choose ticker...</option>
                    {MASTER_ASSETS.map(asset => (
                      <option key={asset.symbol} value={asset.symbol}>{asset.symbol} - {asset.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Quantity</label>
                  <input type="number" step="any" value={quantity} onChange={e => setQuantity(e.target.value)} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-900"/>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-1.5">
                    <label className="block text-sm font-bold text-slate-700">Buy Price (USD)</label>
                    {symbol && livePrice && (
                      <button type="button" onClick={() => setBuyPrice(livePrice.toString())} className="text-xs text-blue-600 font-medium">Use Current: {formatCurrency(livePrice)}</button>
                    )}
                  </div>
                  <input type="number" step="any" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-900"/>
                </div>

                {/* 🔥 LIVE COST DISPLAY */}
                <div className={`p-3 rounded-xl border text-sm font-bold flex justify-between items-center ${isInsufficientFunds ? 'bg-red-50 border-red-200 text-red-700' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                  <span>Total Cost:</span>
                  <span>{formatCurrency(totalCost)}</span>
                </div>

                <button type="submit" disabled={isInsufficientFunds || !symbol || !quantity || !buyPrice} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 mt-2">
                  {isInsufficientFunds ? 'Insufficient USD Balance' : 'Confirm Purchase'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}