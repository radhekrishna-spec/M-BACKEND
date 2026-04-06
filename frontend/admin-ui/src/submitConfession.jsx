import { useState } from 'react';

const API_BASE = import.meta.env.DEV
  ? 'http://localhost:3000'
  : 'https://confession-saas-node-v7-webhookless-max.onrender.com';

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

      const res = await fetch(`${API_BASE}/submit`, {
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
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-5 shadow-xl">
      <h3 className="font-semibold mb-4 text-white">
        Write Your Confession 🎭
      </h3>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Write anonymously..."
        rows={4}
        className="w-full border border-white/10 bg-white/5 rounded-2xl p-3 text-white placeholder:text-gray-400 mb-3 outline-none resize-none"
      />

      <button
        onClick={submitConfession}
        disabled={loading}
        className="w-full rounded-2xl bg-white text-black font-semibold p-3 hover:scale-[1.01] transition-all"
      >
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </div>
  );
}
