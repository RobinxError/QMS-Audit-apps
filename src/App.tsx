import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { AuditExecutionView } from './components/AuditExecutionView';
import { ChecklistManagerView } from './components/ChecklistManagerView';
import { CAPAManagerView } from './components/CAPAManagerView';
import { ISOClauseMatrixView } from './components/ISOClauseMatrixView';
import { ExcelReportCenterView } from './components/ExcelReportCenterView';
import { FactorySettingsView } from './components/FactorySettingsView';
import { AccessManagementModal } from './components/AccessManagementModal';
import { AuthGate } from './components/AuthGate';
import { ReportPrintModal } from './components/ReportPrintModal';
import { SectionsConfigModal } from './components/SectionsConfigModal';
import { PhotoViewerModal } from './components/PhotoViewerModal';

import { 
  AuditRecord, 
  AuditSection, 
  ChecklistItem, 
  UserRole, 
  PhotoAttachment, 
  FactorySettings 
} from './types/audit';

import { 
  loadSections, 
  saveSections, 
  loadChecklistItems, 
  saveChecklistItems, 
  loadAudits, 
  saveAudits, 
  loadUserRole, 
  saveUserRole, 
  loadLanguage, 
  saveLanguage 
} from './services/storage';

import { 
  loadLocalFactorySettings, 
  fetchServerFactorySettings, 
  updateServerFactorySettings 
} from './services/authService';

import { calculateAuditScores } from './services/scoringEngine';
import { exportAuditToExcel } from './services/excelExport';

