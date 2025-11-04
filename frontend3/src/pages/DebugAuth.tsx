import React from 'react';
import { useAuth } from '../context/AuthProvider';
import api from '../api/axios';

export default function DebugAuth() {
  const { user, token, loading, logout } = useAuth();

  const showLocalStorage = () => {
    const keys = ['api_token', 'user'];
    return keys.reduce((acc: any, k) => {
      try {
        acc[k] = localStorage.getItem(k);
      } catch (e) {
        acc[k] = `error: ${String(e)}`;
      }
      return acc;
    }, {});
  };

  const handleRefreshUser = async () => {
    try {
      const res = await api.get('/user');
      alert('Fetched user: ' + JSON.stringify(res.data, null, 2));
    } catch (e: any) {
      alert('Error: ' + (e?.message || String(e)));
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Debug Auth</h2>
      <div className="mb-4">
        <strong>loading:</strong> {String(loading)}
      </div>

      <div className="mb-4">
        <strong>token:</strong>
        <pre className="bg-gray-100 p-2 rounded">{String(token)}</pre>
      </div>

      <div className="mb-4">
        <strong>user:</strong>
        <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(user, null, 2)}</pre>
      </div>

      <div className="mb-4">
        <strong>localStorage:</strong>
        <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(showLocalStorage(), null, 2)}</pre>
      </div>

      <div className="space-x-2">
        <button onClick={handleRefreshUser} className="px-3 py-1 bg-blue-500 text-white rounded">Refresh /api/user</button>
        <button onClick={() => logout()} className="px-3 py-1 bg-red-500 text-white rounded">Logout</button>
      </div>
    </div>
  );
}
