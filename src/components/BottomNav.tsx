import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  FileSpreadsheet, 
  AlertTriangle, 
  FileCheck2,
  Menu,
  X,
  ShieldCheck,
  Printer,
  Settings,
  Globe,
  UserCheck,
  CheckCircle2,
  Download
} from 'lucide-react';
import { UserRole } from '../types/audit';

import { Building2, Share2, LogOut } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openCapaCount: number;
  criticalCount: number;
  language: 'EN' | 'BN';
  setLanguage: (lang: 'EN' | 'BN') => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  onOpenSectionConfig: () => void;
  onOpenPrintReport: () => void;
  onExportExcel: () => void;
  lastSavedText?: string;
  onOpenAccessManagement: () => void;
  onLogout?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  setCurrentTab,
  openCapaCount,
  criticalCount,
  language,
  setLanguage,
  userRole,
  setUserRole,
  onOpenSectionConfig,
  onOpenPrintReport,
  onExportExcel,
  lastSavedText,
  onOpenAccessManagement,
  onLogout,
}) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState<boolean>(false);

  const roles: UserRole[] = [
    'Super Administrator',
    'QMS Manager',
    'QMS Executive / Auditor',
    'Department Head',
    'CAPA Responsible Person',
    'Management Viewer',
  ];

  const navItems = [
    {
      id: 'dashboard',
      label: language === 'EN' ? 'Dashboard' : 'ড্যাশবোর্ড',
      icon: LayoutDashboard,
      badge: criticalCount > 0 ? criticalCount : undefined,
      badgeColor: 'bg-red-600',
    },
    {
      id: 'audit',
      label: language === 'EN' ? 'Audit' : 'অডিট',
      icon: ClipboardCheck,
    },
    {
      id: 'capa',
      label: language === 'EN' ? 'CAPA' : 'কাপা',
      icon: AlertTriangle,
      badge: openCapaCount > 0 ? openCapaCount : undefined,
      badgeColor: 'bg-amber-500',
    },
    {
      id: 'checklists',
      label: language === 'EN' ? 'Checklists' : 'চেকলিস্ট',
      icon: FileSpreadsheet,
    },
    {
      id: 'excel-report',
      label: language === 'EN' ? 'Reports' : 'রিপোর্ট',
      icon: FileCheck2,
    },
  ];

  const handleTabSelect = (tabId: string) => {
    setCurrentTab(tabId);
    setIsMoreMenuOpen(false);
  };

  return (
    <>
      {/* MOBILE MORE ACTIONS BOTTOM DRAWER */}
      {isMoreMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex flex-col justify-end">
          <div 
            className="flex-1"
            onClick={() => setIsMoreMenuOpen(false)}
          />
          <div className="bg-white rounded-t-3xl border-t border-slate-200 p-5 shadow-2xl max-h-[85vh] overflow-y-auto space-y-4 animate-in slide-in-from-bottom duration-200">
            {/* Drawer Handle bar */}
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto" />

            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base text-slate-900">
                  {language === 'EN' ? 'QMS Tools & Navigation' : 'কিউএমএস টুলস ও অপশন'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase">
                  Mobile Hub
                </span>
              </div>
              <button 
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Share Application */}
              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onOpenAccessManagement();
                }}
                className="flex items-center space-x-2.5 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-left min-h-[48px] active:scale-98 transition-all"
              >
                <Share2 className="w-5 h-5 text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">Share App Link</div>
                  <div className="text-[10px] text-blue-700 truncate">Password & Roles</div>
                </div>
              </button>

              {/* Factory Branding & Settings */}
              <button
                onClick={() => {
                  handleTabSelect('settings');
                }}
                className="flex items-center space-x-2.5 p-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-left min-h-[48px] active:scale-98 transition-all"
              >
                <Building2 className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">Factory Branding</div>
                  <div className="text-[10px] text-amber-700 truncate">Logo & Address</div>
                </div>
              </button>

              <button
                onClick={() => {
                  handleTabSelect('iso');
                }}
                className="flex items-center space-x-2.5 p-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-left min-h-[48px] active:scale-98 transition-all"
              >
                <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">ISO 9001 Matrix</div>
                  <div className="text-[10px] text-purple-700 truncate">Clause Gap Analysis</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onOpenPrintReport();
                }}
                className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200 text-left min-h-[48px] active:scale-98 transition-all"
              >
                <Printer className="w-5 h-5 text-sky-600 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">Print PDF Report</div>
                  <div className="text-[10px] text-slate-500 truncate">Official Sign-Offs</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onExportExcel();
                }}
                className="flex items-center space-x-2.5 p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-left min-h-[48px] active:scale-98 transition-all"
              >
                <Download className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">Download Excel</div>
                  <div className="text-[10px] text-emerald-700 truncate">Complete .xlsx (9 sheets)</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onOpenSectionConfig();
                }}
                className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200 text-left min-h-[48px] active:scale-98 transition-all"
              >
                <Settings className="w-5 h-5 text-slate-600 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">Manage Sections</div>
                  <div className="text-[10px] text-slate-600 truncate">19 Factory Modules</div>
                </div>
              </button>
            </div>

            {/* Role & Language Controls */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span>{language === 'EN' ? 'Active User Role' : 'ব্যবহারকারীর রোল'}</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Simulate Permissions</span>
              </div>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as UserRole)}
                className="w-full py-2.5 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 min-h-[44px] focus:ring-2 focus:ring-blue-500"
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <Globe className="w-4 h-4 text-sky-600" />
                  <span>{language === 'EN' ? 'Interface Language' : 'ভাষা পরিবর্তন'}</span>
                </span>
                <button
                  onClick={() => setLanguage(language === 'EN' ? 'BN' : 'EN')}
                  className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-xs active:scale-95 transition-transform min-h-[38px]"
                >
                  {language === 'EN' ? 'বাংলাতে পরিবর্তন করুন' : 'Switch to English'}
                </button>
              </div>
            </div>

            {/* Autosave status banner */}
            <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{lastSavedText || 'Real-Time Auto-Save Active'}</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-700">Offline Ready</span>
            </div>
          </div>
        </div>
      )}

      {/* FIXED BOTTOM NAVIGATION BAR */}
      <nav 
        aria-label="Mobile Bottom Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 shadow-[0_-4px_25px_rgba(0,0,0,0.35)] pb-safe"
      >
        <div className="grid grid-cols-6 h-16 items-center px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabSelect(item.id)}
                className={`flex flex-col items-center justify-center h-full py-1 px-0.5 transition-all relative min-h-[48px] active:scale-95 ${
                  isActive
                    ? 'text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {/* Active Indicator Top Pill */}
                {isActive && (
                  <span className="absolute top-0 left-2 right-2 h-0.5 bg-blue-500 rounded-full" />
                )}

                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-blue-400' : ''}`} />
                  {item.badge !== undefined && (
                    <span className={`absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full text-[9px] font-black text-white ${item.badgeColor} animate-pulse shadow-sm`}>
                      {item.badge}
                    </span>
                  )}
                </div>

                <span className={`text-[10px] tracking-tight mt-1 truncate max-w-full ${isActive ? 'text-blue-300 font-bold' : 'text-slate-400'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* 6th Slot: More Tools Drawer Button */}
          <button
            onClick={() => setIsMoreMenuOpen(true)}
            className={`flex flex-col items-center justify-center h-full py-1 px-0.5 transition-all relative min-h-[48px] active:scale-95 ${
              isMoreMenuOpen || currentTab === 'iso' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {(isMoreMenuOpen || currentTab === 'iso') && (
              <span className="absolute top-0 left-2 right-2 h-0.5 bg-blue-500 rounded-full" />
            )}
            <Menu className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1 truncate">
              {language === 'EN' ? 'More' : 'আরও'}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};
