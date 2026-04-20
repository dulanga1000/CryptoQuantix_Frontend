import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import { formatCurrency } from '../utils/formatters';

const POPULAR_ASSETS = [
  { symbol: 'BTC-USD', name: 'Bitcoin' },
  { symbol: 'ETH-USD', name: 'Ethereum' },
  { symbol: 'SOL-USD', name: 'Solana' },
  { symbol: 'USDC-USD', name: 'USD Coin' }
];

const generateSHA256 = async (text: string) => {
  if (!text) return '';
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export default function CryptoTool() {
  // --- UI NAVIGATION STATE ---
  const [activeTab, setActiveTab] = useState<'simulator' | 'math'>('simulator');

  // --- TONELLI-SHANKS STATE ---
  const [nValue, setNValue] = useState<number | ''>(10);
  const [pValue, setPValue] = useState<number | ''>(13);
  const [tsResult, setTsResult] = useState<any>(null);
  const [tsLoading, setTsLoading] = useState(false);

  // --- NETWORK USERS & MARKET STATE ---
  const [networkUsers, setNetworkUsers] = useState<any[]>([]);
  const [marketPrice, setMarketPrice] = useState<number>(0);
  const [fetchingPrice, setFetchingPrice] = useState(false);

  // --- ECC & WEB3 STATE ---
  const [keypair, setKeypair] = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [keyLoading, setKeyLoading] = useState(false);
  
  // Transaction Builder State
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('BTC-USD');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [customMemo, setCustomMemo] = useState('');
  
  // Signing State
  const [compiledPayload, setCompiledPayload] = useState('');
  const [parsedPayloadObj, setParsedPayloadObj] = useState<any>(null);
  const [signHash, setSignHash] = useState('');
  const [signPrivKey, setSignPrivKey] = useState('');
  const [signature, setSignature] = useState<any>(null);
  const [signLoading, setSignLoading] = useState(false);
  const [signError, setSignError] = useState('');

  // Verification State
  const [verifyPayload, setVerifyPayload] = useState('');
  const [verifyPubX, setVerifyPubX] = useState('');
  const [verifyPubY, setVerifyPubY] = useState('');
  const [verifySigR, setVerifySigR] = useState('');
  const [verifySigS, setVerifySigS] = useState('');
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);

  // 1. Fetch Network Users on load
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/auth/users');
        setNetworkUsers(res.data);
      } catch (err) { console.error("Failed to fetch users"); }
    };
    fetchUsers();
  }, []);

  // 2. Fetch Live Price when Asset changes
  useEffect(() => {
    const fetchPrice = async () => {
      if (!selectedAsset) return;
      setFetchingPrice(true);
      try {
        const res = await api.get(`/market/price/${selectedAsset}`);
        setMarketPrice(res.data.price);
      } catch (err) { setMarketPrice(0); }
      finally { setFetchingPrice(false); }
    };
    fetchPrice();
  }, [selectedAsset]);

  // 3. Compile the Transaction Payload Live
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
      memo_data: customMemo || "Standard Transfer"
    };
    
    const payloadStr = JSON.stringify(payloadObj);
    setCompiledPayload(payloadStr);
    setParsedPayloadObj(payloadObj);
    generateSHA256(payloadStr).then(setSignHash);
  }, [walletAddress, selectedUser, selectedAsset, quantity, customMemo, marketPrice]);

  // Removed useEffect for setVerifyHash since setVerifyHash is deleted

  // --- HANDLERS ---
  const handleTonelliShanks = async (e: React.FormEvent) => {
    e.preventDefault();
    setTsResult(null); setTsLoading(true);
    try {
      const response = await api.post('/crypto/sqrt', { n: Number(nValue), p: Number(pValue) });
      setTsResult(response.data);
    } catch (err: any) { } finally { setTsLoading(false); }
  };

  const handleGenerateKeys = async () => {
    setKeyLoading(true); setSignature(null); setVerifyResult(null);
    try {
      const response = await api.post('/crypto/keygen');
      setKeypair(response.data);
      const addressHash = await generateSHA256(response.data.public_key_x);
      setWalletAddress(`0x${addressHash.substring(0, 40)}`);
      setSignPrivKey(response.data.private_key);
      setVerifyPubX(response.data.public_key_x);
      setVerifyPubY(response.data.public_key_y);
    } catch (err) { } finally { setKeyLoading(false); }
  };

  const handleSignTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !quantity) {
      setSignError("Please select a recipient and amount."); return;
    }
    setSignError(''); setSignature(null); setSignLoading(true); setVerifyResult(null);
    try {
      const response = await api.post('/crypto/sign', { private_key: signPrivKey, message: compiledPayload });
      setSignature(response.data);
      setVerifySigR(response.data.signature_r);
      setVerifySigS(response.data.signature_s);
      setVerifyPayload(compiledPayload); // Auto-fill verify form
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
    } catch (err: any) { } finally { setVerifyLoading(false); }
  };

  // Helper component to render the Payload clearly
  const PayloadReceipt = ({ data }: { data: any }) => {
    if (!data) return <div className="text-xs text-slate-500 text-center py-4">Waiting for transaction data...</div>;
    return (
      <div className="space-y-2 text-xs font-medium font-sans">
        <div className="flex justify-between border-b border-slate-800 pb-2 mb-2">
          <span className="text-slate-400">Network</span>
          <span className="text-blue-400">{data.chain_id}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Sender</span>
          <span className="text-slate-300 truncate max-w-36">{data.sender}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Recipient</span>
          <span className="text-emerald-400">{data.recipient}</span>
        </div>
        <div className="flex justify-between pt-2">
          <span className="text-slate-400">Asset</span>
          <span className="text-slate-300">{data.asset_ticker}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Amount</span>
          <span className="text-slate-300">{data.amount_units}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Fiat Value</span>
          <span className="text-slate-300">{formatCurrency(data.fiat_value_usd)}</span>
        </div>
        <div className="flex justify-between border-t border-slate-800 pt-2 mt-2">
          <span className="text-slate-400">Memo</span>
          <span className="text-slate-300">{data.memo_data}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Nonce</span>
          <span className="text-slate-500">{data.nonce}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex w-full min-h-[calc(100vh-64px)] bg-slate-50 font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 w-full">
          
          {/* Header & Tabs */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-6">Cryptographic Security Protocol</h1>
            
            <div className="bg-slate-200/60 p-1.5 rounded-xl inline-flex w-full sm:w-auto">
              <button onClick={() => setActiveTab('simulator')} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'simulator' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                Web3 Transaction Simulator
              </button>
              <button onClick={() => setActiveTab('math')} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'math' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                Tonelli-Shanks Engine
              </button>
            </div>
          </div>

          {/* ========================================== */}
          {/* TAB 1: WEB3 TRANSACTION SIMULATOR            */}
          {/* ========================================== */}
          {activeTab === 'simulator' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-300">
              
              {/* Card A: Secure Enclave */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <div className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">1. Authenticated Identity Enclave</h3>
                      <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Generate your wallet keys to sign transactions</p>
                    </div>
                    <button onClick={handleGenerateKeys} disabled={keyLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-colors flex items-center gap-2 text-sm shadow-md shadow-blue-600/20 w-full md:w-auto justify-center">
                      {keyLoading ? 'Generating...' : 'Generate New Keypair'}
                    </button>
                  </div>
                  {keypair ? (
                    <div className="space-y-4 animate-in fade-in">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Your Wallet Address (Hashed from PubKey)</div>
                          <div className="text-lg text-blue-600 font-mono font-bold break-all">{walletAddress}</div>
                        </div>
                        <div className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg uppercase tracking-widest self-start md:self-center">Online</div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
                          <div className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2 flex justify-between">Private Key <span className="text-slate-500">SECRET</span></div>
                          <div className="text-sm text-slate-300 font-mono break-all leading-relaxed">{keypair.private_key}</div>
                        </div>
                        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                          <div className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2 flex justify-between">Public Key <span className="text-slate-400">ON-CHAIN</span></div>
                          <div className="text-sm text-slate-600 font-mono break-all leading-relaxed line-clamp-3">X: {keypair.public_key_x}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-xl p-10 text-center border border-dashed border-slate-300 text-sm font-medium text-slate-500">
                      Generate a keypair to receive a wallet address and begin sending funds.
                    </div>
                  )}
                </div>
              </div>

              {/* Card B: Smart Transaction Builder */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                <div className="p-6 md:p-8 flex flex-col h-full">
                  <h3 className="font-bold text-slate-900 text-lg mb-6">2. Construct & Sign Transaction</h3>
                  
                  <form onSubmit={handleSignTransaction} className="space-y-5 flex-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Recipient (Network User)</label>
                      <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} required className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900">
                        <option value="" disabled>Select User...</option>
                        {networkUsers.map(user => (
                          <option key={user.id} value={user.username}>{user.full_name} (@{user.username})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Asset</label>
                        <select value={selectedAsset} onChange={e => setSelectedAsset(e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900">
                          {POPULAR_ASSETS.map(asset => <option key={asset.symbol} value={asset.symbol}>{asset.symbol}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Amount</label>
                        <input type="number" step="any" value={quantity} onChange={e => setQuantity(Number(e.target.value))} required placeholder="0.0" className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900"/>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Transaction Memo (Optional)</label>
                      <input type="text" value={customMemo} onChange={e => setCustomMemo(e.target.value)} placeholder="e.g. Payment for services" className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500"/>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex justify-between">Signer Private Key <span>{keypair ? '✓ Ready' : ''}</span></label>
                      <input type="password" value={signPrivKey} onChange={(e) => setSignPrivKey(e.target.value)} required className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 font-mono tracking-widest text-slate-500" placeholder="Paste Hex string..."/>
                    </div>

                    <button type="submit" disabled={signLoading || !walletAddress || !signPrivKey} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-amber-500/20 mt-4">
                      {signLoading ? 'Encrypting Payload...' : 'Sign Transaction'}
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
                      {fetchingPrice ? (
                        <span className="text-[10px] text-blue-400 animate-pulse">Syncing Price...</span>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-bold">Total: {formatCurrency((Number(quantity)||0) * marketPrice)}</span>
                      )}
                    </div>
                    
                    {/* Clean UI Replacement for JSON */}
                    {parsedPayloadObj ? (
                      <PayloadReceipt data={parsedPayloadObj} />
                    ) : (
                      <div className="text-xs text-slate-500 text-center py-4">Waiting for transaction data...</div>
                    )}
                    
                    <div className="mt-4 pt-4 border-t border-slate-800">
                      <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block mb-1">Generated SHA-256 Hash</span>
                      <div className="text-xs font-mono text-slate-400 break-all">{signHash || '...'}</div>
                    </div>
                  </div>

                  {signature && (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl animate-in fade-in mb-6">
                      <div className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping"></span> Broadcasted Signature
                      </div>
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
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-sm ${verifyResult.is_valid ? 'bg-emerald-100' : 'bg-red-100'}`}>
                            {verifyResult.is_valid ? '✅' : '❌'}
                          </div>
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

          {/* ========================================== */}
          {/* TAB 2: TONELLI-SHANKS MATH ENGINE            */}
          {/* ========================================== */}
          {activeTab === 'math' && (
            <div className="max-w-2xl mx-auto animate-in fade-in duration-300">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path></svg>
                    <h2 className="text-lg font-bold text-slate-800">Tonelli-Shanks Engine</h2>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md uppercase tracking-widest">Base Math</span>
                </div>
                
                <div className="p-6 md:p-8">
                  <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                    Resolve quadratic congruences ($x^2 \equiv n \pmod p$) required for uncompressing Elliptic Curve public keys on the blockchain.
                  </p>
                  
                  <form onSubmit={handleTonelliShanks} className="space-y-6 mb-8">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Integer (n)</label>
                        <input type="number" value={nValue} onChange={e => setNValue(Number(e.target.value))} required className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 text-lg"/>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Prime Field (p)</label>
                        <input type="number" value={pValue} onChange={e => setPValue(Number(e.target.value))} required className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 text-lg"/>
                      </div>
                    </div>
                    <button type="submit" disabled={tsLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50">
                      {tsLoading ? 'Computing Roots...' : 'Execute Algorithm'}
                    </button>
                  </form>

                  {tsResult && (
                    <div className="bg-[#0D1117] border border-slate-800 rounded-xl p-6 shadow-inner overflow-hidden animate-in fade-in">
                      <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-4">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <span className="ml-2 text-xs font-mono text-slate-500">root_calculator.sh</span>
                      </div>
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