import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    if (password === import.meta.env.VITE_ADMIN_PASSWORD) {
      localStorage.setItem('adminAuth', 'true');
      navigate('/admin');
    } else {
      alert('Wrong password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-violet-50">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-violet-700 mb-6">
          Admin Login 🔐
        </h1>

        <input
          type="password"
          placeholder="Enter admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded-2xl p-4 outline-none focus:ring-2 focus:ring-violet-400"
        />

        <button
          onClick={handleLogin}
          className="mt-6 w-full bg-violet-600 text-white py-3 rounded-2xl hover:bg-violet-700"
        >
          Login
        </button>
      </div>
    </div>
  );
}