export default function App() {
  // Factory Branding & Settings State
  const [factorySettings, setFactorySettings] = useState<FactorySettings>(loadLocalFactorySettings);

  // Global App States
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [language, setLanguage] = useState<'EN' | 'BN'>(loadLanguage);
  const [userRole, setUserRole] = useState<UserRole>(loadUserRole);
  const [lastSavedText, setLastSavedText] = useState<string>('Autosaved');

  // Core Data States
  const [sections, setSections] = useState<AuditSection[]>(loadSections);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(loadChecklistItems);
  
  const initialAudits = useMemo(() => loadAudits(sections, checklistItems), []);
  const [audits, setAudits] = useState<AuditRecord[]>(initialAudits);
  const [activeAuditIndex, setActiveAuditIndex] = useState<number>(0);

  // Active Audit Reference
  const activeAudit = audits[activeAuditIndex] || audits[0];

  const setActiveAudit = (updater: React.SetStateAction<AuditRecord>) => {
    setAudits((prevAudits) => {
      const current = prevAudits[activeAuditIndex] || prevAudits[0];
      const next = typeof updater === 'function' ? updater(current) : updater;
      const copy = [...prevAudits];
      copy[activeAuditIndex] = next;
      return copy;
    });
  };

  // Target navigation states
  const [targetAuditSectionId, setTargetAuditSectionId] = useState<string | undefined>(undefined);
  const [targetCapaFindingId, setTargetCapaFindingId] = useState<string | undefined>(undefined);

  // Modals state
  const [isSectionConfigOpen, setIsSectionConfigOpen] = useState<boolean>(false);
  const [isPrintReportOpen, setIsPrintReportOpen] = useState<boolean>(false);
  const [isAccessManagementOpen, setIsAccessManagementOpen] = useState<boolean>(false);
  const [viewingPhoto, setViewingPhoto] = useState<PhotoAttachment | null>(null);

  // Load server factory settings on startup
  useEffect(() => {
    fetchServerFactorySettings().then((latest) => {
      if (latest) {
        setFactorySettings(latest);
      }
    });
  }, []);

  // Dynamic Score Calculation
  const scoreSummary = useMemo(() => {
    return calculateAuditScores(sections, checklistItems, activeAudit.findings);
  }, [sections, checklistItems, activeAudit.findings]);

  // Sync calculated scores back to active audit record
  useEffect(() => {
    if (
      activeAudit.overallScore !== scoreSummary.overallScore ||
      activeAudit.overallStatus !== scoreSummary.overallStatus ||
      activeAudit.criticalFindingsCount !== scoreSummary.criticalCount
    ) {
      setActiveAudit((prev) => ({
        ...prev,
        overallScore: scoreSummary.overallScore,
        overallStatus: scoreSummary.overallStatus,
        criticalFindingsCount: scoreSummary.criticalCount,
        sectionScores: scoreSummary.sectionScores,
        updatedAt: new Date().toISOString(),
      }));
    }
  }, [scoreSummary]);

  // Auto-save changes to LocalStorage with timestamp indicator
  useEffect(() => {
    saveSections(sections);
    setLastSavedText('Saved to Device');
  }, [sections]);

  useEffect(() => {
    saveChecklistItems(checklistItems);
    setLastSavedText('Saved to Device');
  }, [checklistItems]);

  useEffect(() => {
    saveAudits(audits);
    const timeStr = new Intl.DateTimeFormat('en-GB', {
      timeStyle: 'short',
    }).format(new Date());
    setLastSavedText(`Saved ${timeStr}`);
  }, [audits]);

  useEffect(() => {
    saveUserRole(userRole);
  }, [userRole]);

  useEffect(() => {
    saveLanguage(language);
  }, [language]);

  // Handlers for cross-view navigation
  const handleNavigateToAudit = (sectionId?: string) => {
    if (sectionId) setTargetAuditSectionId(sectionId);
    setCurrentTab('audit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToCAPA = (findingId?: string) => {
    if (findingId) setTargetCapaFindingId(findingId);
    setCurrentTab('capa');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExportExcel = () => {
    exportAuditToExcel(activeAudit, sections, checklistItems, scoreSummary, factorySettings);
  };

  const handleSaveFactorySettings = async (newSettings: FactorySettings): Promise<boolean> => {
    const res = await updateServerFactorySettings(newSettings);
    if (res.success && res.settings) {
      setFactorySettings(res.settings);
      // Synchronize active audit factory name & location
      setActiveAudit((prev) => ({
        ...prev,
        factoryName: res.settings!.factoryName,
        factoryLocation: res.settings!.factoryAddress,
        updatedAt: new Date().toISOString(),
      }));
      return true;
    }
    return false;
  };

  // Open photo lightbox
  const handleOpenPhotoViewer = (photo: PhotoAttachment) => {
    setViewingPhoto(photo);
  };

  const openCapaCount = Object.values(activeAudit.findings).filter(
    (f) =>
      (f.result === 'Non-Compliant' || f.result === 'Partially Compliant') &&
      f.capaStatus !== 'Verified & Closed'
  ).length;

  return (
    <AuthGate factorySettings={factorySettings} language={language}>
      {({ session, onLogout }) => {
        const effectiveRole = (session.user.role as UserRole) || userRole;

        return (
          <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased overflow-x-hidden">
            {/* Desktop Enterprise Sidebar (hidden lg:flex) */}
            <Sidebar
              currentTab={currentTab}
              setCurrentTab={setCurrentTab}
              audit={activeAudit}
              scoreSummary={scoreSummary}
              userRole={effectiveRole}
              setUserRole={setUserRole}
              language={language}
              setLanguage={setLanguage}
              onOpenSectionConfig={() => setIsSectionConfigOpen(true)}
              onOpenPrintReport={() => setIsPrintReportOpen(true)}
              openCapaCount={openCapaCount}
              lastSavedText={lastSavedText}
              factorySettings={factorySettings}
              onOpenAccessManagement={() => setIsAccessManagementOpen(true)}
              onLogout={onLogout}
              currentUserName={session.user.fullName}
            />

          {/* Main Workspace Column */}
          <div className="flex-1 flex flex-col min-w-0 min-h-screen">
            {/* Top Header Bar */}
            <Navbar
              currentTab={currentTab}
              setCurrentTab={setCurrentTab}
              userRole={effectiveRole}
              setUserRole={setUserRole}
              language={language}
              setLanguage={setLanguage}
              onOpenSectionConfig={() => setIsSectionConfigOpen(true)}
              onOpenPrintReport={() => setIsPrintReportOpen(true)}
              onExportExcel={handleExportExcel}
              criticalCount={scoreSummary.criticalCount}
              openCapaCount={openCapaCount}
              lastSavedText={lastSavedText}
              activeAuditId={activeAudit.id}
              buyerName={activeAudit.buyerName}
              factorySettings={factorySettings}
              onOpenAccessManagement={() => setIsAccessManagementOpen(true)}
              onLogout={onLogout}
            />

            {/* Content Viewport */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 pb-24 lg:pb-10">
              {currentTab === 'dashboard' && (
                <DashboardView
                  audit={activeAudit}
                  sections={sections}
                  checklistItems={checklistItems}
                  scoreSummary={scoreSummary}
                  language={language}
                  onNavigateToAudit={handleNavigateToAudit}
                  onNavigateToCAPA={handleNavigateToCAPA}
                  onNavigateToExcelReport={() => setCurrentTab('excel-report')}
                />
              )}

              {currentTab === 'audit' && (
                <AuditExecutionView
                  audit={activeAudit}
                  setAudit={setActiveAudit}
                  sections={sections}
                  checklistItems={checklistItems}
                  scoreSummary={scoreSummary}
                  language={language}
                  userRole={effectiveRole}
                  selectedSectionId={targetAuditSectionId}
                  onOpenPhotoViewer={handleOpenPhotoViewer}
                />
              )}

              {currentTab === 'checklists' && (
                <ChecklistManagerView
                  sections={sections}
                  checklistItems={checklistItems}
                  setChecklistItems={setChecklistItems}
                  userRole={effectiveRole}
                  language={language}
                />
              )}

              {currentTab === 'capa' && (
                <CAPAManagerView
                  audit={activeAudit}
                  setAudit={setActiveAudit}
                  sections={sections}
                  checklistItems={checklistItems}
                  userRole={effectiveRole}
                  language={language}
                  initialFindingId={targetCapaFindingId}
                  onOpenPhotoViewer={handleOpenPhotoViewer}
                />
              )}

              {currentTab === 'iso' && (
                <ISOClauseMatrixView
                  audit={activeAudit}
                  checklistItems={checklistItems}
                  language={language}
                />
              )}

              {currentTab === 'excel-report' && (
                <ExcelReportCenterView
                  audit={activeAudit}
                  setAudit={setActiveAudit}
                  sections={sections}
                  checklistItems={checklistItems}
                  scoreSummary={scoreSummary}
                  userRole={effectiveRole}
                  language={language}
                  onOpenPrintReport={() => setIsPrintReportOpen(true)}
                />
              )}

              {currentTab === 'settings' && (
                <FactorySettingsView
                  settings={factorySettings}
                  onSaveSettings={handleSaveFactorySettings}
                  userRole={effectiveRole}
                  language={language}
                />
              )}
            </main>

            {/* Desktop Footer */}
            <footer className="bg-white border-t border-slate-200/80 py-4 px-6 text-xs text-slate-500 hidden lg:block">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <strong className="text-slate-800">{factorySettings.factoryName}</strong>
                  <span>•</span>
                  <span>Bangladesh Export Garment QMS & Buyer Compliance</span>
                </div>
                <div className="flex items-center space-x-4 text-slate-400 font-mono text-[11px]">
                  <span>{factorySettings.registrationNumber}</span>
                  <span>•</span>
                  <span>ISO 9001:2015</span>
                  <span>•</span>
                  <span>C&A • LC Waikiki • GAP • H&M</span>
                  <span>•</span>
                  <span>Enterprise v2.5</span>
                </div>
              </div>
            </footer>
          </div>

          {/* Mobile Bottom Navigation Bar (lg:hidden) */}
          <BottomNav
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            openCapaCount={openCapaCount}
            criticalCount={scoreSummary.criticalCount}
            language={language}
            setLanguage={setLanguage}
            userRole={userRole}
            setUserRole={setUserRole}
            onOpenSectionConfig={() => setIsSectionConfigOpen(true)}
            onOpenPrintReport={() => setIsPrintReportOpen(true)}
            onExportExcel={handleExportExcel}
            lastSavedText={lastSavedText}
            onOpenAccessManagement={() => setIsAccessManagementOpen(true)}
            onLogout={onLogout}
          />

          {/* MODALS */}
          <ReportPrintModal
            isOpen={isPrintReportOpen}
            onClose={() => setIsPrintReportOpen(false)}
            audit={activeAudit}
            sections={sections}
            checklistItems={checklistItems}
            scoreSummary={scoreSummary}
            onExportExcel={handleExportExcel}
            factorySettings={factorySettings}
          />

          <AccessManagementModal
            isOpen={isAccessManagementOpen}
            onClose={() => setIsAccessManagementOpen(false)}
            currentUserRole={effectiveRole}
            language={language}
            factoryName={factorySettings.factoryName}
          />

          <SectionsConfigModal
            isOpen={isSectionConfigOpen}
            onClose={() => setIsSectionConfigOpen(false)}
            sections={sections}
            setSections={setSections}
            userRole={effectiveRole}
          />

          <PhotoViewerModal
            photo={viewingPhoto}
            onClose={() => setViewingPhoto(null)}
          />
        </div>
      );
    }}
  </AuthGate>
);
}
