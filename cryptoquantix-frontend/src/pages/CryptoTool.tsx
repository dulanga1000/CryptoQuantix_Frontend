import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import { formatCurrency } from '../utils/formatters';
import { MASTER_ASSETS } from '../constants/assets';

const generateSHA256 = async (text: string) => {
  if (!text) return '';
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Legendre symbol: checks if n is a quadratic residue modulo p
// If result is 1, then n has a square root modulo p (valid)
// If result is -1 or p-1, then n does NOT have a square root modulo p (invalid)
const legendreSymbol = (n: number, p: number): number => {
  const result = Math.pow(n % p, (p - 1) / 2) % p;
  return result === p - 1 ? -1 : result;
};

// Helper: Get suggested valid values for a given prime p
const getSuggestedValues = (p: number): number[] => {
  const suggestions: number[] = [];
  for (let i = 1; i < Math.min(p, 20) && suggestions.length < 3; i++) {
    if (legendreSymbol(i, p) === 1) {
      suggestions.push(i);
    }
  }
  return suggestions;
};

export default function CryptoTool() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'math'>('simulator');
  const [nValue, setNValue] = useState<number | ''>(10);
  const [pValue, setPValue] = useState<number | ''>(13);
  const [tsResult, setTsResult] = useState<any>(null);
  const [tsLoading, setTsLoading] = useState(false);
  const [nValueError, setNValueError] = useState('');
  const [pValueError, setPValueError] = useState('');
  const [tsError, setTsError] = useState('');
  const [suggestedValues, setSuggestedValues] = useState<number[]>([]);

  // Validate both n and p values
  const validateValues = (n: number | '', p: number | '') => {
    let nError = '';
    let pError = '';
    let suggestions: number[] = [];

    // Validate n
    if (typeof n === 'number') {
      if (n <= 0) nError = 'n must be positive';
      else if (n > 20577) nError = 'n cannot exceed 20577';
      else if (!Number.isInteger(n)) nError = 'n must be an integer';
    }

    // Validate p (must be prime - simple check)
    if (typeof p === 'number') {
      if (p <= 2) pError = 'p must be greater than 2';
      else if (!Number.isInteger(p)) pError = 'p must be an integer';
      else if (p % 2 === 0 && p !== 2) pError = 'p should be an odd prime';
    }

    // Check if n is a quadratic residue modulo p
    if (typeof n === 'number' && typeof p === 'number' && !nError && !pError) {
      if (p > 2 && legendreSymbol(n, p) !== 1) {
        suggestions = getSuggestedValues(p);
        nError = `n=${n} has no square root modulo p=${p}`;
      }
    }

    setNValueError(nError);
    setPValueError(pError);
    setSuggestedValues(suggestions);
  };

  // Validate nValue doesn't exceed 20577 and is a valid quadratic residue
  const handleNValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? '' : Number(e.target.value);
    setNValue(value);
    setTsError('');
    validateValues(value, pValue);
  };

  const handlePValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? '' : Number(e.target.value);
    setPValue(value);
    setTsError('');
    validateValues(nValue, value);
  };

  const [networkUsers, setNetworkUsers] = useState<any[]>([]);
  const [marketPrice, setMarketPrice] = useState<number>(0);
  
  // 🔥 Removed fetchingPrice state

  const [myBalances, setMyBalances] = useState<Record<string, number>>({});

  const [keypair, setKeypair] = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [keyLoading, setKeyLoading] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('BTC-USD');
  const [quantity, setQuantity] = useState<number | ''>('');
  
  // 🔥 Removed customMemo state
  
  const [compiledPayload, setCompiledPayload] = useState('');
  const [parsedPayloadObj, setParsedPayloadObj] = useState<any>(null);
  const [signHash, setSignHash] = useState('');
  const [signPrivKey, setSignPrivKey] = useState('');
  const [signature, setSignature] = useState<any>(null);
  const [signLoading, setSignLoading] = useState(false);
  const [signError, setSignError] = useState('');

  const [verifyPayload, setVerifyPayload] = useState('');
  const [verifyPubX, setVerifyPubX] = useState('');
  const [verifyPubY, setVerifyPubY] = useState('');
  const [verifySigR, setVerifySigR] = useState('');
  const [verifySigS, setVerifySigS] = useState('');
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const usersRes = await api.get('/auth/users');
        setNetworkUsers(usersRes.data);

        const portfolioRes = await api.get('/analytics/portfolio');
        const balancesMap: Record<string, number> = {};
        portfolioRes.data.assets.forEach((asset: any) => {
          balancesMap[asset.symbol] = asset.quantity;
        });
        setMyBalances(balancesMap);

      } catch (err) { console.error("Failed to fetch initial data"); }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchPrice = async () => {
      if (!selectedAsset) return;
      try {
        const res = await api.get(`/market/price/${selectedAsset}`);
        setMarketPrice(res.data.price);
      } catch (err) { setMarketPrice(0); }
    };
    fetchPrice();
  }, [selectedAsset]);

  useEffect(() => {
    if (!walletAddress) {
      setCompiledPayload("");
      setParsedPayloadObj(null);
      return;
    }
    const payloadObj = {
      chain_id: "cryptoquantix_mainnet_v1",
      tx_type: "ASSET_TRANSFER",
      nonce: Math.floor(Math.random() * 900000) + 100000,
      timestamp: new Date().toISOString(),
      sender: walletAddress,
      recipient: selectedUser ? `@${selectedUser}` : "pending_selection",
      asset_ticker: selectedAsset,
      amount_units: Number(quantity) || 0,
      fiat_value_usd: parseFloat(((Number(quantity) || 0) * marketPrice).toFixed(2)),
      memo_data: "Standard Transfer" // 🔥 Hardcoded to remove the unused variable
    };
    
    const payloadStr = JSON.stringify(payloadObj);
    setCompiledPayload(payloadStr);
    setParsedPayloadObj(payloadObj);
    generateSHA256(payloadStr).then(setSignHash);
  }, [walletAddress, selectedUser, selectedAsset, quantity, marketPrice]);

  const handleTonelliShanks = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation check
    validateValues(nValue, pValue);
    if (nValueError || pValueError) {
      return;
    }
    
    setTsResult(null); 
    setTsError('');
    setTsLoading(true);
    try {
      const response = await api.post('/crypto/sqrt', { n: Number(nValue), p: Number(pValue) });
      setTsResult(response.data);
    } catch (err: any) { 
      const errorMsg = err.response?.data?.error || 'Computation failed';
      setTsError(errorMsg);
      console.error('Tonelli-Shanks error:', errorMsg);
    } finally { 
      setTsLoading(false); 
    }
  };

  const handleGenerateKeys = async () => {
    setKeyLoading(true); setSignature(null); setVerifyResult(null);
    try {
      const response = await api.post('/crypto/keygen');
      setKeypair(response.data);
      const addressHash = await generateSHA256(response.data.public_key_x);
      const address = `0x${addressHash.substring(0, 40)}`;
      setWalletAddress(address);
      setSignPrivKey(response.data.private_key);
      setVerifyPubX(response.data.public_key_x);
      setVerifyPubY(response.data.public_key_y);

      localStorage.setItem('cq_secure_wallet', JSON.stringify({
        keypair: response.data,
        address: address
      }));
    } catch (err) { console.error("Failed to generate keys"); } 
    finally { setKeyLoading(false); }
  };

  useEffect(() => {
    const savedWallet = localStorage.getItem('cq_secure_wallet');
    if (savedWallet) {
      const parsed = JSON.parse(savedWallet);
      setKeypair(parsed.keypair);
      setWalletAddress(parsed.address);
      setSignPrivKey(parsed.keypair.private_key);
      setVerifyPubX(parsed.keypair.public_key_x);
      setVerifyPubY(parsed.keypair.public_key_y);
    } else {
      handleGenerateKeys();
    }
  }, []);

  const availableBalance = myBalances[selectedAsset] || 0;
  const isInsufficientFunds = Number(quantity) > availableBalance;

  const handleSignTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !quantity) {
      setSignError("Please select a recipient and amount."); return;
    }
    if (isInsufficientFunds) {
      setSignError(`Insufficient ${selectedAsset} balance.`); return;
    }

    setSignError(''); setSignature(null); setSignLoading(true); setVerifyResult(null);
    try {
      const response = await api.post('/crypto/sign', { private_key: signPrivKey, message: compiledPayload });
      setSignature(response.data);
      setVerifySigR(response.data.signature_r);
      setVerifySigS(response.data.signature_s);
      setVerifyPayload(compiledPayload); 
    } catch (err: any) {
      setSignError(err.response?.data?.error || 'Signing failed.');
    } finally {
      setSignLoading(false);
    }
  };

  const handleVerifySignature = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyResult(null); setVerifyLoading(true);
    try {
      const response = await api.post('/crypto/verify', {
        message: verifyPayload, public_key_x: verifyPubX, public_key_y: verifyPubY,
        signature_r: verifySigR, signature_s: verifySigS
      });
      setVerifyResult(response.data);
      
      if (response.data.is_valid) {
        setMyBalances(prev => ({
          ...prev,
          [selectedAsset]: prev[selectedAsset] - Number(quantity)
        }));
      }
    } catch (err: any) { 
      setVerifyResult({ is_valid: false, message: err.response?.data?.error || "Verification failed." });
    } finally { 
      setVerifyLoading(false); 
    }
  };

  const PayloadReceipt = ({ data }: { data: any }) => {
    if (!data) return <div className="text-xs text-slate-500 text-center py-4">Waiting for transaction data...</div>;
    return (
      <div className="space-y-2 text-xs font-medium font-sans">
        <div className="flex justify-between border-b border-slate-800 pb-2 mb-2">
          <span className="text-slate-400">Network</span><span className="text-blue-400">{data.chain_id}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Sender</span><span className="text-slate-300 truncate max-w-36">{data.sender}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Recipient</span><span className="text-emerald-400">{data.recipient}</span>
        </div>
        <div className="flex justify-between pt-2">
          <span className="text-slate-400">Asset</span><span className="text-slate-300">{data.asset_ticker}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Amount</span><span className="text-slate-300">{data.amount_units}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Fiat Value</span><span className="text-slate-300">{formatCurrency(data.fiat_value_usd)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex w-full min-h-[calc(100vh-64px)] bg-slate-50 font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 w-full">
          
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-6">Cryptographic Protocol</h1>
            <div className="bg-slate-200/60 p-1.5 rounded-xl inline-flex w-full sm:w-auto">
              <button onClick={() => setActiveTab('simulator')} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'simulator' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Web3 Transaction Simulator</button>
              <button onClick={() => setActiveTab('math')} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'math' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Tonelli-Shanks Engine</button>
            </div>
          </div>

          {activeTab === 'simulator' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-300">
              
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <div className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">1. Authenticated Identity Enclave</h3>
                      <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Generate your wallet keys to sign transactions</p>
                    </div>
                    <button onClick={() => handleGenerateKeys()} disabled={keyLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-colors flex items-center gap-2 text-sm shadow-md shadow-blue-600/20 w-full md:w-auto justify-center">
                      {keyLoading ? 'Generating...' : 'Generate New Keypair'}
                    </button>
                  </div>
                  {keypair && (
                    <div className="space-y-4 animate-in fade-in">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                        <div>
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Your Wallet Address (Hashed from PubKey)</div>
                          <div className="text-lg text-blue-600 font-mono font-bold break-all">{walletAddress}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
                          <div className="text-xs font-bold text-red-400 uppercase mb-2 flex justify-between">Private Key <span className="text-slate-500">SECRET</span></div>
                          <div className="text-sm text-slate-300 font-mono break-all leading-relaxed">{keypair.private_key}</div>
                        </div>
                        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                          <div className="text-xs font-bold text-blue-600 uppercase mb-2 flex justify-between">Public Key <span className="text-slate-400">ON-CHAIN</span></div>
                          <div className="text-sm text-slate-600 font-mono break-all leading-relaxed line-clamp-3">X: {keypair.public_key_x}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                <div className="p-6 md:p-8 flex flex-col h-full">
                  <h3 className="font-bold text-slate-900 text-lg mb-6">2. Construct Transaction</h3>
                  
                  <form onSubmit={handleSignTransaction} className="space-y-5 flex-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Recipient (Network User)</label>
                      <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} required className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900">
                        <option value="" disabled>Select User...</option>
                        {networkUsers.map(user => <option key={user.id} value={user.username}>{user.full_name} (@{user.username})</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Asset</label>
                        <select value={selectedAsset} onChange={e => setSelectedAsset(e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900">
                          {MASTER_ASSETS.filter(a => a.type === 'Crypto').map(a => <option key={a.symbol} value={a.symbol}>{a.symbol}</option>)}
                        </select>
                      </div>
                      <div>
                        <div className="flex justify-between items-end mb-1.5">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</label>
                          <span className={`text-[10px] font-bold ${isInsufficientFunds ? 'text-red-500' : 'text-emerald-500'}`}>
                            Wallet: {availableBalance} {selectedAsset.split('-')[0]}
                          </span>
                        </div>
                        <input type="number" step="any" value={quantity} onChange={e => setQuantity(Number(e.target.value))} required placeholder="0.0" className={`w-full px-4 py-3.5 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 font-bold text-slate-900 ${isInsufficientFunds ? 'border-red-400 focus:ring-red-500 bg-red-50' : 'border-slate-200 focus:ring-amber-500'}`}/>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex justify-between">Signer Private Key <span>{keypair ? '✓ Ready' : ''}</span></label>
                      <input type="password" value={signPrivKey} onChange={(e) => setSignPrivKey(e.target.value)} required className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 font-mono tracking-widest text-slate-500" placeholder="Paste Hex string..."/>
                    </div>

                    <button type="submit" disabled={signLoading || !walletAddress || !signPrivKey || isInsufficientFunds} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-amber-500/20 mt-4">
                      {signLoading ? 'Encrypting Payload...' : isInsufficientFunds ? 'Insufficient Funds' : 'Sign Transaction'}
                    </button>
                    {signError && <p className="text-xs text-red-600 font-bold mt-2 text-center">{signError}</p>}
                  </form>
                </div>
              </div>

              {/* Card C: Network Consensus */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative flex flex-col h-full">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                <div className="p-6 md:p-8 flex flex-col h-full">
                  <h3 className="font-bold text-slate-900 text-lg mb-6">3. Network Node Verification</h3>
                  <div className="bg-[#0D1117] p-5 rounded-xl border border-slate-800 flex flex-col mb-6 shadow-inner">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transaction Details</span>
                      <span className="text-[10px] text-emerald-400 font-bold">Total: {formatCurrency((Number(quantity)||0) * marketPrice)}</span>
                    </div>
                    {parsedPayloadObj ? <PayloadReceipt data={parsedPayloadObj} /> : <div className="text-xs text-slate-500 py-4">Waiting...</div>}
                    <div className="mt-4 pt-4 border-t border-slate-800">
                      <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block mb-1">Generated SHA-256 Hash</span>
                      <div className="text-xs font-mono text-slate-400 break-all">{signHash || '...'}</div>
                    </div>
                  </div>

                  {signature && (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-6">
                      <div className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping"></span> Broadcasted Signature</div>
                      <div className="text-xs font-mono text-amber-900 break-all space-y-1">
                        <div><span className="font-bold">R:</span> {signature.signature_r.substring(0, 30)}...</div>
                        <div><span className="font-bold">S:</span> {signature.signature_s.substring(0, 30)}...</div>
                      </div>
                    </div>
                  )}

                  <div className="mt-auto">
                    <form onSubmit={handleVerifySignature}>
                      <button type="submit" disabled={verifyLoading || !verifySigR} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-slate-900/20">
                        {verifyLoading ? 'Validating Ledger...' : 'Run Cryptographic Verification'}
                      </button>
                    </form>
                    
                    {verifyResult && (
                      <div className={`mt-4 p-5 rounded-xl border text-sm font-bold flex flex-col items-start gap-3 animate-in zoom-in-95 ${verifyResult.is_valid ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-sm ${verifyResult.is_valid ? 'bg-emerald-100' : 'bg-red-100'}`}>{verifyResult.is_valid ? '✅' : '❌'}</div>
                          <p className="text-base">{verifyResult.is_valid ? 'Transaction Authenticated' : 'Transaction Rejected'}</p>
                        </div>
                        <p className={`text-sm font-medium ${verifyResult.is_valid ? 'text-emerald-600' : 'text-red-600'}`}>{verifyResult.message}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TONELLI-SHANKS MATH ENGINE */}
          {activeTab === 'math' && (
            <div className="max-w-2xl mx-auto animate-in fade-in duration-300">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-800">Tonelli-Shanks Engine</h2>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md uppercase tracking-widest">Base Math</span>
                </div>
                <div className="p-6 md:p-8">
                  {(nValueError || pValueError || tsError) && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 border border-red-200 flex items-start gap-3">
                      <span className="mt-0.5 text-lg">⚠️</span>
                      <div className="flex-1">
                        {nValueError && <p className="text-sm font-medium">{nValueError}</p>}
                        {pValueError && <p className="text-sm font-medium">{pValueError}</p>}
                        {tsError && <p className="text-sm font-medium">{tsError}</p>}
                        
                        {suggestedValues.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-red-300">
                            <p className="text-xs font-bold mb-2">💡 <strong>Valid n values for p={pValue}:</strong></p>
                            <div className="flex flex-wrap gap-2">
                              {suggestedValues.map((val) => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => {
                                    setNValue(val);
                                    validateValues(val, pValue);
                                  }}
                                  className="text-xs bg-red-200 hover:bg-red-300 text-red-800 px-3 py-1 rounded-md font-semibold transition-colors"
                                >
                                  n={val}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <form onSubmit={handleTonelliShanks} className="space-y-6 mb-8">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Integer (n)</label>
                        <div>
                          <input 
                            type="number" 
                            value={nValue} 
                            onChange={handleNValueChange} 
                            required 
                            max="20577" 
                            className={`w-full px-4 py-3.5 bg-slate-50 border ${nValueError ? 'border-red-400 bg-red-50' : 'border-slate-200'} rounded-xl outline-none font-mono font-bold text-slate-900 focus:ring-2 ${nValueError ? 'focus:ring-red-500' : 'focus:ring-indigo-500'} text-lg`}
                            placeholder="e.g., 5"
                          />
                          {nValueError && <p className="text-xs text-red-600 mt-1 font-medium">✗ {nValueError}</p>}
                          {!nValueError && typeof nValue === 'number' && <p className="text-xs text-emerald-600 mt-1 font-medium">✓ Valid</p>}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Prime Field (p)</label>
                        <div>
                          <input 
                            type="number" 
                            value={pValue} 
                            onChange={handlePValueChange} 
                            required 
                            className={`w-full px-4 py-3.5 bg-slate-50 border ${pValueError ? 'border-red-400 bg-red-50' : 'border-slate-200'} rounded-xl outline-none font-mono font-bold text-slate-900 focus:ring-2 ${pValueError ? 'focus:ring-red-500' : 'focus:ring-indigo-500'} text-lg`}
                            placeholder="e.g., 11"
                          />
                          {pValueError && <p className="text-xs text-red-600 mt-1 font-medium">✗ {pValueError}</p>}
                          {!pValueError && typeof pValue === 'number' && <p className="text-xs text-emerald-600 mt-1 font-medium">✓ Valid</p>}
                        </div>
                      </div>
                    </div>
                    <button type="submit" disabled={tsLoading || !!nValueError || !!pValueError} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                      {tsLoading ? 'Computing Roots...' : 'Execute Algorithm'}
                    </button>
                  </form>

                  {tsResult && (
                    <div className="bg-[#0D1117] border border-slate-800 rounded-xl p-6 shadow-inner overflow-hidden animate-in fade-in">
                      <div className="text-sm font-mono text-emerald-400 mb-6 font-bold bg-emerald-400/10 border border-emerald-400/20 inline-block px-4 py-2 rounded-lg">
                        Roots Found: {tsResult.root_1} , {tsResult.root_2}
                      </div>
                      <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2 font-mono text-sm text-slate-400">
                        {tsResult.steps.map((step: string, idx: number) => (
                          <div key={idx} className="flex gap-4">
                            <span className="text-slate-600 select-none">[{String(idx + 1).padStart(2, '0')}]</span>
                            <span className="text-slate-300 leading-relaxed">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}