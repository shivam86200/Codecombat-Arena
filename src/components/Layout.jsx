import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Sword, LayoutDashboard, Trophy, LogIn, UserPlus,
  LogOut, User, ChevronDown, Swords, Medal, Coins, History
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { name: 'Dashboard',   path: '/dashboard',   icon: LayoutDashboard },
  { name: 'Leaderboard', path: '/leaderboard', icon: Trophy          },
  { name: 'Tournament',  path: '/tournament',  icon: Medal           },
  { name: 'New Match',   path: '/match/new',   icon: Swords          },
  { name: 'Ledger',      path: '/ledger',      icon: History         },
];

const Navbar = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <nav className="glass sticky top-0 z-50 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2 shrink-0">
            <Sword className="h-7 w-7 text-primary-500" />
            <span className="text-lg font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent tracking-tight">
              CODECOMBAT
            </span>
          </Link>

          {/* Nav links — authenticated only */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-1">
              {NAV_ITEMS.map(({ name, path, icon: Icon }) => {
                const active = location.pathname === path;
                return (
                  <Link
                    key={name}
                    to={path}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? 'bg-primary-600/20 text-primary-400 border border-primary-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {name}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link to="/ledger" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 transition-colors mr-2">
                  <Coins className="h-4 w-4" />
                  <span className="text-sm font-bold">{user?.coins || 0}</span>
                </Link>
                <div className="relative">
                <button
                  onClick={() => setOpen((o) => !o)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800/70 transition-all text-sm font-medium text-slate-300 hover:text-white"
                >
                  <div className="w-7 h-7 rounded-full bg-primary-600/30 border border-primary-500/40 flex items-center justify-center">
                    <User className="h-3.5 w-3.5 text-primary-400" />
                  </div>
                  <span className="hidden sm:block max-w-[120px] truncate">
                    {user?.username || user?.name || user?.email?.split('@')[0] || 'Warrior'}
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>

                {open && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 mt-2 w-52 glass rounded-xl border border-white/10 shadow-xl z-20 overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/5">
                        <p className="text-xs text-slate-500">Signed in as</p>
                        <p className="text-sm font-semibold text-white truncate">{user?.email}</p>
                      </div>
                      <div className="p-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <LogOut className="h-4 w-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
            ) : (
              <>
                <Link to="/login" className="flex items-center gap-1.5 text-slate-400 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                  <LogIn className="h-4 w-4" /> Login
                </Link>
                <Link to="/register" className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-primary-900/20">
                  <UserPlus className="h-4 w-4" /> Join Arena
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const Layout = ({ children }) => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-grow max-w-7xl mx-auto w-full">
      {children}
    </main>
    <footer className="py-6 text-center text-slate-600 border-t border-white/5 text-xs">
      © {new Date().getFullYear()} CodeCombat Arena — Built for elite warriors.
    </footer>
  </div>
);

export default Layout;
