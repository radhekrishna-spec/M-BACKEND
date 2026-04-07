export default function QuickPreview({ confession, onClose }) {
  const copyText = async () => {
    await navigator.clipboard.writeText(confession.message);
    alert('Copied!');
  };

  if (!confession) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-xl font-bold"
        >
          ✕
        </button>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-violet-700">
            Confession #{confession.confessionNo}
          </h2>

          <button
            onClick={copyText}
            className="bg-violet-600 text-white px-4 py-2 rounded-xl"
          >
            Copy
          </button>
        </div>

        <div className="rounded-2xl bg-violet-50 p-4 leading-7 whitespace-pre-wrap">
          {confession.message}
        </div>
      </div>
    </div>
  );
}
