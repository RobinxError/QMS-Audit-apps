import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ShieldAlert, 
  Clock, 
  ArrowRight, 
  CheckSquare, 
  Layers, 
  Filter, 
  Calendar, 
  TrendingUp, 
  FileCheck, 
  Building2, 
  Maximize2,
  FileSpreadsheet,
  Download,
  ClipboardCheck,
  ChevronRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { AuditRecord, AuditSection, ChecklistItem } from '../types/audit';
import { ScoreSummary } from '../services/scoringEngine';

interface DashboardViewProps {
  audit: AuditRecord;
  sections: AuditSection[];
  checklistItems: ChecklistItem[];
  scoreSummary: ScoreSummary;
  language: 'EN' | 'BN';
  onNavigateToAudit: (sectionId?: string) => void;
  onNavigateToCAPA: (findingId?: string) => void;
  onNavigateToExcelReport?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  audit,
  sections,
  checklistItems,
  scoreSummary,
  language,
  onNavigateToAudit,
  onNavigateToCAPA,
  onNavigateToExcelReport,
}) => {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'All' | 'GREEN' | 'YELLOW' | 'RED' | 'NOT_ASSESSED'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const totalQuestions = scoreSummary.totalQuestions;
  const assessedQuestions = scoreSummary.totalAssessed;
  const completionPercentage = totalQuestions > 0 ? Math.round((assessedQuestions / totalQuestions) * 100) : 0;

  const filteredSections = sections.filter((sec) => {
    const s = scoreSummary.sectionScores[sec.id];
    if (selectedStatusFilter !== 'All' && s && s.status !== selectedStatusFilter) {
      return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const match = sec.name.toLowerCase().includes(q) || (sec.nameBn && sec.nameBn.includes(q));
      if (!match) return false;
    }
    return true;
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const overdueCapas = Object.values(audit.findings).filter((f) => {
    return (
      (f.result === 'Non-Compliant' || f.result === 'Partially Compliant') &&
      f.capaStatus !== 'Verified & Closed' &&
      f.targetCompletionDate &&
      f.targetCompletionDate < todayStr
    );
  });

  const openCapas = Object.values(audit.findings).filter(
    (f) =>
      (f.result === 'Non-Compliant' || f.result === 'Partially Compliant') &&
      f.capaStatus !== 'Verified & Closed'
  );

  return (
    <div className="space-y-6">
      {/* ============================================================== */}
      {/* 1. EXECUTIVE DASHBOARD HEADER & QUICK ACTIONS                   */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Executive Quality Management Console</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              Buyer Compliance & ISO 9001:2015 Audit Summary
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Real-time scoring and process compliance evaluation across 19 sweater manufacturing modules for{' '}
              <strong className="text-slate-800">{audit.factoryName}</strong> (Buyer: {audit.buyerName}).
            </p>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 text-xs text-slate-600">
              <span className="flex items-center">
                <strong>Audit Ref:</strong>
                <span className="font-mono text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded ml-1 font-semibold">
                  {audit.id}
                </span>
              </span>
              <span>•</span>
              <span><strong>Floor:</strong> {audit.floor}</span>
              <span>•</span>
              <span><strong>Line:</strong> {audit.module} / {audit.line}</span>
              <span>•</span>
              <span><strong>Lead Auditor:</strong> {audit.leadAuditor}</span>
              <span>•</span>
              <span><strong>Checklist Ver:</strong> {audit.checklistVersion}</span>
            </div>
          </div>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigateToAudit()}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center space-x-2 min-h-[44px] active:scale-95"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Conduct Audit (19 Sections)</span>
            </button>

            {onNavigateToExcelReport && (
              <button
                onClick={onNavigateToExcelReport}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center space-x-2 min-h-[44px] active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Excel Center (9 Sheets)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. CRITICAL FINDINGS BANNER (Mandatory Rule)                    */}
      {/* ============================================================== */}
      {scoreSummary.criticalCount > 0 && (
        <div className="bg-red-50/90 border-2 border-red-500 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 bg-red-100 rounded-xl text-red-600 shrink-0">
              <ShieldAlert className="w-6 h-6 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-red-600 text-white rounded">
                  Mandatory QMS Warning
                </span>
                <h3 className="text-sm sm:text-base font-bold text-red-950">
                  {scoreSummary.criticalCount} Critical Product Safety / Buyer Non-Compliance Detected!
                </h3>
              </div>
              <p className="mt-1 text-xs text-red-900 leading-relaxed">
                ISO 9001:2015 Clause 8.7 & buyer compliance protocol dictate that an overall high audit percentage{' '}
                <strong className="underline">never overrides</strong> a critical non-compliance (broken needle, pull-test failure, metal contamination, or child safety defect). Immediate containment and corrective action are mandatory.
              </p>

              {/* Critical Findings Chips */}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {scoreSummary.criticalFindings.map(({ item, finding }, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-white rounded-xl border border-red-200 text-xs flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">
                        {item.sectionName}: {item.question}
                      </div>
                      <div className="text-[10px] text-red-700 font-mono mt-0.5">
                        Ref: {item.buyerClause || 'Critical Clause'} • Severity: Critical
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigateToCAPA(item.id)}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-bold shrink-0 min-h-[32px] active:scale-95 transition-transform"
                    >
                      CAPA →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. FOUR EXECUTIVE KPI SUMMARY CARDS                             */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Overall Audit Score */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Overall Audit Score
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                scoreSummary.overallStatus === 'GREEN'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : scoreSummary.overallStatus === 'YELLOW'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : scoreSummary.overallStatus === 'RED'
                  ? 'bg-red-100 text-red-800 border border-red-300'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {scoreSummary.overallStatus === 'GREEN' && 'GREEN (>80%)'}
              {scoreSummary.overallStatus === 'YELLOW' && 'YELLOW (50-80%)'}
              {scoreSummary.overallStatus === 'RED' && 'RED (<50%)'}
              {scoreSummary.overallStatus === 'NOT_ASSESSED' && 'Pending'}
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-mono tabular-nums">
              {scoreSummary.overallScore !== null ? `${scoreSummary.overallScore.toFixed(1)}%` : 'N/A'}
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Pts: {scoreSummary.totalPointsEarned} / {scoreSummary.maxApplicablePoints}
            </div>
          </div>

          {/* Color Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  scoreSummary.overallStatus === 'GREEN'
                    ? 'bg-emerald-500'
                    : scoreSummary.overallStatus === 'YELLOW'
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(scoreSummary.overallScore || 0, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>0% (Red)</span>
              <span>50%</span>
              <span>80%</span>
              <span>100% (Green)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Section Status Distribution */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            19 Section Performance Rating
          </span>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <div className="text-xl font-extrabold text-emerald-700 font-mono tabular-nums">
                {scoreSummary.greenSectionsCount}
              </div>
              <div className="text-[10px] font-bold text-emerald-800 uppercase mt-0.5">Green</div>
              <div className="text-[9px] text-emerald-600 font-mono">&gt; 80%</div>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
              <div className="text-xl font-extrabold text-amber-700 font-mono tabular-nums">
                {scoreSummary.yellowSectionsCount}
              </div>
              <div className="text-[10px] font-bold text-amber-800 uppercase mt-0.5">Yellow</div>
              <div className="text-[9px] text-amber-600 font-mono">50–80%</div>
            </div>

            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-center">
              <div className="text-xl font-extrabold text-red-700 font-mono tabular-nums">
                {scoreSummary.redSectionsCount}
              </div>
              <div className="text-[10px] font-bold text-red-800 uppercase mt-0.5">Red</div>
              <div className="text-[9px] text-red-600 font-mono">&lt; 50%</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex justify-between">
            <span>Total: <strong>{sections.length} Sections</strong></span>
            <span>Unassessed: <strong>{scoreSummary.notAssessedSectionsCount}</strong></span>
          </div>
        </div>

        {/* Card 3: Checkpoint Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Checkpoint Breakdown
            </span>
            <span className="text-xs font-bold text-blue-600 font-mono">
              {assessedQuestions}/{totalQuestions} Assessed
            </span>
          </div>

          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-500" /> Compliant (100)
              </span>
              <span className="font-bold text-slate-900 font-mono tabular-nums">{scoreSummary.compliantCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center text-amber-700 font-medium">
                <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-amber-500" /> Partial (50)
              </span>
              <span className="font-bold text-slate-900 font-mono tabular-nums">{scoreSummary.partialCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center text-red-700 font-medium">
                <XCircle className="w-3.5 h-3.5 mr-1.5 text-red-500" /> Non-Compliant (0)
              </span>
              <span className="font-bold text-slate-900 font-mono tabular-nums">{scoreSummary.nonCompliantCount}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-100">
              <span>N/A Excluded: {scoreSummary.naCount}</span>
              <span>Pending: {scoreSummary.notVerifiedCount}</span>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Coverage:</span>
            <span className="font-bold text-slate-800">{completionPercentage}%</span>
          </div>
        </div>

        {/* Card 4: CAPA & Overdue Actions */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              CAPA Tracker
            </span>
            <span className="p-1 bg-amber-50 rounded text-amber-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">{openCapas.length}</div>
              <div className="text-xs font-semibold text-slate-600 mt-0.5">Open CAPAs</div>
            </div>
            <div className="p-3 bg-red-50 rounded-xl border border-red-200">
              <div className="text-2xl font-black text-red-600 font-mono tabular-nums">{overdueCapas.length}</div>
              <div className="text-xs font-semibold text-red-700 mt-0.5">Overdue</div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Pending Verification: <strong>{openCapas.filter((f) => f.capaStatus === 'Submitted for Verification').length}</strong>
            </span>
            <button
              onClick={() => onNavigateToCAPA()}
              className="text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-1 min-h-[36px]"
            >
              <span>Manage →</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. SECTION-WISE SCORECARD & SEARCH CONTROLS                    */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Touch-Scrollable Filter Chips */}
        <div className="flex overflow-x-auto pb-1 sm:pb-0 scrollbar-none touch-pan-x items-center gap-1.5 w-full sm:w-auto">
          <div className="flex items-center space-x-1.5 text-slate-500 font-semibold mr-1 shrink-0">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Filter:</span>
          </div>
          {(['All', 'GREEN', 'YELLOW', 'RED', 'NOT_ASSESSED'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-xl font-bold shrink-0 min-h-[38px] transition-all whitespace-nowrap active:scale-95 ${
                selectedStatusFilter === filter
                  ? filter === 'GREEN'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : filter === 'YELLOW'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : filter === 'RED'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {filter === 'All' && `All (${sections.length})`}
              {filter === 'GREEN' && `Green (>80%) [${scoreSummary.greenSectionsCount}]`}
              {filter === 'YELLOW' && `Yellow (50-80%) [${scoreSummary.yellowSectionsCount}]`}
              {filter === 'RED' && `Red (<50%) [${scoreSummary.redSectionsCount}]`}
              {filter === 'NOT_ASSESSED' && `Pending [${scoreSummary.notAssessedSectionsCount}]`}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search factory section..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[40px] bg-slate-50/50"
          />
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. PROCESS MODULES SCORECARD TABLE                             */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/60 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Sweater Manufacturing Process Scorecards (19 Modules)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Transparent, automated scoring per Bangladesh sweater manufacturing quality standard
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 font-mono">
            {filteredSections.length} of {sections.length} Sections
          </span>
        </div>

        {/* Mobile View: Cards */}
        <div className="block md:hidden divide-y divide-slate-100">
          {filteredSections.map((section, idx) => {
            const s = scoreSummary.sectionScores[section.id];
            const score = s?.scorePercentage ?? null;
            const status = s?.status || 'NOT_ASSESSED';

            return (
              <div key={section.id} className="p-4 space-y-3 bg-white">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                      <span className="font-mono font-bold text-slate-400">#{idx + 1}</span>
                      <h4 className="font-bold text-sm text-slate-900 truncate">{section.name}</h4>
                    </div>
                    <div className="text-[11px] text-slate-500 font-bengali truncate mt-0.5">
                      {section.nameBn}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        status === 'GREEN'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : status === 'YELLOW'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : status === 'RED'
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {status === 'GREEN' ? '>80% GREEN' : status === 'YELLOW' ? 'YELLOW' : status === 'RED' ? '<50% RED' : 'PENDING'}
                    </span>
                    <div className="font-mono font-black text-base text-slate-900 mt-0.5 tabular-nums">
                      {score !== null ? `${score.toFixed(1)}%` : 'N/A'}
                    </div>
                  </div>
                </div>

                {score !== null && (
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full ${
                        status === 'GREEN' ? 'bg-emerald-500' : status === 'YELLOW' ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(score, 100)}%` }}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 text-xs">
                  <div className="flex items-center space-x-2 text-[11px]">
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                      {s?.compliantCount || 0} Pass
                    </span>
                    <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded">
                      {s?.partialCount || 0} Partial
                    </span>
                    <span className="text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded">
                      {s?.nonCompliantCount || 0} NC
                    </span>
                    {(s?.criticalCount || 0) > 0 && (
                      <span className="text-white font-black bg-red-600 px-2 py-0.5 rounded text-[10px] animate-pulse">
                        {s?.criticalCount} CRIT
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onNavigateToAudit(section.id)}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 min-h-[44px] active:scale-95 transition-all"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200/80 text-xs">
            <thead className="bg-slate-100/70 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th scope="col" className="px-4 py-3 text-left">#</th>
                <th scope="col" className="px-4 py-3 text-left">Section Name</th>
                <th scope="col" className="px-4 py-3 text-center">Score %</th>
                <th scope="col" className="px-4 py-3 text-center">Status</th>
                <th scope="col" className="px-4 py-3 text-center">Compliant</th>
                <th scope="col" className="px-4 py-3 text-center">Partial</th>
                <th scope="col" className="px-4 py-3 text-center">Non-Compliant</th>
                <th scope="col" className="px-4 py-3 text-center">Critical</th>
                <th scope="col" className="px-4 py-3 text-center">Pending</th>
                <th scope="col" className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredSections.map((section, idx) => {
                const s = scoreSummary.sectionScores[section.id];
                const score = s?.scorePercentage ?? null;
                const status = s?.status || 'NOT_ASSESSED';

                return (
                  <tr key={section.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-slate-400 font-bold">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">
                        {section.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-bengali">
                        {section.nameBn}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-sm tabular-nums">
                      {score !== null ? `${score.toFixed(1)}%` : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          status === 'GREEN'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : status === 'YELLOW'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : status === 'RED'
                            ? 'bg-red-100 text-red-800 border border-red-300'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {status === 'GREEN' && 'GREEN'}
                        {status === 'YELLOW' && 'YELLOW'}
                        {status === 'RED' && 'RED'}
                        {status === 'NOT_ASSESSED' && 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono text-emerald-700 font-bold tabular-nums">
                      {s?.compliantCount || 0}
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono text-amber-700 font-bold tabular-nums">
                      {s?.partialCount || 0}
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono text-red-700 font-bold tabular-nums">
                      {s?.nonCompliantCount || 0}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {(s?.criticalCount || 0) > 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white animate-pulse">
                          {s?.criticalCount} CRIT
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono text-slate-400 tabular-nums">
                      {s?.notVerifiedCount || 0}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => onNavigateToAudit(section.id)}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-bold transition-all text-xs"
                      >
                        Inspect →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
