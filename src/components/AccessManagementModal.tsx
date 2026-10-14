import React, { useState, useEffect } from 'react';
import { 
  X, 
  Share2, 
  Users, 
  KeyRound, 
  Copy, 
  Check, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Lock, 
  Unlock, 
  Trash2, 
  Plus, 
  UserPlus, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  ExternalLink,
  RefreshCw,
  Ban
} from 'lucide-react';
import { UserAccount, SharedAccessLink, AccessRole, UserRole } from '../types/audit';
import { 
  fetchUsers, 
  createUser, 
  resetUserPassword, 
  toggleUserStatus, 
  deleteUser,
  fetchShareLinks, 
  createShareLink, 
  toggleShareLinkRevoke, 
  deleteShareLink 
} from '../services/authService';

interface AccessManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: UserRole;
  language: 'EN' | 'BN';
  factoryName: string;
}

export const AccessManagementModal: React.FC<AccessManagementModalProps> = ({
  isOpen,
  onClose,
  currentUserRole,
  language,
  factoryName,
}) => {
  const [activeTab, setActiveTab] = useState<'share' | 'users'>('share');

  // Shared Links State
  const [shares, setShares] = useState<SharedAccessLink[]>([]);
  const [isLoadingShares, setIsLoadingShares] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // New Link Form State
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [linkName, setLinkName] = useState('');
  const [linkRole, setLinkRole] = useState<AccessRole>('Viewer');
  const [isPasswordProtected, setIsPasswordProtected] = useState(true);
  const [linkPassword, setLinkPassword] = useState('');
  const [linkExpiry, setLinkExpiry] = useState<'24h' | '3d' | '7d' | '30d' | 'never'>('7d');
  const [linkMaxUses, setLinkMaxUses] = useState<string>('25');
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');

  // Users State
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newUserRole, setNewUserRole] = useState<AccessRole>('Auditor');
  const [newUserDept, setNewUserDept] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');

  // Reset Password Dialog State
  const [resettingUser, setResettingUser] = useState<UserAccount | null>(null);
  const [resetNewPass, setResetNewPass] = useState('');

  const isAdmin = currentUserRole === 'Super Administrator' || (currentUserRole as string) === 'Admin';

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setIsLoadingShares(true);
    setIsLoadingUsers(true);
    try {
      const [sharesData, usersData] = await Promise.all([fetchShareLinks(), fetchUsers()]);
      setShares(sharesData);
      setUsers(usersData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingShares(false);
      setIsLoadingUsers(false);
    }
  };

  if (!isOpen) return null;

  // Build the copyable share link
  const getFullShareUrl = (token: string) => {
    const origin = window.location.origin;
    return `${origin}/?invite=${token}`;
  };

  const handleCopyLink = (token: string) => {
    const url = getFullShareUrl(token);
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 3000);
  };

  const handleCreateShareLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError('');
    setLinkSuccess('');

    if (!linkName.trim()) {
      setLinkError('Please provide a name or recipient for this link.');
      return;
    }

    if (isPasswordProtected && (!linkPassword || linkPassword.length < 4)) {
      setLinkError('Password must be at least 4 characters long.');
      return;
    }

    const res = await createShareLink({
      name: linkName,
      assignedRole: linkRole,
      isPasswordProtected,
      password: isPasswordProtected ? linkPassword : undefined,
      expiresDuration: linkExpiry,
      maxUses: linkMaxUses ? parseInt(linkMaxUses, 10) : undefined,
      createdBy: `${currentUserRole}`,
    });

    if (res.success && res.share) {
      setShares([res.share, ...shares]);
      setLinkSuccess(`Share link created for "${res.share.name}".`);
      setIsCreatingLink(false);
      setLinkName('');
      setLinkPassword('');
    } else {
      setLinkError(res.error || 'Failed to create share link.');
    }
  };

  const handleToggleRevokeShare = async (id: string) => {
    const res = await toggleShareLinkRevoke(id);
    if (res.success) {
      setShares(shares.map((s) => (s.id === id ? { ...s, status: s.status === 'Revoked' ? 'Active' : 'Revoked' } : s)));
    }
  };

  const handleDeleteShare = async (id: string) => {
    if (!confirm('Permanently delete this share link? Anyone using it will immediately lose access.')) return;
    const res = await deleteShareLink(id);
    if (res.success) {
      setShares(shares.filter((s) => s.id !== id));
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess('');

    if (!newUsername || !newEmail || !newFullName || !newUserPassword) {
      setUserError('Please fill in all mandatory fields.');
      return;
    }

    if (newUserPassword.length < 6) {
      setUserError('Password must be at least 6 characters long.');
      return;
    }

    const res = await createUser({
      username: newUsername,
      email: newEmail,
      fullName: newFullName,
      role: newUserRole,
      department: newUserDept || 'Operations',
      password: newUserPassword,
    });

    if (res.success && res.user) {
      setUsers([...users, res.user]);
      setUserSuccess(`User account created for ${res.user.fullName}.`);
      setIsCreatingUser(false);
      setNewUsername('');
      setNewEmail('');
      setNewFullName('');
      setNewUserDept('');
      setNewUserPassword('');
    } else {
      setUserError(res.error || 'Failed to create user.');
    }
  };

  const handleToggleUserStatus = async (user: UserAccount) => {
    const nextStatus = user.status === 'Active' ? 'Suspended' : 'Active';
    const res = await toggleUserStatus(user.id, nextStatus);
    if (res.success) {
      setUsers(users.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u)));
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser || resetNewPass.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    const res = await resetUserPassword(resettingUser.id, resetNewPass);
    if (res.success) {
      alert(res.message || 'Password updated successfully.');
      setResettingUser(null);
      setResetNewPass('');
    } else {
      alert(res.error || 'Failed to reset password.');
    }
  };

  const handleDeleteUserClick = async (user: UserAccount) => {
    if (user.username === 'admin') {
      alert('Cannot delete root system administrator.');
      return;
    }
    if (!confirm(`Are you sure you want to delete account for ${user.fullName}?`)) return;
    const res = await deleteUser(user.id);
    if (res.success) {
      setUsers(users.filter((u) => u.id !== user.id));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-8 shadow-2xl border border-slate-200 my-6 max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                  {language === 'EN' ? 'Share & Access Governance' : 'শেয়ার ও ব্যবহারকারী ব্যবস্থাপনা'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  Secured
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {factoryName} • Salted Hashing & Rate-Limited Access Control
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 mt-4 mb-5">
          <button
            onClick={() => setActiveTab('share')}
            className={`flex items-center space-x-2 py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all -mb-[2px] ${
              activeTab === 'share'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>{language === 'EN' ? 'Restricted Share Links' : 'শেয়ার লিঙ্কসমূহ'}</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px]">
              {shares.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center space-x-2 py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all -mb-[2px] ${
              activeTab === 'users'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{language === 'EN' ? 'User Accounts & Roles' : 'ব্যবহারকারী ও রোল'}</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px]">
              {users.length}
            </span>
          </button>
        </div>

        {/* TAB 1: SHARED ACCESS LINKS */}
        {activeTab === 'share' && (
          <div className="space-y-6">
            {/* Create Link Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  {language === 'EN' ? 'Create a Secure Shareable Invitation' : 'নিরাপদ শেয়ার লিঙ্ক তৈরি করুন'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {language === 'EN'
                    ? 'Generate copyable link with configurable role, password protection, and auto-expiration.'
                    : 'নির্দিষ্ট রোল, পাসওয়ার্ড ও মেয়াদ সহ লিঙ্ক তৈরি করুন।'}
                </p>
              </div>

              {isAdmin && !isCreatingLink && (
                <button
                  onClick={() => setIsCreatingLink(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center space-x-1.5 active:scale-95 transition-all min-h-[40px]"
                >
                  <Plus className="w-4 h-4" />
                  <span>{language === 'EN' ? 'New Share Link' : 'নতুন লিঙ্ক তৈরি'}</span>
                </button>
              )}
            </div>

            {/* Notification Messages */}
            {linkSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-900 text-xs rounded-xl flex items-center space-x-2 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{linkSuccess}</span>
              </div>
            )}
            {linkError && (
              <div className="p-3 bg-red-50 text-red-900 text-xs rounded-xl flex items-center space-x-2 border border-red-200">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{linkError}</span>
              </div>
            )}

            {/* Create Link Form Drawer */}
            {isCreatingLink && (
              <form onSubmit={handleCreateShareLink} className="p-5 bg-white rounded-2xl border-2 border-blue-500/40 shadow-sm space-y-4 animate-fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    {language === 'EN' ? 'Configure New Shareable Link' : 'লিঙ্ক কনফিগারেশন'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCreatingLink(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">
                      {language === 'EN' ? 'Link Name / Recipient Description' : 'লিঙ্কের নাম / প্রাপক'} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. C&A Buyer Technical Audit Team, GAP Lead QMS Delegation"
                      value={linkName}
                      onChange={(e) => setLinkName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      {language === 'EN' ? 'Assigned Delegation Role' : 'বরাদ্দকৃত রোল'} *
                    </label>
                    <select
                      value={linkRole}
                      onChange={(e) => setLinkRole(e.target.value as AccessRole)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    >
                      <option value="Viewer">Viewer (Read-only reports & scorecards)</option>
                      <option value="Auditor">Auditor (Floor execution & evidence capture)</option>
                      <option value="QMS Manager">QMS Manager (Audit review & CAPA sign-off)</option>
                      <option value="Admin">Admin (Full administrative privileges)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      {language === 'EN' ? 'Expiration Policy' : 'মেয়াদকাল'} *
                    </label>
                    <select
                      value={linkExpiry}
                      onChange={(e) => setLinkExpiry(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    >
                      <option value="24h">24 Hours (Urgent single-day review)</option>
                      <option value="3d">3 Days (Weekend / short audit period)</option>
                      <option value="7d">7 Days (Standard buyer audit window)</option>
                      <option value="30d">30 Days (Monthly compliance cycle)</option>
                      <option value="never">Never Expires (Permanent delegation)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                    <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={isPasswordProtected}
                        onChange={(e) => setIsPasswordProtected(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                      <span className="flex items-center space-x-1.5">
                        <Lock className="w-3.5 h-3.5 text-blue-600" />
                        <span>{language === 'EN' ? 'Require Passcode to Access' : 'পাসকোড সুরক্ষা সক্রিয় করুন'}</span>
                      </span>
                    </label>

                    {isPasswordProtected && (
                      <div className="mt-2 pl-6">
                        <input
                          type="text"
                          required={isPasswordProtected}
                          placeholder="Enter a secure shared passcode (e.g. CaAudit#2026)"
                          value={linkPassword}
                          onChange={(e) => setLinkPassword(e.target.value)}
                          className="w-full sm:w-80 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none text-xs font-mono"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          Passcode is stored strictly as a salted cryptographic hash. Never stored in plain text.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreatingLink(false)}
                    className="px-3 py-1.5 text-slate-600 hover:text-slate-800 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all"
                  >
                    Generate & Save Share Link
                  </button>
                </div>
              </form>
            )}

            {/* List of Active Share Links */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                {language === 'EN' ? 'Active & Issued Invitation Links' : 'সক্রিয় লিঙ্কসমূহ'}
              </div>

              {shares.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 text-xs">
                  No share links generated yet. Click "New Share Link" to grant restricted access.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {shares.map((share) => {
                    const isCopied = copiedToken === share.token;
                    const isRevoked = share.status === 'Revoked';
                    const isExpired = Boolean(share.status === 'Expired' || (share.expiresAt && new Date(share.expiresAt).getTime() < Date.now()));

                    return (
                      <div
                        key={share.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isRevoked || isExpired
                            ? 'bg-slate-50/80 border-slate-200 opacity-60'
                            : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                                {share.name}
                              </h4>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                {share.assignedRole}
                              </span>
                              {share.isPasswordProtected ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center space-x-1">
                                  <Lock className="w-3 h-3" />
                                  <span>Passcode Protected</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                                  Direct Link
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isRevoked
                                    ? 'bg-red-100 text-red-700'
                                    : isExpired
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {isRevoked ? 'Revoked' : isExpired ? 'Expired' : 'Active'}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 font-mono">
                              <span>Token: {share.token.slice(0, 16)}...</span>
                              <span>Uses: {share.useCount} {share.maxUses ? `/ ${share.maxUses}` : ''}</span>
                              <span>
                                Expires: {share.expiresAt ? new Date(share.expiresAt).toLocaleDateString() : 'Never'}
                              </span>
                              <span>Created: {new Date(share.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-2 shrink-0">
                            <button
                              onClick={() => handleCopyLink(share.token)}
                              disabled={isRevoked || isExpired}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all min-h-[38px] ${
                                isCopied
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                              } disabled:opacity-40`}
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{isCopied ? 'Link Copied!' : 'Copy Link'}</span>
                            </button>

                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => handleToggleRevokeShare(share.id)}
                                  className={`p-2 rounded-xl text-xs font-bold transition-all min-h-[38px] min-w-[38px] flex items-center justify-center ${
                                    isRevoked
                                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                  }`}
                                  title={isRevoked ? 'Restore Link' : 'Revoke Access'}
                                >
                                  {isRevoked ? <RefreshCw className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                </button>

                                <button
                                  onClick={() => handleDeleteShare(share.id)}
                                  className="p-2 rounded-xl text-xs font-bold bg-red-50 hover:bg-red-100 text-red-600 transition-all min-h-[38px] min-w-[38px] flex items-center justify-center"
                                  title="Delete Link"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: USER ACCOUNTS & ROLES */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  {language === 'EN' ? 'Factory User Management' : 'ব্যবহারকারী তালিকা ও নিয়ন্ত্রণ'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {language === 'EN'
                    ? 'Manage login accounts, assign security roles, reset passwords, and toggle access.'
                    : 'লগইন অ্যাকাউন্ট, রোল ও পাসওয়ার্ড পরিচালনা করুন।'}
                </p>
              </div>

              {isAdmin && !isCreatingUser && (
                <button
                  onClick={() => setIsCreatingUser(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center space-x-1.5 active:scale-95 transition-all min-h-[40px]"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{language === 'EN' ? 'Add User' : 'নতুন ব্যবহারকারী'}</span>
                </button>
              )}
            </div>

            {/* Notification Messages */}
            {userSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-900 text-xs rounded-xl flex items-center space-x-2 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{userSuccess}</span>
              </div>
            )}
            {userError && (
              <div className="p-3 bg-red-50 text-red-900 text-xs rounded-xl flex items-center space-x-2 border border-red-200">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{userError}</span>
              </div>
            )}

            {/* Create User Form Drawer */}
            {isCreatingUser && (
              <form onSubmit={handleCreateUser} className="p-5 bg-white rounded-2xl border-2 border-blue-500/40 shadow-sm space-y-4 animate-fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    {language === 'EN' ? 'Register New Factory User' : 'নতুন ব্যবহারকারী নিবন্ধন'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCreatingUser(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Engr. Robiul Islam"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Username *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. robiul.qms"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. robiul@apexsweater.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Security Role *</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as AccessRole)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    >
                      <option value="Admin">Admin (Full administrative access)</option>
                      <option value="QMS Manager">QMS Manager (Audit sign-off & CAPA verification)</option>
                      <option value="Auditor">Auditor (Floor audit execution & evidence)</option>
                      <option value="Viewer">Viewer (Read-only observation)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Department</label>
                    <input
                      type="text"
                      placeholder="e.g. Knitting Quality, Washing, Compliance"
                      value={newUserDept}
                      onChange={(e) => setNewUserDept(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Initial Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="Min. 6 characters"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreatingUser(false)}
                    className="px-3 py-1.5 text-slate-600 hover:text-slate-800 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all"
                  >
                    Save New User
                  </button>
                </div>
              </form>
            )}

            {/* Users Directory Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3">Department</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Last Active</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{user.fullName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">@{user.username} • {user.email}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          user.role === 'Admin'
                            ? 'bg-purple-100 text-purple-800'
                            : user.role === 'QMS Manager'
                            ? 'bg-blue-100 text-blue-800'
                            : user.role === 'Auditor'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{user.department}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          user.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[11px] text-slate-400 font-mono">
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => {
                                setResettingUser(user);
                                setResetNewPass('');
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors"
                              title="Reset Password"
                            >
                              Password
                            </button>

                            <button
                              onClick={() => handleToggleUserStatus(user)}
                              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                                user.status === 'Active'
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {user.status === 'Active' ? 'Suspend' : 'Activate'}
                            </button>

                            {user.username !== 'admin' && (
                              <button
                                onClick={() => handleDeleteUserClick(user)}
                                className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors inline-flex items-center"
                                title="Delete User"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Reset Password Modal Sub-Dialog */}
            {resettingUser && (
              <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl space-y-3 animate-fade-in border border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-bold">
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>Reset Password for: {resettingUser.fullName} (@{resettingUser.username})</span>
                  </div>
                  <button
                    onClick={() => setResettingUser(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleResetPasswordSubmit} className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="password"
                    required
                    placeholder="Enter new password (min. 6 chars)"
                    value={resetNewPass}
                    onChange={(e) => setResetNewPass(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                  />
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all min-h-[38px] w-full sm:w-auto"
                    >
                      Update Password
                    </button>
                    <button
                      type="button"
                      onClick={() => setResettingUser(null)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-all min-h-[38px]"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Security Constitution Footer Note */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-start space-x-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p>
            <strong>Security Hardened:</strong> Shared credentials and passwords are encrypted using salted PBKDF2 hashing with 10,000 iterations. Brute force protection automatically rate-limits and temporarily locks out attackers after 5 failed login attempts. Unauthorized external visitors cannot view factory records or evidence without authenticated credentials.
          </p>
        </div>
      </div>
    </div>
  );
};
