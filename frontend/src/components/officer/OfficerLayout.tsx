import { Outlet } from 'react-router-dom';
import { OfficerPageShell } from './OfficerPageShell';
import { OfficerNavbar } from './OfficerNavbar';

export const OfficerLayout = () => (
  <OfficerPageShell>
    <OfficerNavbar />
    <main className="flex-1 w-full min-h-0">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-8">
        <Outlet />
      </div>
    </main>
  </OfficerPageShell>
);

export default OfficerLayout;
