import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
  // Check if the user has an access token saved in their browser
  const isAuthenticated = !!localStorage.getItem('access_token');

  // If they are not logged in, redirect them to the Auth page
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // If they are logged in, allow them to view the protected child routes
  return <Outlet />;
}