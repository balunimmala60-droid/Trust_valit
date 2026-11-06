import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import {
  Shield,
  ShieldCheck,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  UserCheck,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Smartphone,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';

interface AuthPageProps {
  allUsers: User[];
  onLoginSuccess: (user: User, method: string) => void;
  onRegisterSuccess: (newUser: User) => void;
  onCancel?: () => void;
  canCancel?: boolean;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  allUsers,
  onLoginSuccess,
  onRegisterSuccess,
  onCancel,
  canCancel = false
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('sarah.owner@acmecorp.com');
  const [loginPassword, setLoginPassword] = useState('TrustVault@2026!');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginStep, setLoginStep] = useState<1 | 2>(1); // 1 = credentials, 2 = 2FA
  const [loginOtp, setLoginOtp] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('OWNER');
  const [regStep, setRegStep] = useState<1 | 2>(1); // 1 = details & role, 2 = 2FA setup
  const [regOtp, setRegOtp] = useState('');
  const [regError, setRegError] = useState('');

  // Simulated live TOTP code that refreshes
  const [simulatedTotp, setSimulatedTotp] = useState('749281');
  const [totpCountdown, setTotpCountdown] = useState(28);
  const [copiedKey, setCopiedKey] = useState(false);

  // Timer for 2FA countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTotpCountdown(prev => {
        if (prev <= 1) {
          // Generate new 6 digit code
          const newCode = Math.floor(100000 + Math.random() * 900000).toString();
          setSimulatedTotp(newCode);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Quick preset accounts for testing
  const demoAccounts = [
    {
      role: 'OWNER' as UserRole,
      title: 'Owner Account',
      name: 'Sarah Chen',
      email: 'sarah.owner@acmecorp.com',
      badge: 'Full Document Control'
    },
    {
      role: 'VIEWER' as UserRole,
      title: 'Viewer Account',
      name: 'David Ross',
      email: 'david.viewer@external-partner.com',
      badge: 'READ / EDIT Delegated'
    },
    {
      role: 'ADMIN' as UserRole,
      title: 'Admin Account',
      name: 'Alex Vance',
      email: 'admin@trustvault.sec',
      badge: 'System Governance'
    }
  ];

  const handleSelectDemoAccount = (acc: typeof demoAccounts[0]) => {
    setLoginEmail(acc.email);
    setLoginPassword('TrustVault@2026!');
    setLoginError('');
  };

  // Step 1 Submit: Validate credentials and move to 2FA
  const handleLoginCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail || !loginPassword) {
      setLoginError('Please enter both email address and password.');
      return;
    }

    const matchedUser = allUsers.find(
      u => u.email.toLowerCase() === loginEmail.toLowerCase().trim()
    );

    if (!matchedUser) {
      setLoginError('No registered account found with this email. Please check or create an account.');
      return;
    }

    if (matchedUser.accountStatus === 'SUSPENDED') {
      setLoginError('This account has been suspended by an administrator. Contact security governance.');
      return;
    }

    // Move to 2FA step
    setLoginStep(2);
    setLoginOtp('');
  };

  // Step 2 Submit: Validate 2FA code and log in
  const handleLogin2FaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const cleanOtp = loginOtp.replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      setLoginError('Please enter a valid 6-digit security verification code.');
      return;
    }

    const matchedUser = allUsers.find(
      u => u.email.toLowerCase() === loginEmail.toLowerCase().trim()
    );

    if (matchedUser) {
      onLoginSuccess(matchedUser, 'PASSWORD_PLUS_2FA');
    }
  };

  // Register Step 1: Validate registration info and role
  const handleRegisterDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regFullName.trim()) {
      setRegError('Please provide your full name.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setRegError('Please provide a valid work email address.');
      return;
    }
    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match. Please re-enter.');
      return;
    }

    const exists = allUsers.some(u => u.email.toLowerCase() === regEmail.toLowerCase().trim());
    if (exists) {
      setRegError('An account with this email already exists. Please sign in instead.');
      return;
    }

    // Move to 2FA setup step
    setRegStep(2);
    setRegOtp('');
  };

  // Register Step 2: Validate 2FA setup and complete registration
  const handleRegister2FaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    const cleanOtp = regOtp.replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      setRegError('Please enter the 6-digit confirmation code from your authenticator.');
      return;
    }

    const newUser: User = {
      id: 'user_' + Math.random().toString(36).substring(2, 9),
      fullName: regFullName.trim(),
      email: regEmail.toLowerCase().trim(),
      role: selectedRole,
      accountStatus: 'ACTIVE',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };

    onRegisterSuccess(newUser);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText('TVLT-9821-4472-SECQ');
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#081426] text-[#F8FAFC]">
      <div className="w-full max-w-xl bg-[#132238] border border-[#334155] rounded-3xl shadow-2xl overflow-hidden animate-fadeIn">
        {/* Top Header Branding */}
        <div className="p-6 border-b border-[#334155] bg-[#0D1B2A] text-center relative">
          {canCancel && onCancel && (
            <button
              onClick={onCancel}
              className="absolute top-5 right-5 text-slate-400 hover:text-white text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#1B2D45] border border-[#334155]"
            >
              Return to Vault
            </button>
          )}

          <div className="flex items-center justify-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 border border-blue-400/40">
              <Shield className="w-6 h-6 fill-current" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">
              TRUST<span className="text-cyan-400">VAULT</span>
            </span>
          </div>

          <p className="text-xs text-cyan-300 font-medium">
            Your Documents. Your Control. Your Security.
          </p>
          <div className="mt-2 inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[#1B2D45] text-slate-300 text-[10px] font-mono border border-[#334155]">
            <KeyRound className="w-3 h-3 text-cyan-400" />
            <span>Zero-Trust Gateway • Mandatory Two-Step Verification (2FA)</span>
          </div>
        </div>

        {/* Tab Switcher: Sign In vs Create Account */}
        <div className="grid grid-cols-2 border-b border-[#334155] bg-[#0D1B2A]/70 text-xs">
          <button
            onClick={() => {
              setAuthMode('login');
              setLoginStep(1);
              setLoginError('');
            }}
            className={`py-3.5 font-bold transition-all border-b-2 flex items-center justify-center space-x-2 ${
              authMode === 'login'
                ? 'border-cyan-400 text-cyan-300 bg-[#132238]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Sign In to Vault</span>
          </button>

          <button
            onClick={() => {
              setAuthMode('register');
              setRegStep(1);
              setRegError('');
            }}
            className={`py-3.5 font-bold transition-all border-b-2 flex items-center justify-center space-x-2 ${
              authMode === 'register'
                ? 'border-cyan-400 text-cyan-300 bg-[#132238]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Create New Account</span>
          </button>
        </div>

        {/* Content Container */}
        <div className="p-6 md:p-8 space-y-6">
          {/* ============================================================== */}
          {/* MODE 1: SIGN IN */}
          {/* ============================================================== */}
          {authMode === 'login' && (
            <div>
              {loginStep === 1 ? (
                /* Step 1: Credentials */
                <form onSubmit={handleLoginCredentialsSubmit} className="space-y-4">
                  <div>
                    <h2 className="text-base font-black text-white">Sign In to Your Account</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Enter your enterprise credentials, then verify your identity with Two-Step Verification.
                    </p>
                  </div>

                  {loginError && (
                    <div className="p-3 rounded-xl bg-[#1e3a8a]/70 border border-blue-500 text-cyan-200 text-xs flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  {/* Quick Preset Selector */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Quick Demo Accounts (1-Click Select)
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {demoAccounts.map(acc => (
                        <button
                          key={acc.email}
                          type="button"
                          onClick={() => handleSelectDemoAccount(acc)}
                          className={`p-2 rounded-xl border text-left transition-all ${
                            loginEmail === acc.email
                              ? 'bg-blue-600/20 border-cyan-400 shadow-sm'
                              : 'bg-[#1B2D45] border-[#334155] hover:border-slate-400 text-slate-300'
                          }`}
                        >
                          <div className="font-bold text-white text-[11px] truncate">{acc.name}</div>
                          <div className="text-[9px] text-cyan-300 font-mono mt-0.5 uppercase font-semibold">{acc.role}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Email Input */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 block">Work Email</label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D1B2A] border border-[#334155] text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">Password</label>
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                      >
                        {showLoginPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showLoginPassword ? 'Hide' : 'Show'}</span>
                      </button>
                    </div>
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D1B2A] border border-[#334155] text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 mt-2"
                  >
                    <span>Proceed to Two-Step Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                /* Step 2: Two-Step Verification (2FA) */
                <form onSubmit={handleLogin2FaSubmit} className="space-y-5">
                  <div>
                    <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
                      <Smartphone className="w-4 h-4" />
                      <span>Security Challenge: Step 2 of 2</span>
                    </div>
                    <h2 className="text-base font-black text-white">Enter Two-Step Verification Code</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      A time-based 6-digit security code has been generated for identity <strong className="text-white">{loginEmail}</strong>.
                    </p>
                  </div>

                  {loginError && (
                    <div className="p-3 rounded-xl bg-[#1e3a8a]/70 border border-blue-500 text-cyan-200 text-xs flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  {/* Simulated Authenticator Card */}
                  <div className="p-4 rounded-2xl bg-[#0D1B2A] border border-[#334155] space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 text-slate-300">
                        <Smartphone className="w-4 h-4 text-cyan-400" />
                        <span className="font-semibold">TrustVault Authenticator</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-[11px] font-mono text-cyan-300">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Refreshes in {totpCountdown}s</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#132238] border border-[#334155]">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-mono">Current 2FA Code:</span>
                        <div className="text-2xl font-black font-mono tracking-widest text-white mt-0.5">
                          {simulatedTotp.substring(0, 3)}-{simulatedTotp.substring(3, 6)}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setLoginOtp(simulatedTotp)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition-all"
                      >
                        Auto-fill Code
                      </button>
                    </div>
                  </div>

                  {/* Code Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">
                      6-Digit Security Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={loginOtp}
                      onChange={e => setLoginOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      autoFocus
                      required
                      className="w-full px-4 py-3 rounded-xl bg-[#0D1B2A] border border-[#334155] text-white text-xl font-mono text-center tracking-[0.5em] focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="flex items-center space-x-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setLoginStep(1)}
                      className="flex-1 py-3 rounded-xl bg-[#1B2D45] hover:bg-[#223859] border border-[#334155] text-slate-300 font-bold text-xs transition-all"
                    >
                      ← Back
                    </button>

                    <button
                      type="submit"
                      className="flex-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4 text-cyan-300" />
                      <span>Confirm & Enter Vault</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* MODE 2: CREATE NEW ACCOUNT */}
          {/* ============================================================== */}
          {authMode === 'register' && (
            <div>
              {regStep === 1 ? (
                /* Register Step 1: Details and Role Selection */
                <form onSubmit={handleRegisterDetailsSubmit} className="space-y-4">
                  <div>
                    <h2 className="text-base font-black text-white">Create New TrustVault Account</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Configure your enterprise identity and select your role: <strong>Owner</strong>, <strong>Viewer</strong>, or <strong>Admin</strong>.
                    </p>
                  </div>

                  {regError && (
                    <div className="p-3 rounded-xl bg-[#1e3a8a]/70 border border-blue-500 text-cyan-200 text-xs flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />
                      <span>{regError}</span>
                    </div>
                  )}

                  {/* Name and Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300 block">Full Name</label>
                      <input
                        type="text"
                        value={regFullName}
                        onChange={e => setRegFullName(e.target.value)}
                        placeholder="e.g. Maya Lin"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D1B2A] border border-[#334155] text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300 block">Work Email</label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={e => setRegEmail(e.target.value)}
                        placeholder="maya.lin@enterprise.corp"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D1B2A] border border-[#334155] text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  {/* Role Selection */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Select Your Platform Role
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* Role 1: OWNER */}
                      <div
                        onClick={() => setSelectedRole('OWNER')}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                          selectedRole === 'OWNER'
                            ? 'bg-blue-600/20 border-cyan-400 shadow-md ring-1 ring-cyan-400/30'
                            : 'bg-[#0D1B2A] border-[#334155] hover:border-slate-400 text-slate-300'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-xs">Owner</span>
                            <ShieldCheck className="w-4 h-4 text-cyan-400" />
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight">
                            Upload documents, grant & revoke delegations, full asset control.
                          </p>
                        </div>
                        <span className="mt-2 text-[9px] font-mono font-bold text-cyan-300 uppercase block">
                          Full Control
                        </span>
                      </div>

                      {/* Role 2: VIEWER */}
                      <div
                        onClick={() => setSelectedRole('VIEWER')}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                          selectedRole === 'VIEWER'
                            ? 'bg-blue-600/20 border-cyan-400 shadow-md ring-1 ring-cyan-400/30'
                            : 'bg-[#0D1B2A] border-[#334155] hover:border-slate-400 text-slate-300'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-xs">Viewer</span>
                            <Eye className="w-4 h-4 text-blue-400" />
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight">
                            Access explicitly delegated documents with READ or EDIT rights.
                          </p>
                        </div>
                        <span className="mt-2 text-[9px] font-mono font-bold text-blue-300 uppercase block">
                          Least Privilege
                        </span>
                      </div>

                      {/* Role 3: ADMIN */}
                      <div
                        onClick={() => setSelectedRole('ADMIN')}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                          selectedRole === 'ADMIN'
                            ? 'bg-blue-600/20 border-cyan-400 shadow-md ring-1 ring-cyan-400/30'
                            : 'bg-[#0D1B2A] border-[#334155] hover:border-slate-400 text-slate-300'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-xs">Admin</span>
                            <Shield className="w-4 h-4 text-emerald-400" />
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight">
                            User governance, suspension, and cryptographic audit monitoring.
                          </p>
                        </div>
                        <span className="mt-2 text-[9px] font-mono font-bold text-emerald-300 uppercase block">
                          Governance
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Password & Confirm Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300 block">Password</label>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={e => setRegPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D1B2A] border border-[#334155] text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-300">Confirm Password</label>
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="text-[11px] text-cyan-400 hover:text-cyan-300"
                        >
                          {showRegPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        value={regConfirmPassword}
                        onChange={e => setRegConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D1B2A] border border-[#334155] text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 mt-2"
                  >
                    <span>Proceed to 2FA Setup</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                /* Register Step 2: 2FA Setup & Activation */
                <form onSubmit={handleRegister2FaSubmit} className="space-y-5">
                  <div>
                    <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
                      <Sparkles className="w-4 h-4" />
                      <span>Security Activation: Step 2 of 2</span>
                    </div>
                    <h2 className="text-base font-black text-white">Set Up Two-Step Verification (2FA)</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Link your authenticator app to activate mandatory 2FA security for role <strong className="text-cyan-300 uppercase">{selectedRole}</strong>.
                    </p>
                  </div>

                  {regError && (
                    <div className="p-3 rounded-xl bg-[#1e3a8a]/70 border border-blue-500 text-cyan-200 text-xs flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />
                      <span>{regError}</span>
                    </div>
                  )}

                  {/* 2FA Secret Key Card */}
                  <div className="p-4 rounded-2xl bg-[#0D1B2A] border border-[#334155] space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">Authenticator Secret Key:</span>
                      <button
                        type="button"
                        onClick={handleCopyKey}
                        className="text-cyan-400 hover:text-cyan-300 font-mono text-[11px] flex items-center space-x-1"
                      >
                        {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey ? 'Copied!' : 'Copy Key'}</span>
                      </button>
                    </div>

                    <div className="p-3 rounded-xl bg-[#132238] border border-[#334155] font-mono text-cyan-300 font-bold text-center tracking-wider text-sm select-all">
                      TVLT-9821-4472-SECQ
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-slate-400 text-[11px]">Simulated TOTP Code:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-white font-bold">{simulatedTotp}</span>
                        <button
                          type="button"
                          onClick={() => setRegOtp(simulatedTotp)}
                          className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px]"
                        >
                          Auto-fill
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 6-Digit Code Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Enter 6-Digit Confirmation Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={regOtp}
                      onChange={e => setRegOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      autoFocus
                      required
                      className="w-full px-4 py-3 rounded-xl bg-[#0D1B2A] border border-[#334155] text-white text-xl font-mono text-center tracking-[0.5em] focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="flex items-center space-x-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setRegStep(1)}
                      className="flex-1 py-3 rounded-xl bg-[#1B2D45] hover:bg-[#223859] border border-[#334155] text-slate-300 font-bold text-xs transition-all"
                    >
                      ← Back
                    </button>

                    <button
                      type="submit"
                      className="flex-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4 text-cyan-300" />
                      <span>Activate 2FA & Enter Vault</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
