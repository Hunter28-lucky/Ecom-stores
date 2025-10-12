import { useState, useEffect } from 'react';
import App from './App';
import { AdminDashboard } from './components/AdminDashboard';

// Check if Supabase is configured
const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && 
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

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
    // Show setup message if Supabase not configured
    if (!isSupabaseConfigured) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-2xl bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">🔧 CMS Setup Required</h1>
            <p className="text-gray-600 mb-6">
              The admin dashboard requires Supabase configuration. Please follow these steps:
            </p>
            <ol className="list-decimal list-inside space-y-3 text-gray-700 mb-6">
              <li>Create a free account at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">supabase.com</a></li>
              <li>Create a new project and wait for provisioning</li>
              <li>Run the SQL schema from <code className="bg-gray-100 px-2 py-1 rounded">supabase-schema.sql</code></li>
              <li>Add environment variables to <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code>:</li>
            </ol>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm mb-6">
              VITE_SUPABASE_URL=https://your-project.supabase.co<br/>
              VITE_SUPABASE_ANON_KEY=your-anon-key
            </div>
            <p className="text-gray-600 mb-4">
              See <code className="bg-gray-100 px-2 py-1 rounded">CMS_SETUP_GUIDE.md</code> for detailed instructions.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Back to Store
            </button>
          </div>
        </div>
      );
    }
    
    return <AdminDashboard />;
  }

  return <App />;
}
