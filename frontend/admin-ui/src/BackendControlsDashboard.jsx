import {
  BarChart3,
  Bell,
  Database,
  Image,
  Palette,
  RefreshCw,
  Save,
  Search,
  Shield,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import SubmitConfession from './submitConfession';

const API_BASE = import.meta.env.DEV
  ? 'http://localhost:3000'
  : 'https://m-backend-4t8v.onrender.com';

function ConfessionNoControl() {
  const [number, setNumber] = useState('');
  useEffect(() => {
    fetch(`${API_BASE}/api/confession-no`)
      .then((res) => res.json())
      .then((data) => {
        setNumber(data.confessionNo || '');
      });
  }, []);

  const updateNumber = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/confession-no`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confessionNo: Number(number),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Update failed');
      }

      alert(`Updated to #${data.confessionNo}`);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-5 shadow-xl">
      <h3 className="font-semibold mb-4">Set Confession Number</h3>

      <input
        type="number"
        value={number}
        onChange={(e) => setNumber(e.target.value)}
        placeholder="Enter number"
        className="w-full border border-white/10 bg-white/5 rounded-2xl p-3 text-white placeholder:text-gray-400 mb-3 outline-none"
      />

      <div className="grid grid-cols-3 gap-2 mb-3">
        <button
          onClick={() => setNumber((prev) => Number(prev || 0) + 1)}
          className="rounded-2xl border border-white/10 p-2 hover:bg-white/10"
        >
          +1
        </button>

        <button
          onClick={() => setNumber((prev) => Number(prev || 0) + 10)}
          className="rounded-2xl border border-white/10 p-2 hover:bg-white/10"
        >
          +10
        </button>

        <button
          onClick={() => setNumber((prev) => Number(prev || 0) + 100)}
          className="rounded-2xl border border-white/10 p-2 hover:bg-white/10"
        >
          +100
        </button>
      </div>

      <button
        onClick={updateNumber}
        className="w-full rounded-2xl bg-white text-black font-semibold p-3 hover:scale-[1.01] transition-all"
      >
        Update Number
      </button>
    </div>
  );
}

const defaultControls = [
  {
    name: 'Spam Filter',
    key: 'spamFilter',
    desc: 'Detect repeated links, emojis, abusive floods',
    category: 'Moderation',
    enabled: true,
  },
  {
    name: 'Duplicate Check',
    key: 'duplicateCheck',
    desc: 'Prevent same confession repost',
    category: 'Moderation',
    enabled: true,
  },
  {
    name: 'Grammar Clean',
    key: 'grammarFix',
    desc: 'Auto-fix grammar and punctuation',
    category: 'AI',
    enabled: true,
  },
  {
    name: 'Profanity Censor',
    key: 'censor',
    desc: 'Mask abusive words automatically',
    category: 'Moderation',
    enabled: true,
  },
  {
    name: 'AI Toxicity Check',
    key: 'toxicity',
    desc: 'Reject harmful or toxic text',
    category: 'AI',
    enabled: true,
  },
  {
    name: 'Auto Split Parts',
    key: 'split',
    desc: 'Split long confession into carousel parts',
    category: 'Posting',
    enabled: true,
  },
  {
    name: 'Telegram Preview',
    key: 'telegram',
    desc: 'Send preview before posting',
    category: 'Posting',
    enabled: true,
  },
  {
    name: 'Instagram Auto Post',
    key: 'instagram',
    desc: 'Publish after approval',
    category: 'Posting',
    enabled: false,
  },
];

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`w-14 h-8 rounded-full transition-all relative ${
        checked ? 'bg-white' : 'bg-white/20'
      }`}
    >
      <div
        className={`absolute top-1 h-6 w-6 rounded-full transition-all ${
          checked ? 'left-7 bg-black' : 'left-1 bg-white'
        }`}
      />
    </button>
  );
}

function StatCard({ title, value, icon: Icon }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-5 shadow-xl hover:bg-white/10 transition-all">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-300">{title}</p>
        <Icon size={18} />
      </div>
      <h3 className="text-2xl font-bold text-white">{value}</h3>
    </div>
  );
}

export default function BackendControlsDashboard() {
  const [search, setSearch] = useState('');
  const [controls, setControls] = useState(defaultControls);

  useEffect(() => {
    fetch(`${API_BASE}/api/settings`)
      .then((res) => res.json())
      .then((data) => {
        setControls((prev) =>
          prev.map((item) => ({
            ...item,
            enabled: data[item.key] ?? item.enabled,
          })),
        );
      });
  }, []);

  const filtered = useMemo(() => {
    return controls.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [controls, search]);

  const toggleItem = async (key) => {
    const updatedControls = controls.map((item) =>
      item.key === key ? { ...item, enabled: !item.enabled } : item,
    );

    setControls(updatedControls);

    const payload = {};
    updatedControls.forEach((item) => {
      payload[item.key] = item.enabled;
    });

    await fetch(`${API_BASE}/api/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black p-6 text-white">
      <div className="max-w-7xl mx-auto rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-5xl font-bold tracking-tight">
              Confession SaaS Control Center
            </h1>
            <p className="text-gray-300 mt-2">
              Advanced admin dashboard for full backend control
            </p>
          </div>

          <div className="flex gap-3">
            <button className="px-5 py-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all flex items-center gap-2">
              <RefreshCw size={18} /> Sync
            </button>

            <button className="px-5 py-3 rounded-2xl bg-white text-black font-semibold hover:scale-[1.02] transition-all flex items-center gap-2">
              <Save size={18} /> Save Changes
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <StatCard title="Pending Approvals" value="18" icon={Bell} />
          <StatCard title="Spam Blocked Today" value="42" icon={Shield} />
          <StatCard title="Posted to Instagram" value="12" icon={Image} />
          <StatCard title="Processing Success" value="99.2%" icon={BarChart3} />
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl p-5 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Search size={18} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search controls..."
                  className="w-full outline-none border border-white/10 bg-white/5 rounded-2xl px-4 py-3 text-white placeholder:text-gray-400"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {filtered.map((item) => (
                  <div
                    key={item.key}
                    className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-5 flex items-center justify-between hover:bg-white/10 hover:shadow-xl transition-all"
                  >
                    <div>
                      <p className="text-xs text-gray-400 mb-1">
                        {item.category}
                      </p>
                      <h2 className="font-semibold text-lg text-white">
                        {item.name}
                      </h2>
                      <p className="text-sm text-gray-300 max-w-xs">
                        {item.desc}
                      </p>
                    </div>

                    <Toggle
                      checked={item.enabled}
                      onChange={() => toggleItem(item.key)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <SubmitConfession />
            <ConfessionNoControl />

            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-5 shadow-xl">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Database size={18} /> System Health
              </h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>Node API</span>
                  <span className="font-semibold text-green-400">Online</span>
                </div>
                <div className="flex justify-between">
                  <span>Telegram Bot</span>
                  <span className="font-semibold text-green-400">
                    Connected
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-5 shadow-xl">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Palette size={18} /> Theme / Branding
              </h3>

              <button className="w-full border border-white/10 rounded-2xl p-3 mb-3 hover:bg-white/10 transition-all">
                Upload Logo
              </button>

              <button className="w-full border border-white/10 rounded-2xl p-3 hover:bg-white/10 transition-all">
                Change Accent Theme
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
