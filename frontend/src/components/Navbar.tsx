import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Film, Ticket, LayoutDashboard, Building2, LogIn, LogOut, UserCheck } from 'lucide-react';
import { LoginModal } from './LoginModal';

export const Navbar: React.FC = () => {
  const { user, logout, switchDemoUser } = useAuth();
  const { isConnected } = useSocket();
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-white group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
            <Film className="w-5 h-5 text-white" />
          </div>
          <span className="bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
            SeatSwift
          </span>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-300">
            <Link to="/" className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-slate-800 transition">
              Explore Events
            </Link>
            {user && (
              <Link to="/my-bookings" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:text-white hover:bg-slate-800 transition">
                <Ticket className="w-4 h-4 text-indigo-400" />
                My Tickets
              </Link>
            )}
            {user && (user.role === 'ORGANISER' || user.role === 'ADMIN') && (
              <Link to="/organiser" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:text-white hover:bg-slate-800 transition">
                <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                Organiser Portal
              </Link>
            )}
            {user && user.role === 'ADMIN' && (
              <Link to="/admin/venues" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:text-white hover:bg-slate-800 transition">
                <Building2 className="w-4 h-4 text-amber-400" />
                Venues & Layouts
              </Link>
            )}
          </nav>

          {/* Real-time WebSocket Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-slate-400 font-medium">{isConnected ? 'Live Sync' : 'Offline'}</span>
          </div>

          {/* Profile / Demo Switcher */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-xl text-xs">
                  <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                    user.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    user.role === 'ORGANISER' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  }`}>
                    {user.role}
                  </span>
                  <span className="font-semibold text-slate-200 hidden sm:inline">{user.name}</span>
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-md shadow-indigo-600/30 transition"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )}

            {/* Quick Demo Switcher */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
              <span className="text-slate-500 px-2 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" /> Demo:
              </span>
              <button
                onClick={() => switchDemoUser('CUSTOMER')}
                className={`px-2 py-1 rounded font-medium transition ${user?.role === 'CUSTOMER' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Customer
              </button>
              <button
                onClick={() => switchDemoUser('ORGANISER')}
                className={`px-2 py-1 rounded font-medium transition ${user?.role === 'ORGANISER' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Organiser
              </button>
              <button
                onClick={() => switchDemoUser('ADMIN')}
                className={`px-2 py-1 rounded font-medium transition ${user?.role === 'ADMIN' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </div>

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </header>
  );
};
