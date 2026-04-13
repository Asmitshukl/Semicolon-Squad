import { createBrowserRouter, RouterProvider } from 'react-router-dom';
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
const VictimStationPage     = lazy(() => import('../pages/victim/VictimStationPage').then(m => ({ default: m.VictimStationPage })));
const VictimTrackerPage     = lazy(() => import('../pages/victim/VictimTrackerPage').then(m => ({ default: m.VictimTrackerPage })));
const VictimRightsPage      = lazy(() => import('../pages/victim/VictimRightsPage').then(m => ({ default: m.VictimRightsPage })));
const VictimProfilePage     = lazy(() => import('../pages/victim/VictimProfilePage').then(m => ({ default: m.VictimProfilePage })));

const OfficerLayout         = lazy(() => import('../components/officer/OfficerLayout').then(m => ({ default: m.OfficerLayout })));
const OfficerDashboard      = lazy(() => import('../pages/officer/OfficerDashboard').then(m => ({ default: m.OfficerDashboard })));
const FIRInbox              = lazy(() => import('../pages/officer/FIRInbox').then(m => ({ default: m.FIRInbox })));
const FIRDetail             = lazy(() => import('../pages/officer/FIRDetail').then(m => ({ default: m.FIRDetail })));
const OfficerFIRNewPage     = lazy(() => import('../pages/officer/OfficerFIRNewPage').then(m => ({ default: m.OfficerFIRNewPage })));
const BNSTranslator         = lazy(() => import('../pages/officer/BNSTranslator').then(m => ({ default: m.BNSTranslator })));
const VoiceStatements       = lazy(() => import('../pages/officer/VoiceStatements').then(m => ({ default: m.VoiceStatements })));
const OfficerProfile        = lazy(() => import('../pages/officer/OfficerProfile').then(m => ({ default: m.OfficerProfile })));

const AdminLayout           = lazy(() => import('../components/layout/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminHome             = lazy(() => import('../pages/admin/AdminHome').then(m => ({ default: m.AdminHome })));
const AdminOfficerPage      = lazy(() => import('../pages/admin/AdminOfficerPage').then(m => ({ default: m.AdminOfficerPage })));
const AdminStationPage      = lazy(() => import('../pages/admin/AdminStationPage').then(m => ({ default: m.AdminStationPage })));
const AdminBNSPage          = lazy(() => import('../pages/admin/AdminBNSPage').then(m => ({ default: m.AdminBNSPage })));

const NotFound              = lazy(() => import('../pages/NotFound').then(m => ({ default: m.NotFound })));
const Unauthorized          = lazy(() => import('../pages/Unauthorized').then(m => ({ default: m.Unauthorized })));
const PublicLandingPage     = lazy(() => import('../pages/PublicLandingPage').then(m => ({ default: m.PublicLandingPage })));

/* ── Full-page loading spinner ──────────────────────────────────── */
const PageLoader = () => (
  <div className="min-h-screen bg-[#12100E] flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-2 border-[#D2701A]/30 border-t-[#D2701A] rounded-full animate-spin" />
      <p className="text-slate-500 text-sm">Loading…</p>
    </div>
  </div>
);

/* ── Router definition ──────────────────────────────────────────── */
const router = createBrowserRouter([
  /* ── Public landing page ──────────────────────────────────────── */
  {
    path: '/',
    element: <Suspense fallback={<PageLoader />}><PublicLandingPage /></Suspense>,
  },

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

  /* ── Victim portal — role-gated ──────────────────────────────── */
  {
    element: <PrivateRoute allowedRoles={['victim']} />,
    children: [
      { path: '/victim',           element: <Suspense fallback={<PageLoader />}><LandingHome /></Suspense> },
      { path: '/victim/statement', element: <Suspense fallback={<PageLoader />}><VictimStatementPage /></Suspense> },
      { path: '/victim/classify',  element: <Suspense fallback={<PageLoader />}><VictimClassifyPage /></Suspense> },
      { path: '/victim/rights',    element: <Suspense fallback={<PageLoader />}><VictimRightsPage /></Suspense> },
      { path: '/victim/station',   element: <Suspense fallback={<PageLoader />}><VictimStationPage /></Suspense> },
      { path: '/victim/tracker',   element: <Suspense fallback={<PageLoader />}><VictimTrackerPage /></Suspense> },
      { path: '/victim/profile',   element: <Suspense fallback={<PageLoader />}><VictimProfilePage /></Suspense> },
    ],
  },

  /* ── Officer portal — role-gated ────────────────────────────── */
  {
    element: <PrivateRoute allowedRoles={['officer']} />,
    children: [
      {
        path: '/officer',
        element: (
          <Suspense fallback={<PageLoader />}>
            <OfficerLayout />
          </Suspense>
        ),
        children: [
          { index: true,           element: <Suspense fallback={<PageLoader />}><OfficerDashboard /></Suspense> },
          { path: 'fir',           element: <Suspense fallback={<PageLoader />}><FIRInbox /></Suspense> },
          { path: 'fir/new',       element: <Suspense fallback={<PageLoader />}><OfficerFIRNewPage /></Suspense> },
          { path: 'fir/:firId',    element: <Suspense fallback={<PageLoader />}><FIRDetail /></Suspense> },
          { path: 'bns',           element: <Suspense fallback={<PageLoader />}><BNSTranslator /></Suspense> },
          { path: 'voice',         element: <Suspense fallback={<PageLoader />}><VoiceStatements /></Suspense> },
          { path: 'profile',       element: <Suspense fallback={<PageLoader />}><OfficerProfile /></Suspense> },
        ],
      },
    ],
  },

  /* ── Admin portal — layout + nested routes ───────────────────── */
  {
    path: '/admin',
    element: (
      <Suspense fallback={<PageLoader />}>
        <AdminLayout />
      </Suspense>
    ),
    children: [
      { index: true,         element: <Suspense fallback={<PageLoader />}><AdminHome /></Suspense> },
      { path: 'officers',    element: <Suspense fallback={<PageLoader />}><AdminOfficerPage /></Suspense> },
      { path: 'stations',    element: <Suspense fallback={<PageLoader />}><AdminStationPage /></Suspense> },
      { path: 'bns',         element: <Suspense fallback={<PageLoader />}><AdminBNSPage /></Suspense> },
    ],
  },

  /* ── Utility pages ───────────────────────────────────────────── */
  {
    path: '/unauthorized',
    element: <Suspense fallback={<PageLoader />}><Unauthorized /></Suspense>,
  },
  {
    path: '*',
    element: <Suspense fallback={<PageLoader />}><NotFound /></Suspense>,
  },
]);

/* ── Export RouterProvider ──────────────────────────────────────── */
export const AppRouter = () => <RouterProvider router={router} />;
