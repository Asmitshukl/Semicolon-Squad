import { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';

const statusBorder = (status: string) => {
  if (status === 'PENDING') return 'border-l-[3px] border-l-amber-500';
  if (status === 'VERIFIED') return 'border-l-[3px] border-l-[#16A34A]';
  return 'border-l-[3px] border-l-[#DC2626]';
};

export const AdminOfficerPage = () => {
  const [officers, setOfficers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadOfficers = async () => {
    try {
      setError(null);
      const data = await adminService.listOfficers();
      setOfficers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load officers.');
    }
  };

  useEffect(() => {
    void loadOfficers();
  }, []);

  const handleReview = async (officerId: string, action: 'approve' | 'reject') => {
    try {
      setBusyId(officerId);
      setError(null);
      await adminService.reviewOfficer(officerId, action);
      await loadOfficers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update officer status.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-8 lg:p-10 max-w-[1400px]">
      <p className="text-[11px] font-bold tracking-[0.22em] text-[#6B7280] uppercase mb-2">Officer registry</p>
      <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Approvals queue</h1>
      <p className="text-sm text-[#6B7280] mb-10 max-w-2xl">
        Review police officer registrations and approve or reject access to the officer portal.
      </p>

      {error && <div className="mb-6 text-red-400 text-sm">{error}</div>}

      <div className="overflow-x-auto border border-white/[0.08] rounded-sm">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-white/[0.08] text-[10px] font-bold tracking-[0.15em] text-[#6B7280] uppercase">
              <th className="px-4 py-3">Badge</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Station</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {officers.map((officer) => (
              <tr key={officer.id} className="border-b border-white/[0.06] hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-mono text-[#E5E7EB]">{officer.badgeNumber}</td>
                <td className="px-4 py-3 text-white font-semibold">
                  {officer.user.name}
                  <div className="text-xs text-[#9CA3AF]">{officer.user.email}</div>
                </td>
                <td className="px-4 py-3 text-[#9CA3AF]">
                  {officer.station.name}
                  <div className="text-xs">{officer.station.stationCode}</div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-white/[0.04] border border-white/[0.1] ${statusBorder(officer.verificationStatus)}`}
                  >
                    {officer.verificationStatus}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[#9CA3AF]">
                  {new Date(officer.createdAt).toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                  <button
                    type="button"
                    disabled={busyId === officer.id}
                    onClick={() => void handleReview(officer.id, 'approve')}
                    className="inline-flex items-center justify-center px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide bg-[#16A34A] text-white rounded-sm hover:bg-[#15803d] disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={busyId === officer.id}
                    onClick={() => void handleReview(officer.id, 'reject')}
                    className="inline-flex items-center justify-center px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide border border-[#DC2626] text-[#F87171] rounded-sm hover:bg-[#DC2626]/10 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOfficerPage;
