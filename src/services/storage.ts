import { AuditRecord, AuditSection, ChecklistItem, UserRole } from '../types/audit';
import { DEFAULT_SWEATER_SECTIONS } from '../data/defaultSections';
import { DEFAULT_CHECKLIST_ITEMS } from '../data/defaultChecklists';
import { calculateAuditScores } from './scoringEngine';

const STORAGE_KEYS = {
  SECTIONS: 'sweater_audit_sections_v2',
  CHECKLISTS: 'sweater_audit_checklists_v2',
  AUDITS: 'sweater_audit_records_v2',
  ACTIVE_AUDIT_ID: 'sweater_active_audit_id_v2',
  USER_ROLE: 'sweater_user_role_v2',
  LANGUAGE: 'sweater_app_language_v2',
};

// Create an initial sample audit for demonstration if none exists
export function createDefaultSampleAudit(sections: AuditSection[], items: ChecklistItem[]): AuditRecord {
  const auditId = 'AUD-BD-2026-001';
  const initialFindings: Record<string, any> = {};

  // Preset realistic findings for demonstration:
  // - High score in most sections
  // - A non-compliance in Needle & Sharp Tools (Broken needle policy) to test Critical Finding visibility
  // - A partial compliance in Washing section
  items.forEach((item) => {
    if (item.id === 'item-needle-01') {
      initialFindings[item.id] = {
        itemId: item.id,
        result: 'Non-Compliant',
        riskLevel: 'Critical',
        findingDescription: 'Operator found with broken needle tip missing 1 fragment; broken needle log not countersigned by floor QMS supervisor for morning shift.',
        photos: [
          {
            id: 'ph-demo-1',
            url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
            caption: 'Broken needle log card missing 1.2mm tip fragment on Machine #K-14',
            evidenceNotes: 'Knitting Line 02, Flat knitting 12GG',
            type: 'Before',
            questionId: item.id,
            sectionName: item.sectionName,
            auditorName: 'Engr. Robiul Islam (Lead QMS)',
            timestamp: '2026-10-14 10:15 BST',
          },
        ],
        correctiveAction: 'Immediate 100% quarantine of 14 panels knitted in that batch. Handheld metal detector scan conducted on surrounding 5 machines. 9-piece collection verified.',
        rootCause: 'Operator failed to notify line technician immediately upon needle deflection.',
        fiveWhys: [
          'Why did broken needle fragment go missing? Operator threw partial shank in waste bin.',
          'Why did operator throw it? Rush to meet hourly output target.',
          'Why was operator unaware? Induction training not refreshed within last 6 months.',
          'Why was refresher delayed? Line was reconfigured for new buyer style without QC sign-off.',
          'Root Cause: Lack of pre-production needle policy refresher during style changeover.',
        ],
        preventiveAction: 'Mandatory daily morning toolbox meeting on needle exchange policy. Implement magnetic sweeping wand at knitting floor.',
        responsiblePerson: 'Md. Shahidul Alam',
        responsibleDepartment: 'Knitting Maintenance & QC',
        targetCompletionDate: '2026-10-18',
        capaStatus: 'In Progress',
        auditorRemarks: 'Critical finding flagged for urgent QMS Manager review. All quarantined panels cleared after 9-point detector pass.',
        updatedAt: new Date().toISOString(),
      };
    } else if (item.id === 'item-washing-02') {
      initialFindings[item.id] = {
        itemId: item.id,
        result: 'Partially Compliant',
        riskLevel: 'Major',
        findingDescription: 'Rinse bath pH test recorded manually at 7.8 (slightly above 7.5 target limit) due to delayed citric acid neutralizing buffer.',
        photos: [],
        correctiveAction: 'Re-rinse batch with 0.5g/L organic neutralizing buffer; re-tested at pH 6.6.',
        rootCause: 'Digital pH meter calibration electrode had dried buffer solution.',
        fiveWhys: [
          'Why was pH 7.8? Insufficient neutralizing agent in rinse bath.',
          'Why was it under-dosed? Automatic dispenser valve clogged with residue.',
          'Root Cause: Preventive maintenance on chemical dispenser overdue by 4 days.',
        ],
        preventiveAction: 'Weekly descaling of auto dispenser pipelines and daily 2-point buffer calibration of pH meter.',
        responsiblePerson: 'Engr. Tanvir Ahmed',
        responsibleDepartment: 'Washing Department',
        targetCompletionDate: '2026-10-20',
        capaStatus: 'Open',
        auditorRemarks: 'Corrective action verified on re-wash batch; preventive schedule needs revision.',
        updatedAt: new Date().toISOString(),
      };
    } else if (item.id === 'item-doc-01') {
      initialFindings[item.id] = {
        itemId: item.id,
        result: 'Partially Compliant',
        riskLevel: 'Minor',
        findingDescription: 'One obsolete tech-pack revision (Rev 2) was found beside the sample room board alongside active Rev 3.',
        photos: [],
        correctiveAction: 'Immediately collected and stamped with red OBSOLETE stamp, shredded per SOP.',
        rootCause: 'Sample merchandiser did not retrieve previous hard copy upon distributing Rev 3.',
        preventiveAction: 'Enforce two-way signature in document distribution and return register.',
        responsiblePerson: 'Nasrin Sultana',
        responsibleDepartment: 'Sample & Tech Pack Control',
        targetCompletionDate: '2026-10-16',
        capaStatus: 'Submitted for Verification',
        auditorRemarks: 'Replaced with Rev 3 copy immediately.',
        updatedAt: new Date().toISOString(),
      };
    } else {
      // Default to Compliant for realistic demo
      initialFindings[item.id] = {
        itemId: item.id,
        result: 'Compliant',
        findingDescription: 'Verified and found fully in compliance with standard operating requirements.',
        riskLevel: 'Minor',
        photos: [],
        capaStatus: 'Open',
        updatedAt: new Date().toISOString(),
      };
    }
  });

  const scores = calculateAuditScores(sections, items, initialFindings);

  return {
    id: auditId,
    title: 'C&A Comprehensive Buyer Compliance & ISO 9001 Technical Audit',
    factoryName: 'Apex Sweater Mills Limited',
    factoryLocation: 'Board Bazar, Gazipur, Bangladesh',
    auditType: 'Buyer Compliance Audit',
    buyerName: 'C&A',
    checklistVersion: 'C&A QMS Rev 4.2 / ISO 9001:2015',
    auditDate: '2026-10-14',
    auditTime: '09:30 BST',
    floor: 'Floor 3 (Knitting & Linking)',
    module: 'Module B - Fine Gauge Sweaters',
    line: 'Line 02 & 04 (12GG Shima Seiki)',
    orderOrPoNumber: 'PO-884210 / Order CA-SW-2026',
    styleNumber: 'STY-SW-8890 (Men Crewneck Cotton/Cashmere)',
    yarnLotNumber: 'LOT-DK-894 (100% BCI Combed Cotton 2/28 Nm)',
    leadAuditor: 'Engr. Robiul Islam (Lead QMS Auditor)',
    coAuditor: 'Nazrul Hassan (Quality Assurance Manager)',
    auditedDepartments: ['Knitting', 'Linking', 'Washing', 'QC', 'Product Safety'],
    status: 'In Progress',
    overallScore: scores.overallScore,
    overallStatus: scores.overallStatus,
    criticalFindingsCount: scores.criticalCount,
    sectionScores: scores.sectionScores,
    findings: initialFindings,
    generalRemarks: 'Overall manufacturing discipline is strong with excellent 5S and calibrated equipment. However, 1 CRITICAL finding regarding broken needle accountability requires immediate senior management containment.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function loadSections(): AuditSection[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SECTIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load sections from storage, using defaults:', e);
  }
  return DEFAULT_SWEATER_SECTIONS;
}

