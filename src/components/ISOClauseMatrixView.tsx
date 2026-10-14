import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Search, 
  Info,
  ExternalLink
} from 'lucide-react';
import { ISO_9001_CLAUSES } from '../data/isoClauses';
import { AuditRecord, ChecklistItem } from '../types/audit';

interface ISOClauseMatrixViewProps {
  audit: AuditRecord;
  checklistItems: ChecklistItem[];
  language: 'EN' | 'BN';
}

export const ISOClauseMatrixView: React.FC<ISOClauseMatrixViewProps> = ({
  audit,
  checklistItems,
  language,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredClauses = ISO_9001_CLAUSES.filter((c) => {
    if (searchQuery.trim() === '') return true;
    const q = searchQuery.toLowerCase();
    return (
      c.clauseNumber.includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.sweaterIndustryApplication.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-purple-600 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>ISO 9001:2015 Standard Alignment & Gap Analysis</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Sweater Manufacturing QMS ISO Matrix
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
            Traceability mapping of factory floor checkpoints to mandatory ISO 9001:2015 clauses (Clauses 4 through 10 with specific focus on 7.1.5, 7.2, 7.5, 8.5.1, 8.5.2, 8.5.4, 8.6, 8.7, 9.2, 10.2).
          </p>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search clause or technical area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none min-h-[40px] bg-slate-50/50"
          />
        </div>
      </div>

      {/* ISO Matrix Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredClauses.map((clause) => {
          // Find checklist items mapped to this clause
          const mappedItems = checklistItems.filter(
            (i) => i.isoClause && i.isoClause.includes(clause.clauseNumber)
          );

          // Find findings
          const ncItems = mappedItems.filter((i) => {
            const f = audit.findings[i.id];
            return f && (f.result === 'Non-Compliant' || f.result === 'Partially Compliant');
          });

          const compliantItems = mappedItems.filter((i) => {
            const f = audit.findings[i.id];
            return f?.result === 'Compliant';
          });

          return (
            <div
              key={clause.clauseNumber}
              className={`bg-white rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
                ncItems.length > 0 ? 'border-amber-300 bg-amber-50/10' : 'border-slate-200/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded bg-purple-100 text-purple-900 font-black font-mono text-xs">
                      Clause {clause.clauseNumber}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900">
                      {clause.title}
                    </h3>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      mappedItems.length === 0
                        ? 'bg-slate-100 text-slate-500'
                        : ncItems.length > 0
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    {mappedItems.length === 0
                      ? 'No items'
                      : ncItems.length > 0
                      ? `${ncItems.length} Finding(s)`
                      : 'Compliant'}
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-600">
                  {clause.description}
                </p>

                {/* Sweater Industry Application */}
                <div className="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs">
                  <strong className="text-slate-800 block text-[11px] uppercase tracking-wider mb-1 font-bold">
                    Sweater Factory Application:
                  </strong>
                  <span className="text-slate-600 leading-relaxed">
                    {clause.sweaterIndustryApplication}
                  </span>
                </div>
              </div>

              {/* Linked Checklist items count */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Linked Questions: <strong>{mappedItems.length}</strong> ({compliantItems.length} Compliant, {ncItems.length} Non-Compliant)
                </span>
                <span className="font-mono text-[11px] text-purple-700 font-semibold">
                  ISO 9001:2015
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
