import { useState, useEffect } from 'react';
import App from './App';
import { AdminDashboard } from './components/AdminDashboard';

export function Router() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Simple routing logic
  if (currentPath === '/admin' || currentPath === '/admin/') {
    return <AdminDashboard />;
  }

  return <App />;
}
