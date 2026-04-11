import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const Unauthorized = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-auth-gradient flex flex-col items-center justify-center p-8 text-center">
      <div className="w-20 h-20 rounded-2xl bg-danger/10 border border-danger/30 flex items-center justify-center mb-6">
        <ShieldAlert className="w-10 h-10 text-danger" strokeWidth={1.5} />
      </div>
      <h1 className="text-4xl font-black text-white mb-2">Access Denied</h1>
      <p className="text-slate-400 mb-6 max-w-sm">
        You don't have permission to view this page. Please log in with the appropriate role.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <button onClick={() => navigate(-1)} className="btn-ghost max-w-xs flex items-center justify-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
        <Link to="/login" className="btn-primary max-w-xs flex items-center justify-center gap-2">
          Sign In
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;