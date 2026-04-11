import { useEffect, useState, type FormEvent } from 'react';
import { adminService } from '../../services/adminService';

const emptyForm = {
  name: '',
  stationCode: '',
  address: '',
  district: '',
  state: '',
  pincode: '',
  latitude: '',
  longitude: '',
  phone: '',
  email: '',
  jurisdictionArea: '',
};

export const AdminStationPage = () => {
  const [stations, setStations] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const loadStations = async () => {
    try {
      setError(null);
      const data = await adminService.listStations();
      setStations(data);
      window.dispatchEvent(new Event('admin:refresh'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load stations.');
    }
  };

  useEffect(() => {
    void loadStations();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setError(null);
      await adminService.createStation({
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      });
      setForm(emptyForm);
      await loadStations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create station.');
    }
  };

  return (
    <div className="p-8 lg:p-10 max-w-[1480px] text-white">
      <p className="text-[11px] font-bold tracking-[0.22em] text-[#9CA3AF] uppercase mb-2">Station master</p>
      <h1 className="text-3xl font-extrabold tracking-tight mb-8 text-white">Police stations</h1>
      {error && <div className="mb-6 text-red-300 text-sm">{error}</div>}

      <div className="grid lg:grid-cols-[420px,1fr] gap-8">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-3">
          <h2 className="text-lg font-bold text-white">Add station</h2>
          {Object.entries(form).map(([key, value]) => (
            <input
              key={key}
              value={value}
              onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))}
              placeholder={key}
              className="w-full rounded-xl bg-[#0b0b0b] border border-white/[0.08] px-3 py-2.5 text-sm text-white placeholder:text-[#6B7280]"
            />
          ))}
          <button
            type="submit"
            className="w-full rounded-xl px-3 py-3 text-[11px] font-extrabold uppercase tracking-[0.14em] bg-[#F97316] text-white"
          >
            Create station
          </button>
        </form>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-white/[0.08] text-[10px] font-bold tracking-[0.15em] text-[#9CA3AF] uppercase">
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">District</th>
                <th className="px-6 py-4">State</th>
              </tr>
            </thead>
            <tbody>
              {stations.map((station) => (
                <tr key={station.id} className="border-b border-white/[0.06] hover:bg-white/[0.03]">
                  <td className="px-6 py-4 font-mono text-white">{station.stationCode}</td>
                  <td className="px-6 py-4 text-white">{station.name}</td>
                  <td className="px-6 py-4 text-[#D1D5DB]">{station.district}</td>
                  <td className="px-6 py-4 text-[#D1D5DB]">{station.state}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminStationPage;
