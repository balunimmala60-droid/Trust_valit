import React, { useState } from 'react';
import { User, NotificationItem, AppTheme } from '../types';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Bell,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  Sun,
  Moon,
  Sparkles,
  Palette
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  currentUser: User;
  allUsers: User[];
  onSwitchUser: (user: User) => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  notifications: NotificationItem[];
  onOpenDemoGuide: () => void;
  chainValid: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  allUsers,
  onSwitchUser,
  activeTab,
  onSelectTab,
  notifications,
  onOpenDemoGuide,
  chainValid
}) => {
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const { theme, setTheme, toggleTheme, isBW } = useTheme();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="sticky top-0 z-40 transition-colors duration-200 border-b shadow-lg bg-[#0b1a3d]/95 backdrop-blur-md border-blue-900/60 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectTab('dashboard')}>
            <div className="flex items-center justify-center w-9 h-9 rounded-lg font-black shadow-md bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-500/30 border border-blue-400/40">
              <Shield className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-black tracking-tight text-white">
                  TRUST<span className="text-blue-400">VAULT</span>
                </span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border bg-blue-950/80 text-blue-300 border-blue-700">
                  Zero-Trust
                </span>
              </div>
              <p className="text-[11px] hidden sm:block text-blue-200/80 font-medium">
                Secure Document Sharing & Verifiable Audit Trail
              </p>
            </div>
          </div>


          {/* Center Navigation Tabs */}
          <nav className="hidden lg:flex items-center space-x-1">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'documents', label: 'Documents' },
              { id: 'record-history', label: 'Record History' },
              { id: 'proof-center', label: 'Security Proofs' },
              { id: 'attack-lab', label: 'Attack Replay Lab' },
              { id: 'audit-trail', label: 'Audit Chain' },
              { id: 'copilot', label: 'AI Copilot' },
              { id: 'requests', label: 'Access Requests' },
              ...(currentUser.role === 'ADMIN' ? [{ id: 'admin', label: 'User Admin' }] : [])
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold border border-blue-400/40'
                    : 'text-blue-200 hover:text-white hover:bg-blue-900/40'
                }`}
              >
                {tab.label}
              </button>

            ))}
          </nav>

          {/* Right Action Tools: Judge Demo, Audit Status, Persona Switcher */}
          <div className="flex items-center space-x-2.5">

            {/* Enterprise Platform Tour & System Guide */}
            <button
              onClick={onOpenDemoGuide}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all shadow-sm bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/50"
              title="Platform Overview & Architecture Walkthrough"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Platform Tour</span>
            </button>


            {/* Audit Chain Status Indicator */}
            <div
              onClick={() => onSelectTab('audit-trail')}
              className={`cursor-pointer flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-mono font-medium border ${
                chainValid
                  ? isBW
                    ? 'bg-neutral-900 text-emerald-400 border-neutral-700 hover:bg-neutral-800'
                    : 'bg-emerald-950/50 text-emerald-400 border-emerald-800/60 hover:bg-emerald-900/40'
                  : 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse'
              }`}
              title="SHA-256 Merkle Chain Integrity"
            >
              <span className={`w-2 h-2 rounded-full ${chainValid ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              <span className="hidden md:inline">{chainValid ? 'Audit: OK' : 'Tampered!'}</span>
            </div>

            {/* Notifications Menu */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-md transition-all ${
                  isBW
                    ? 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${isBW ? 'bg-white' : 'bg-cyan-400 animate-ping'}`} />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl shadow-2xl p-3 z-50 border bg-[#132238] border-[#334155] text-slate-100">
                  <div className="flex items-center justify-between pb-2 border-b border-[#334155]">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Security Notifications</span>
                    <span className="text-[10px] font-mono text-slate-400">{notifications.length} events</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-[#334155] mt-1">
                    {notifications.map(n => (
                      <div key={n.id} className="py-2 text-xs">
                        <div className="font-semibold text-white">{n.title}</div>
                        <div className="text-[11px] mt-0.5 text-slate-300">{n.message}</div>
                        <div className="text-[9px] mt-1 font-mono text-cyan-400">{new Date(n.createdAt).toLocaleTimeString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Demo Persona Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-md border text-xs font-medium transition-all bg-[#1B2D45] hover:bg-[#223859] border-[#334155] text-slate-200"
              >
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                <div className="text-left">
                  <div className="font-bold leading-none text-white">{currentUser.fullName.split(' ')[0]}</div>
                  <div className="text-[9px] leading-tight uppercase font-mono text-cyan-300">{currentUser.role}</div>
                </div>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {showPersonaMenu && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl shadow-2xl p-2 z-50 border bg-[#132238] border-[#334155] text-slate-100">
                  <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider border-b border-[#334155] mb-1 text-cyan-400">
                    Switch Active Identity & Role
                  </div>
                  <div className="text-[10px] px-2 mb-2 text-slate-400">
                    Switch account personas to test document permissions:
                  </div>

                  <div className="space-y-1">
                    {allUsers.map(user => (
                      <button
                        key={user.id}
                        onClick={() => {
                          onSwitchUser(user);
                          setShowPersonaMenu(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg text-xs transition-all flex items-center justify-between ${
                          currentUser.id === user.id
                            ? 'bg-blue-600/20 text-white font-bold border border-cyan-400'
                            : 'hover:bg-[#1B2D45] text-slate-300 hover:text-white'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-white">{user.fullName}</div>
                          <div className="text-[10px] font-mono text-slate-400">{user.email}</div>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-[#0D1B2A] text-cyan-300 border border-[#334155]">
                          {user.role}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation bar */}
      <div className={`lg:hidden flex items-center space-x-1.5 overflow-x-auto px-4 py-2 border-t ${
        isBW ? 'border-neutral-800 bg-[#111111]' : 'border-slate-800 bg-slate-950/80'
      }`}>
        {[
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'documents', label: 'Docs' },
          { id: 'record-history', label: 'History' },
          { id: 'proof-center', label: 'Proofs' },
          { id: 'attack-lab', label: 'Attacks' },
          { id: 'audit-trail', label: 'Audit' },
          { id: 'copilot', label: 'Copilot' },
          { id: 'requests', label: 'Requests' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`whitespace-nowrap px-2.5 py-1 rounded text-xs font-semibold ${
              activeTab === tab.id
                ? isBW
                  ? 'bg-white text-black'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : isBW
                ? 'text-neutral-400'
                : 'text-slate-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
};
