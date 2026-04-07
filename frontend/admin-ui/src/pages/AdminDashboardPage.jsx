import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfessionTable from '../components/ConfessionTable';
import Pagination from '../components/Pagination';
import QuickPreview from '../components/QuickPreview';
import SearchBar from '../components/SearchBar';

export default function AdminDashboardPage() {
  const [confessions, setConfessions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedConfession, setSelectedConfession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(
      'https://confession-saas-node-v7-webhookless-max.onrender.com/api/admin/confessions',
    )
      .then((res) => res.json())
      .then((data) => setConfessions(data))
      .catch((err) => console.error(err));
  }, []);

  const filteredData = useMemo(() => {
    return confessions.filter(
      (item) =>
        item.nickname?.toLowerCase().includes(search.toLowerCase()) ||
        item.message?.toLowerCase().includes(search.toLowerCase()) ||
        String(item.confessionNo).includes(search),
    );
  }, [confessions, search]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const logout = () => {
    localStorage.removeItem('adminAuth');
    window.location.href = '/admin/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-violet-700">Admin Dashboard</h1>

        <div className="flex gap-3">
          <button
            onClick={() => navigate('/backend')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl"
          >
            Backend Controls
          </button>

          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl"
          >
            Logout
          </button>
        </div>
      </div>
      <SearchBar
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setCurrentPage(1);
        }}
      />

      <div className="grid grid-cols-3 gap-6 mt-6">
        <div className="col-span-2">
          <ConfessionTable
            confessions={paginatedData}
            onSelect={setSelectedConfession}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>

        <QuickPreview confession={selectedConfession} />
      </div>
    </div>
  );
}
