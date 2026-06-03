import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileSpreadsheet, 
  User, 
  LogOut, 
  Menu, 
  X, 
  BellRing
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['Admin', 'Manager', 'Employee'] },
    { name: 'Employees', path: '/employees', icon: Users, roles: ['Admin', 'Manager'] },
    { name: 'Attendance', path: '/attendance', icon: Calendar, roles: ['Admin', 'Manager', 'Employee'] },
    { name: 'Leave Tracker', path: '/leaves', icon: FileSpreadsheet, roles: ['Admin', 'Manager', 'Employee'] },
    { name: 'My Profile', path: '/profile', icon: User, roles: ['Admin', 'Manager', 'Employee'] },
  ];

  const filteredNavItems = navItems.filter(item => user && item.roles.includes(user.role));

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-[#E2E8D5] text-olive border-[#A3AD9A]/30';
      case 'Manager':
        return 'bg-[#F3E9D2] text-olive border-[#A3AD9A]/20';
      default:
        return 'bg-[#FAF9F6] text-ink/70 border-slate-200';
    }
  };

  return (
    <div id="app_layout" className="min-h-screen bg-cream flex flex-col lg:flex-row font-sans text-ink">
      {/* Sidebar for Desktop */}
      <aside id="desktop_sidebar" className="hidden lg:flex flex-col w-[280px] bg-white text-ink border-r border-[#2D2D2A]/5 rounded-r-[32px] shrink-0 select-none py-8 px-6 justify-between shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div className="space-y-8">
          {/* Brand/System Title */}
          <div className="flex items-center space-x-3 px-2">
            <div className="h-10 w-10 bg-olive rounded-2xl flex items-center justify-center shadow-md font-serif text-white font-semibold tracking-wider text-xl shrink-0">
              S
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold tracking-tight text-olive leading-none">StaffSync</h1>
              <p className="text-[10px] uppercase tracking-widest text-[#2D2D2A]/50 font-sans mt-1">Management Portal</p>
            </div>
          </div>

          {/* Navigation Section */}
          <nav className="flex flex-col gap-3 pt-4">
            {filteredNavItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <NavLink
                  id={`nav_${item.name.toLowerCase().replace(/\s+/g, '_')}`}
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm transition-all group ${
                    isActive 
                      ? 'text-olive font-semibold bg-cream/75 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] border border-[#5A5A40]/10' 
                      : 'text-ink/60 hover:text-ink hover:bg-cream/45'
                  }`}
                >
                  <div className="flex items-center space-x-3.5">
                    <IconComponent className={`h-4.5 w-4.5 shrink-0 transition-colors ${isActive ? 'text-olive' : 'text-sage group-hover:text-olive/70'}`} />
                    <span>{item.name}</span>
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 rounded-full bg-olive shadow-[0_0_8px_rgba(90,90,64,0.3)] animate-pulse"></div>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Identity Panel */}
        {user && (
          <div className="p-5 bg-[#FAF9F6] rounded-3xl border border-slate-100/80 flex flex-col gap-4 mt-6">
            <div className="flex items-center space-x-3">
              <div className="relative shrink-0">
                {user.profilePicture ? (
                  <img 
                    referrerPolicy="no-referrer"
                    src={user.profilePicture} 
                    alt={user.name} 
                    className="h-11 w-11 rounded-full object-cover border border-[#A3AD9A]/30" 
                  />
                ) : (
                  <div className="h-11 w-11 rounded-full bg-sage flex items-center justify-center font-bold text-white text-base shadow-sm">
                    {user.name.charAt(0)}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-olive border-2 border-white"></span>
              </div>
              <div className="overflow-hidden">
                <h4 className="font-semibold text-xs text-ink truncate leading-tight">{user.name}</h4>
                <p className="text-[9px] uppercase tracking-wider text-ink/50 truncate leading-tight mt-0.5">{user.department}</p>
                <span className={`inline-block text-[8px] tracking-wider uppercase font-bold px-2 py-0.5 rounded-full border mt-1.5 leading-none ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
              </div>
            </div>
            
            <button
              id="btn_desktop_logout"
              onClick={handleLogout}
              className="w-full text-left text-xs font-semibold text-rose-700/70 hover:text-rose-700 transition-colors pt-2 border-t border-slate-100 select-none flex items-center space-x-1.5 px-1 cursor-pointer"
            >
              <span>Logout Session</span>
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Header */}
      <header id="mobile_header" className="lg:hidden bg-white border-b border-cream px-4 py-3 flex items-center justify-between z-40 shrink-0 shadow-[0_2px_10px_rgba(0,0,0,0.01)]">
        <div className="flex items-center space-x-3 select-none">
          <div className="h-8 w-8 bg-olive rounded-xl flex items-center justify-center shadow font-serif text-white font-semibold">
            S
          </div>
          <span className="font-serif font-bold text-olive tracking-tight text-base">StaffSync</span>
        </div>

        <div className="flex items-center space-x-2">
          {user && (
            <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border ${getRoleBadgeColor(user.role)}`}>
              {user.role}
            </span>
          )}
          <button
            id="btn_mobile_menu_toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 px-2 text-ink/70 hover:text-olive hover:bg-cream/50 rounded-xl transition-all"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="mobile_drawer"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden bg-white border-b border-cream px-4 py-4 space-y-4 z-30 absolute top-[53px] left-0 w-full shadow-xl"
          >
            <div className="space-y-1">
              {filteredNavItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <NavLink
                    id={`mobile_nav_${item.name.toLowerCase().replace(/\s+/g, '_')}`}
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm transition-all ${
                      isActive 
                        ? 'bg-cream text-olive font-semibold border-l-4 border-olive' 
                        : 'text-ink/65 hover:bg-cream/40'
                    }`}
                  >
                    <IconComponent className="h-4.5 w-4.5 text-sage" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>

            {user && (
              <div className="border-t border-cream pt-4 flex flex-col gap-3">
                <div className="flex items-center space-x-3 px-2">
                  <div className="h-9 w-9 bg-sage rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold leading-tight">{user.name}</p>
                    <p className="text-[10px] text-ink/50 font-mono">{user.email}</p>
                  </div>
                </div>
                <button
                  id="btn_mobile_logout"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full py-2.5 rounded-xl text-center text-xs font-semibold text-rose-700/85 hover:bg-rose-50 border border-rose-100"
                >
                  Logout Session
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Pane */}
      <main id="main_pane" className="flex-1 flex flex-col overflow-auto bg-cream min-w-0">
        <header id="main_content_header" className="hidden lg:flex bg-cream/40 px-8 py-3 h-16 items-center justify-between z-10 sticky top-0 shrink-0 backdrop-blur-md">
          <div>
            <h2 className="text-[10px] uppercase tracking-widest leading-none font-bold text-sage">
              EMS Workspace &bull; Portal view
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right select-none">
              <span className="text-xs font-semibold text-ink/80 block">{user?.name}</span>
              <span className="text-[9px] text-sage font-mono uppercase tracking-wider block mt-0.5">
                Local Time System: 2026-06-01
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
