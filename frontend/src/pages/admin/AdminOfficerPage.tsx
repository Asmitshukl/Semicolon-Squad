import { useEffect, useMemo, useState } from "react";
import { adminService } from "../../services/adminService";

type OfficerRow = {
  id: string;
  badgeNumber: string;
  rank: string;
  department: string;
  verificationStatus: string;
  verifiedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    isActive: boolean;
    role: string;
  };
  station: {
    id: string;
    name: string;
    stationCode: string;
    district: string;
    state: string;
  };
};

const statusTone = (status: string) => {
  if (status === "PENDING")
    return "border-[#FBBF24]/40 bg-[#FBBF24]/10 text-[#FDE68A]";
  if (status === "VERIFIED")
    return "border-[#16A34A]/40 bg-[#16A34A]/10 text-[#BBF7D0]";
  return "border-[#DC2626]/40 bg-[#DC2626]/10 text-[#FCA5A5]";
};

const emptyCreate = {
  name: "",
  email: "",
  phone: "",
  badgeNumber: "",
  stationCode: "",
  rank: "Sub-Inspector",
  password: "",
};

export const AdminOfficerPage = () => {
  const [officers, setOfficers] = useState<OfficerRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "PENDING" | "VERIFIED" | "REJECTED"
  >("ALL");

  const loadOfficers = async (status?: string) => {
    try {
      setError(null);
      setRefreshing(true);
      const data = await adminService.listOfficers(status);
      setOfficers(data);
      window.dispatchEvent(new Event("admin:refresh"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load officers.");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadOfficers(statusFilter === "ALL" ? undefined : statusFilter);
  }, [statusFilter]);

  const handleReview = async (
    officerId: string,
    action: "approve" | "reject",
  ) => {
    try {
      setBusyId(officerId);
      setError(null);
      const updated = await adminService.reviewOfficer(officerId, action);
      setOfficers((current) => {
        const nextStatus =
          updated?.verificationStatus ??
          (action === "approve" ? "VERIFIED" : "REJECTED");
        const nextIsActive = updated?.user?.isActive ?? action === "approve";
        return current.flatMap((officer) => {
          if (officer.id !== officerId) return [officer];

          const nextOfficer: OfficerRow = {
            ...officer,
            verificationStatus: nextStatus,
            verifiedAt: updated?.verifiedAt ?? new Date().toISOString(),
            user: {
              ...officer.user,
              isActive: nextIsActive,
            },
          };

          if (statusFilter === "ALL" || statusFilter === nextStatus) {
            return [nextOfficer];
          }
          return [];
        });
      });
      window.dispatchEvent(new Event("admin:refresh"));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update officer status.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setCreating(true);
      setError(null);
      setSuccess(null);
      const newOfficer = await adminService.createOfficer(createForm);
      setCreateForm(emptyCreate);
      // Add the new officer directly to the list if it matches the current filter
      if (newOfficer && typeof newOfficer === 'object' && 'id' in newOfficer) {
        const officer = newOfficer as OfficerRow;
        setOfficers((current) => {
          if (statusFilter === "ALL" || statusFilter === officer.verificationStatus) {
            return [officer, ...current];
          }
          return current;
        });
        window.dispatchEvent(new Event("admin:refresh"));
        setSuccess(`Officer ${officer.user?.name ?? ''} created and verified successfully.`);
      } else {
        // Fallback: reload the list
        await loadOfficers(statusFilter === "ALL" ? undefined : statusFilter);
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to create officer.";
      setError(message);
    } finally {
      setCreating(false);
    }
  };

  const pendingCount = useMemo(
    () =>
      officers.filter((officer) => officer.verificationStatus === "PENDING")
        .length,
    [officers],
  );

  return (
    <div className="p-8 lg:p-10 max-w-[1480px] text-white">
      <div className="mb-10">
        <p className="text-[11px] font-bold tracking-[0.22em] text-[#9CA3AF] uppercase mb-2">
          Officer registry
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
          Approvals queue
        </h1>
        <p className="text-sm text-[#D1D5DB] max-w-2xl">
          Review live officer registrations, approve access to the police
          portal, or create a verified officer account for station operations.
        </p>
      </div>

      <div className="grid lg:grid-cols-[380px,1fr] gap-8">
        <form
          onSubmit={handleCreate}
          className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-4"
        >
          <div className="border-b border-white/[0.08] pb-4">
            <p className="text-[11px] font-bold tracking-[0.18em] text-[#9CA3AF] uppercase mb-2">
              Create officer
            </p>
            <h2 className="text-xl font-extrabold text-white">
              Provision new officer
            </h2>
          </div>

          {[
            ["name", "Full name"],
            ["email", "Official email"],
            ["phone", "Official mobile"],
            ["badgeNumber", "Badge number"],
            ["stationCode", "Station code"],
            ["rank", "Rank"],
            ["password", "Temporary password"],
          ].map(([key, label]) => (
            <label key={key} className="block">
              <span className="mb-2 block text-[10px] font-bold tracking-[0.18em] uppercase text-[#9CA3AF]">
                {label}
              </span>
              <input
                type={key === "password" ? "password" : "text"}
                value={createForm[key as keyof typeof createForm]}
                onChange={(e) =>
                  setCreateForm((current) => ({
                    ...current,
                    [key]: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-white/[0.08] bg-[#0b0b0b] px-3 py-2.5 text-sm text-white placeholder:text-[#6B7280]"
                placeholder={
                  key === "stationCode" ? "e.g., DELHI01" : undefined
                }
              />
            </label>
          ))}

          <button
            type="submit"
            disabled={creating}
            className="w-full rounded-xl bg-[#F97316] px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.16em] text-white hover:bg-[#ea580c] disabled:opacity-50"
          >
            {creating ? "Creating officer…" : "Create officer"}
          </button>

          {success && (
            <div className="mt-4 rounded-lg bg-[#16A34A]/10 border border-[#16A34A]/30 text-[#BBF7D0] p-3 text-sm">
              {success}
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/30 text-[#FCA5A5] p-3 text-sm">
              {error}
            </div>
          )}
        </form>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] px-6 py-5">
            <div>
              <p className="text-[11px] font-bold tracking-[0.18em] text-[#9CA3AF] uppercase mb-2">
                Live approvals
              </p>
              <h2 className="text-xl font-extrabold text-white">
                Total officers: {officers.length}
              </h2>
            </div>

            <div className="flex gap-3 items-center">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as typeof statusFilter)
                }
                className="rounded-xl border border-white/[0.08] bg-[#0b0b0b] px-3 py-2 text-sm text-white"
              >
                <option value="ALL">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <button
                type="button"
                disabled={refreshing}
                onClick={() =>
                  loadOfficers(
                    statusFilter === "ALL" ? undefined : statusFilter,
                  )
                }
                className="rounded-xl border border-white/[0.08] bg-[#0b0b0b] hover:bg-white/[0.05] px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#9CA3AF] transition disabled:opacity-50"
              >
                {refreshing ? "Refreshing…" : "↻ Refresh"}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-white/[0.08] text-[10px] font-bold tracking-[0.15em] text-[#9CA3AF] uppercase">
                  <th className="px-6 py-4">Badge</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Station</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Submitted</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {officers.map((officer) => (
                  <tr
                    key={officer.id}
                    className="border-b border-white/[0.06] hover:bg-white/[0.03]"
                  >
                    <td className="px-6 py-4 font-mono text-white">
                      {officer.badgeNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">
                        {officer.user.name}
                      </div>
                      <div className="text-xs text-[#D1D5DB]">
                        {officer.user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#D1D5DB]">
                      {officer.station.name}
                      <div className="text-xs text-[#9CA3AF]">
                        {officer.station.stationCode}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${statusTone(
                          officer.verificationStatus,
                        )}`}
                      >
                        {officer.verificationStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-[#D1D5DB]">
                      {new Date(officer.createdAt).toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      {officer.verificationStatus === "PENDING" ? (
                        <>
                          <button
                            type="button"
                            disabled={busyId === officer.id}
                            onClick={() =>
                              void handleReview(officer.id, "approve")
                            }
                            className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] bg-[#16A34A] text-white hover:bg-[#15803d] disabled:opacity-50"
                          >
                            {busyId === officer.id ? "Working..." : "Approve"}
                          </button>
                          <button
                            type="button"
                            disabled={busyId === officer.id}
                            onClick={() =>
                              void handleReview(officer.id, "reject")
                            }
                            className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] border border-[#DC2626] text-[#FCA5A5] hover:bg-[#DC2626]/10 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9CA3AF]">
                          No action needed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {officers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-sm text-[#9CA3AF]"
                    >
                      No officers found for the current filter.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOfficerPage;
