import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  
  const isJho = user?.role === 'JH_OWNER';

  return (
    <div className="min-h-screen bg-transparent transition-colors duration-500 flex">
      {/* Desktop Sidebar */}
      {!isJho && (
        <div className="hidden md:block">
          <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        </div>
      )}

      {/* Mobile Drawer Sidebar */}
      {!isJho && mobileOpen && (
        <>
          <div 
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden"
          />
          <div className="fixed inset-y-0 left-0 z-50 md:hidden animate-slide-in">
            <Sidebar collapsed={false} setCollapsed={setMobileOpen} />
          </div>
        </>
      )}

      {/* Main Content Pane */}
      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isJho ? 'pl-0 md:pl-0' : collapsed ? 'md:pl-20' : 'md:pl-64'
        }`}
      >
        <Navbar onMenuClick={() => !isJho && setMobileOpen(true)} />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
