import { useState } from 'react';

const API_BASE = import.meta.env.DEV
  ? 'http://localhost:3000'
  : 'https://your-backend-url.onrender.com';

export default function SubmitConfession() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submitConfession = async () => {
    if (!message.trim()) {
      alert('Please write your confession');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/api/confessions/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Submit failed');
      }

      alert('Confession submitted 🎭');
      setMessage('');
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-2xl p-6">
        <h2 className="text-white text-xl font-semibold mb-4">
          Anonymous Confession 🎭
        </h2>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          placeholder="Write your confession..."
          className="w-full rounded-2xl bg-white/[0.03] border border-white/10 text-white p-4 outline-none resize-none"
        />

        <button
          onClick={submitConfession}
          disabled={loading}
          className="w-full mt-4 rounded-2xl bg-white text-black font-semibold py-3 hover:scale-[1.02] transition-all"
        >
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </div>
  );
}
