import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import InvestmentTool from './pages/InvestmentTool';
import CryptoTool from './pages/CryptoTool';
import ProtectedRoute from './components/ProtectedRoute'; // Import our new guard
import MarketDataTool from './pages/MarketDataTool';
import PortfolioPage from './pages/PortfolioPage';

function App() {
  return (
    <div className="min-h-screen font-sans text-slate-900 bg-slate-50 flex flex-col">
      <Navbar />
      
      <div className="flex-grow flex">
        <Routes>
          {/* PUBLIC ROUTES - Anyone can access these */}
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          
          {/* SECURE ROUTES - Only logged in users can access these */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/investment" element={<InvestmentTool />} />
            <Route path="/crypto" element={<CryptoTool />} />
            <Route path="/market-data" element={<MarketDataTool />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
          </Route>
        </Routes>
      </div>
    </div>
  );
}

export default App;