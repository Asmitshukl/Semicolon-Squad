import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye, EyeOff, AlertCircle, CheckCircle2,
  User, BadgeCheck, Lock, Mail, Loader2, ArrowRight,
} from 'lucide-react';
import { useAuth } from './useAuth';
import { AuthLayout } from './AuthLayout';
import type { LoginCredentials } from '../../../services/authService';

/* ── Validation ─────────────────────────────────────────────────── */
const schema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormValues = z.infer<typeof schema>;

/* ── Roles ──────────────────────────────────────────────────────── */
const ROLES = [
  { id: 'victim'  as const, label: 'Victim',  labelHi: 'पीड़ित',  icon: User       },
  { id: 'officer' as const, label: 'Officer', labelHi: 'अधिकारी', icon: BadgeCheck  },
  { id: 'admin'   as const, label: 'Admin',   labelHi: 'व्यवस्थापक', icon: Lock    },
] as const;
type RoleId = typeof ROLES[number]['id'];

/* ══════════════════════════════════════════════════════════════════ */
export const LoginPage = () => {
  const [activeRole, setActiveRole] = useState<RoleId>('victim');
  const [showPw, setShowPw]         = useState(false);
  const [searchParams]              = useSearchParams();
  const { login, isLoading, error } = useAuth();
  const isPending = searchParams.get('status') === 'pending';

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => { reset(); }, [activeRole, reset]);

  const onSubmit = async (values: FormValues) => {
    try { await login(values as LoginCredentials); } catch { /* error handled via store */ }
  };

  const registerHref =
    activeRole === 'victim'  ? '/register/victim'  :
    activeRole === 'officer' ? '/register/officer' : null;

  return (
    <AuthLayout backTo="/" backLabel="← Home">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="mb-8">
        {/* Saffron "WELCOME BACK" tag */}
        <span className="inline-flex items-center gap-2 text-[10px] font-extrabold tracking-[0.25em] uppercase"
              style={{ color: '#FF9933' }}>
          <span className="w-6 h-px inline-block" style={{ background: '#FF9933' }} />
          स्वागत है &nbsp;·&nbsp; WELCOME BACK
        </span>

        <h1 className="mt-3 text-[1.9rem] font-extrabold text-white leading-tight">
          Sign in to<br />your portal.
        </h1>

        {/* Pending notice */}
        {isPending && (
          <div className="mt-4 alert-success">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="text-xs leading-relaxed">
              Officer registration submitted! Pending admin approval.
              You will receive an SMS once your account is approved.
            </span>
          </div>
        )}

        {/* Register link */}
        {!isPending && registerHref && (
          <p className="mt-2.5 text-sm" style={{ color: '#4a6070' }}>
            Don't have an account?{' '}
            <Link to={registerHref}
                  className="font-semibold underline underline-offset-4 transition-colors"
                  style={{ color: '#e8d8c0' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#FF9933')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#e8d8c0')}>
              Create one →
            </Link>
          </p>
        )}
      </div>

      {/* ── Thin divider ────────────────────────────────────────── */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} className="mb-6" />

      {/* ── Role tabs ───────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 rounded-xl mb-6"
           style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.05)' }}>
        {ROLES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            id={`tab-role-${id}`}
            type="button"
            onClick={() => setActiveRole(id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all duration-200"
            style={{
              background:  activeRole === id ? 'linear-gradient(135deg, #FF9933 0%, #E07800 100%)' : 'transparent',
              color:       activeRole === id ? '#fff' : '#4a6070',
              boxShadow:   activeRole === id ? '0 3px 14px rgba(255,153,51,0.35)' : 'none',
            }}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Login form ──────────────────────────────────────────── */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

        {/* Email */}
        <div>
          <label htmlFor="login-email" className="field-label">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: '#3a5070' }} />
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="your@email.com"
              {...register('email')}
              className={`field pl-10 ${errors.email ? 'field-error' : ''}`}
            />
          </div>
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />{errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="login-password" className="field-label !mb-0">Password</label>
            <button type="button"
                    className="text-xs transition-colors"
                    style={{ color: '#3a5070' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#FF9933')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#3a5070')}>
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: '#3a5070' }} />
            <input
              id="login-password"
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              {...register('password')}
              className={`field pl-10 pr-11 ${errors.password ? 'field-error' : ''}`}
            />
            <button
              id="toggle-password"
              type="button"
              onClick={() => setShowPw(v => !v)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: '#3a5070' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#e0c090')}
              onMouseLeave={e => (e.currentTarget.style.color = '#3a5070')}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />{errors.password.message}
            </p>
          )}
        </div>

        {/* API error */}
        {error && (
          <div className="alert-error">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit — saffron button */}
        <button
          id="login-submit"
          type="submit"
          disabled={isLoading}
          className="btn-primary !mt-6 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Signing in…</>
          ) : (
            <>
              Sign in as {ROLES.find(r => r.id === activeRole)?.label}
              <ArrowRight className="w-4 h-4 ml-auto" />
            </>
          )}
        </button>
      </form>

      {/* ── Official note ────────────────────────────────────────── */}
      <p className="mt-6 text-center text-[11px] leading-relaxed" style={{ color: '#2a3d55' }}>
        This is an official Government of India digital service.<br />
        Unauthorized access is a punishable offence under IT Act 2000.
      </p>
    </AuthLayout>
  );
};

export default LoginPage;