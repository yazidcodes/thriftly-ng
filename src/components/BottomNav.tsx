import { LayoutDashboard, Users, Clock } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const tabs = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/members', label: 'Members', icon: Users },
  { path: '/history', label: 'History', icon: Clock },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isAppPage = ['/dashboard', '/members', '/history'].includes(location.pathname);
  if (!isAppPage) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {tabs.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 text-xs font-medium transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
