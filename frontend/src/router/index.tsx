import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { PrivateRoute } from '../features/shared/auth/PrivateRoute';

/* ── Lazy-loaded auth pages ─────────────────────────────────────── */
const LoginPage       = lazy(() => import('../features/shared/auth/LoginPage'));
const VictimRegister  = lazy(() => import('../features/shared/auth/VictimRegister'));
const OfficerRegister = lazy(() => import('../features/shared/auth/OfficerRegister'));

/* ── Lazy-loaded stub pages (swap in real pages as you build them) ─ */
const LandingHome           = lazy(() => import('../pages/victim/LandingHome').then(m => ({ default: m.LandingHome })));
const VictimStatementPage   = lazy(() => import('../pages/victim/VictimStatementPage').then(m => ({ default: m.VictimStatementPage })));
const VictimClassifyPage    = lazy(() => import('../pages/victim/VictimClassifyPage').then(m => ({ default: m.VictimClassifyPage })));

const VictimTrackerPage     = lazy(() => import('../pages/victim/VictimTrackerPage').then(m => ({ default: m.VictimTrackerPage })));
const VictimProfilePage     = lazy(() => import('../pages/victim/VictimProfilePage').then(m => ({ default: m.VictimProfilePage })));

const OfficerHome           = lazy(() => import('../pages/officer/OfficerHome').then(m => ({ default: m.OfficerHome })));
const OfficerFIRNewPage     = lazy(() => import('../pages/officer/OfficerFIRNewPage').then(m => ({ default: m.OfficerFIRNewPage })));
const OfficerFIRDetailPage  = lazy(() => import('../pages/officer/OfficerFIRDetailPage').then(m => ({ default: m.OfficerFIRDetailPage })));
const OfficerFIRListPage    = lazy(() => import('../pages/officer/OfficerFIRListPage').then(m => ({ default: m.OfficerFIRListPage })));
const OfficerBNSLookupPage  = lazy(() => import('../pages/officer/OfficerBNSLookupPage').then(m => ({ default: m.OfficerBNSLookupPage })));
const OfficerProfilePage    = lazy(() => import('../pages/officer/OfficerProfilePage').then(m => ({ default: m.OfficerProfilePage })));

const AdminHome             = lazy(() => import('../pages/admin/AdminHome').then(m => ({ default: m.AdminHome })));
const AdminOfficerPage      = lazy(() => import('../pages/admin/AdminOfficerPage').then(m => ({ default: m.AdminOfficerPage })));
const AdminStationPage      = lazy(() => import('../pages/admin/AdminStationPage').then(m => ({ default: m.AdminStationPage })));
const AdminBNSPage          = lazy(() => import('../pages/admin/AdminBNSPage').then(m => ({ default: m.AdminBNSPage })));

const NotFound              = lazy(() => import('../pages/NotFound').then(m => ({ default: m.NotFound })));
const Unauthorized          = lazy(() => import('../pages/Unauthorized').then(m => ({ default: m.Unauthorized })));

/* ── Full-page loading spinner ──────────────────────────────────── */
const PageLoader = () => (
  <div className="min-h-screen bg-navy-900 flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      <p className="text-slate-500 text-sm">Loading…</p>
    </div>
  </div>
);

/* ── Router definition ──────────────────────────────────────────── */
const router = createBrowserRouter([
  /* ── Public routes ───────────────────────────────────────────── */
  {
    path: '/login',
    element: <Suspense fallback={<PageLoader />}><LoginPage /></Suspense>,
  },
  {
    path: '/register/victim',
    element: <Suspense fallback={<PageLoader />}><VictimRegister /></Suspense>,
  },
  {
    path: '/register/officer',
    element: <Suspense fallback={<PageLoader />}><OfficerRegister /></Suspense>,
  },

  /* ── Victim portal (TEMPORARILY PUBLIC for UI testing) ─────── */
  { path: '/victim',           element: <Suspense fallback={<PageLoader />}><LandingHome /></Suspense> },
  { path: '/victim/statement', element: <Suspense fallback={<PageLoader />}><VictimStatementPage /></Suspense> },
  { path: '/victim/classify',  element: <Suspense fallback={<PageLoader />}><VictimClassifyPage /></Suspense> },
  { path: '/victim/tracker',   element: <Suspense fallback={<PageLoader />}><VictimTrackerPage /></Suspense> },
  { path: '/victim/profile',   element: <Suspense fallback={<PageLoader />}><VictimProfilePage /></Suspense> },

  /* ── Officer portal (role-gated) ─────────────────────────────── */
  {
    element: <PrivateRoute allowedRoles={['officer']} />,
    children: [
      { path: '/officer',             element: <Suspense fallback={<PageLoader />}><OfficerHome /></Suspense> },
      { path: '/officer/fir/new',     element: <Suspense fallback={<PageLoader />}><OfficerFIRNewPage /></Suspense> },
      { path: '/officer/fir/:id',     element: <Suspense fallback={<PageLoader />}><OfficerFIRDetailPage /></Suspense> },
      { path: '/officer/fir',         element: <Suspense fallback={<PageLoader />}><OfficerFIRListPage /></Suspense> },
      { path: '/officer/bns',         element: <Suspense fallback={<PageLoader />}><OfficerBNSLookupPage /></Suspense> },
      { path: '/officer/profile',     element: <Suspense fallback={<PageLoader />}><OfficerProfilePage /></Suspense> },
    ],
  },

  /* ── Admin portal (role-gated) ───────────────────────────────── */
  {
    element: <PrivateRoute allowedRoles={['admin']} />,
    children: [
      { path: '/admin',               element: <Suspense fallback={<PageLoader />}><AdminHome /></Suspense> },
      { path: '/admin/officers',      element: <Suspense fallback={<PageLoader />}><AdminOfficerPage /></Suspense> },
      { path: '/admin/stations',      element: <Suspense fallback={<PageLoader />}><AdminStationPage /></Suspense> },
      { path: '/admin/bns',           element: <Suspense fallback={<PageLoader />}><AdminBNSPage /></Suspense> },
    ],
  },

  /* ── Utility pages ───────────────────────────────────────────── */
  {
    path: '/unauthorized',
    element: <Suspense fallback={<PageLoader />}><Unauthorized /></Suspense>,
  },
  {
    path: '/',
    element: <Navigate to="/victim" replace />,
  },
  {
    path: '*',
    element: <Suspense fallback={<PageLoader />}><NotFound /></Suspense>,
  },
]);

/* ── Export RouterProvider ──────────────────────────────────────── */
export const AppRouter = () => <RouterProvider router={router} />;