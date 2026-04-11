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
    <div className="p-8 lg:p-10 max-w-[1480px] text-white">
      <p className="text-[11px] font-bold tracking-[0.22em] text-[#9CA3AF] uppercase mb-2">Legislative catalog</p>
      <h1 className="text-3xl font-extrabold tracking-tight mb-8 text-white">BNS sections</h1>
      <div className="flex gap-3 mb-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search section number, title, or IPC equivalent"
          className="flex-1 rounded-xl bg-[#0b0b0b] border border-white/[0.08] px-3 py-2.5 text-sm text-white placeholder:text-[#6B7280]"
        />
        <button
          type="button"
          onClick={() => void loadSections(query)}
          className="px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.14em] bg-[#F97316] text-white rounded-xl"
        >
          Search
        </button>
      </div>
      {error && <div className="mb-6 text-red-300 text-sm">{error}</div>}
      <div className="grid gap-4">
        {sections.map((section) => (
          <div key={section.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
            <div className="flex items-center justify-between gap-3 mb-2">
              <h2 className="text-lg font-bold text-white">
                BNS {section.sectionNumber}: {section.sectionTitle}
              </h2>
              <span className="text-xs text-[#D1D5DB]">IPC {section.ipcEquivalent ?? '—'}</span>
            </div>
            <p className="text-sm text-[#D1D5DB]">{section.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminBNSPage;
