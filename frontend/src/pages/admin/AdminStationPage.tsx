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
    <div className="p-8 lg:p-10 max-w-[1400px] text-white">
      <p className="text-[11px] font-bold tracking-[0.22em] text-[#6B7280] uppercase mb-2">Station master</p>
      <h1 className="text-3xl font-extrabold tracking-tight mb-8">Police stations</h1>
      {error && <div className="mb-6 text-red-400 text-sm">{error}</div>}

      <div className="grid lg:grid-cols-[420px,1fr] gap-8">
        <form onSubmit={handleSubmit} className="border border-white/[0.08] rounded-sm p-5 space-y-3">
          <h2 className="text-lg font-bold">Add station</h2>
          {Object.entries(form).map(([key, value]) => (
            <input
              key={key}
              value={value}
              onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))}
              placeholder={key}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-sm"
            />
          ))}
          <button
            type="submit"
            className="w-full px-3 py-2 text-[11px] font-extrabold uppercase tracking-wide bg-[#F97316] text-white rounded-sm"
          >
            Create station
          </button>
        </form>

        <div className="border border-white/[0.08] rounded-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-white/[0.08] text-[10px] font-bold tracking-[0.15em] text-[#6B7280] uppercase">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">District</th>
                <th className="px-4 py-3">State</th>
              </tr>
            </thead>
            <tbody>
              {stations.map((station) => (
                <tr key={station.id} className="border-b border-white/[0.06]">
                  <td className="px-4 py-3 font-mono">{station.stationCode}</td>
                  <td className="px-4 py-3">{station.name}</td>
                  <td className="px-4 py-3 text-[#9CA3AF]">{station.district}</td>
                  <td className="px-4 py-3 text-[#9CA3AF]">{station.state}</td>
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
