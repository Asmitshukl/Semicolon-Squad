import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye, EyeOff, AlertCircle, User, Mail, Phone,
  Lock, Globe, Loader2, ArrowRight,
} from 'lucide-react';
import { useAuth } from './useAuth';
import { AuthLayout } from './AuthLayout';

/* ── Validation ─────────────────────────────────────────────────── */
const schema = z.object({
  name:            z.string().min(2, 'Full name must be at least 2 characters'),
  email:           z.string().email('Enter a valid email address'),
  phone:           z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  gender:          z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  language:        z.string().optional(),
  password:        z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
type FormValues = z.infer<typeof schema>;

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी (Hindi)' },
  { value: 'mr', label: 'मराठी (Marathi)' },
  { value: 'ta', label: 'தமிழ் (Tamil)' },
  { value: 'te', label: 'తెలుగు (Telugu)' },
  { value: 'bh', label: 'भोजपुरी (Bhojpuri)' },
];

/* ══════════════════════════════════════════════════════════════════ */
export const VictimRegister = () => {
  const [showPw, setShowPw]   = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const { victimRegister, isLoading, error } = useAuth();

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    const { confirmPassword: _, ...payload } = values;
    try { await victimRegister(payload); } catch { /* error via store */ }
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
          पीड़ित पंजीकरण &nbsp;·&nbsp; VICTIM REGISTRATION
        </span>
        <h1 className="mt-3 text-[1.8rem] font-extrabold text-white leading-tight">
          Create your<br />victim account.
        </h1>
        <p className="mt-2 text-sm" style={{ color: '#4a6070' }}>
          Already registered?{' '}
          <Link to="/login"
                className="font-semibold underline underline-offset-4 transition-colors"
                style={{ color: '#e8d8c0' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#FF9933')}
                onMouseLeave={e => (e.currentTarget.style.color = '#e8d8c0')}>
            Sign in →
          </Link>
        </p>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} className="mb-6" />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

        {/* Name + Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="v-name" className="field-label">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#3a5070' }} />
              <input id="v-name" type="text" autoComplete="name" placeholder="Ravi Kumar"
                {...register('name')} className={`field pl-10 ${errors.name ? 'field-error' : ''}`} />
            </div>
            <Err msg={errors.name?.message} />
          </div>
          <div>
            <label htmlFor="v-phone" className="field-label">Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#3a5070' }} />
              <span className="absolute left-10 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: '#3a5070' }}>+91</span>
              <input id="v-phone" type="tel" autoComplete="tel" placeholder="98765 43210"
                {...register('phone')} className={`field pl-16 ${errors.phone ? 'field-error' : ''}`} />
            </div>
            <Err msg={errors.phone?.message} />
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="v-email" className="field-label">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#3a5070' }} />
            <input id="v-email" type="email" autoComplete="email" placeholder="you@example.com"
              {...register('email')} className={`field pl-10 ${errors.email ? 'field-error' : ''}`} />
          </div>
          <Err msg={errors.email?.message} />
        </div>

        {/* Gender + Language */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="v-gender" className="field-label">Gender <span style={{ color: '#2a3d55' }}>(optional)</span></label>
            <select id="v-gender" {...register('gender')} className="field">
              <option value="">Select gender</option>
              <option value="male">Male / पुरुष</option>
              <option value="female">Female / महिला</option>
              <option value="other">Other / अन्य</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>
          <div>
            <label htmlFor="v-language" className="field-label">
              <span className="inline-flex items-center gap-1"><Globe className="w-3 h-3" /> Preferred Language</span>
            </label>
            <select id="v-language" {...register('language')} className="field">
              {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
        </div>

        {/* Password + Confirm */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="v-password" className="field-label">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#3a5070' }} />
              <input id="v-password" type={showPw ? 'text' : 'password'} autoComplete="new-password"
                placeholder="Min. 8 characters" {...register('password')}
                className={`field pl-10 pr-10 ${errors.password ? 'field-error' : ''}`} />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: '#3a5070' }}>
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Err msg={errors.password?.message} />
          </div>
          <div>
            <label htmlFor="v-confirm" className="field-label">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#3a5070' }} />
              <input id="v-confirm" type={showCpw ? 'text' : 'password'} autoComplete="new-password"
                placeholder="Repeat password" {...register('confirmPassword')}
                className={`field pl-10 pr-10 ${errors.confirmPassword ? 'field-error' : ''}`} />
              <button type="button" onClick={() => setShowCpw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: '#3a5070' }}>
                {showCpw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Err msg={errors.confirmPassword?.message} />
          </div>
        </div>

        {/* Rights notice */}
        <p className="text-xs leading-relaxed" style={{ color: '#2a3d55' }}>
          By registering, your data will be protected under the{' '}
          <span style={{ color: '#FF9933' }}>Information Technology Act 2000</span> and shared
          only with relevant law enforcement under FIR procedures.
        </p>

        {/* API error */}
        {error && (
          <div className="alert-error">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit */}
        <button id="victim-register-submit" type="submit" disabled={isLoading}
                className="btn-primary !mt-5 flex items-center justify-center gap-2">
          {isLoading
            ? <><Loader2 className="w-4 h-4 animate-spin" />Creating account…</>
            : <>Create Victim Account <ArrowRight className="w-4 h-4 ml-auto" /></>}
        </button>
      </form>

      <p className="mt-5 text-center text-[11px] leading-relaxed" style={{ color: '#2a3d55' }}>
        This is an official Government of India digital service.
      </p>
    </AuthLayout>
  );
};

export default VictimRegister;