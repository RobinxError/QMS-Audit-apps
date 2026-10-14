import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  KeyRound, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ArrowRight, 
  Building2, 
  Sparkles, 
  UserCheck, 
  CheckCircle2, 
  Clock,
  ExternalLink,
  Info,
  ShieldAlert
} from 'lucide-react';
import { AuthSession, FactorySettings, AccessRole } from '../types/audit';
import { 
  getSavedAuthSession, 
  loginWithCredentials, 
  verifyShareLink, 
  logoutUser,
  fetchDemoStatus,
  fetchDemoCredentials,
  DemoAccountInfo
} from '../services/authService';

interface AuthGateProps {
  children: (props: {
    session: AuthSession;
    onLogout: () => void;
    onSwitchUser: (username: string, pass: string) => Promise<boolean>;
  }) => React.ReactNode;
  factorySettings: FactorySettings;
  language: 'EN' | 'BN';
}

export const AuthGate: React.FC<AuthGateProps> = ({
  children,
  factorySettings,
  language,
}) => {
  const [session, setSession] = useState<AuthSession | null>(getSavedAuthSession);
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lockoutRemaining, setLockoutRemaining] = useState<number | null>(null);

  // Demo Mode & Evaluation Credentials Bar state
  const [demoModeEnabled, setDemoModeEnabled] = useState(true);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccountInfo[]>([]);
  const [selectedDemoUser, setSelectedDemoUser] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

  // Invite Token Detection
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteRequiresPass, setInviteRequiresPass] = useState(false);
  const [inviteLinkName, setInviteLinkName] = useState<string>('');
  const [invitePasscode, setInvitePasscode] = useState('');
  const [inviteRole, setInviteRole] = useState<AccessRole | null>(null);

  useEffect(() => {
    // Check URL parameters for invitation / share token
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('invite') || urlParams.get('share');
    if (token) {
      setInviteToken(token);
      attemptShareLogin(token);
    }

    // Load Demo Mode status and accounts for evaluation testing
    loadDemoStatus();
  }, []);

  const loadDemoStatus = async () => {
    try {
      const status = await fetchDemoStatus();
      setDemoModeEnabled(status.demoModeEnabled);
      setDemoAccounts(status.accounts);
    } catch (e) {
      console.warn('Could not load demo status:', e);
    }
  };

  const attemptShareLogin = async (token: string, pass?: string) => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const res = await verifyShareLink(token, pass);
      if (res.success && res.session) {
        setSession(res.session);
        // Clear invite param from URL cleanly without reload
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      } else if (res.requiresPassword) {
        setInviteRequiresPass(true);
        if (res.linkName) setInviteLinkName(res.linkName);
        if (res.assignedRole) setInviteRole(res.assignedRole);
        if (pass) {
          setErrorMessage(res.error || 'Incorrect passcode for this shared access link.');
        }
      } else {
        setErrorMessage(res.error || 'Invalid or expired share invitation.');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setDemoNotice(null);
    if (!usernameOrEmail.trim() || !password) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginWithCredentials(usernameOrEmail, password);
      if (res.success && res.session) {
        setSession(res.session);
        setLockoutRemaining(null);
      } else {
        setErrorMessage(res.error || 'Invalid credentials');
        if (res.remainingSeconds) {
          setLockoutRemaining(res.remainingSeconds);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser(session?.token);
    setSession(null);
    setUsernameOrEmail('');
    setPassword('');
    setSelectedDemoUser(null);
    setDemoNotice(null);
  };

  const handleSwitchUser = async (usr: string, pass: string) => {
    setUsernameOrEmail(usr);
    setPassword(pass);
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const res = await loginWithCredentials(usr, pass);
      if (res.success && res.session) {
        setSession(res.session);
        return true;
      } else {
        setErrorMessage(res.error || 'User switch failed');
        return false;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Demo Account Selector Click: Automatically fills in credentials from backend without exposing hardcoded passwords in frontend
  const handleSelectDemoAccount = async (account: DemoAccountInfo) => {
    setDemoLoading(true);
    setErrorMessage('');
    setSelectedDemoUser(account.username);

    try {
      const creds = await fetchDemoCredentials(account.username);
      if (creds.success && creds.password) {
        setUsernameOrEmail(creds.username || account.username);
        setPassword(creds.password);
        setDemoNotice(
          `Credentials auto-filled for ${account.label} (${account.username}). Click "Sign In to Portal" to authenticate.`
        );
      } else {
        setErrorMessage(creds.error || 'Could not retrieve demo credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to auto-fill demo credentials.');
    } finally {
      setDemoLoading(false);
    }
  };

  // If already authenticated, render protected application
  if (session) {
    return (
      <>
        {children({
          session,
          onLogout: handleLogout,
          onSwitchUser: handleSwitchUser,
        })}
      </>
    );
  }

  // Otherwise render the enterprise branded login gate
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* Top Header info */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between py-2 text-xs">
        <div className="flex items-center space-x-2 text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold">{factorySettings.isoCertifications?.split(',')[0] || 'ISO 9001:2015'} Enterprise System</span>
        </div>
        <div className="text-[11px] text-slate-500 font-mono hidden sm:block">
          Reg: {factorySettings.registrationNumber}
        </div>
      </div>

      {/* Main Authentication Container */}
      <div className="max-w-md w-full mx-auto my-auto py-6">
        <div className="bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
          {/* Card Top Branding Header */}
          <div className="p-6 sm:p-7 bg-slate-900 text-white border-b border-slate-800 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-600/10 pointer-events-none" />

            {/* Factory Logo or Crest */}
            <div className="flex justify-center mb-3">
              {factorySettings.factoryLogo ? (
                <img
                  src={factorySettings.factoryLogo}
                  alt={factorySettings.factoryName}
                  className="max-h-12 max-w-[240px] object-contain drop-shadow"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                  <Building2 className="w-6 h-6" />
                </div>
              )}
            </div>

            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
              {factorySettings.factoryName}
            </h1>
            <p className="text-[11px] text-slate-400 font-mono mt-1">
              Buyer Compliance & QMS Audit Management Portal
            </p>
          </div>

          {/* Form Content */}
          <div className="p-6 sm:p-7 space-y-4">
            {/* If arriving via a Password-Protected Invite Link */}
            {inviteToken && inviteRequiresPass ? (
              <form onSubmit={(e) => { e.preventDefault(); attemptShareLogin(inviteToken, invitePasscode); }} className="space-y-4">
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold text-blue-900">
                    <Lock className="w-4 h-4 text-blue-600" />
                    <span>Restricted Invitation Access</span>
                  </div>
                  <div className="text-blue-800 font-medium">
                    {inviteLinkName || 'Factory Audit Share Link'}
                  </div>
                  {inviteRole && (
                    <div className="text-[11px] text-blue-600">
                      Assigned Role: <strong>{inviteRole}</strong>
                    </div>
                  )}
                </div>

                {errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-900 text-xs rounded-xl flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Enter Invitation Passcode *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter passcode to unlock"
                    value={invitePasscode}
                    onChange={(e) => setInvitePasscode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all min-h-[44px]"
                >
                  <span>{isSubmitting ? 'Verifying...' : 'Unlock & Access System'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setInviteToken(null);
                      setInviteRequiresPass(false);
                      setErrorMessage('');
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 underline"
                  >
                    Log in with employee credentials instead
                  </button>
                </div>
              </form>
            ) : (
              /* Standard Credentials Form */
              <form onSubmit={handleStandardLogin} className="space-y-3.5">
                {errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-900 text-xs rounded-xl flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div className="leading-snug">{errorMessage}</div>
                  </div>
                )}

                {lockoutRemaining && (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-start space-x-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="leading-snug">
                      Rate limit security active. Account temporarily locked for {lockoutRemaining}s.
                    </div>
                  </div>
                )}

                {demoNotice && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-start space-x-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="leading-snug font-medium">{demoNotice}</div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    {language === 'EN' ? 'Username or Email' : 'ইউজারনেম বা ইমেইল'} *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="admin, qms.manager, auditor, viewer"
                      value={usernameOrEmail}
                      onChange={(e) => {
                        setUsernameOrEmail(e.target.value);
                        setSelectedDemoUser(null);
                      }}
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    {language === 'EN' ? 'Password' : 'পাসওয়ার্ড'} *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setSelectedDemoUser(null);
                      }}
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 top-2.5 transition-colors"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || demoLoading}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all min-h-[44px]"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? language === 'EN'
                        ? 'Authenticating...'
                        : 'যাচাই করা হচ্ছে...'
                      : language === 'EN'
                      ? 'Sign In to Portal'
                      : 'সাইন ইন করুন'}
                  </span>
                </button>
              </form>
            )}

            {/* Optional Demo Accounts Bar for Authorized Evaluation (Disabled in Production unless enabled by Admin) */}
            {demoModeEnabled && (
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide bg-blue-100 text-blue-800 border border-blue-200">
                      Demo Mode
                    </span>
                    <span className="text-[10px] font-bold text-slate-600">
                      Authorized Evaluation
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Auto-Fill Credentials
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
                  Select an account to auto-fill its credentials, then click <strong>Sign In</strong>:
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {demoAccounts.map((account) => {
                    const isSelected = selectedDemoUser === account.username;
                    const roleColorMap: Record<string, { bg: string; hover: string; border: string; text: string }> = {
                      Admin: { bg: 'bg-purple-50/60', hover: 'hover:bg-purple-100/60', border: 'border-purple-200', text: 'text-purple-900' },
                      'QMS Manager': { bg: 'bg-blue-50/60', hover: 'hover:bg-blue-100/60', border: 'border-blue-200', text: 'text-blue-900' },
                      Auditor: { bg: 'bg-emerald-50/60', hover: 'hover:bg-emerald-100/60', border: 'border-emerald-200', text: 'text-emerald-900' },
                      Viewer: { bg: 'bg-slate-50', hover: 'hover:bg-slate-100', border: 'border-slate-200', text: 'text-slate-800' },
                    };
                    const color = roleColorMap[account.role] || roleColorMap.Viewer;

                    return (
                      <button
                        key={account.username}
                        type="button"
                        onClick={() => handleSelectDemoAccount(account)}
                        disabled={demoLoading || isSubmitting}
                        className={`p-2 rounded-xl text-left transition-all border ${color.bg} ${color.hover} ${color.border} ${
                          isSelected ? 'ring-2 ring-blue-500 shadow-sm border-blue-400' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-bold text-[11px] ${color.text}`}>
                            {account.label || account.role}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                          {account.username}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                  <span className="flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    <span>PBKDF2 Salted Hashes on Server</span>
                  </span>
                  <span>Can be disabled in Settings</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer System Trustmark */}
      <div className="max-w-6xl w-full mx-auto py-3 text-center text-slate-500 text-[11px]">
        {factorySettings.factoryName} • Quality Management System Division • Powered by ISO 9001:2015 & Bangladesh Knitwear Compliance
      </div>
    </div>
  );
};
