import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Eye, 
  Printer, 
  ShieldCheck, 
  Layers, 
  FileText, 
  UserCheck, 
  History,
  Building,
  Check,
  Calendar,
  FileCheck2,
  Lock,
  ArrowRight
} from 'lucide-react';
import { 
  AuditRecord, 
  AuditSection, 
  ChecklistItem, 
  UserRole, 
  ReportVersion 
} from '../types/audit';
import { ScoreSummary } from '../services/scoringEngine';
import { 
  exportAuditToExcel, 
  exportScorecardOnly, 
  exportFindingsOnly, 
  exportCapaTrackerOnly,
  getStandardAuditFilename,
  calculateOverdueDays
} from '../services/excelExport';

interface ExcelReportCenterViewProps {
  audit: AuditRecord;
  setAudit: React.Dispatch<React.SetStateAction<AuditRecord>>;
  sections: AuditSection[];
  checklistItems: ChecklistItem[];
  scoreSummary: ScoreSummary;
  userRole: UserRole;
  language: 'EN' | 'BN';
  onOpenPrintReport: () => void;
}

export const ExcelReportCenterView: React.FC<ExcelReportCenterViewProps> = ({
  audit,
  setAudit,
  sections,
  checklistItems,
  scoreSummary,
  userRole,
  language,
  onOpenPrintReport,
}) => {
  const [activePreviewTab, setActivePreviewTab] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [lastDownloadFilename, setLastDownloadFilename] = useState<string>('');
  const [approvalNotes, setApprovalNotes] = useState<string>('');
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState<boolean>(false);

  const standardFilename = getStandardAuditFilename(audit);
  const todayStr = new Date().toISOString().slice(0, 10);

  // Initialize or get versions list
  const versions: ReportVersion[] = audit.reportVersions && audit.reportVersions.length > 0
    ? audit.reportVersions
    : [
        {
          id: 'REP-v1.0',
          versionNumber: 'v1.0',
          generatedAt: `${audit.auditDate} 11:30 BST`,
          generatedBy: audit.leadAuditor,
          filename: standardFilename,
          overallScore: scoreSummary.overallScore,
          overallStatus: scoreSummary.overallStatus,
          criticalFindingsCount: scoreSummary.criticalCount,
          openCapaCount: Object.values(audit.findings).filter((f) => (f.result === 'Non-Compliant' || f.result === 'Partially Compliant') && f.capaStatus !== 'Verified & Closed').length,
          approvalStatus: audit.status === 'Approved & Published' ? 'Approved & Signed' : 'Submitted for Review',
          fileSizeEstimate: '142 KB',
          notes: 'Initial formal audit report generation upon completion of factory floor rounds.',
        },
      ];

  // Handler: Generate / Regenerate Excel Report & Record in Version Control
  const handleGenerateAndDownload = (downloadImmediately: boolean = true) => {
    setIsGenerating(true);

    setTimeout(() => {
      let dlName = '';
      if (downloadImmediately) {
        dlName = exportAuditToExcel(audit, sections, checklistItems, scoreSummary);
        setLastDownloadFilename(dlName);
      } else {
        dlName = standardFilename;
      }

      // Record new version in audit history
      const nextVerNum = `v1.${versions.length}`;
      const newVersion: ReportVersion = {
        id: `REP-${nextVerNum}-${Date.now()}`,
        versionNumber: nextVerNum,
        generatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' BST',
        generatedBy: `${userRole} (${audit.leadAuditor})`,
        filename: dlName,
        overallScore: scoreSummary.overallScore,
        overallStatus: scoreSummary.overallStatus,
        criticalFindingsCount: scoreSummary.criticalCount,
        openCapaCount: Object.values(audit.findings).filter((f) => (f.result === 'Non-Compliant' || f.result === 'Partially Compliant') && f.capaStatus !== 'Verified & Closed').length,
        approvalStatus: audit.status === 'Approved & Published' ? 'Approved & Signed' : 'Draft',
        fileSizeEstimate: '148 KB',
        notes: `Regenerated report with updated section scores (${scoreSummary.overallScore !== null ? scoreSummary.overallScore.toFixed(1) : 'N/A'}%).`,
      };

      setAudit((prev) => ({
        ...prev,
        reportVersions: [newVersion, ...(prev.reportVersions || versions)],
        updatedAt: new Date().toISOString(),
      }));

      setIsGenerating(false);
    }, 400);
  };

  // Handler: Approve and Finalize Audit
  const handleApproveAudit = () => {
    if (userRole !== 'QMS Manager' && userRole !== 'Super Administrator') {
      alert('Permission Denied: Only QMS Managers or Super Administrators have authority to formally approve and publish audit reports.');
      return;
    }

    setAudit((prev) => ({
      ...prev,
      status: 'Approved & Published',
      approvedBy: 'Nazrul Hassan (QMS Manager)',
      approvalDate: todayStr,
      generalRemarks: approvalNotes || prev.generalRemarks,
      updatedAt: new Date().toISOString(),
    }));

    setIsApprovalModalOpen(false);
    alert('Audit report successfully Approved & Published! You can now download the finalized executive sign-off report.');
  };

  // Pre-filtered Non-Compliance Items
  const ncItems = checklistItems.filter((item) => {
    const f = audit.findings[item.id];
    return f && (f.result === 'Non-Compliant' || f.result === 'Partially Compliant');
  });

  return (
    <div className="space-y-6">
      {/* TOP HEADER: SYSTEM STATUS & GENERATOR ACTIONS */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Section 17: Automatic Professional Excel Audit Report Generator</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Management-Ready Excel Audit Reporting Engine
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Generates a verified, multi-worksheet `.xlsx` workbook from actual saved factory database records. Features automated calculations, 19 factory sections, conditional status formatting, and three-tier sign-off.
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-slate-600">
              <span><strong>File Target:</strong> <code className="font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">{standardFilename}</code></span>
              <span>•</span>
              <span><strong>Approval Status:</strong> <span className={`font-bold ${audit.status === 'Approved & Published' ? 'text-emerald-700' : 'text-amber-700'}`}>{audit.status}</span></span>
              <span>•</span>
              <span><strong>Current Version:</strong> <span className="font-mono font-bold text-slate-900">{versions[0]?.versionNumber || 'v1.0'}</span></span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full lg:w-auto">
            {audit.status !== 'Approved & Published' && (
              <button
                onClick={() => setIsApprovalModalOpen(true)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center space-x-1.5 min-h-[44px] active:scale-95"
                title="Review & formally approve audit"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Approve & Finalize</span>
              </button>
            )}

            <button
              onClick={() => handleGenerateAndDownload(true)}
              disabled={isGenerating}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center space-x-2 min-h-[48px] active:scale-95"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Compiling Worksheets...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Complete Excel Report (9 Sheets)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Confirmation alert when download succeeds */}
        {lastDownloadFilename && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-900 flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                Generated and downloaded: <strong>{lastDownloadFilename}</strong>
              </span>
            </span>
            <span className="text-[11px] font-mono text-emerald-700">
              Valid Microsoft Excel format (.xlsx)
            </span>
          </div>
        )}
      </div>

      {/* QUICK DOWNLOAD CARDS FOR MODULAR EXPORTS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Complete 9-Sheet Workbook */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-emerald-500 transition-all">
          <div>
            <div className="p-2 w-fit rounded-xl bg-emerald-50 text-emerald-700 mb-2">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Complete Audit Report
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              All 9 worksheets including Executive Summary, 19 Sections, CAPA Tracker, and Sign-offs.
            </p>
          </div>
          <button
            onClick={() => handleGenerateAndDownload(true)}
            className="mt-4 w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 transition-colors flex items-center justify-center space-x-1.5 min-h-[40px] active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download All 9 Sheets</span>
          </button>
        </div>

        {/* Card 2: Section Scorecard */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-blue-500 transition-all">
          <div>
            <div className="p-2 w-fit rounded-xl bg-blue-50 text-blue-700 mb-2">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Section-wise Scorecard
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Export dedicated 19-section performance scorecard with points, percentages, and status colors.
            </p>
          </div>
          <button
            onClick={() => exportScorecardOnly(audit, sections, checklistItems, scoreSummary)}
            className="mt-4 w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl text-xs font-bold border border-blue-200 transition-colors flex items-center justify-center space-x-1.5 min-h-[40px] active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Scorecard</span>
          </button>
        </div>

        {/* Card 3: Non-Compliance Register */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-red-500 transition-all">
          <div>
            <div className="p-2 w-fit rounded-xl bg-red-50 text-red-700 mb-2">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Deficiency Register
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              List of all {scoreSummary.nonCompliantCount + scoreSummary.partialCount} non-compliant findings with buyer clause references.
            </p>
          </div>
          <button
            onClick={() => exportFindingsOnly(audit, sections, checklistItems, scoreSummary)}
            className="mt-4 w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-red-800 rounded-xl text-xs font-bold border border-red-200 transition-colors flex items-center justify-center space-x-1.5 min-h-[40px] active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Findings Register</span>
          </button>
        </div>

        {/* Card 4: CAPA Master Tracker */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-amber-500 transition-all">
          <div>
            <div className="p-2 w-fit rounded-xl bg-amber-50 text-amber-700 mb-2">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              CAPA Master Tracker
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Corrective action plans, 5-Why root cause summaries, and automatic overdue day counts.
            </p>
          </div>
          <button
            onClick={() => exportCapaTrackerOnly(audit, sections, checklistItems, scoreSummary)}
            className="mt-4 w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold border border-amber-200 transition-colors flex items-center justify-center space-x-1.5 min-h-[40px] active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CAPA Tracker</span>
          </button>
        </div>
      </div>

      {/* INTERACTIVE WORKSHEET PREVIEWER */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Previewer Header & Tabs */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Live Excel Worksheet Previewer (9 Worksheets)
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenPrintReport}
              className="px-3 py-1 text-xs font-semibold rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center space-x-1"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print Preview</span>
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-100/80 px-2 pt-2 scrollbar-none touch-pan-x text-xs font-semibold">
          {[
            { num: 1, name: '1. Executive Summary' },
            { num: 2, name: '2. Section-wise Scorecard' },
            { num: 3, name: '3. Detailed Checklist' },
            { num: 4, name: '4. Non-Compliance Register' },
            { num: 5, name: '5. Photo Evidence' },
            { num: 6, name: '6. CAPA Tracker' },
            { num: 7, name: '7. ISO 9001 Alignment' },
            { num: 8, name: '8. Management Action Plan' },
            { num: 9, name: '9. Audit Sign-off' },
          ].map((tab) => (
            <button
              key={tab.num}
              onClick={() => setActivePreviewTab(tab.num)}
              className={`px-3.5 py-2.5 rounded-t-xl transition-all whitespace-nowrap border-b-2 mr-1 min-h-[40px] active:scale-95 ${
                activePreviewTab === tab.num
                  ? 'bg-white text-slate-900 border-emerald-600 shadow-xs font-bold'
                  : 'bg-transparent text-slate-600 hover:text-slate-900 border-transparent'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Preview Content Area */}
        <div className="p-3.5 sm:p-5 max-h-[500px] overflow-y-auto text-xs">
          {/* TAB 1: EXECUTIVE SUMMARY PREVIEW */}
          {activePreviewTab === 1 && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900 text-white rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-base font-bold uppercase tracking-wide">
                    {audit.factoryName}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Buyer Compliance & QMS Audit Report • {audit.buyerName} ({audit.auditDate})
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black font-mono text-emerald-400">
                    {scoreSummary.overallScore !== null ? `${scoreSummary.overallScore.toFixed(2)}%` : 'Not Assessed'}
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {scoreSummary.overallStatus}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700">
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Total Sections:</span>
                  <span className="font-bold text-sm text-slate-900">{sections.length}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Assessed Items:</span>
                  <span className="font-bold text-sm text-slate-900">{scoreSummary.totalAssessed} / {scoreSummary.totalQuestions}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Critical Findings:</span>
                  <span className="font-bold text-sm text-red-600">{scoreSummary.criticalCount}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Open CAPAs:</span>
                  <span className="font-bold text-sm text-amber-600">
                    {Object.values(audit.findings).filter((f) => (f.result === 'Non-Compliant' || f.result === 'Partially Compliant') && f.capaStatus !== 'Verified & Closed').length}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200 text-slate-600">
                <strong className="text-slate-900 block mb-1">Executive Summary Notes:</strong>
                <span>{audit.generalRemarks || 'Audit completed per Bangladesh sweater manufacturing QMS and buyer compliance protocols.'}</span>
              </div>
            </div>
          )}

          {/* TAB 2: SECTION-WISE SCORECARD PREVIEW */}
          {activePreviewTab === 2 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-800 text-white uppercase text-[11px]">
                  <tr>
                    <th scope="col" className="p-2 text-left">#</th>
                    <th scope="col" className="p-2 text-left">Audit Section</th>
                    <th scope="col" className="p-2 text-center">Score %</th>
                    <th scope="col" className="p-2 text-center">Status</th>
                    <th scope="col" className="p-2 text-center">Compliant</th>
                    <th scope="col" className="p-2 text-center">Partial</th>
                    <th scope="col" className="p-2 text-center">Non-Compliant</th>
                    <th scope="col" className="p-2 text-center">Critical</th>
                    <th scope="col" className="p-2 text-left">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {sections.map((sec, idx) => {
                    const s = scoreSummary.sectionScores[sec.id];
                    return (
                      <tr key={sec.id} className="hover:bg-slate-50">
                        <td className="p-2 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-2 font-bold text-slate-900">{sec.name}</td>
                        <td className="p-2 text-center font-mono font-bold">
                          {s && s.scorePercentage !== null ? `${s.scorePercentage.toFixed(1)}%` : 'Not Assessed'}
                        </td>
                        <td className="p-2 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              s?.status === 'GREEN'
                                ? 'bg-emerald-100 text-emerald-800'
                                : s?.status === 'YELLOW'
                                ? 'bg-amber-100 text-amber-800'
                                : s?.status === 'RED'
                                ? 'bg-red-100 text-red-800'
                                : 'text-slate-400'
                            }`}
                          >
                            {s?.status || 'NOT_ASSESSED'}
                          </span>
                        </td>
                        <td className="p-2 text-center text-emerald-700 font-bold">{s?.compliantCount || 0}</td>
                        <td className="p-2 text-center text-amber-700 font-bold">{s?.partialCount || 0}</td>
                        <td className="p-2 text-center text-red-700 font-bold">{s?.nonCompliantCount || 0}</td>
                        <td className="p-2 text-center text-red-600 font-bold">{s?.criticalCount || 0}</td>
                        <td className="p-2 text-slate-500 text-[11px] truncate max-w-xs">
                          {s?.criticalCount && s.criticalCount > 0 ? 'Urgent CAPA containment' : s?.status === 'GREEN' ? 'Acceptable' : 'Improvement required'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: DETAILED CHECKLIST PREVIEW */}
          {activePreviewTab === 3 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-800 text-white uppercase text-[11px]">
                  <tr>
                    <th scope="col" className="p-2 text-left">ID / Section</th>
                    <th scope="col" className="p-2 text-left">Audit Question</th>
                    <th scope="col" className="p-2 text-left">Clauses</th>
                    <th scope="col" className="p-2 text-center">Result</th>
                    <th scope="col" className="p-2 text-center">Score</th>
                    <th scope="col" className="p-2 text-left">Finding Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {checklistItems.map((item) => {
                    const f = audit.findings[item.id];
                    const res = f?.result || 'Not Verified';
                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="p-2 whitespace-nowrap">
                          <span className="font-mono text-slate-400 block">{item.id}</span>
                          <span className="font-bold text-slate-800">{item.sectionName}</span>
                        </td>
                        <td className="p-2 max-w-sm">
                          <div className="font-semibold text-slate-900">{item.question}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Criteria: {item.acceptanceCriteria}</div>
                        </td>
                        <td className="p-2 whitespace-nowrap">
                          {item.buyerClause && <span className="block font-mono text-[10px] text-blue-700">{item.buyerClause}</span>}
                          {item.isoClause && <span className="block font-mono text-[10px] text-purple-700">ISO {item.isoClause}</span>}
                        </td>
                        <td className="p-2 text-center font-bold">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${res === 'Compliant' ? 'bg-emerald-100 text-emerald-800' : res === 'Non-Compliant' ? 'bg-red-100 text-red-800' : res === 'Partially Compliant' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                            {res}
                          </span>
                        </td>
                        <td className="p-2 text-center font-mono font-bold">
                          {res === 'Compliant' ? 100 : res === 'Partially Compliant' ? 50 : res === 'Non-Compliant' ? 0 : '-'}
                        </td>
                        <td className="p-2 text-slate-600 text-[11px] max-w-xs">
                          {f?.findingDescription || (res === 'Compliant' ? 'Conforming' : 'Pending')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: NON-COMPLIANCE REGISTER PREVIEW */}
          {activePreviewTab === 4 && (
            <div className="overflow-x-auto">
              {ncItems.length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                  No non-compliant findings in this audit.
                </div>
              ) : (
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-red-900 text-white uppercase text-[11px]">
                    <tr>
                      <th scope="col" className="p-2 text-left">Finding ID</th>
                      <th scope="col" className="p-2 text-left">Section & Question</th>
                      <th scope="col" className="p-2 text-center">Severity</th>
                      <th scope="col" className="p-2 text-left">Deficiency Observation</th>
                      <th scope="col" className="p-2 text-left">Immediate Correction</th>
                      <th scope="col" className="p-2 text-left">Responsible Person</th>
                      <th scope="col" className="p-2 text-center">Target Date</th>
                      <th scope="col" className="p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {ncItems.map((item, idx) => {
                      const f = audit.findings[item.id];
                      return (
                        <tr key={item.id} className="hover:bg-red-50/20">
                          <td className="p-2 font-mono font-bold text-red-800">NC-{(idx + 1).toString().padStart(3, '0')}</td>
                          <td className="p-2">
                            <span className="font-bold text-slate-900 block">{item.sectionName}</span>
                            <span className="text-slate-600 text-[11px]">{item.question}</span>
                          </td>
                          <td className="p-2 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${item.isCritical ? 'bg-red-600 text-white animate-pulse' : 'bg-red-100 text-red-800'}`}>
                              {item.isCritical ? 'CRITICAL' : f.riskLevel}
                            </span>
                          </td>
                          <td className="p-2 text-red-900 font-medium max-w-xs">{f.findingDescription || 'Deficiency noted.'}</td>
                          <td className="p-2 text-slate-700 max-w-xs">{f.correctiveAction || 'Pending Plan'}</td>
                          <td className="p-2 font-medium">{f.responsiblePerson || 'Unassigned'}</td>
                          <td className="p-2 text-center font-mono">{f.targetCompletionDate || 'TBD'}</td>
                          <td className="p-2 text-center font-bold text-slate-700">{f.capaStatus}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 5: PHOTO EVIDENCE PREVIEW */}
          {activePreviewTab === 5 && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500">
                Photo evidence logged in Sheet 5 with before/after classifications and timestamps.
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {checklistItems.flatMap((item) =>
                  (audit.findings[item.id]?.photos || []).map((photo) => (
                    <div key={photo.id} className="border border-slate-200 rounded-lg p-2 bg-slate-50">
                      <div className="h-28 rounded overflow-hidden bg-black flex items-center justify-center">
                        <img src={photo.url} alt={photo.caption} className="h-full object-cover" />
                      </div>
                      <div className="mt-1.5 font-bold text-slate-900 truncate">{photo.caption}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{photo.sectionName}</div>
                      <span className={`inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${photo.type === 'After' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {photo.type}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 6: CAPA TRACKER PREVIEW */}
          {activePreviewTab === 6 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-amber-800 text-white uppercase text-[11px]">
                  <tr>
                    <th scope="col" className="p-2 text-left">CAPA ID</th>
                    <th scope="col" className="p-2 text-left">Section</th>
                    <th scope="col" className="p-2 text-left">Finding & 5-Why Root Cause</th>
                    <th scope="col" className="p-2 text-left">Corrective & Preventive Action</th>
                    <th scope="col" className="p-2 text-left">Assignee & Dept</th>
                    <th scope="col" className="p-2 text-center">Target Date</th>
                    <th scope="col" className="p-2 text-center">Overdue Days</th>
                    <th scope="col" className="p-2 text-center">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {ncItems.map((item, idx) => {
                    const f = audit.findings[item.id];
                    const isClosed = f.capaStatus === 'Verified & Closed';
                    const overdue = calculateOverdueDays(f.targetCompletionDate, isClosed);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="p-2 font-mono font-bold text-amber-900">CAPA-{(idx + 1).toString().padStart(3, '0')}</td>
                        <td className="p-2 font-bold text-slate-800">{item.sectionName}</td>
                        <td className="p-2 max-w-xs">
                          <strong className="block text-slate-900">{f.findingDescription || item.question}</strong>
                          <span className="text-[10px] text-slate-500 italic mt-0.5 block">
                            5-Why: {f.fiveWhys?.filter(Boolean).join(' -> ') || f.rootCause || 'Under investigation'}
                          </span>
                        </td>
                        <td className="p-2 max-w-xs">
                          <div className="text-slate-800"><strong>Correction:</strong> {f.correctiveAction || 'TBD'}</div>
                          <div className="text-slate-600 text-[11px] mt-0.5"><strong>Prevention:</strong> {f.preventiveAction || 'TBD'}</div>
                        </td>
                        <td className="p-2 font-medium">
                          {f.responsiblePerson || 'Unassigned'} ({f.responsibleDepartment || 'QMS'})
                        </td>
                        <td className="p-2 text-center font-mono">{f.targetCompletionDate || 'TBD'}</td>
                        <td className="p-2 text-center font-bold">
                          {isClosed ? (
                            <span className="text-emerald-700">Closed</span>
                          ) : overdue > 0 ? (
                            <span className="text-red-600 animate-pulse font-mono">{overdue} Days Overdue</span>
                          ) : (
                            <span className="text-slate-500">On Track</span>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isClosed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {f.capaStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 7: ISO 9001 ALIGNMENT PREVIEW */}
          {activePreviewTab === 7 && (
            <div className="space-y-3">
              <div className="text-xs text-slate-600">
                Mapped against ISO 9001:2015 Clauses (7.1.5, 7.2, 7.5, 8.5.1, 8.5.2, 8.5.4, 8.6, 8.7, 10.2).
              </div>
              <table className="min-w-full divide-y divide-slate-200 text-xs border border-slate-200">
                <thead className="bg-purple-900 text-white uppercase text-[11px]">
                  <tr>
                    <th scope="col" className="p-2 text-left">ISO Clause</th>
                    <th scope="col" className="p-2 text-left">Factory Section</th>
                    <th scope="col" className="p-2 text-left">Audit Requirement</th>
                    <th scope="col" className="p-2 text-center">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {checklistItems.slice(0, 10).map((item) => (
                    <tr key={item.id}>
                      <td className="p-2 font-mono font-bold text-purple-900">ISO {item.isoClause || '8.5.1'}</td>
                      <td className="p-2 font-bold text-slate-800">{item.sectionName}</td>
                      <td className="p-2 text-slate-700">{item.question}</td>
                      <td className="p-2 text-center font-bold">
                        {audit.findings[item.id]?.result || 'Not Verified'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 8: MANAGEMENT ACTION PLAN PREVIEW */}
          {activePreviewTab === 8 && (
            <div className="space-y-3">
              <div className="text-xs text-slate-600">
                Prioritized Action Plan for Factory General Manager and Department Heads.
              </div>
              <table className="min-w-full divide-y divide-slate-200 text-xs border border-slate-200">
                <thead className="bg-slate-900 text-white uppercase text-[11px]">
                  <tr>
                    <th scope="col" className="p-2 text-left">Priority</th>
                    <th scope="col" className="p-2 text-left">Department</th>
                    <th scope="col" className="p-2 text-left">Problem Observed</th>
                    <th scope="col" className="p-2 text-left">Required Executive Action</th>
                    <th scope="col" className="p-2 text-center">Target Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {ncItems.map((item, idx) => {
                    const f = audit.findings[item.id];
                    const isCrit = item.isCritical || f.riskLevel === 'Critical';
                    return (
                      <tr key={item.id}>
                        <td className="p-2 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${isCrit ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'}`}>
                            {isCrit ? 'PRIORITY 1 — CRITICAL' : 'PRIORITY 2 — HIGH'}
                          </span>
                        </td>
                        <td className="p-2 font-bold text-slate-800">{f.responsibleDepartment || item.sectionName}</td>
                        <td className="p-2 text-slate-700 font-medium">{f.findingDescription || item.question}</td>
                        <td className="p-2 text-slate-700">{f.correctiveAction || 'Immediate containment'}</td>
                        <td className="p-2 text-center font-mono">{f.targetCompletionDate || 'Within 7 Days'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 9: AUDIT APPROVAL & SIGN-OFF PREVIEW */}
          {activePreviewTab === 9 && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-6">
              <div className="border-b border-slate-300 pb-3">
                <h4 className="font-bold text-sm text-slate-900 uppercase">
                  Formal Three-Tier Approval & Verification Chain
                </h4>
                <p className="text-xs text-slate-500">
                  Per ISO 9001:2015 Clause 7.5 documented information guidelines, approvals verify inspection authenticity.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs">
                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-900 text-sm">{audit.leadAuditor}</div>
                  <div className="text-slate-500">Lead QMS Auditor</div>
                  <div className="text-[10px] text-emerald-600 font-bold mt-1">Submitted: {audit.auditDate}</div>
                  <div className="mt-3 text-[11px] font-mono text-slate-400 border-t pt-2">[ Digitally Signed ]</div>
                </div>

                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-900 text-sm">{audit.approvedBy || 'Nazrul Hassan'}</div>
                  <div className="text-slate-500">Quality Assurance Manager</div>
                  <div className="text-[10px] text-emerald-600 font-bold mt-1">
                    {audit.status === 'Approved & Published' ? 'Approved & Signed' : 'Under QMS Review'}
                  </div>
                  <div className="mt-3 text-[11px] font-mono text-slate-400 border-t pt-2">
                    {audit.status === 'Approved & Published' ? '[ Signed & Verified ]' : '[ Pending Approval ]'}
                  </div>
                </div>

                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-900 text-sm">Engr. M. A. Rahman</div>
                  <div className="text-slate-500">Factory General Manager</div>
                  <div className="text-[10px] text-slate-400 mt-1">Executive Compliance Sign-Off</div>
                  <div className="mt-3 text-[11px] font-mono text-slate-400 border-t pt-2">
                    {audit.status === 'Approved & Published' ? '[ Executive Counter-Sign ]' : '[ Pending Approval ]'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* REPORT VERSION CONTROL & PREVIOUS VERSIONS TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Report Version Control & Generation History
            </h3>
          </div>
          <button
            onClick={() => handleGenerateAndDownload(true)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center space-x-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Generate New Version</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold uppercase">
              <tr>
                <th scope="col" className="p-3 text-left">Version</th>
                <th scope="col" className="p-3 text-left">Generation Timestamp</th>
                <th scope="col" className="p-3 text-left">Generated By</th>
                <th scope="col" className="p-3 text-center">Score Snapshot</th>
                <th scope="col" className="p-3 text-center">Critical Deficiencies</th>
                <th scope="col" className="p-3 text-center">Approval Status</th>
                <th scope="col" className="p-3 text-left">Filename & Notes</th>
                <th scope="col" className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {versions.map((ver, idx) => (
                <tr key={ver.id || idx} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-slate-900">
                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300">
                      {ver.versionNumber}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-600">{ver.generatedAt}</td>
                  <td className="p-3 font-semibold text-slate-800">{ver.generatedBy}</td>
                  <td className="p-3 text-center font-mono font-bold">
                    {ver.overallScore !== null ? `${ver.overallScore.toFixed(1)}%` : 'N/A'}
                  </td>
                  <td className="p-3 text-center">
                    {ver.criticalFindingsCount > 0 ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-100 text-red-800">
                        {ver.criticalFindingsCount} Critical
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ver.approvalStatus === 'Approved & Signed'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {ver.approvalStatus}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500 max-w-xs">
                    <div className="font-mono text-[10px] truncate">{ver.filename}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{ver.notes}</div>
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleGenerateAndDownload(true)}
                      className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 flex items-center space-x-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: FORMAL QMS APPROVAL & SIGN-OFF */}
      {isApprovalModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center space-x-2 text-emerald-700 mb-2">
              <ShieldCheck className="w-6 h-6" />
              <h3 className="font-bold text-base text-slate-900">
                QMS Approval & Executive Publication
              </h3>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              You are approving <strong>"{audit.title}"</strong> ({audit.id}) with Overall Score: <strong>{scoreSummary.overallScore !== null ? `${scoreSummary.overallScore.toFixed(1)}%` : 'N/A'}</strong> ({scoreSummary.overallStatus}).
            </p>

            {scoreSummary.criticalCount > 0 && (
              <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-xs text-red-900 mb-3">
                <strong>Attention:</strong> {scoreSummary.criticalCount} critical deficiency remains flagged. High score does not override mandatory product safety issues. Ensure containment actions are verified.
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Executive Approval Remarks (Recorded in Sheet 1 & Sheet 9):
              </label>
              <textarea
                rows={3}
                placeholder="Enter executive sign-off remarks, authorization notes, and CAPA follow-up dates..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end space-x-2 text-xs font-semibold">
              <button
                onClick={() => setIsApprovalModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveAudit}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm flex items-center space-x-1"
              >
                <Check className="w-4 h-4" />
                <span>Approve & Publish Report</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
