import { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';

export const AdminBNSPage = () => {
  const [sections, setSections] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadSections = async (value?: string) => {
    try {
      setError(null);
      const data = await adminService.listBns(value);
      setSections(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load BNS catalog.');
    }
  };

  useEffect(() => {
    void loadSections();
  }, []);

  return (
    <div className="p-8 lg:p-10 max-w-[1400px] text-white">
      <p className="text-[11px] font-bold tracking-[0.22em] text-[#6B7280] uppercase mb-2">Legislative catalog</p>
      <h1 className="text-3xl font-extrabold tracking-tight mb-8">BNS sections</h1>
      <div className="flex gap-3 mb-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search section number, title, or IPC equivalent"
          className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => void loadSections(query)}
          className="px-4 py-2 text-[11px] font-extrabold uppercase tracking-wide bg-[#F97316] text-white rounded-sm"
        >
          Search
        </button>
      </div>
      {error && <div className="mb-6 text-red-400 text-sm">{error}</div>}
      <div className="grid gap-4">
        {sections.map((section) => (
          <div key={section.id} className="border border-white/[0.08] rounded-sm p-4">
            <div className="flex items-center justify-between gap-3 mb-2">
              <h2 className="text-lg font-bold">
                BNS {section.sectionNumber}: {section.sectionTitle}
              </h2>
              <span className="text-xs text-[#9CA3AF]">IPC {section.ipcEquivalent ?? '—'}</span>
            </div>
            <p className="text-sm text-[#D1D5DB]">{section.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminBNSPage;
