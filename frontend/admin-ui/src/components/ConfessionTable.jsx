export default function ConfessionTable({ confessions, onSelect }) {
  const getPreview = (text) => {
    return text?.split(' ').slice(0, 5).join(' ') + '...';
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
      <table className="w-full">
        <thead className="bg-violet-100">
          <tr>
            <th className="p-4 text-left">Confession No.</th>
            <th className="p-4 text-left">Nickname</th>
            <th className="p-4 text-left">Preview</th>
            <th className="p-4 text-left">Created Time</th>
          </tr>
        </thead>

        <tbody>
          {confessions.map((item) => (
            <tr
              key={item._id}
              onClick={() => onSelect(item)}
              className="border-b hover:bg-violet-50 cursor-pointer transition"
            >
              <td className="p-4">{item.confessionNo}</td>
              <td className="p-4">{item.nickname || 'Anonymous'}</td>
              <td className="p-4">{getPreview(item.message)}</td>
              <td className="p-4">{formatDateTime(item.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
