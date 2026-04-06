import { useState } from 'react';

const API_BASE = import.meta.env.DEV
  ? 'http://localhost:3000'
  : 'https://confession-saas-node-v7-webhookless-max.onrender.com';

export default function SubmitConfession() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submitConfession = async () => {
    if (!message.trim()) {
      alert('Confession likho pehle');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/api/confessions/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Submit failed');
      }

      alert('Confession submitted successfully 🎭');
      setMessage('');
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-3xl font-bold mb-4">Anonymous Confession 🎭</h1>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={8}
          placeholder="Write your confession..."
          className="w-full rounded-2xl bg-white/5 border border-white/10 p-4 outline-none"
        />

        <button
          onClick={submitConfession}
          disabled={loading}
          className="w-full mt-4 bg-white text-black rounded-2xl p-3 font-semibold"
        >
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </div>
  );
}
