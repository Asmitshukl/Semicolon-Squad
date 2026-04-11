import { Link } from 'react-router-dom';
import { ShieldOff, Home } from 'lucide-react';

export const NotFound = () => (
  <div className="min-h-screen bg-auth-gradient flex flex-col items-center justify-center p-8 text-center">
    <div className="w-20 h-20 rounded-2xl bg-navy-800/80 border border-white/10 flex items-center justify-center mb-6">
      <ShieldOff className="w-10 h-10 text-slate-500" strokeWidth={1.5} />
    </div>
    <h1 className="text-6xl font-black text-white mb-2">404</h1>
    <p className="text-slate-400 mb-6">This page doesn't exist in our records.</p>
    <Link to="/" className="btn-primary max-w-xs flex items-center justify-center gap-2">
      <Home className="w-4 h-4" /> Return Home
    </Link>
  </div>
);

export default NotFound;