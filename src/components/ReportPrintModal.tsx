import React from 'react';
import { X, Printer, Download, Building, CheckCircle2, AlertTriangle, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { AuditRecord, AuditSection, ChecklistItem, FactorySettings } from '../types/audit';
import { ScoreSummary } from '../services/scoringEngine';

interface ReportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  audit: AuditRecord;
  sections: AuditSection[];
  checklistItems: ChecklistItem[];
  scoreSummary: ScoreSummary;
  onExportExcel: () => void;
  factorySettings?: FactorySettings;
}

export const ReportPrintModal: React.FC<ReportPrintModalProps> = ({
  isOpen,
  onClose,
  audit,
  sections,
  checklistItems,
  scoreSummary,
  onExportExcel,
  factorySettings,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const ncItems = checklistItems.filter((item) => {
    const f = audit.findings[item.id];
    return f && (f.result === 'Non-Compliant' || f.result === 'Partially Compliant');
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full p-6 sm:p-10 shadow-2xl border border-slate-200 my-6 max-h-[95vh] overflow-y-auto print:max-h-none print:shadow-none print:p-0 print:border-none">
        {/* Modal Controls - Hidden during actual print */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-slate-200 print:hidden">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center space-x-2">
              <Printer className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Official Factory Audit Report
              </h3>
            </div>
            <button
              onClick={onClose}
              className="sm:hidden p-2 text-slate-400 hover:text-slate-600 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onExportExcel}
              className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center space-x-1.5 min-h-[44px] active:scale-95 shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel (9 Sheets)</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center space-x-1.5 min-h-[44px] active:scale-95 shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="hidden sm:flex p-2 text-slate-400 hover:text-slate-600 rounded-lg min-h-[44px] min-w-[44px] items-center justify-center"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE REPORT CONTENT */}
        <div className="space-y-6 text-slate-800 text-xs sm:text-sm">
          {/* Official Factory Header */}
          <div className="border-b-2 border-slate-900 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start space-x-4">
                {factorySettings?.factoryLogo && (
                  <img
                    src={factorySettings.factoryLogo}
                    alt={factorySettings.factoryName}
                    className="max-h-16 max-w-[180px] object-contain shrink-0"
                  />
                )}
                <div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                    {factorySettings?.factoryName || audit.factoryName}
                  </div>
                  <div className="text-xs text-slate-600 font-medium">
                    {factorySettings?.factoryAddress || audit.factoryLocation}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Reg: {factorySettings?.registrationNumber || 'BGMEA-REG-20419'} • {factorySettings?.isoCertifications || 'ISO 9001:2015 Certified Sweater Manufacturing Facility'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Tel: {factorySettings?.contactPhone || '+880 2-9298412'} • Email: {factorySettings?.contactEmail || 'compliance@apexsweater.com'}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="inline-block px-3 py-1 rounded bg-slate-900 text-white font-mono text-xs font-bold uppercase">
                  Audit Report #{audit.id}
                </span>
                <div className="text-xs text-slate-500 mt-1 font-mono">
                  Date: {audit.auditDate} • {audit.auditTime}
                </div>
                <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                  QMS Certified Export Facility
                </div>
              </div>
            </div>
          </div>

          {/* Audit Scope Details Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Audit Title:</span>
              <span className="font-bold text-slate-900">{audit.title}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Buyer Name:</span>
              <span className="font-bold text-slate-900">{audit.buyerName}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Checklist Standard:</span>
              <span className="font-bold text-slate-900">{audit.checklistVersion}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Audit Scope / Line:</span>
              <span className="font-bold text-slate-900">{audit.floor} / {audit.line}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Style & Order Number:</span>
              <span className="font-bold text-slate-900">{audit.styleNumber || 'N/A'} (PO: {audit.orderOrPoNumber || 'N/A'})</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Yarn Lot & Count:</span>
              <span className="font-bold text-slate-900">{audit.yarnLotNumber || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Lead Auditor:</span>
              <span className="font-bold text-slate-900">{audit.leadAuditor}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Audit Status:</span>
              <span className="font-bold text-slate-900">{audit.status}</span>
            </div>
          </div>

          {/* Executive Performance Summary Card */}
          <div className="p-4 rounded-xl border border-slate-300 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Overall Audit Compliance Score
              </span>
              <div className="flex items-baseline space-x-3 mt-1">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
                  {scoreSummary.overallScore !== null ? `${scoreSummary.overallScore.toFixed(2)}%` : 'Not Assessed'}
                </span>
                <span
                  className={`px-3 py-1 rounded text-xs font-black uppercase ${
                    scoreSummary.overallStatus === 'GREEN'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : scoreSummary.overallStatus === 'YELLOW'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : scoreSummary.overallStatus === 'RED'
                      ? 'bg-red-100 text-red-800 border border-red-300'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {scoreSummary.overallStatus === 'GREEN' && 'GREEN — Above 80% (Acceptable)'}
                  {scoreSummary.overallStatus === 'YELLOW' && 'YELLOW — 50% to 80% (Action Required)'}
                  {scoreSummary.overallStatus === 'RED' && 'RED — Below 50% (Critical Attention)'}
                  {scoreSummary.overallStatus === 'NOT_ASSESSED' && 'Not Assessed'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="block font-black text-sm text-slate-900">{scoreSummary.totalAssessed}</span>
                <span className="text-[10px] text-slate-500 uppercase">Assessed</span>
              </div>
              <div className="p-2 bg-emerald-50 rounded border border-emerald-200">
                <span className="block font-black text-sm text-emerald-700">{scoreSummary.compliantCount}</span>
                <span className="text-[10px] text-emerald-700 uppercase">Compliant</span>
              </div>
              <div className="p-2 bg-amber-50 rounded border border-amber-200">
                <span className="block font-black text-sm text-amber-700">{scoreSummary.partialCount}</span>
                <span className="text-[10px] text-amber-700 uppercase">Partial</span>
              </div>
              <div className="p-2 bg-red-50 rounded border border-red-200">
                <span className="block font-black text-sm text-red-700">{scoreSummary.nonCompliantCount}</span>
                <span className="text-[10px] text-red-700 uppercase">Non-Compliant</span>
              </div>
            </div>
          </div>

          {/* Critical Findings Alert in Report */}
          {scoreSummary.criticalCount > 0 && (
            <div className="p-3.5 bg-red-50 rounded-xl border border-red-400 text-red-950 text-xs">
              <div className="flex items-center space-x-2 font-black uppercase text-red-700">
                <AlertTriangle className="w-4 h-4" />
                <span>Critical Safety Finding Warning ({scoreSummary.criticalCount} Detected)</span>
              </div>
              <p className="mt-1 font-medium text-red-800">
                A high overall score does not override mandatory product safety non-compliances. Immediate senior management containment is required.
              </p>
            </div>
          )}

          {/* Section-Wise Score Summary Table */}
          <div>
            <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-2">
              Section-Wise Performance Evaluation (19 Factory Sections)
            </h4>
            <table className="min-w-full divide-y divide-slate-200 text-xs border border-slate-200">
              <thead className="bg-slate-100 font-bold uppercase text-slate-700">
                <tr>
                  <th scope="col" className="p-2 text-left">#</th>
                  <th scope="col" className="p-2 text-left">Section Name</th>
                  <th scope="col" className="p-2 text-center">Score %</th>
                  <th scope="col" className="p-2 text-center">Rating</th>
                  <th scope="col" className="p-2 text-center">Compliant</th>
                  <th scope="col" className="p-2 text-center">Partial</th>
                  <th scope="col" className="p-2 text-center">Non-Compliant</th>
                  <th scope="col" className="p-2 text-center">Critical</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sections.map((sec, idx) => {
                  const s = scoreSummary.sectionScores[sec.id];
                  return (
                    <tr key={sec.id}>
                      <td className="p-2 font-mono text-slate-500">{idx + 1}</td>
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
                      <td className="p-2 text-center font-bold text-red-600">{s?.criticalCount || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Non-Compliance & Corrective Actions Table */}
          {ncItems.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-2">
                Non-Compliance Findings & Corrective Action Plan (CAPA)
              </h4>
              <table className="min-w-full divide-y divide-slate-200 text-xs border border-slate-200">
                <thead className="bg-slate-100 font-bold uppercase text-slate-700">
                  <tr>
                    <th scope="col" className="p-2 text-left">Item / Clause</th>
                    <th scope="col" className="p-2 text-left">Finding Description</th>
                    <th scope="col" className="p-2 text-left">Corrective Action Plan</th>
                    <th scope="col" className="p-2 text-left">Responsible Person</th>
                    <th scope="col" className="p-2 text-center">Target Date</th>
                    <th scope="col" className="p-2 text-center">CAPA Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {ncItems.map((item) => {
                    const f = audit.findings[item.id];
                    return (
                      <tr key={item.id}>
                        <td className="p-2">
                          <strong className="block text-slate-900">{item.sectionName}</strong>
                          <span className="font-mono text-[10px] text-slate-500">{item.buyerClause || item.id}</span>
                        </td>
                        <td className="p-2 text-red-800 font-medium">{f.findingDescription || item.question}</td>
                        <td className="p-2 text-slate-700">{f.correctiveAction || 'Pending Plan'}</td>
                        <td className="p-2 font-medium">{f.responsiblePerson || 'Unassigned'}</td>
                        <td className="p-2 text-center font-mono">{f.targetCompletionDate || 'TBD'}</td>
                        <td className="p-2 text-center font-bold">{f.capaStatus}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Official Sign-Off Signatures Block */}
          <div className="pt-8 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs">
            <div>
              <div className="border-b border-slate-400 pb-1 font-bold text-slate-900">
                {audit.leadAuditor}
              </div>
              <div className="text-slate-500 mt-1">Lead QMS Auditor</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Date: {audit.auditDate}</div>
            </div>

            <div>
              <div className="border-b border-slate-400 pb-1 font-bold text-slate-900">
                Nazrul Hassan
              </div>
              <div className="text-slate-500 mt-1">Quality Assurance Manager</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Verification & Approval</div>
            </div>

            <div>
              <div className="border-b border-slate-400 pb-1 font-bold text-slate-900">
                Engr. M. A. Rahman
              </div>
              <div className="text-slate-500 mt-1">Factory General Manager</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Executive Management Sign-Off</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
