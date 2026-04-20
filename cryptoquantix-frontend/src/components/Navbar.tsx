import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  // Check if the JWT token exists to determine auth state
  const isAuthenticated = !!localStorage.getItem('access_token');

  const handleLogout = () => {
    // 1. Remove tokens from browser
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    // 2. Redirect to homepage
    navigate('/');
  };

  return (
    <nav className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Brand */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="text-xl font-bold tracking-wider text-blue-400">
              CryptoQuantix
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition">
                  Dashboard
                </Link>
                <button 
                  onClick={handleLogout}
                  className="bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/auth" className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition">
                  Sign In
                </Link>
                <Link to="/auth" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}