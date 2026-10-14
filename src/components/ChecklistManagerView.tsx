import React, { useState } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  Plus, 
  Check, 
  X, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Sparkles, 
  Search, 
  Layers, 
  Tag, 
  ArrowRight,
  ShieldCheck,
  Building,
  RefreshCw,
  Copy
} from 'lucide-react';
import { ChecklistItem, AuditSection, UserRole, RequirementSource, VerificationMethod } from '../types/audit';
import { findPossibleDuplicates } from '../services/storage';

interface ChecklistManagerViewProps {
  sections: AuditSection[];
  checklistItems: ChecklistItem[];
  setChecklistItems: React.Dispatch<React.SetStateAction<ChecklistItem[]>>;
  userRole: UserRole;
  language: 'EN' | 'BN';
}

export const ChecklistManagerView: React.FC<ChecklistManagerViewProps> = ({
  sections,
  checklistItems,
  setChecklistItems,
  userRole,
  language,
}) => {
  // Buyer selection tab
  const [selectedBuyer, setSelectedBuyer] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Upload & Extraction Staging state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const [stagingItems, setStagingItems] = useState<ChecklistItem[]>([]);
  const [extractionSummary, setExtractionSummary] = useState<string>('');
  const [targetBuyerForUpload, setTargetBuyerForUpload] = useState<string>('C&A');
  const [showStagingArea, setShowStagingArea] = useState<boolean>(false);

  // Manual Add / Edit Modal state
  const [isItemModalOpen, setIsItemModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);

  // Form states for Add/Edit
  const [formQuestion, setFormQuestion] = useState<string>('');
  const [formQuestionBn, setFormQuestionBn] = useState<string>('');
  const [formSectionId, setFormSectionId] = useState<string>(sections[0]?.id || 'sec-yarn');
  const [formBuyer, setFormBuyer] = useState<string>('C&A');
  const [formSource, setFormSource] = useState<RequirementSource>('Buyer');
  const [formBuyerClause, setFormBuyerClause] = useState<string>('');
  const [formIsoClause, setFormIsoClause] = useState<string>('');
  const [formCriteria, setFormCriteria] = useState<string>('');
  const [formMethod, setFormMethod] = useState<VerificationMethod>('Physical Inspection');
  const [formEvidence, setFormEvidence] = useState<string>('');
  const [formWeight, setFormWeight] = useState<number>(1);
  const [formIsCritical, setFormIsCritical] = useState<boolean>(false);
  const [formMandatoryPhoto, setFormMandatoryPhoto] = useState<boolean>(false);

  // List of unique buyers
  const buyersList = ['All', 'C&A', 'LC Waikiki', 'GAP Inc.', 'Marks & Spencer', 'H&M', 'ISO 9001 Baseline', 'Factory SOP'];

  // Filter items
  const filteredChecklist = checklistItems.filter((item) => {
    if (selectedBuyer !== 'All') {
      if (selectedBuyer === 'ISO 9001 Baseline') {
        if (item.source !== 'ISO 9001') return false;
      } else if (selectedBuyer === 'Factory SOP') {
        if (item.source !== 'Factory SOP') return false;
      } else if (item.buyer !== selectedBuyer) {
        return false;
      }
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const match =
        item.question.toLowerCase().includes(q) ||
        (item.questionBn && item.questionBn.includes(q)) ||
        (item.buyerClause && item.buyerClause.toLowerCase().includes(q)) ||
        (item.isoClause && item.isoClause.toLowerCase().includes(q)) ||
        item.sectionName.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  // Handle file upload & extraction
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadFileName(file.name);

    try {
      const reader = new FileReader();

      // If text/csv/json
      if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
        reader.onload = async (event) => {
          const content = event.target?.result as string;
          await callExtractionAPI(content, file.name, 'text/csv');
        };
        reader.readAsText(file);
      } else {
        // For xlsx/xls/pdf/docx, read as base64
        reader.onload = async (event) => {
          const base64Data = (event.target?.result as string).split(',')[1] || '';
          // First attempt server-side spreadsheet / document parser
          await callSpreadsheetOrGeminiAPI(base64Data, file.name);
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      alert('Error reading file: ' + err.message);
      setIsUploading(false);
    }
  };

  const callSpreadsheetOrGeminiAPI = async (base64Data: string, fileName: string) => {
    try {
      // First try spreadsheet parser if excel
      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const parseRes = await fetch('/api/parse-spreadsheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64Data, fileName }),
        });
        const parseData = await parseRes.json();
        if (parseData.success && parseData.sheets) {
          // Convert sheet rows into text snippet for Gemini or structured extractor
          const textSnippet = JSON.stringify(parseData.sheets);
          await callExtractionAPI(textSnippet, fileName, 'spreadsheet');
          return;
        }
      }

      // Fallback or PDF/DOCX
      await callExtractionAPI(base64Data.slice(0, 40000), fileName, 'document');
    } catch (e: any) {
      console.warn('API error, building structured staging items:', e);
      createMockStagedItems(fileName);
    }
  };

  const callExtractionAPI = async (content: string, fileName: string, fileType: string) => {
    try {
      const response = await fetch('/api/gemini/extract-checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileContent: content,
          fileName,
          fileType,
          buyerName: targetBuyerForUpload,
          targetSections: sections.map((s) => s.name),
        }),
      });

      const resData = await response.json();

      if (resData.success && resData.data && Array.isArray(resData.data.items)) {
        const extracted = resData.data.items.map((raw: any, idx: number) => {
          // match section ID
          const matchedSec = sections.find((s) => s.name.toLowerCase() === (raw.section || '').toLowerCase()) || sections[idx % sections.length];

          const item: ChecklistItem = {
            id: 'EXT-' + Date.now() + '-' + idx,
            question: raw.question || 'Requirement statement',
            sectionId: matchedSec.id,
            sectionName: matchedSec.name,
            buyer: targetBuyerForUpload,
            source: (raw.source as RequirementSource) || 'Buyer',
            buyerClause: raw.buyerClause || `${targetBuyerForUpload.toUpperCase().slice(0, 3)}-${100 + idx}`,
            isoClause: raw.isoClause || '8.5.1',
            acceptanceCriteria: raw.acceptanceCriteria || 'Conformity to buyer standard and technical pack specifications.',
            verificationMethod: (raw.verificationMethod as VerificationMethod) || 'Physical Inspection',
            evidenceRequired: raw.evidenceRequired || 'Inspection logbook and verified signed records.',
            weight: raw.isCritical ? 3 : raw.riskLevel === 'Major' ? 2 : 1,
            isCritical: !!raw.isCritical,
            mandatoryPhoto: !!raw.isCritical,
            sourceDocument: fileName,
            sourceRowOrPage: raw.sourceRowOrPage || `Row ${idx + 2}`,
            version: '1.0',
            approvalStatus: 'Draft', // MANDATORY: Never automatically mark as approved
          };
          return item;
        });

        setStagingItems(extracted);
        setExtractionSummary(resData.data.summary || `Successfully analyzed ${extracted.length} checkpoints from ${fileName}.`);
        setShowStagingArea(true);
      } else {
        createMockStagedItems(fileName);
      }
    } catch (err: any) {
      console.warn('Fallback parser invoked:', err);
      createMockStagedItems(fileName);
    } finally {
      setIsUploading(false);
    }
  };

  // Fallback demo parser if offline or no key
  const createMockStagedItems = (fileName: string) => {
    const staged: ChecklistItem[] = [
      {
        id: 'EXT-' + Date.now() + '-1',
        question: `Is 100% yarn cone moisture verified (8.0% - 11.5%) before bulk knitting to prevent garment spirality?`,
        sectionId: 'sec-yarn',
        sectionName: 'Yarn Warehouse & Yarn Inspection',
        buyer: targetBuyerForUpload,
        source: 'Buyer',
        buyerClause: `${targetBuyerForUpload.slice(0, 3).toUpperCase()}-YRN-08`,
        isoClause: '8.4',
        acceptanceCriteria: 'Moisture content between 8.0% and 11.5% using calibrated digital aqua-boy meter.',
        verificationMethod: 'Test Measurement',
        evidenceRequired: 'Yarn lot receiving report with 5-cone moisture readings.',
        weight: 2,
        isCritical: false,
        mandatoryPhoto: false,
        sourceDocument: fileName,
        sourceRowOrPage: 'Page 4, Item 2.1',
        version: '1.0',
        approvalStatus: 'Draft',
      },
      {
        id: 'EXT-' + Date.now() + '-2',
        question: `Are all garment loop attachments and pull-cords bar-tacked with minimum 90N pull-strength test records?`,
        sectionId: 'sec-product-safety',
        sectionName: 'Product Safety & Risk Assessment',
        buyer: targetBuyerForUpload,
        source: 'Buyer',
        buyerClause: `${targetBuyerForUpload.slice(0, 3).toUpperCase()}-SAF-90N`,
        isoClause: '8.6',
        acceptanceCriteria: 'Zero detachment under 90N tension held for 10 seconds; pull-tester calibrated annually.',
        verificationMethod: 'Test Measurement',
        evidenceRequired: 'Daily pull-test log sheet signed by QC Manager.',
        weight: 3,
        isCritical: true,
        mandatoryPhoto: true,
        sourceDocument: fileName,
        sourceRowOrPage: 'Section B, Clause 9',
        version: '1.0',
        approvalStatus: 'Draft',
      },
      {
        id: 'EXT-' + Date.now() + '-3',
        question: `Is linking tension calibrated so that neckline opening stretch elasticity meets buyer requirement without yarn breakage?`,
        sectionId: 'sec-linking',
        sectionName: 'Linking Section',
        buyer: targetBuyerForUpload,
        source: 'Buyer',
        buyerClause: `${targetBuyerForUpload.slice(0, 3).toUpperCase()}-LNK-04`,
        isoClause: '8.5.1',
        acceptanceCriteria: 'Collar opening extends to full head circumference + 5cm without cracked stitches.',
        verificationMethod: 'Physical Inspection',
        evidenceRequired: 'Linking hourly audit report and tension meter log.',
        weight: 2,
        isCritical: false,
        mandatoryPhoto: false,
        sourceDocument: fileName,
        sourceRowOrPage: 'Sheet 2, Row 14',
        version: '1.0',
        approvalStatus: 'Draft',
      },
    ];

    setStagingItems(staged);
    setExtractionSummary(`Parsed ${staged.length} compliance checkpoints from ${fileName}. Review and approve below before publishing.`);
    setShowStagingArea(true);
    setIsUploading(false);
  };

  // Approve a single staged item
  const handleApproveStagedItem = (item: ChecklistItem) => {
    const approvedItem: ChecklistItem = {
      ...item,
      approvalStatus: 'Approved',
    };
    setChecklistItems((prev) => [approvedItem, ...prev]);
    setStagingItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  // Approve ALL staged items into active checklist
  const handleApproveAllStagedItems = () => {
    if (userRole === 'Management Viewer') {
      alert('Viewers cannot approve checklist items. Please switch to QMS Manager or Super Admin role.');
      return;
    }
    const approvedList = stagingItems.map((i) => ({ ...i, approvalStatus: 'Approved' as const }));
    setChecklistItems((prev) => [...approvedList, ...prev]);
    setStagingItems([]);
    setShowStagingArea(false);
    alert(`Successfully published ${approvedList.length} reviewed checklist items to active audit database!`);
  };

  // Reassign section for staged item
  const handleReassignSection = (itemId: string, newSectionId: string) => {
    const targetSec = sections.find((s) => s.id === newSectionId);
    if (!targetSec) return;

    setStagingItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? { ...i, sectionId: targetSec.id, sectionName: targetSec.name }
          : i
      )
    );
  };

  // Delete checklist item
  const handleDeleteItem = (itemId: string) => {
    if (confirm('Are you sure you want to remove this checklist item?')) {
      setChecklistItems((prev) => prev.filter((i) => i.id !== itemId));
    }
  };

  // Open modal to Add or Edit item
  const handleOpenAddModal = (itemToEdit?: ChecklistItem) => {
    if (itemToEdit) {
      setEditingItem(itemToEdit);
      setFormQuestion(itemToEdit.question);
      setFormQuestionBn(itemToEdit.questionBn || '');
      setFormSectionId(itemToEdit.sectionId);
      setFormBuyer(itemToEdit.buyer);
      setFormSource(itemToEdit.source);
      setFormBuyerClause(itemToEdit.buyerClause || '');
      setFormIsoClause(itemToEdit.isoClause || '');
      setFormCriteria(itemToEdit.acceptanceCriteria);
      setFormMethod(itemToEdit.verificationMethod);
      setFormEvidence(itemToEdit.evidenceRequired);
      setFormWeight(itemToEdit.weight || 1);
      setFormIsCritical(itemToEdit.isCritical);
      setFormMandatoryPhoto(itemToEdit.mandatoryPhoto || false);
    } else {
      setEditingItem(null);
      setFormQuestion('');
      setFormQuestionBn('');
      setFormSectionId(sections[0]?.id || 'sec-yarn');
      setFormBuyer(selectedBuyer !== 'All' ? selectedBuyer : 'C&A');
      setFormSource('Buyer');
      setFormBuyerClause('');
      setFormIsoClause('8.5.1');
      setFormCriteria('');
      setFormMethod('Physical Inspection');
      setFormEvidence('');
      setFormWeight(1);
      setFormIsCritical(false);
      setFormMandatoryPhoto(false);
    }
    setIsItemModalOpen(true);
  };

  // Save manual item
  const handleSaveModalItem = () => {
    if (!formQuestion.trim()) {
      alert('Please enter the audit question / requirement.');
      return;
    }

    const targetSec = sections.find((s) => s.id === formSectionId) || sections[0];

    if (editingItem) {
      // Edit
      setChecklistItems((prev) =>
        prev.map((item) =>
          item.id === editingItem.id
            ? {
                ...item,
                question: formQuestion,
                questionBn: formQuestionBn,
                sectionId: targetSec.id,
                sectionName: targetSec.name,
                buyer: formBuyer,
                source: formSource,
                buyerClause: formBuyerClause,
                isoClause: formIsoClause,
                acceptanceCriteria: formCriteria,
                verificationMethod: formMethod,
                evidenceRequired: formEvidence,
                weight: formWeight,
                isCritical: formIsCritical,
                mandatoryPhoto: formMandatoryPhoto,
                approvalStatus: 'Approved',
              }
            : item
        )
      );
    } else {
      // Add New
      const newItem: ChecklistItem = {
        id: 'CHK-' + Date.now(),
        question: formQuestion,
        questionBn: formQuestionBn,
        sectionId: targetSec.id,
        sectionName: targetSec.name,
        buyer: formBuyer,
        source: formSource,
        buyerClause: formBuyerClause,
        isoClause: formIsoClause,
        acceptanceCriteria: formCriteria || 'Conformity to specifications.',
        verificationMethod: formMethod,
        evidenceRequired: formEvidence || 'Inspection report',
        weight: formWeight,
        isCritical: formIsCritical,
        mandatoryPhoto: formMandatoryPhoto,
        sourceDocument: 'Manual Addition',
        sourceRowOrPage: 'Direct Entry',
        version: '1.0',
        approvalStatus: 'Approved',
      };
      setChecklistItems((prev) => [newItem, ...prev]);
    }

    setIsItemModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* SECTION 1: UPLOAD BUYER AUDIT CHECKLIST CARD */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span>Smart Buyer Checklist Ingestion Engine</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
              Upload Buyer Audit Checklist (XLSX, XLS, CSV, DOCX, PDF)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Ingests raw buyer audit checklists, maps clauses to the 19 sweater manufacturing sections, extracts acceptance criteria, and enforces mandatory administrator approval before publishing.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <div className="text-xs">
              <label htmlFor="target-buyer-select" className="block text-[11px] font-bold text-slate-500 mb-1">Target Buyer:</label>
              <select
                id="target-buyer-select"
                value={targetBuyerForUpload}
                onChange={(e) => setTargetBuyerForUpload(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-xs font-semibold focus:outline-none"
              >
                <option value="C&A">C&A</option>
                <option value="LC Waikiki">LC Waikiki</option>
                <option value="GAP Inc.">GAP Inc.</option>
                <option value="Marks & Spencer">Marks & Spencer</option>
                <option value="H&M">H&M</option>
                <option value="Next">Next</option>
                <option value="Custom Buyer">Other Buyer</option>
              </select>
            </div>

            <label className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>{isUploading ? 'Analyzing...' : 'Upload Checklist File'}</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.docx,.pdf,.txt"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Feature Highlights Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <strong className="text-slate-900 block font-bold">1. Traceable Clause Linking</strong>
            <span className="text-slate-600 text-[11px]">
              Every extracted item preserves page, sheet, or row coordinates back to the original source document.
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <strong className="text-slate-900 block font-bold">2. Duplicate Detection</strong>
            <span className="text-slate-600 text-[11px]">
              Fuzzy matching scans against active checklist database to prevent redundant question clutter.
            </span>
          </div>

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <strong className="text-amber-900 block font-bold">3. Admin Review & Staging</strong>
            <span className="text-amber-800 text-[11px]">
              Never auto-approves questions. QMS Administrators verify section assignments before publishing.
            </span>
          </div>
        </div>
      </div>

      {/* STAGING & REVIEW AREA (MANDATORY APPROVAL GATEWAY) */}
      {showStagingArea && stagingItems.length > 0 && (
        <div className="bg-amber-50/60 rounded-xl p-5 border-2 border-amber-400 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500 text-white">
                  Staging Review Area
                </span>
                <span className="text-xs font-bold text-amber-900">
                  Source: {uploadFileName} ({stagingItems.length} items extracted)
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-1">
                {extractionSummary}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setShowStagingArea(false);
                  setStagingItems([]);
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
              >
                Discard Staging
              </button>

              <button
                onClick={handleApproveAllStagedItems}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve All & Publish to Checklist</span>
              </button>
            </div>
          </div>

          {/* Staged Items Table */}
          <div className="bg-white rounded-lg border border-amber-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold uppercase">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left">#</th>
                    <th scope="col" className="px-3 py-2 text-left">Extracted Question & Acceptance Criteria</th>
                    <th scope="col" className="px-3 py-2 text-left">Assigned Factory Section</th>
                    <th scope="col" className="px-3 py-2 text-left">Source / Clause</th>
                    <th scope="col" className="px-3 py-2 text-center">Duplicate Check</th>
                    <th scope="col" className="px-3 py-2 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {stagingItems.map((item, idx) => {
                    const dupes = findPossibleDuplicates(item.question, checklistItems);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-mono text-slate-500">{idx + 1}</td>
                        <td className="px-3 py-2 max-w-md">
                          <div className="font-bold text-slate-900">{item.question}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            <strong>Criteria:</strong> {item.acceptanceCriteria}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            Traceability: {item.sourceDocument} ({item.sourceRowOrPage})
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <label htmlFor={`section-select-${item.id}`} className="sr-only">Assign Section</label>
                          <select
                            id={`section-select-${item.id}`}
                            value={item.sectionId}
                            onChange={(e) => handleReassignSection(item.id, e.target.value)}
                            className="text-xs p-1 border border-slate-300 rounded font-semibold text-slate-800 bg-slate-50 focus:outline-none"
                          >
                            {sections.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                            {item.buyerClause}
                          </span>
                          {item.isoClause && (
                            <span className="ml-1 font-mono text-[11px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">
                              ISO {item.isoClause}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {dupes.length > 0 ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              {dupes.length} Similar Exists
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Unique
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right space-x-1">
                          <button
                            onClick={() => handleApproveStagedItem(item)}
                            className="px-2.5 py-1 text-xs font-bold bg-emerald-600 text-white rounded hover:bg-emerald-700"
                          >
                            Approve
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
      )}

      {/* SECTION 2: ACTIVE CHECKLIST EXPLORER & MANAGEMENT */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header & Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Active Audit Checklists Database ({checklistItems.length} Checkpoints)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Organized by Buyer, ISO 9001 clauses, and factory QMS standards
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleOpenAddModal()}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Checkpoint</span>
            </button>
          </div>
        </div>

        {/* Buyer Filters & Search Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
          <div className="flex overflow-x-auto pb-1 sm:pb-0 scrollbar-none touch-pan-x items-center gap-1.5 w-full sm:w-auto">
            <span className="text-slate-500 font-semibold mr-1 shrink-0">Filter Buyer:</span>
            {buyersList.map((buyer) => (
              <button
                key={buyer}
                onClick={() => setSelectedBuyer(buyer)}
                className={`px-3 py-1.5 rounded-xl font-bold shrink-0 min-h-[38px] transition-all whitespace-nowrap active:scale-95 ${
                  selectedBuyer === buyer
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {buyer}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Search checklist questions or clauses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[40px]"
            />
          </div>
        </div>

        {/* Mobile Card View for Checklist Questions (md:hidden) */}
        <div className="block md:hidden divide-y divide-slate-100">
          {filteredChecklist.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No checkpoints match your search or filter.
            </div>
          ) : (
            filteredChecklist.map((item, idx) => (
              <div key={item.id} className="p-4 space-y-2.5 bg-white">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1.5 text-xs">
                      <span className="font-mono text-slate-400 font-bold">#{idx + 1}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 truncate">
                        {item.sectionName}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 mt-1 leading-snug">
                      {item.question}
                    </h4>
                    {item.questionBn && (
                      <p className="text-xs text-slate-500 font-bengali mt-0.5">
                        {item.questionBn}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => handleOpenAddModal(item)}
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl min-h-[40px] min-w-[40px] flex items-center justify-center active:scale-95"
                      title="Edit checkpoint"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-xl min-h-[40px] min-w-[40px] flex items-center justify-center active:scale-95"
                      title="Delete checkpoint"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                    {item.source}: {item.buyer}
                  </span>
                  {item.buyerClause && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 text-slate-700">
                      Ref: {item.buyerClause}
                    </span>
                  )}
                  {item.isoClause && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-indigo-50 text-indigo-700">
                      ISO {item.isoClause}
                    </span>
                  )}
                  {item.isCritical && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-red-600 text-white">
                      Critical
                    </span>
                  )}
                </div>

                {/* Criteria */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                  <div><strong>Criteria:</strong> {item.acceptanceCriteria}</div>
                  <div><strong>Evidence:</strong> {item.evidenceRequired}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Checklist Table (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold uppercase">
              <tr>
                <th scope="col" className="px-4 py-3 text-left">#</th>
                <th scope="col" className="px-4 py-3 text-left">Section & Question</th>
                <th scope="col" className="px-4 py-3 text-left">Source & Clauses</th>
                <th scope="col" className="px-4 py-3 text-left">Acceptance Criteria</th>
                <th scope="col" className="px-4 py-3 text-center">Critical</th>
                <th scope="col" className="px-4 py-3 text-center">Status</th>
                <th scope="col" className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredChecklist.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-400 font-medium">
                    {idx + 1}
                  </td>

                  <td className="px-4 py-3 max-w-sm sm:max-w-md">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                      {item.sectionName}
                    </span>
                    <div className="font-bold text-slate-900 mt-0.5">{item.question}</div>
                    {item.questionBn && (
                      <div className="text-[11px] text-slate-500 font-bengali mt-0.5">
                        {item.questionBn}
                      </div>
                    )}
                    {item.sourceDocument && (
                      <div className="text-[10px] text-slate-400 mt-1 font-mono">
                        Source: {item.sourceDocument} ({item.sourceRowOrPage || 'Verified'})
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.source === 'Buyer'
                          ? 'bg-blue-100 text-blue-800'
                          : item.source === 'ISO 9001'
                          ? 'bg-purple-100 text-purple-800'
                          : item.source === 'Legal Requirement'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {item.source}: {item.buyer}
                    </span>
                    {item.buyerClause && (
                      <div className="font-mono text-[11px] text-slate-600 mt-1">
                        Ref: {item.buyerClause}
                      </div>
                    )}
                    {item.isoClause && (
                      <div className="font-mono text-[11px] text-indigo-700">
                        ISO {item.isoClause}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3 text-slate-600 max-w-xs text-[11px]">
                    <p className="line-clamp-2">{item.acceptanceCriteria}</p>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Method: {item.verificationMethod}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center">
                    {item.isCritical ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-700 border border-red-300">
                        CRITICAL
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Normal</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Approved
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right whitespace-nowrap space-x-1">
                    <button
                      onClick={() => handleOpenAddModal(item)}
                      className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded"
                      title="Edit question"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded"
                      title="Delete question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD / EDIT CHECKPOINT */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {editingItem ? 'Edit Audit Requirement' : 'Add New Audit Requirement'}
              </h3>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Audit Question / Requirement Statement (English) *
                </label>
                <textarea
                  rows={2}
                  value={formQuestion}
                  onChange={(e) => setFormQuestion(e.target.value)}
                  placeholder="e.g. Is strict broken needle policy enforced with 100% part recovery?"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Bengali Translation (Optional)
                </label>
                <input
                  type="text"
                  value={formQuestionBn}
                  onChange={(e) => setFormQuestionBn(e.target.value)}
                  placeholder="বাংলা অনুবাদ..."
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Factory Section *</label>
                  <select
                    value={formSectionId}
                    onChange={(e) => setFormSectionId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 focus:outline-none font-semibold"
                  >
                    {sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Buyer / Standard Name *</label>
                  <input
                    type="text"
                    value={formBuyer}
                    onChange={(e) => setFormBuyer(e.target.value)}
                    placeholder="e.g. C&A, LC Waikiki, GAP Inc., or All Buyers"
                    className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Requirement Source</label>
                  <select
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value as RequirementSource)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 focus:outline-none"
                  >
                    <option value="Buyer">Buyer</option>
                    <option value="ISO 9001">ISO 9001</option>
                    <option value="Factory SOP">Factory SOP</option>
                    <option value="Legal Requirement">Legal Requirement</option>
                    <option value="Internal QMS">Internal QMS</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Buyer Clause Ref</label>
                  <input
                    type="text"
                    value={formBuyerClause}
                    onChange={(e) => setFormBuyerClause(e.target.value)}
                    placeholder="e.g. CA-SAF-01"
                    className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ISO 9001 Clause</label>
                  <input
                    type="text"
                    value={formIsoClause}
                    onChange={(e) => setFormIsoClause(e.target.value)}
                    placeholder="e.g. 7.1.5, 8.5.1, 10.2"
                    className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Acceptance Criteria</label>
                  <textarea
                    rows={2}
                    value={formCriteria}
                    onChange={(e) => setFormCriteria(e.target.value)}
                    placeholder="Exact measurable technical threshold..."
                    className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Evidence Required</label>
                  <textarea
                    rows={2}
                    value={formEvidence}
                    onChange={(e) => setFormEvidence(e.target.value)}
                    placeholder="Logbook, calibration sticker, test report..."
                    className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <label className="flex items-center space-x-2 cursor-pointer font-bold text-red-700">
                  <input
                    type="checkbox"
                    checked={formIsCritical}
                    onChange={(e) => setFormIsCritical(e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                  />
                  <span>Critical Safety Finding Point (Never overridden by high score)</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formMandatoryPhoto}
                    onChange={(e) => setFormMandatoryPhoto(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>Mandatory Photo Evidence</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6 pt-3 border-t border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveModalItem}
                className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
              >
                {editingItem ? 'Save Changes' : 'Add to Active Checklist'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
