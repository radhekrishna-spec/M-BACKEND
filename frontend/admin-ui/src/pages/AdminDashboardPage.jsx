import { useEffect, useMemo, useState } from 'react';
import ConfessionTable from '../components/ConfessionTable';
import Pagination from '../components/Pagination';
import QuickPreview from '../components/QuickPreview';
import SearchBar from '../components/SearchBar';

export default function AdminDashboardPage() {
  const [confessions, setConfessions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedConfession, setSelectedConfession] = useState(null);

  useEffect(() => {
    fetch('https://confession-admin-ui.onrender.com/api/admin/confessions')
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50 p-6">
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
