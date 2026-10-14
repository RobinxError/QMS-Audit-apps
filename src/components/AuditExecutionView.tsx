import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  HelpCircle, 
  Clock, 
  Camera, 
  Image as ImageIcon, 
  AlertTriangle, 
  Search, 
  Filter, 
  Save, 
  CheckSquare, 
  Info,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Shield,
  Upload,
  Trash2,
  Maximize2,
  ListFilter,
  Layers,
  Sparkles,
  Lock
} from 'lucide-react';
import { 
  AuditRecord, 
  AuditSection, 
  ChecklistItem, 
  AuditResult, 
  RiskLevel, 
  PhotoAttachment, 
  UserRole 
} from '../types/audit';
import { ScoreSummary } from '../services/scoringEngine';

interface AuditExecutionViewProps {
  audit: AuditRecord;
  setAudit: React.Dispatch<React.SetStateAction<AuditRecord>>;
  sections: AuditSection[];
  checklistItems: ChecklistItem[];
  scoreSummary: ScoreSummary;
  language: 'EN' | 'BN';
  userRole: UserRole;
  selectedSectionId?: string;
  onOpenPhotoViewer: (photo: PhotoAttachment) => void;
}

export const AuditExecutionView: React.FC<AuditExecutionViewProps> = ({
  audit,
  setAudit,
  sections,
  checklistItems,
  scoreSummary,
  language,
  userRole,
  selectedSectionId: initialSectionId,
  onOpenPhotoViewer,
}) => {
  const [activeSectionId, setActiveSectionId] = useState<string>(
    initialSectionId || sections[0]?.id || 'sec-yarn'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NC' | 'CRITICAL' | 'PENDING' | 'PHOTOS'>('ALL');
  const [justificationModalItem, setJustificationModalItem] = useState<ChecklistItem | null>(null);
  const [justificationText, setJustificationText] = useState<string>('');
  const [expandedCriteriaItems, setExpandedCriteriaItems] = useState<Record<string, boolean>>({});
  const [isSectionPickerOpen, setIsSectionPickerOpen] = useState<boolean>(false);

  // Active section data & mobile navigation helpers
  const currentSectionIndex = sections.findIndex((s) => s.id === activeSectionId);
  const activeSection = sections[currentSectionIndex >= 0 ? currentSectionIndex : 0] || sections[0];
  const sectionScore = activeSection ? scoreSummary.sectionScores[activeSection.id] : null;

  const hasPrevSection = currentSectionIndex > 0;
  const hasNextSection = currentSectionIndex < sections.length - 1;
  const goToPrevSection = () => {
    if (hasPrevSection) {
      setActiveSectionId(sections[currentSectionIndex - 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  const goToNextSection = () => {
    if (hasNextSection) {
      setActiveSectionId(sections[currentSectionIndex + 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Filter items in active section
  const sectionItems = checklistItems.filter((i) => i.sectionId === activeSectionId);
  const assessedInSection = sectionItems.filter((item) => {
    const f = audit.findings[item.id];
    return f && f.result && f.result !== 'Not Verified';
  }).length;
  const sectionProgressPercent = sectionItems.length > 0 
    ? Math.round((assessedInSection / sectionItems.length) * 100) 
    : 0;

  const filteredItems = sectionItems.filter((item) => {
    const finding = audit.findings[item.id];
    const result = finding?.result || 'Not Verified';

    if (statusFilter === 'NC') {
      if (result !== 'Non-Compliant' && result !== 'Partially Compliant') return false;
    } else if (statusFilter === 'CRITICAL') {
      if (!item.isCritical) return false;
    } else if (statusFilter === 'PENDING') {
      if (result !== 'Not Verified') return false;
    } else if (statusFilter === 'PHOTOS') {
      if (!finding?.photos || finding.photos.length === 0) return false;
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const match =
        item.question.toLowerCase().includes(q) ||
        (item.questionBn && item.questionBn.includes(q)) ||
        (item.buyerClause && item.buyerClause.toLowerCase().includes(q)) ||
        (item.isoClause && item.isoClause.toLowerCase().includes(q)) ||
        item.acceptanceCriteria.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  // Toggle criteria expansion for a card
  const toggleCriteria = (itemId: string) => {
    setExpandedCriteriaItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const isViewer = userRole === 'Viewer' || userRole === 'Management Viewer';

  // Handler for updating audit result
  const handleSetResult = (item: ChecklistItem, result: AuditResult) => {
    if (isViewer) return;
    if (result === 'Not Applicable') {
      setJustificationModalItem(item);
      setJustificationText(audit.findings[item.id]?.naJustification || '');
      return;
    }

    setAudit((prev) => {
      const currentFinding = prev.findings[item.id] || {
        itemId: item.id,
        result: 'Not Verified',
        findingDescription: '',
        riskLevel: item.isCritical ? 'Critical' : 'Minor',
        photos: [],
        capaStatus: 'Open',
        updatedAt: new Date().toISOString(),
      };

      const updated = {
        ...currentFinding,
        result,
        riskLevel: result === 'Non-Compliant' && item.isCritical ? 'Critical' : currentFinding.riskLevel,
        updatedAt: new Date().toISOString(),
      };

      return {
        ...prev,
        findings: {
          ...prev.findings,
          [item.id]: updated,
        },
        updatedAt: new Date().toISOString(),
      };
    });
  };

  // Handler for saving NA Justification
  const handleSaveNAJustification = () => {
    if (!justificationModalItem) return;
    if (!justificationText.trim()) {
      alert('Mandatory Justification required when marking an audit item as Not Applicable.');
      return;
    }

    setAudit((prev) => {
      const currentFinding = prev.findings[justificationModalItem.id] || {
        itemId: justificationModalItem.id,
        result: 'Not Applicable',
        findingDescription: '',
        riskLevel: 'Minor',
        photos: [],
        capaStatus: 'Open',
        updatedAt: new Date().toISOString(),
      };

      return {
        ...prev,
        findings: {
          ...prev.findings,
          [justificationModalItem.id]: {
            ...currentFinding,
            result: 'Not Applicable',
            naJustification: justificationText,
            updatedAt: new Date().toISOString(),
          },
        },
        updatedAt: new Date().toISOString(),
      };
    });

    setJustificationModalItem(null);
    setJustificationText('');
  };

  // Handler for updating finding details
  const handleUpdateFindingField = (
    itemId: string,
    field: 'findingDescription' | 'riskLevel' | 'auditorRemarks',
    value: any
  ) => {
    if (isViewer) return;
    setAudit((prev) => {
      const currentFinding = prev.findings[itemId] || {
        itemId,
        result: 'Not Verified',
        findingDescription: '',
        riskLevel: 'Minor',
        photos: [],
        capaStatus: 'Open',
        updatedAt: new Date().toISOString(),
      };

      return {
        ...prev,
        findings: {
          ...prev.findings,
          [itemId]: {
            ...currentFinding,
            [field]: value,
            updatedAt: new Date().toISOString(),
          },
        },
        updatedAt: new Date().toISOString(),
      };
    });
  };

  // Handler for Photo Upload (supports direct camera & files)
  const handleAddPhoto = (
    itemId: string,
    sectionName: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (isViewer) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64Url = uploadEvent.target?.result as string;
        const newPhoto: PhotoAttachment = {
          id: 'PH-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
          url: base64Url,
          caption: file.name.replace(/\.[^/.]+$/, ''),
          type: 'Observation',
          questionId: itemId,
          sectionName,
          auditorName: audit.leadAuditor,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        };

        setAudit((prev) => {
          const currentFinding = prev.findings[itemId] || {
            itemId,
            result: 'Not Verified',
            findingDescription: '',
            riskLevel: 'Minor',
            photos: [],
            capaStatus: 'Open',
            updatedAt: new Date().toISOString(),
          };

          return {
            ...prev,
            findings: {
              ...prev.findings,
              [itemId]: {
                ...currentFinding,
                photos: [...(currentFinding.photos || []), newPhoto],
                updatedAt: new Date().toISOString(),
              },
            },
          };
        });
      };
      reader.readAsDataURL(file);
    });
  };

  // Handler for deleting a photo
  const handleDeletePhoto = (itemId: string, photoId: string) => {
    if (isViewer) return;
    setAudit((prev) => {
      const finding = prev.findings[itemId];
      if (!finding) return prev;
      return {
        ...prev,
        findings: {
          ...prev.findings,
          [itemId]: {
            ...finding,
            photos: finding.photos.filter((p) => p.id !== photoId),
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ============================================================== */}
      {/* 1. AUDIT CONTEXT & FACTORY METADATA HEADER                       */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 uppercase">
                Active Audit Execution
              </span>
              <span className="text-xs text-slate-500 font-mono">Ref: {audit.id}</span>
            </div>
            <h2 className="text-base sm:text-xl font-black text-slate-900 mt-1 leading-snug">
              {audit.title}
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-600">
              <span><strong>Buyer:</strong> {audit.buyerName}</span>
              <span>•</span>
              <span><strong>Floor:</strong> {audit.floor}</span>
              <span>•</span>
              <span><strong>Line:</strong> {audit.module}/{audit.line}</span>
              <span>•</span>
              <span><strong>Auditor:</strong> {audit.leadAuditor}</span>
            </div>
          </div>

          {/* Section Score Summary Badge */}
          {sectionScore && (
            <div className="flex items-center justify-between sm:justify-end space-x-3 bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200">
              <div>
                <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate max-w-[160px] sm:max-w-none">
                  {activeSection.name}
                </div>
                <div className="text-lg sm:text-2xl font-black text-slate-900 font-mono">
                  {sectionScore.scorePercentage !== null
                    ? `${sectionScore.scorePercentage.toFixed(1)}%`
                    : 'Not Assessed'}
                </div>
              </div>

              <div
                className={`px-2.5 py-1.5 rounded-lg text-xs font-black uppercase text-center border shrink-0 ${
                  sectionScore.status === 'GREEN'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : sectionScore.status === 'YELLOW'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : sectionScore.status === 'RED'
                    ? 'bg-red-100 text-red-800 border-red-300'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {sectionScore.status === 'GREEN' && 'GREEN (>80%)'}
                {sectionScore.status === 'YELLOW' && 'YELLOW (50-80%)'}
                {sectionScore.status === 'RED' && 'RED (<50%)'}
                {sectionScore.status === 'NOT_ASSESSED' && 'Pending'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. MOBILE COMPACT SECTION NAVIGATOR & PROGRESS (md:hidden)       */}
      {/* ============================================================== */}
      <div className="md:hidden bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs">
          <button
            onClick={() => setIsSectionPickerOpen(true)}
            className="flex items-center space-x-1.5 font-bold text-blue-600 hover:text-blue-800 min-h-[36px]"
          >
            <Layers className="w-4 h-4" />
            <span className="underline">Section {currentSectionIndex + 1} of {sections.length}: Choose</span>
          </button>
          
          <span className="text-[11px] font-mono text-slate-500">
            {assessedInSection} / {sectionItems.length} Checked ({sectionProgressPercent}%)
          </span>
        </div>

        {/* Section Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${sectionProgressPercent}%` }}
          />
        </div>

        {/* Active Section Title Card */}
        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <h3 className="text-xs font-black text-slate-900 truncate">
              {currentSectionIndex + 1}. {activeSection.name}
            </h3>
            <p className="text-[10px] text-slate-500 font-bengali truncate mt-0.5">
              {activeSection.nameBn}
            </p>
          </div>
          <button
            onClick={() => setIsSectionPickerOpen(true)}
            className="px-2.5 py-1 text-[11px] font-bold bg-white text-slate-700 border border-slate-300 rounded-lg shrink-0 shadow-xs"
          >
            Switch
          </button>
        </div>

        {/* Big Touch-Friendly Prev / Next Section Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={goToPrevSection}
            disabled={!hasPrevSection}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 min-h-[46px] border ${
              hasPrevSection
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 active:scale-95'
                : 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev Section</span>
          </button>

          <button
            onClick={goToNextSection}
            disabled={!hasNextSection}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 min-h-[46px] border ${
              hasNextSection
                ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm active:scale-95'
                : 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
            }`}
          >
            <span>Next Section</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. DESKTOP / TABLET HORIZONTAL SECTION BAR (hidden md:block)     */}
      {/* ============================================================== */}
      <div className="hidden md:block bg-white rounded-2xl p-3 border border-slate-200 shadow-sm overflow-x-auto scrollbar-thin">
        <div className="flex space-x-2 min-w-max">
          {sections.map((sec, idx) => {
            const sc = scoreSummary.sectionScores[sec.id];
            const isActive = sec.id === activeSectionId;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSectionId(sec.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-2 border min-h-[40px] ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <span className="font-mono text-[10px] opacity-75">{idx + 1}.</span>
                <span className="truncate max-w-[140px] sm:max-w-none">{sec.name}</span>
                {sc && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : sc.status === 'GREEN'
                        ? 'bg-emerald-100 text-emerald-800'
                        : sc.status === 'YELLOW'
                        ? 'bg-amber-100 text-amber-800'
                        : sc.status === 'RED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {sc.scorePercentage !== null ? `${sc.scorePercentage.toFixed(0)}%` : '-'}
                  </span>
                )}
                {sc && sc.criticalCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. FILTER & SEARCH WITHIN CURRENT SECTION                      */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
        {/* Horizontal Touch Scrollable Filter Chips */}
        <div className="flex overflow-x-auto pb-1 sm:pb-0 scrollbar-none touch-pan-x items-center gap-1.5 w-full sm:w-auto">
          <span className="text-slate-500 font-semibold mr-1 shrink-0 flex items-center">
            <Filter className="w-3.5 h-3.5 text-blue-600 mr-1" /> Filter:
          </span>
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold shrink-0 min-h-[34px] transition-all ${
              statusFilter === 'ALL' ? 'bg-slate-800 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({sectionItems.length})
          </button>
          <button
            onClick={() => setStatusFilter('NC')}
            className={`px-3 py-1.5 rounded-lg font-bold shrink-0 min-h-[34px] transition-all ${
              statusFilter === 'NC' ? 'bg-red-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Non-Compliant
          </button>
          <button
            onClick={() => setStatusFilter('CRITICAL')}
            className={`px-3 py-1.5 rounded-lg font-bold shrink-0 min-h-[34px] transition-all ${
              statusFilter === 'CRITICAL' ? 'bg-red-800 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Critical Only
          </button>
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3 py-1.5 rounded-lg font-bold shrink-0 min-h-[34px] transition-all ${
              statusFilter === 'PENDING' ? 'bg-slate-700 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter('PHOTOS')}
            className={`px-3 py-1.5 rounded-lg font-bold shrink-0 min-h-[34px] transition-all ${
              statusFilter === 'PHOTOS' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Has Photos
          </button>
        </div>

        <div className="w-full sm:w-72 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search clause, question, criteria..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[40px]"
          />
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. CHECKLIST ITEMS LIST — OPTIMIZED FOR MOBILE TOUCH           */}
      {/* ============================================================== */}
      <div className="space-y-3 sm:space-y-4">
        {isViewer && (
          <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl flex items-center space-x-2.5 text-xs font-semibold shadow-xs">
            <Lock className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <span className="font-bold">Viewer Access Mode:</span> You have read-only permissions to inspect checklist criteria, scores, ISO mappings, and photo evidence registers. Audit scoring and evidence uploads are disabled.
            </div>
          </div>
        )}

        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500">
            <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold">No audit checkpoints match your current filter.</p>
            <p className="text-xs text-slate-400 mt-1">Try switching filters or clearing your search query.</p>
          </div>
        ) : (
          filteredItems.map((item, idx) => {
            const finding = audit.findings[item.id] || {
              itemId: item.id,
              result: 'Not Verified',
              findingDescription: '',
              riskLevel: item.isCritical ? 'Critical' : 'Minor',
              photos: [],
              capaStatus: 'Open',
              updatedAt: new Date().toISOString(),
            };
            const result = finding.result;
            const isCriteriaExpanded = !!expandedCriteriaItems[item.id];

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border p-3.5 sm:p-5 shadow-sm transition-all ${
                  item.isCritical && (result === 'Non-Compliant' || result === 'Partially Compliant')
                    ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/10'
                    : result === 'Compliant'
                    ? 'border-emerald-200 bg-emerald-50/15'
                    : result === 'Non-Compliant'
                    ? 'border-red-200 bg-red-50/15'
                    : result === 'Partially Compliant'
                    ? 'border-amber-200 bg-amber-50/15'
                    : 'border-slate-200'
                }`}
              >
                {/* Header: Clause numbers, Source, Critical flag */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2.5 border-b border-slate-100 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      #{idx + 1}
                    </span>

                    {/* Source badge */}
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                        item.source === 'Buyer'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : item.source === 'ISO 9001'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : item.source === 'Legal Requirement'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {item.source}: {item.buyer}
                    </span>

                    {/* Buyer Clause */}
                    {item.buyerClause && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px]">
                        Ref: {item.buyerClause}
                      </span>
                    )}

                    {/* ISO 9001 Clause */}
                    {item.isoClause && (
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono text-[11px]">
                        ISO {item.isoClause}
                      </span>
                    )}
                  </div>

                  {/* Critical badge */}
                  {item.isCritical && (
                    <div className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-red-100 border border-red-300 text-red-700 font-bold text-[10px] sm:text-[11px]">
                      <AlertTriangle className="w-3 h-3 text-red-600" />
                      <span>CRITICAL CHECKPOINT</span>
                    </div>
                  )}
                </div>

                {/* Question & Technical Requirements */}
                <div className="mt-2.5">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                    {item.question}
                  </h4>
                  {item.questionBn && (
                    <p className="text-xs text-slate-500 font-bengali mt-0.5">
                      {item.questionBn}
                    </p>
                  )}

                  {/* Collapsible Criteria & Evidence Section */}
                  <div className="mt-2">
                    <button
                      onClick={() => toggleCriteria(item.id)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1 py-1"
                    >
                      <span>{isCriteriaExpanded ? 'Hide Criteria & Evidence' : 'View Criteria & Evidence'}</span>
                      {isCriteriaExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isCriteriaExpanded && (
                      <div className="mt-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1.5 animate-in fade-in duration-150">
                        <div>
                          <strong className="text-slate-900">Acceptance Criteria:</strong> {item.acceptanceCriteria}
                        </div>
                        <div>
                          <strong className="text-slate-900">Evidence Required:</strong> {item.evidenceRequired}
                        </div>
                        <div>
                          <strong className="text-slate-900">Verification Method:</strong> {item.verificationMethod}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Audit Result Buttons: Large Touch Hitboxes (≥44-48px) */}
                <div className="mt-3.5 pt-3 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto text-xs">
                      {/* Compliant */}
                      <button
                        onClick={() => handleSetResult(item, 'Compliant')}
                        className={`py-3 px-2 rounded-xl font-bold flex items-center justify-center space-x-1 sm:space-x-1.5 transition-all min-h-[48px] active:scale-95 ${
                          result === 'Compliant'
                            ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-600 ring-offset-1'
                            : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span className="truncate">Pass (100)</span>
                      </button>

                      {/* Partially Compliant */}
                      <button
                        onClick={() => handleSetResult(item, 'Partially Compliant')}
                        className={`py-3 px-2 rounded-xl font-bold flex items-center justify-center space-x-1 sm:space-x-1.5 transition-all min-h-[48px] active:scale-95 ${
                          result === 'Partially Compliant'
                            ? 'bg-amber-500 text-white shadow-md ring-2 ring-amber-500 ring-offset-1'
                            : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                        }`}
                      >
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span className="truncate">Partial (50)</span>
                      </button>

                      {/* Non-Compliant */}
                      <button
                        onClick={() => handleSetResult(item, 'Non-Compliant')}
                        className={`py-3 px-2 rounded-xl font-bold flex items-center justify-center space-x-1 sm:space-x-1.5 transition-all min-h-[48px] active:scale-95 ${
                          result === 'Non-Compliant'
                            ? 'bg-red-600 text-white shadow-md ring-2 ring-red-600 ring-offset-1'
                            : 'bg-red-50 text-red-800 hover:bg-red-100 border border-red-200'
                        }`}
                      >
                        <XCircle className="w-4 h-4 shrink-0" />
                        <span className="truncate">NC (0)</span>
                      </button>

                      {/* Not Applicable */}
                      <button
                        onClick={() => handleSetResult(item, 'Not Applicable')}
                        className={`py-2.5 px-3 rounded-xl font-semibold flex items-center justify-center space-x-1 transition-all min-h-[44px] active:scale-95 ${
                          result === 'Not Applicable'
                            ? 'bg-slate-800 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                        }`}
                        title="Excluded from score calculation (mandatory justification)"
                      >
                        <HelpCircle className="w-4 h-4 shrink-0" />
                        <span>N/A</span>
                      </button>

                      {/* Not Verified */}
                      <button
                        onClick={() => handleSetResult(item, 'Not Verified')}
                        className={`col-span-2 sm:col-auto py-2.5 px-3 rounded-xl font-semibold flex items-center justify-center space-x-1 transition-all min-h-[44px] active:scale-95 ${
                          result === 'Not Verified'
                            ? 'bg-slate-700 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                        }`}
                        title="Pending inspection"
                      >
                        <Clock className="w-4 h-4 shrink-0" />
                        <span>Pending</span>
                      </button>
                    </div>

                    {/* Risk Level Selector */}
                    {(result === 'Non-Compliant' || result === 'Partially Compliant') && (
                      <div className="flex items-center space-x-2 text-xs bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 min-h-[44px] self-start sm:self-auto">
                        <span className="font-semibold text-slate-600">Risk Severity:</span>
                        <select
                          value={finding.riskLevel}
                          onChange={(e) =>
                            handleUpdateFindingField(item.id, 'riskLevel', e.target.value as RiskLevel)
                          }
                          className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
                        >
                          <option value="Minor">Minor</option>
                          <option value="Major">Major</option>
                          <option value="Critical">Critical</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* N/A Justification preview */}
                  {result === 'Not Applicable' && finding.naJustification && (
                    <div className="mt-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                      <strong className="text-slate-900">N/A Justification:</strong> {finding.naJustification}
                    </div>
                  )}

                  {/* Finding Description & Action Details */}
                  {(result === 'Non-Compliant' || result === 'Partially Compliant' || finding.findingDescription) && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-800 mb-1">
                          Finding Description / Non-Compliance Details:
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Describe the exact factual condition observed on the sweater factory floor..."
                          value={finding.findingDescription}
                          onChange={(e) =>
                            handleUpdateFindingField(item.id, 'findingDescription', e.target.value)
                          }
                          className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-800 mb-1">
                          Auditor Remarks & Recommendations:
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Immediate containment instruction or verification notes..."
                          value={finding.auditorRemarks || ''}
                          onChange={(e) =>
                            handleUpdateFindingField(item.id, 'auditorRemarks', e.target.value)
                          }
                          className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* Photo Evidence Section with Direct Camera Trigger */}
                  <div className="mt-3 pt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600 flex items-center">
                        <ImageIcon className="w-4 h-4 text-blue-600 mr-1" />
                        Evidence Photos ({finding.photos?.length || 0}):
                      </span>

                      {/* Photo thumbnails */}
                      {finding.photos && finding.photos.map((photo) => (
                        <div
                          key={photo.id}
                          className="relative group w-12 h-12 rounded-xl overflow-hidden border border-slate-300 cursor-pointer shadow-xs active:scale-95"
                          onClick={() => onOpenPhotoViewer(photo)}
                        >
                          <img
                            src={photo.url}
                            alt={photo.caption}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePhoto(item.id, photo.id);
                            }}
                            className="absolute top-0 right-0 p-1 bg-red-600 text-white rounded-bl opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove photo"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}

                      {/* Mandatory Photo alert */}
                      {item.mandatoryPhoto && (!finding.photos || finding.photos.length === 0) && (
                        <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          Photo Mandatory
                        </span>
                      )}
                    </div>

                    {/* Camera and Upload Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Direct Rear Camera Capture Button */}
                      <label className="cursor-pointer inline-flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all min-h-[44px] active:scale-95 shadow-xs">
                        <Camera className="w-4 h-4 text-blue-600" />
                        <span>Camera</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => handleAddPhoto(item.id, item.sectionName, e)}
                          className="hidden"
                        />
                      </label>

                      {/* Device / Gallery File Upload Button */}
                      <label className="cursor-pointer inline-flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all min-h-[44px] active:scale-95 shadow-xs">
                        <Upload className="w-4 h-4 text-slate-600" />
                        <span>Gallery</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => handleAddPhoto(item.id, item.sectionName, e)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ============================================================== */}
      {/* 6. BOTTOM SECTION ADVANCE STRIP (Helps users proceed)           */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between gap-3 text-xs">
        <button
          onClick={goToPrevSection}
          disabled={!hasPrevSection}
          className={`py-2.5 px-4 rounded-xl font-bold flex items-center space-x-1.5 min-h-[44px] border ${
            hasPrevSection
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 active:scale-95'
              : 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous Section</span>
        </button>

        <span className="font-mono text-slate-500 font-bold hidden sm:inline">
          {currentSectionIndex + 1} / {sections.length} Sections
        </span>

        <button
          onClick={goToNextSection}
          disabled={!hasNextSection}
          className={`py-2.5 px-4 rounded-xl font-bold flex items-center space-x-1.5 min-h-[44px] border ${
            hasNextSection
              ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm active:scale-95'
              : 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
          }`}
        >
          <span>Next Section</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ============================================================== */}
      {/* MODAL: MOBILE FULL SECTION PICKER DRAWER                       */}
      {/* ============================================================== */}
      {isSectionPickerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex flex-col justify-end">
          <div className="flex-1" onClick={() => setIsSectionPickerOpen(false)} />
          <div className="bg-white rounded-t-3xl border-t border-slate-200 p-5 shadow-2xl max-h-[85vh] overflow-y-auto space-y-3">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto" />
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                Select Sweater Factory Section (19)
              </h3>
              <button
                onClick={() => setIsSectionPickerOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
              {sections.map((sec, idx) => {
                const sc = scoreSummary.sectionScores[sec.id];
                const isCurrent = sec.id === activeSectionId;
                return (
                  <button
                    key={sec.id}
                    onClick={() => {
                      setActiveSectionId(sec.id);
                      setIsSectionPickerOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-full text-left p-3 rounded-xl border flex items-center justify-between min-h-[50px] transition-all active:scale-98 ${
                      isCurrent
                        ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-bold truncate">
                        {idx + 1}. {sec.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-bengali truncate">
                        {sec.nameBn}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center space-x-2">
                      {sc && (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            sc.status === 'GREEN'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sc.status === 'YELLOW'
                              ? 'bg-amber-100 text-amber-800'
                              : sc.status === 'RED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {sc.scorePercentage !== null ? `${sc.scorePercentage.toFixed(0)}%` : 'Pending'}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: MANDATORY N/A JUSTIFICATION                             */}
      {/* ============================================================== */}
      {justificationModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-2 text-amber-600 mb-2">
              <HelpCircle className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900">
                Mandatory N/A Justification
              </h3>
            </div>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Per ISO 9001 and buyer compliance protocol, marking <strong>"{justificationModalItem.question}"</strong> as Not Applicable requires an operational justification (e.g. style is 100% hand-knit without dial linking, garment has no metal buttons, etc.).
            </p>

            <textarea
              rows={3}
              placeholder="State reason why this checkpoint does not apply..."
              value={justificationText}
              onChange={(e) => setJustificationText(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4"
              autoFocus
            />

            <div className="flex justify-end space-x-2 text-xs font-semibold">
              <button
                onClick={() => setJustificationModalItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNAJustification}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm min-h-[44px]"
              >
                Confirm Exclude from Score
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
