import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function Topbar() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-card/50 glass border-b border-border flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center">
        {/* Mobile menu button would go here */}
      </div>
      <div className="flex items-center space-x-4">
        <button className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted transition-colors">
          <span className="sr-only">View notifications</span>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
        <button
          onClick={handleLogout}
          className="text-sm font-medium text-destructive hover:text-destructive/80 transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
