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

  const renderAvatar = (role) => {
    let bgClass = "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400";
    let ovalColor = "#0066b2"; // Tata blue
    let linesColor = "#ffffff"; // white

    if (role === 'JH_OWNER') {
      // JHO: light yellow bg with blue tata logo
      bgClass = "bg-yellow-100 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900/30";
      ovalColor = "#0066b2";
      linesColor = "#FEF08A"; // light yellow (matches yellow-100)
    } else if (role === 'SUPERVISOR' || role === 'TEAM_LEADER') {
      // TL & Supervisor: blue bg with black tata logo
      bgClass = "bg-blue-600 border-blue-700";
      ovalColor = "#000000";
      linesColor = "#2563EB"; // blue (matches blue-600)
    } else if (role === 'LINE_INCHARGE') {
      // LI: creamy white bg with blue tata logo
      bgClass = "bg-[#FAF7F2] dark:bg-[#1E1C18] border-stone-200 dark:border-stone-850";
      ovalColor = "#0066b2";
      linesColor = "#FAF7F2"; // creamy white (matches bg)
    }

    return (
      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-inner overflow-hidden shrink-0 ${bgClass}`}>
        <svg viewBox="0 0 100 100" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <clipPath id="avatarTataOvalClip">
              <path d="M 50,22 C 22,22 10,38 10,50 C 10,62 22,78 50,78 C 78,78 90,62 90,50 C 90,38 78,22 50,22 Z" />
            </clipPath>
          </defs>
          <g clipPath="url(#avatarTataOvalClip)">
            <path d="M 50,22 C 22,22 10,38 10,50 C 10,62 22,78 50,78 C 78,78 90,62 90,50 C 90,38 78,22 50,22 Z" fill={ovalColor} />
            <path d="M 8,50 C 25,43.5 45,43.5 48.5,44 L 48.5,78 H 51.5 L 51.5,44 C 55,43.5 75,43.5 92,50 C 75,47.5 56.5,47.5 53,48 L 53,78 H 47 L 47,48 C 43.5,47.5 25,47.5 8,50 Z" fill={linesColor} />
          </g>
        </svg>
      </div>
    );
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
          {renderAvatar(user.role)}
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
