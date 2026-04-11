import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye, EyeOff, AlertCircle, User, Mail, Phone,
  Lock, Hash, Building2, Info, Loader2, ArrowRight,
} from 'lucide-react';
import { useAuth } from './useAuth';
import { AuthLayout } from './AuthLayout';

/* ── Validation ─────────────────────────────────────────────────── */
const schema = z.object({
  name:            z.string().min(2, 'Full name is required'),
  email:           z.string().email('Enter a valid email address'),
  phone:           z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  badgeNumber:     z.string().min(3, 'Badge number is required'),
  stationCode:     z.string().min(3, 'Station code is required'),
  rank:            z.string().optional(),
  password:        z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
type FormValues = z.infer<typeof schema>;

const RANKS = [
  'Constable', 'Head Constable', 'Assistant Sub-Inspector',
  'Sub-Inspector', 'Inspector', 'Deputy Superintendent', 'Superintendent',
];

/* ══════════════════════════════════════════════════════════════════ */
export const OfficerRegister = () => {
  const [showPw, setShowPw]   = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const { officerRegister, isLoading, error } = useAuth();

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    const { confirmPassword: _, ...payload } = values;
    try { await officerRegister(payload); } catch { /* error via store */ }
  };

  const Err = ({ msg }: { msg?: string }) =>
    msg ? <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3 flex-shrink-0" />{msg}</p> : null;

  return (
    <AuthLayout backTo="/login" backLabel="← Back to login" formMaxWidth="max-w-lg">

      {/* Header */}
      <div className="mb-7">
        <span className="inline-flex items-center gap-2 text-[10px] font-extrabold tracking-[0.25em] uppercase"
              style={{ color: '#FF9933' }}>
          <span className="w-6 h-px inline-block" style={{ background: '#FF9933' }} />
          पुलिस अधिकारी पंजीकरण &nbsp;·&nbsp; OFFICER REGISTRATION
        </span>
        <h1 className="mt-3 text-[1.8rem] font-extrabold text-white leading-tight">
          Register as<br />police officer.
        </h1>
        <p className="mt-2 text-sm" style={{ color: '#4a6070' }}>
          Already approved?{' '}
          <Link to="/login"
                className="font-semibold underline underline-offset-4 transition-colors"
                style={{ color: '#e8d8c0' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#FF9933')}
                onMouseLeave={e => (e.currentTarget.style.color = '#e8d8c0')}>
            Sign in as officer →
          </Link>
        </p>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} className="mb-5" />

      {/* Approval notice */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-xl mb-5 text-xs"
           style={{ background: 'rgba(255,153,51,0.08)', border: '1px solid rgba(255,153,51,0.25)', color: '#d4a050' }}>
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#FF9933' }} />
        <span>
          Officer accounts require verification by the Station Administrator before login is granted.
          You will receive an <strong>SMS confirmation</strong> once approved.
        </span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

        {/* Name + Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="o-name" className="field-label">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#3a5070' }} />
              <input id="o-name" type="text" autoComplete="name" placeholder="Inspector Sharma"
                {...register('name')} className={`field pl-10 ${errors.name ? 'field-error' : ''}`} />
            </div>
            <Err msg={errors.name?.message} />
          </div>
          <div>
            <label htmlFor="o-phone" className="field-label">Official Mobile</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#3a5070' }} />
              <span className="absolute left-10 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: '#3a5070' }}>+91</span>
              <input id="o-phone" type="tel" autoComplete="tel" placeholder="98765 43210"
                {...register('phone')} className={`field pl-16 ${errors.phone ? 'field-error' : ''}`} />
            </div>
            <Err msg={errors.phone?.message} />
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="o-email" className="field-label">Official Email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#3a5070' }} />
            <input id="o-email" type="email" autoComplete="email" placeholder="officer@police.gov.in"
              {...register('email')} className={`field pl-10 ${errors.email ? 'field-error' : ''}`} />
          </div>
          <Err msg={errors.email?.message} />
        </div>

        {/* Badge + Station */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="o-badge" className="field-label">Badge Number</label>
            <div className="relative">
              <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#3a5070' }} />
              <input id="o-badge" type="text" placeholder="e.g. MH-1234A"
                {...register('badgeNumber')}
                className={`field pl-10 uppercase tracking-widest ${errors.badgeNumber ? 'field-error' : ''}`} />
            </div>
            <Err msg={errors.badgeNumber?.message} />
          </div>
          <div>
            <label htmlFor="o-station" className="field-label">Station Code</label>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#3a5070' }} />
              <input id="o-station" type="text" placeholder="e.g. MH-ANDHERI-E"
                {...register('stationCode')}
                className={`field pl-10 uppercase ${errors.stationCode ? 'field-error' : ''}`} />
            </div>
            <Err msg={errors.stationCode?.message} />
          </div>
        </div>

        {/* Rank */}
        <div>
          <label htmlFor="o-rank" className="field-label">
            Rank <span style={{ color: '#2a3d55' }}>(optional)</span>
          </label>
          <select id="o-rank" {...register('rank')} className="field">
            <option value="">Select rank / पद</option>
            {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Password + Confirm */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="o-password" className="field-label">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#3a5070' }} />
              <input id="o-password" type={showPw ? 'text' : 'password'} autoComplete="new-password"
                placeholder="Min. 8 characters" {...register('password')}
                className={`field pl-10 pr-10 ${errors.password ? 'field-error' : ''}`} />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#3a5070' }}>
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Err msg={errors.password?.message} />
          </div>
          <div>
            <label htmlFor="o-confirm" className="field-label">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#3a5070' }} />
              <input id="o-confirm" type={showCpw ? 'text' : 'password'} autoComplete="new-password"
                placeholder="Repeat password" {...register('confirmPassword')}
                className={`field pl-10 pr-10 ${errors.confirmPassword ? 'field-error' : ''}`} />
              <button type="button" onClick={() => setShowCpw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#3a5070' }}>
                {showCpw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Err msg={errors.confirmPassword?.message} />
          </div>
        </div>

        {/* Legal disclaimer */}
        <p className="text-xs leading-relaxed pt-1" style={{ color: '#2a3d55' }}>
          Your badge number and station code will be verified against national police records.
          False registration is punishable under{' '}
          <span style={{ color: '#FF9933' }}>BNS § 317 (IPC § 170)</span> — Impersonation of public servant.
        </p>

        {/* API error */}
        {error && (
          <div className="alert-error">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit */}
        <button id="officer-register-submit" type="submit" disabled={isLoading}
                className="btn-primary !mt-5 flex items-center justify-center gap-2">
          {isLoading
            ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting registration…</>
            : <>Submit for Admin Approval <ArrowRight className="w-4 h-4 ml-auto" /></>}
        </button>
      </form>

      <p className="mt-5 text-center text-[11px] leading-relaxed" style={{ color: '#2a3d55' }}>
        This is an official Government of India digital service.
      </p>
    </AuthLayout>
  );
};

export default OfficerRegister;