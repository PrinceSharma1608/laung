import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Menu } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  // Format the user role for displaying
  const formatRole = (role) => {
    return role.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
  };

  return (
    <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 sticky top-0 z-20 flex items-center justify-between px-6 shadow-sm">
      {/* Mobile Toggle & Brand title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Plant Portal
          </span>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 -mt-1 leading-tight">
            Tata Motors Lucknow
          </h1>
        </div>
      </div>

      {/* Right side options */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Vertical divider */}
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

        {/* User Card */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shadow-inner">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
              {user.userName}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              {formatRole(user.role)}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="p-2 rounded-xl text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200 flex items-center justify-center hover:scale-105"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