export function saveSections(sections: AuditSection[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.SECTIONS, JSON.stringify(sections));
  } catch (e) {
    console.error('Failed to save sections:', e);
  }
}

export function loadChecklistItems(): ChecklistItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHECKLISTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load checklists from storage, using defaults:', e);
  }
  return DEFAULT_CHECKLIST_ITEMS;
}

export function saveChecklistItems(items: ChecklistItem[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.CHECKLISTS, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save checklist items:', e);
  }
}

export function loadAudits(sections: AuditSection[], items: ChecklistItem[]): AuditRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDITS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load audits from storage:', e);
  }

  // Pre-seed default audit
  const defaultAudit = createDefaultSampleAudit(sections, items);
  saveAudits([defaultAudit]);
  return [defaultAudit];
}

export function saveAudits(audits: AuditRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.AUDITS, JSON.stringify(audits));
    // Asynchronously sync with server if available
    fetch('/api/audits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(audits[0]),
    }).catch(() => {
      // Offline or network error handled gracefully
    });
  } catch (e) {
    console.error('Failed to save audits:', e);
  }
}

export function loadUserRole(): UserRole {
  try {
    const role = localStorage.getItem(STORAGE_KEYS.USER_ROLE);
    if (role) return role as UserRole;
  } catch (e) {}
  return 'QMS Manager';
}

export function saveUserRole(role: UserRole) {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
  } catch (e) {}
}

export function loadLanguage(): 'EN' | 'BN' {
  try {
    const lang = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
    if (lang === 'BN' || lang === 'EN') return lang;
  } catch (e) {}
  return 'EN';
}

export function saveLanguage(lang: 'EN' | 'BN') {
  try {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  } catch (e) {}
}

/**
 * Detect possible duplicate questions (similarity check)
 */
export function findPossibleDuplicates(newQuestion: string, existingItems: ChecklistItem[]): ChecklistItem[] {
  const clean = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
  const target = clean(newQuestion);
  const targetWords = new Set(target.split(/\s+/).filter((w) => w.length > 3));

  return existingItems.filter((item) => {
    const itemClean = clean(item.question);
    if (itemClean === target) return true;
    const words = itemClean.split(/\s+/).filter((w) => w.length > 3);
    let common = 0;
    words.forEach((w) => {
      if (targetWords.has(w)) common++;
    });
    const similarity = common / Math.max(words.length, targetWords.size, 1);
    return similarity > 0.65;
  });
}
