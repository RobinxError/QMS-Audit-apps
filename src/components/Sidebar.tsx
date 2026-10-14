import React from 'react';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  FileSpreadsheet, 
  AlertTriangle, 
  ShieldCheck, 
  FileCheck2, 
  Printer, 
  Settings, 
  Globe, 
  UserCheck, 
  Building2, 
  CheckCircle2, 
  ChevronRight, 
  Sparkles,
  Layers,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';
import { AuditRecord, UserRole, FactorySettings } from '../types/audit';
import { ScoreSummary } from '../services/scoringEngine';
import { LogOut, Share2 } from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  audit: AuditRecord;
  scoreSummary: ScoreSummary;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  language: 'EN' | 'BN';
  setLanguage: (lang: 'EN' | 'BN') => void;
  onOpenSectionConfig: () => void;
  onOpenPrintReport: () => void;
  openCapaCount: number;
  lastSavedText?: string;
  factorySettings: FactorySettings;
  onOpenAccessManagement: () => void;
  onLogout?: () => void;
  currentUserName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  audit,
  scoreSummary,
  userRole,
  setUserRole,
  language,
  setLanguage,
  onOpenSectionConfig,
  onOpenPrintReport,
  openCapaCount,
  lastSavedText,
  factorySettings,
  onOpenAccessManagement,
  onLogout,
  currentUserName,
}) => {
  const roles: UserRole[] = [
    'Admin',
    'QMS Manager',
    'Auditor',
    'Viewer',
  ];

  const overallScore = scoreSummary.overallScore;
  const status = scoreSummary.overallStatus;

  return (
    <aside className="hidden lg:flex w-72 flex-col bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0 select-none shadow-xl">
      {/* Brand & Organization Lockup */}
      <div className="p-4 border-b border-slate-800/80">
        <div 
          onClick={() => setCurrentTab('dashboard')} 
          className="flex items-center space-x-3 cursor-pointer group"
        >
          {factorySettings?.factoryLogo ? (
            <div className="h-10 max-w-[85px] flex items-center justify-center p-1 bg-slate-950 rounded-xl border border-slate-800 shrink-0">
              <img
                src={factorySettings.factoryLogo}
                alt={factorySettings.factoryName}
                className="max-h-8 max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/30 group-hover:scale-105 transition-transform shrink-0">
              <ClipboardCheck className="w-5 h-5 text-white" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-1.5">
              <h1 className="text-sm font-extrabold text-white tracking-tight truncate">
                Sweater QMS Pro
              </h1>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                Enterprise
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-semibold truncate">
              {factorySettings?.factoryName || 'Apex Sweater Mills Ltd.'}
            </p>
          </div>
        </div>

        {/* Active Audit Context Mini Card */}
        <div className="mt-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span className="font-mono uppercase font-semibold">Active Audit Ref</span>
            <span className="font-mono text-slate-300 font-bold">{audit.id}</span>
          </div>
          <div className="font-bold text-white text-xs truncate">
            {audit.buyerName} • {audit.styleNumber || 'Style SW-2026'}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/50">
            <span className="text-[10px] text-slate-400">Score Status:</span>
            <div className="flex items-center space-x-1.5">
              <span className="font-mono font-bold text-xs text-white">
                {overallScore !== null ? `${overallScore.toFixed(1)}%` : 'Pending'}
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                  status === 'GREEN'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : status === 'YELLOW'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : status === 'RED'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {status === 'GREEN' ? 'GREEN' : status === 'YELLOW' ? 'YELLOW' : status === 'RED' ? 'RED' : 'PENDING'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto scrollbar-thin">
        {/* GROUP 1: AUDIT OPERATIONS */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {language === 'EN' ? 'Audit Operations' : 'অডিট অপারেশন'}
          </div>
          <nav className="space-y-1">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <LayoutDashboard className={`w-4 h-4 ${currentTab === 'dashboard' ? 'text-white' : 'text-blue-400'}`} />
                <span>{language === 'EN' ? 'Management Dashboard' : 'ড্যাশবোর্ড'}</span>
              </div>
            </button>

            <button
              onClick={() => setCurrentTab('audit')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                currentTab === 'audit'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <ClipboardCheck className={`w-4 h-4 ${currentTab === 'audit' ? 'text-white' : 'text-emerald-400'}`} />
                <span>{language === 'EN' ? 'Conduct Audit' : 'অডিট পরিচালনা'}</span>
              </div>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                currentTab === 'audit' ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                19 Sec
              </span>
            </button>

            <button
              onClick={() => setCurrentTab('capa')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                currentTab === 'capa'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <AlertTriangle className={`w-4 h-4 ${currentTab === 'capa' ? 'text-white' : 'text-amber-400'}`} />
                <span>{language === 'EN' ? 'CAPA Management' : 'কাপা ব্যবস্থাপনা'}</span>
              </div>
              {openCapaCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 animate-pulse">
                  {openCapaCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* GROUP 2: BUYER COMPLIANCE & STANDARDS */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {language === 'EN' ? 'Buyer & QMS Standards' : 'বায়ার ও কিউএমএস মান'}
          </div>
          <nav className="space-y-1">
            <button
              onClick={() => setCurrentTab('checklists')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                currentTab === 'checklists'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <FileSpreadsheet className={`w-4 h-4 ${currentTab === 'checklists' ? 'text-white' : 'text-sky-400'}`} />
                <span>{language === 'EN' ? 'Buyer Checklists & Upload' : 'বায়ার চেকলিস্ট ও আপলোড'}</span>
              </div>
            </button>

            <button
              onClick={() => setCurrentTab('iso')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                currentTab === 'iso'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className={`w-4 h-4 ${currentTab === 'iso' ? 'text-white' : 'text-purple-400'}`} />
                <span>{language === 'EN' ? 'ISO 9001 Matrix' : 'আইএসও ৯০০১ ম্যাট্রিক্স'}</span>
              </div>
            </button>
          </nav>
        </div>

        {/* GROUP 3: EXECUTIVE REPORTS */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {language === 'EN' ? 'Reporting & Governance' : 'রিপোর্টিং ও সুশাসন'}
          </div>
          <nav className="space-y-1">
            <button
              onClick={() => setCurrentTab('excel-report')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                currentTab === 'excel-report'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <FileCheck2 className={`w-4 h-4 ${currentTab === 'excel-report' ? 'text-white' : 'text-emerald-400'}`} />
                <span>{language === 'EN' ? 'Excel Report Center' : 'এক্সেল রিপোর্ট সেন্টার'}</span>
              </div>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                9 Sheets
              </span>
            </button>

            <button
              onClick={onOpenPrintReport}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all"
            >
              <div className="flex items-center space-x-2.5">
                <Printer className="w-4 h-4 text-sky-400" />
                <span>{language === 'EN' ? 'Print Official PDF' : 'অফিসিয়াল পিডিএফ প্রিন্ট'}</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </nav>
        </div>

        {/* System Administration & Security */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {language === 'EN' ? 'Administration & Security' : 'প্রশাসন ও নিরাপত্তা'}
          </div>
          <div className="space-y-1">
            <button
              onClick={() => setCurrentTab('settings')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                currentTab === 'settings'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Building2 className={`w-4 h-4 ${currentTab === 'settings' ? 'text-white' : 'text-amber-400'}`} />
                <span>{language === 'EN' ? 'Factory Branding & Settings' : 'ফ্যাক্টরি ব্র্যান্ডিং ও সেটিংস'}</span>
              </div>
            </button>

            <button
              onClick={onOpenAccessManagement}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all group"
            >
              <div className="flex items-center space-x-2.5">
                <Share2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>{language === 'EN' ? 'Share App & Users' : 'শেয়ার ও ব্যবহারকারী'}</span>
              </div>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Secure
              </span>
            </button>

            <button
              onClick={onOpenSectionConfig}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all"
            >
              <div className="flex items-center space-x-2.5">
                <Settings className="w-4 h-4 text-sky-400" />
                <span>{language === 'EN' ? 'Configure Sections' : 'সেকশন কনফিগারেশন'}</span>
              </div>
              <span className="text-[10px] text-slate-400">19 Modules</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Profile & Utility Card */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/40 space-y-2.5">
        {/* Autosave Real-Time Status */}
        <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-800/40 border border-slate-800 text-[11px] text-emerald-400 font-mono">
          <div className="flex items-center space-x-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <span className="truncate">{lastSavedText || 'Autosave Active'}</span>
          </div>
          <span className="text-[10px] text-slate-500 shrink-0 font-sans">Synced</span>
        </div>

        {/* Authenticated User / Session Info */}
        <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
                {currentUserName ? currentUserName[0].toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  {currentUserName || 'Active Session'}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {userRole}
                </div>
              </div>
            </div>

            {/* Language Switch Button */}
            <button
              onClick={() => setLanguage(language === 'EN' ? 'BN' : 'EN')}
              className="flex items-center space-x-1 px-2 py-1 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] font-bold transition-colors shrink-0"
              title="Toggle English / বাংলা"
            >
              <Globe className="w-3 h-3 text-sky-400" />
              <span>{language === 'EN' ? 'বাংলা' : 'EN'}</span>
            </button>
          </div>

          <div className="flex items-center space-x-1 pt-1 border-t border-slate-700/50">
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as UserRole)}
              className="flex-1 py-1 px-2 bg-slate-900 border border-slate-700 rounded-lg text-[11px] font-semibold text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1.5 bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
