import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  User, 
  Calendar, 
  Building2, 
  FileCheck, 
  Camera, 
  Search, 
  Filter, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  ArrowRight,
  Send,
  Lock,
  Unlock
} from 'lucide-react';
import { 
  AuditRecord, 
  ChecklistItem, 
  AuditSection, 
  AuditItemFinding, 
  UserRole, 
  CAPAStatus,
  PhotoAttachment 
} from '../types/audit';

interface CAPAManagerViewProps {
  audit: AuditRecord;
  setAudit: React.Dispatch<React.SetStateAction<AuditRecord>>;
  sections: AuditSection[];
  checklistItems: ChecklistItem[];
  userRole: UserRole;
  language: 'EN' | 'BN';
  initialFindingId?: string;
  onOpenPhotoViewer: (photo: PhotoAttachment) => void;
}

export const CAPAManagerView: React.FC<CAPAManagerViewProps> = ({
  audit,
  setAudit,
  sections,
  checklistItems,
  userRole,
  language,
  initialFindingId,
  onOpenPhotoViewer,
}) => {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(initialFindingId || null);

  const todayStr = new Date().toISOString().slice(0, 10);

  // Collect all items with non-compliance or existing CAPA
  const capaItems = checklistItems.filter((item) => {
    const finding = audit.findings[item.id];
    if (!finding) return false;
    return (
      finding.result === 'Non-Compliant' ||
      finding.result === 'Partially Compliant' ||
      finding.capaStatus !== 'Open' ||
      !!finding.correctiveAction
    );
  });

  // Filter items
  const filteredCapaItems = capaItems.filter((item) => {
    const finding = audit.findings[item.id];
    if (!finding) return false;

    if (selectedStatusFilter !== 'All') {
      if (selectedStatusFilter === 'Overdue') {
        if (
          finding.capaStatus === 'Verified & Closed' ||
          !finding.targetCompletionDate ||
          finding.targetCompletionDate >= todayStr
        ) {
          return false;
        }
      } else if (finding.capaStatus !== selectedStatusFilter) {
        return false;
      }
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const match =
        item.question.toLowerCase().includes(q) ||
        item.sectionName.toLowerCase().includes(q) ||
        (finding.findingDescription && finding.findingDescription.toLowerCase().includes(q)) ||
        (finding.responsiblePerson && finding.responsiblePerson.toLowerCase().includes(q)) ||
        (finding.responsibleDepartment && finding.responsibleDepartment.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  // Handler for updating CAPA fields
  const handleUpdateCapaField = (itemId: string, field: keyof AuditItemFinding, value: any) => {
    setAudit((prev) => {
      const current = prev.findings[itemId] || {
        itemId,
        result: 'Non-Compliant',
        findingDescription: '',
        riskLevel: 'Major',
        photos: [],
        capaStatus: 'Open',
        updatedAt: new Date().toISOString(),
      };

      return {
        ...prev,
        findings: {
          ...prev.findings,
          [itemId]: {
            ...current,
            [field]: value,
            updatedAt: new Date().toISOString(),
          },
        },
        updatedAt: new Date().toISOString(),
      };
    });
  };

  // Handler for updating 5-Why array
  const handleUpdateFiveWhy = (itemId: string, index: number, text: string) => {
    const finding = audit.findings[itemId];
    const existing = finding?.fiveWhys ? [...finding.fiveWhys] : ['', '', '', '', ''];
    while (existing.length < 5) existing.push('');
    existing[index] = text;
    handleUpdateCapaField(itemId, 'fiveWhys', existing);
  };

  // Handler for status transitions
  const handleTransitionStatus = (itemId: string, nextStatus: CAPAStatus) => {
    const finding = audit.findings[itemId];
    if (!finding) return;

    if (nextStatus === 'Verified & Closed') {
      if (userRole !== 'QMS Manager' && userRole !== 'Super Administrator') {
        alert('Permission Denied: Only QMS Managers or Super Administrators can verify and close CAPA findings.');
        return;
      }
      if (!finding.correctiveAction || !finding.preventiveAction) {
        alert('Cannot close CAPA without documented corrective and preventive actions.');
        return;
      }
      handleUpdateCapaField(itemId, 'capaStatus', 'Verified & Closed');
      handleUpdateCapaField(itemId, 'verifiedBy', `${audit.leadAuditor} (QMS Lead)`);
      handleUpdateCapaField(itemId, 'verificationDate', todayStr);
    } else if (nextStatus === 'Submitted for Verification') {
      if (!finding.correctiveAction) {
        alert('Please fill out the corrective action before submitting for verification.');
        return;
      }
      handleUpdateCapaField(itemId, 'capaStatus', 'Submitted for Verification');
    } else {
      handleUpdateCapaField(itemId, 'capaStatus', nextStatus);
    }
  };

  // Add implementation photo evidence (After-Action)
  const handleAddImplementationPhoto = (
    itemId: string,
    sectionName: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target?.result as string;
        const newPhoto: PhotoAttachment = {
          id: 'PH-AFTER-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
          url: base64Url,
          caption: 'After-Action Proof: ' + file.name.replace(/\.[^/.]+$/, ''),
          type: 'After',
          questionId: itemId,
          sectionName,
          auditorName: 'Responsible Person / Verifier',
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        };

        setAudit((prev) => {
          const finding = prev.findings[itemId];
          if (!finding) return prev;
          return {
            ...prev,
            findings: {
              ...prev.findings,
              [itemId]: {
                ...finding,
                photos: [...(finding.photos || []), newPhoto],
                updatedAt: new Date().toISOString(),
              },
            },
          };
        });
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="space-y-6">
      {/* HEADER CARD */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>ISO 9001:2015 Clause 10.2 & Buyer CAPA System</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Corrective & Preventive Action (CAPA) Workflow
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
            Root cause investigation (5-Why Analysis), immediate containment, preventive actions, implementation evidence, and authorized QMS closure.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-bold">
          <span className="px-3 py-1.5 rounded-lg bg-red-100 text-red-800 border border-red-200">
            {capaItems.filter((i) => audit.findings[i.id]?.capaStatus === 'Open').length} Open
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 border border-amber-200">
            {capaItems.filter((i) => audit.findings[i.id]?.capaStatus === 'In Progress').length} In Progress
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-800 border border-blue-200">
            {capaItems.filter((i) => audit.findings[i.id]?.capaStatus === 'Submitted for Verification').length} Awaiting Verification
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
            {capaItems.filter((i) => audit.findings[i.id]?.capaStatus === 'Verified & Closed').length} Closed
          </span>
        </div>
      </div>

      {/* FILTER TABS & SEARCH */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
        <div className="flex overflow-x-auto pb-1 sm:pb-0 scrollbar-none touch-pan-x items-center gap-1.5 w-full sm:w-auto">
          <span className="text-slate-500 font-semibold mr-1 shrink-0 flex items-center">
            <Filter className="w-3.5 h-3.5 text-blue-600 mr-1" /> Status:
          </span>
          {['All', 'Open', 'In Progress', 'Submitted for Verification', 'Verified & Closed', 'Overdue'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl font-bold shrink-0 min-h-[38px] transition-all active:scale-95 whitespace-nowrap ${
                selectedStatusFilter === status
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search finding, person, department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[40px]"
          />
        </div>
      </div>

      {/* CAPA ITEMS LIST */}
      <div className="space-y-4">
        {filteredCapaItems.length === 0 ? (
          <div className="bg-white rounded-xl p-8 border border-slate-200 text-center text-slate-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-base font-bold text-slate-800">
              No active CAPA findings match the selected filter.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Non-compliant findings recorded during audit execution will automatically appear here.
            </p>
          </div>
        ) : (
          filteredCapaItems.map((item, idx) => {
            const finding = audit.findings[item.id];
            const isExpanded = expandedItemId === item.id;
            const isOverdue =
              finding.capaStatus !== 'Verified & Closed' &&
              finding.targetCompletionDate &&
              finding.targetCompletionDate < todayStr;

            const beforePhotos = (finding.photos || []).filter((p) => p.type === 'Before' || p.type === 'Observation');
            const afterPhotos = (finding.photos || []).filter((p) => p.type === 'After');

            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl border transition-all shadow-sm ${
                  item.isCritical
                    ? 'border-red-400 ring-1 ring-red-400/30'
                    : isOverdue
                    ? 'border-red-300 bg-red-50/10'
                    : 'border-slate-200'
                }`}
              >
                {/* Summary Header Accordion */}
                <div
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                  onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`p-2 rounded-lg mt-0.5 ${
                        item.isCritical
                          ? 'bg-red-600 text-white animate-pulse'
                          : finding.result === 'Non-Compliant'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      <AlertTriangle className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500">
                          CAPA-{(idx + 1).toString().padStart(3, '0')}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {item.sectionName}
                        </span>
                        {item.buyerClause && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-50 text-blue-700">
                            {item.buyerClause}
                          </span>
                        )}
                        {item.isCritical && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white">
                            CRITICAL FINDING
                          </span>
                        )}
                        {isOverdue && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white animate-pulse">
                            OVERDUE DEADLINE!
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 mt-1">
                        {item.question}
                      </h4>

                      {finding.findingDescription && (
                        <p className="text-xs text-red-700 font-medium mt-1">
                          <strong>Finding:</strong> {finding.findingDescription}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-end sm:self-center shrink-0">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        finding.capaStatus === 'Verified & Closed'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : finding.capaStatus === 'Submitted for Verification'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : finding.capaStatus === 'In Progress'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-red-100 text-red-800 border border-red-300'
                      }`}
                    >
                      {finding.capaStatus}
                    </span>

                    <button className="text-slate-400 hover:text-slate-600 p-1">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded CAPA Workflow Form */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 space-y-5 text-xs">
                    {/* SECTION 1: Immediate Containment & Responsibility */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block font-bold text-slate-800 mb-1">
                          1. Immediate Correction & Containment (Within 24 Hours):
                        </label>
                        <textarea
                          rows={2}
                          placeholder="e.g. Quarantined 14 affected garment panels; conducted handheld metal detector sweep on Machine Line 2..."
                          value={finding.correctiveAction || ''}
                          onChange={(e) =>
                            handleUpdateCapaField(item.id, 'correctiveAction', e.target.value)
                          }
                          className="w-full p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="block font-bold text-slate-800 mb-1">
                            Responsible Person & Dept:
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Md. Shahidul (Knitting Lead)"
                            value={finding.responsiblePerson || ''}
                            onChange={(e) =>
                              handleUpdateCapaField(item.id, 'responsiblePerson', e.target.value)
                            }
                            className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-800 mb-1">
                            Target Completion Date:
                          </label>
                          <input
                            type="date"
                            value={finding.targetCompletionDate || ''}
                            onChange={(e) =>
                              handleUpdateCapaField(item.id, 'targetCompletionDate', e.target.value)
                            }
                            className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:outline-none font-semibold text-slate-800"
                          />
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: 5-WHY ROOT CAUSE ANALYSIS TOOL */}
                    <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2.5">
                      <div className="flex items-center space-x-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <span>2. Structured 5-Why Root Cause Analysis:</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Ask "Why?" progressively to unearth the underlying management or process deficiency rather than stopping at human error.
                      </p>

                      {[1, 2, 3, 4, 5].map((whyNum, wIdx) => {
                        const val = finding.fiveWhys?.[wIdx] || '';
                        return (
                          <div key={whyNum} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="font-bold text-indigo-700 font-mono text-xs sm:w-16 shrink-0">
                              Why #{whyNum}:
                            </span>
                            <input
                              type="text"
                              value={val}
                              placeholder={
                                whyNum === 1
                                  ? 'Why did the non-compliance occur?'
                                  : whyNum === 5
                                  ? 'Root Cause: Underlying systemic/training deficiency...'
                                  : 'Why did that happen?'
                              }
                              onChange={(e) => handleUpdateFiveWhy(item.id, wIdx, e.target.value)}
                              className="w-full sm:flex-1 p-2.5 border border-slate-200 rounded-lg text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[40px]"
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* SECTION 3: Long-term Preventive Action */}
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">
                        3. Permanent Preventive Action Plan (Process / System Fix):
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Update machine pre-check SOP; mandate pre-shift magnetic floor sweep; conduct weekly QC calibration verification..."
                        value={finding.preventiveAction || ''}
                        onChange={(e) =>
                          handleUpdateCapaField(item.id, 'preventiveAction', e.target.value)
                        }
                        className="w-full p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    {/* SECTION 4: Photographic Proof (Before vs After) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      {/* Before Evidence */}
                      <div className="p-3 bg-white rounded-lg border border-slate-200">
                        <span className="font-bold text-slate-700 block mb-2">
                          Non-Compliance Evidence (Before-Action):
                        </span>
                        {beforePhotos.length === 0 ? (
                          <div className="text-slate-400 text-xs italic py-2">
                            No photo attached during initial audit.
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {beforePhotos.map((p) => (
                              <div
                                key={p.id}
                                className="w-16 h-16 rounded-lg overflow-hidden border border-slate-300 cursor-pointer shadow-xs"
                                onClick={() => onOpenPhotoViewer(p)}
                              >
                                <img src={p.url} alt={p.caption} className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* After Implementation Evidence */}
                      <div className="p-3 bg-white rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-emerald-800">
                            Implementation Proof (After-Action Photos):
                          </span>
                          <div className="flex items-center space-x-1.5">
                            <label className="cursor-pointer inline-flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold min-h-[40px] active:scale-95 shadow-xs">
                              <Camera className="w-3.5 h-3.5" />
                              <span>Camera</span>
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={(e) =>
                                  handleAddImplementationPhoto(item.id, item.sectionName, e)
                                }
                                className="hidden"
                              />
                            </label>
                            <label className="cursor-pointer inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold min-h-[40px] active:scale-95 shadow-xs">
                              <span>Gallery</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                  handleAddImplementationPhoto(item.id, item.sectionName, e)
                                }
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>

                        {afterPhotos.length === 0 ? (
                          <div className="text-slate-400 text-xs italic py-2">
                            No implementation proof attached yet. Attach photos demonstrating corrective action.
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {afterPhotos.map((p) => (
                              <div
                                key={p.id}
                                className="w-16 h-16 rounded-lg overflow-hidden border-2 border-emerald-400 cursor-pointer shadow-xs"
                                onClick={() => onOpenPhotoViewer(p)}
                              >
                                <img src={p.url} alt={p.caption} className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SECTION 5: Verification & Closure Authorization */}
                    <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-800">
                            4. QMS Verification & Closure Status:
                          </span>
                          {finding.verifiedBy && (
                            <span className="text-[11px] text-emerald-700 font-semibold font-mono">
                              Verified by: {finding.verifiedBy} ({finding.verificationDate})
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Findings cannot be closed by assignees alone. Authorized QMS Manager review with objective evidence is required.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
                        {/* Role-based action controls */}
                        {userRole === 'Viewer' || userRole === 'Management Viewer' ? (
                          <div className="p-2.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold flex items-center space-x-1.5 border border-slate-200">
                            <Lock className="w-3.5 h-3.5 text-slate-500" />
                            <span>Viewer Role: Read-only observation</span>
                          </div>
                        ) : (
                          <>
                            {finding.capaStatus === 'Open' && (
                              <button
                                onClick={() => handleTransitionStatus(item.id, 'In Progress')}
                                className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700 min-h-[44px] active:scale-98"
                              >
                                Mark In Progress
                              </button>
                            )}

                            {finding.capaStatus !== 'Verified & Closed' && (
                              <button
                                onClick={() => handleTransitionStatus(item.id, 'Submitted for Verification')}
                                className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-sm flex items-center justify-center space-x-1 min-h-[44px] active:scale-98"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Submit for QMS Verification</span>
                              </button>
                            )}

                            {finding.capaStatus !== 'Verified & Closed' ? (
                              (userRole === 'Admin' || userRole === 'Super Administrator' || userRole === 'QMS Manager') ? (
                                <button
                                  onClick={() => handleTransitionStatus(item.id, 'Verified & Closed')}
                                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-black hover:bg-emerald-700 shadow-sm flex items-center justify-center space-x-1.5 min-h-[44px] active:scale-98"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Verify & Close CAPA</span>
                                </button>
                              ) : (
                                <span className="text-xs text-slate-500 italic p-2 bg-slate-50 rounded-lg border border-slate-200">
                                  QMS Manager/Admin sign-off required to close
                                </span>
                              )
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span className="px-3.5 py-2 bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-300 flex items-center space-x-1 min-h-[40px]">
                                  <Lock className="w-3.5 h-3.5" />
                                  <span>Closed & Verified</span>
                                </span>
                                {(userRole === 'QMS Manager' || userRole === 'Admin' || userRole === 'Super Administrator') && (
                                  <button
                                    onClick={() => handleTransitionStatus(item.id, 'Open')}
                                    className="text-slate-400 hover:text-slate-600 underline text-xs p-2"
                                  >
                                    Reopen
                                  </button>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
