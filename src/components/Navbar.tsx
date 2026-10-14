import React from 'react';
import { 
  ClipboardCheck, 
  LayoutDashboard, 
  FileSpreadsheet, 
  AlertTriangle, 
  Printer, 
  Settings, 
  Globe, 
  UserCheck, 
  Download,
  ChevronRight,
  ShieldCheck,
  Building,
  Building2,
  CheckCircle2,
  Share2,
  LogOut
} from 'lucide-react';
import { UserRole, FactorySettings } from '../types/audit';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  language: 'EN' | 'BN';
  setLanguage: (lang: 'EN' | 'BN') => void;
  onOpenSectionConfig: () => void;
  onOpenPrintReport: () => void;
  onExportExcel: () => void;
  criticalCount: number;
  openCapaCount: number;
  lastSavedText?: string;
  activeAuditId?: string;
  buyerName?: string;
  factorySettings: FactorySettings;
  onOpenAccessManagement: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  userRole,
  setUserRole,
  language,
  setLanguage,
  onOpenSectionConfig,
  onOpenPrintReport,
  onExportExcel,
  criticalCount,
  openCapaCount,
  lastSavedText,
  activeAuditId = 'AUD-2026-QMS-089',
  buyerName = 'C&A',
  factorySettings,
  onOpenAccessManagement,
  onLogout,
}) => {
  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'dashboard': return language === 'EN' ? 'Executive Dashboard' : 'ড্যাশবোর্ড';
      case 'audit': return language === 'EN' ? 'Conduct Audit (19 Sections)' : 'অডিট পরিচালনা';
      case 'checklists': return language === 'EN' ? 'Buyer Checklists & Upload' : 'বায়ার চেকলিস্ট';
      case 'capa': return language === 'EN' ? 'CAPA Management' : 'কাপা ব্যবস্থাপনা';
      case 'iso': return language === 'EN' ? 'ISO 9001 Alignment' : 'আইএসও ৯০০১ ম্যাট্রিক্স';
      case 'excel-report': return language === 'EN' ? 'Excel Report Center (9 Sheets)' : 'এক্সেল রিপোর্ট সেন্টার';
      case 'settings': return language === 'EN' ? 'Factory Branding & Settings' : 'ফ্যাক্টরি ব্র্যান্ডিং ও সেটিংস';
      default: return 'Overview';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-xs">
      {/* ============================================================== */}
      {/* 1. MOBILE TOP APP BAR (lg:hidden)                               */}
      {/* ============================================================== */}
      <div className="lg:hidden flex items-center justify-between px-3 h-14 bg-slate-900 text-white">
        <div 
          onClick={() => setCurrentTab('dashboard')}
          className="flex items-center space-x-2.5 cursor-pointer min-w-0"
        >
          {factorySettings?.factoryLogo ? (
            <div className="h-8 max-w-[70px] flex items-center justify-center p-0.5 bg-slate-950 rounded-lg border border-slate-800 shrink-0">
              <img
                src={factorySettings.factoryLogo}
                alt={factorySettings.factoryName}
                className="max-h-7 max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 shadow-sm">
              <ClipboardCheck className="w-4 h-4 text-white" />
            </div>
          )}
          <div className="min-w-0">
            <div className="text-xs font-bold text-white tracking-tight truncate flex items-center space-x-1.5">
              <span>{factorySettings?.factoryName ? factorySettings.factoryName.split(' ')[0] : 'Sweater'} QMS</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                ISO 9001
              </span>
            </div>
            <p className="text-[10px] text-slate-300 truncate font-medium">
              {factorySettings?.factoryName || 'Apex Sweater Mills Ltd.'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          {/* Quick Share Link button on mobile */}
          <button
            onClick={onOpenAccessManagement}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-xs font-semibold flex items-center justify-center min-h-[36px] min-w-[36px]"
            title="Share App Link"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {criticalCount > 0 && (
            <button
              onClick={() => setCurrentTab('capa')}
              className="flex items-center space-x-1 px-2 py-1 rounded-md bg-red-950 border border-red-700 text-red-300 animate-pulse font-bold text-[10px] min-h-[36px]"
              aria-label={`${criticalCount} Critical issues`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>{criticalCount} Crit</span>
            </button>
          )}

          <button
            onClick={() => setLanguage(language === 'EN' ? 'BN' : 'EN')}
            className="flex items-center space-x-1 px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold min-h-[36px] active:scale-95 transition-transform"
          >
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span>{language === 'EN' ? 'বাং' : 'EN'}</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. DESKTOP ENTERPRISE TOP BAR (hidden lg:flex)                 */}
      {/* ============================================================== */}
      <div className="hidden lg:flex items-center justify-between px-6 h-14">
        {/* Breadcrumb Trail with Factory Name */}
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <span 
            className="font-bold text-slate-800 hover:text-blue-600 cursor-pointer transition-colors" 
            onClick={() => setCurrentTab('dashboard')}
          >
            {factorySettings?.factoryName || 'Apex Sweater Mills'}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">
            {buyerName} ({activeAuditId})
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-bold text-slate-900">
            {getTabLabel(currentTab)}
          </span>
        </div>

        {/* Right Actions: Share Link, Settings, Critical Alerts & Export */}
        <div className="flex items-center space-x-2.5">
          {/* Quick Share Button */}
          <button
            onClick={onOpenAccessManagement}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all shadow-xs active:scale-95"
            title="Create or manage password-protected shareable links"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Share App</span>
          </button>

          {/* Quick Settings Button */}
          <button
            onClick={() => setCurrentTab('settings')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              currentTab === 'settings'
                ? 'bg-blue-600 text-white border-blue-700 font-bold'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
            title="Factory Branding & Settings"
          >
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Settings</span>
          </button>

          {criticalCount > 0 && (
            <button
              onClick={() => setCurrentTab('capa')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-700 font-bold text-xs hover:bg-red-100 transition-colors"
            >
              <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />
              <span>{criticalCount} Critical Findings!</span>
            </button>
          )}

          <button
            onClick={onExportExcel}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all shadow-xs"
            title="Download full 9-worksheet Excel report"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel (.xlsx)</span>
          </button>

          <button
            onClick={onOpenPrintReport}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-all shadow-xs"
            title="Open printable official audit report"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print Report</span>
          </button>
        </div>
      </div>
    </header>
  );
};
