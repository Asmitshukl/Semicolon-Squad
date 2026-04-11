import { Shield } from 'lucide-react';
import { useAuth } from '../../features/shared/auth/useAuth';

export const AdminHome = () => {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-auth-gradient flex flex-col items-center justify-center p-8 text-center">
      <div className="glass-card p-10 max-w-md w-full">
        <Shield className="w-12 h-12 text-slate-400 mx-auto mb-4" strokeWidth={1.5} />
        <h1 className="text-2xl font-bold text-white mb-2">Admin Portal</h1>
        <p className="text-slate-400 mb-1 text-sm">Welcome, <span className="text-slate-300 font-medium">{user?.name}</span></p>
        <p className="text-slate-500 text-xs mb-6">This portal is under construction.</p>
        <button onClick={logout} className="btn-ghost text-sm">Sign Out</button>
      </div>
    </div>
  );
};
export default AdminHome;