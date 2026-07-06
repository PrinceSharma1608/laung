import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wrench, 
  Users, 
  MapPin, 
  UserCheck, 
  Layers, 
  ChevronLeft, 
  ChevronRight,
  ShieldAlert,
  History,
  FileSpreadsheet,
  ClipboardCheck,
  Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ collapsed, setCollapsed }) => {
  const { user } = useAuth();
  
  if (!user) return null;
  const role = user.role;

  // Helper to determine menu permissions
  const hasAccess = (allowedRoles) => {
    return allowedRoles.includes(role);
  };

  const menuItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['LINE_INCHARGE', 'SUPERVISOR', 'TEAM_LEADER', 'JH_OWNER']
    },
    {
      path: '/maintenance',
      label: 'Perform Maintenance',
      icon: Wrench,
      roles: ['TEAM_LEADER', 'JH_OWNER']
    },
    {
      path: '/users',
      label: 'User Directory',
      icon: Users,
      roles: ['LINE_INCHARGE']
    },
    {
      path: '/area-supervisor',
      label: 'Area-Supervisor Mapping',
      icon: MapPin,
      roles: ['LINE_INCHARGE']
    },
    {
      path: '/tl-jho',
      label: 'TL - JHO Mapping',
      icon: UserCheck,
      roles: ['LINE_INCHARGE']
    },
    {
      path: '/machine-allocation',
      label: 'Machine Allocation',
      icon: Layers,
      roles: ['LINE_INCHARGE']
    },
    {
      path: '/machine-configuration',
      label: 'Machine Config',
      icon: Settings,
      roles: ['LINE_INCHARGE']
    },
    {
      path: '/audit',
      label: 'Audits',
      icon: ClipboardCheck,
      roles: ['LINE_INCHARGE', 'SUPERVISOR']
    },
    {
      path: '/maintenance-logs',
      label: 'Maintenance Logs',
      icon: History,
      roles: ['LINE_INCHARGE']
    },
    {
      path: '/audit-logs',
      label: 'Audit Logs',
      icon: FileSpreadsheet,
      roles: ['LINE_INCHARGE']
    }
  ];

  return (
    <aside 
      className={`fixed top-0 left-0 z-30 h-screen bg-slate-900 text-slate-100 border-r border-slate-800 transition-all duration-300 flex flex-col ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Section */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <svg viewBox="0 0 100 100" className="w-9 h-9 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <clipPath id="tataOvalClip">
                <path d="M 50,22 C 22,22 10,38 10,50 C 10,62 22,78 50,78 C 78,78 90,62 90,50 C 90,38 78,22 50,22 Z" />
              </clipPath>
            </defs>
            <g clipPath="url(#tataOvalClip)">
              <path d="M 50,22 C 22,22 10,38 10,50 C 10,62 22,78 50,78 C 78,78 90,62 90,50 C 90,38 78,22 50,22 Z" fill="#0066b2" />
              <path d="M 8,50 C 25,43.5 45,43.5 48.5,44 L 48.5,78 H 51.5 L 51.5,44 C 55,43.5 75,43.5 92,50 C 75,47.5 56.5,47.5 53,48 L 53,78 H 47 L 47,48 C 43.5,47.5 25,47.5 8,50 Z" fill="#ffffff" />
            </g>
          </svg>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-wide text-white uppercase">TATA MOTORS</span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase -mt-0.5">Jishu Hozen</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors hidden md:block"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 py-4 overflow-y-auto px-3 space-y-1">
        {menuItems.map((item) => {
          if (!hasAccess(item.roles)) return null;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/10'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="text-sm tracking-wide">{item.label}</span>}
              
              {/* Tooltip for collapsed view */}
              {collapsed && (
                <div className="absolute left-full ml-3 px-2 py-1 rounded bg-slate-950 text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-md">
                  {item.label}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Role Indicator Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-center shrink-0">
        {!collapsed ? (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Active Role</span>
            <span className="px-2.5 py-1 text-xs font-semibold bg-indigo-950/80 border border-indigo-800 text-indigo-300 rounded-full inline-block truncate max-w-full">
              {role.replace('_', ' ')}
            </span>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse" title={role} />
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
