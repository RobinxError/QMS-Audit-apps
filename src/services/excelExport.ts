import * as XLSX from 'xlsx';
import { AuditRecord, ChecklistItem, AuditSection, ReportVersion, FactorySettings } from '../types/audit';
import { ScoreSummary } from './scoringEngine';
import { ISO_9001_CLAUSES } from '../data/isoClauses';

/**
 * Generates the standardized export filename:
 * FactoryName_Buyer_AuditType_AuditDate_AuditReference.xlsx
 */
export function getStandardAuditFilename(audit: AuditRecord, suffix?: string): string {
  const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  const factory = sanitize(audit.factoryName || 'Sweater_Factory');
  const buyer = sanitize(audit.buyerName || 'Buyer');
  const type = sanitize(audit.auditType || 'QMS_Audit');
  const date = sanitize(audit.auditDate || new Date().toISOString().slice(0, 10));
  const ref = sanitize(audit.id || 'AUD');
  const part = suffix ? `_${sanitize(suffix)}` : '';
  return `${factory}_${buyer}_${type}_${date}_${ref}${part}.xlsx`;
}

/**
 * Calculates overdue days between a target date (YYYY-MM-DD) and current date
 */
export function calculateOverdueDays(targetDate?: string, isClosed?: boolean): number {
  if (isClosed || !targetDate) return 0;
  const target = new Date(targetDate);
  const now = new Date();
  // Strip time component for pure calendar day comparison
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffTime = now.getTime() - target.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

/**
 * Builds the complete 9-sheet official Management Excel Audit Workbook
 */
export function generateCompleteAuditWorkbook(
  audit: AuditRecord,
  sections: AuditSection[],
  checklistItems: ChecklistItem[],
  scoreSummary: ScoreSummary,
  factorySettings?: FactorySettings
): { workbook: XLSX.WorkBook; filename: string } {
  const wb = XLSX.utils.book_new();
  const todayStr = new Date().toISOString().slice(0, 10);

  // -------------------------------------------------------------
  // SHEET 1: EXECUTIVE SUMMARY
  // -------------------------------------------------------------
  const execSummaryRows: any[] = [
    ['SWEATER FACTORY AUDIT MANAGEMENT SYSTEM — EXECUTIVE REPORT'],
    ['REPORT TITLE:', 'BUYER COMPLIANCE & QUALITY MANAGEMENT SYSTEM (QMS) AUDIT REPORT'],
    ['CONFIDENTIALITY:', 'STRICTLY CONFIDENTIAL — FOR FACTORY MANAGEMENT & BUYER AUDIT REVIEW'],
    [''],
    ['FACTORY & AUDIT IDENTIFICATION'],
    ['Factory Legal Name:', factorySettings?.factoryName || audit.factoryName],
    ['Factory Address / Industrial Belts:', factorySettings?.factoryAddress || audit.factoryLocation],
    ['BGMEA / BKMEA Registration:', factorySettings?.registrationNumber || 'BGMEA-REG-20419'],
    ['Compliance Contact / Phone:', `${factorySettings?.contactPhone || '+880 2-9298412'} • ${factorySettings?.contactEmail || 'compliance@factory.com'}`],
    ['Official Website:', factorySettings?.website || 'N/A'],
    ['Head of Quality & Compliance:', factorySettings?.headOfQMS || audit.leadAuditor],
    ['Factory Tagline / Standard:', factorySettings?.tagline || 'ISO 9001:2015 Certified Sweater Manufacturing Facility'],
    ['Active Certifications:', factorySettings?.isoCertifications || 'ISO 9001:2015, OEKO-TEX Standard 100, WRAP Gold'],
    ['Buyer Name:', audit.buyerName],
    ['Audit Reference Number:', audit.id],
    ['Audit Date & Time:', `${audit.auditDate} ${audit.auditTime}`],
    ['Audit Type:', audit.auditType],
    ['Checklist Version & Standard:', audit.checklistVersion],
    ['Inspection Floor & Lines:', `${audit.floor} • ${audit.module} • ${audit.line}`],
    ['Order / PO Number:', audit.orderOrPoNumber || 'N/A'],
    ['Style Number & Description:', audit.styleNumber || 'N/A'],
    ['Yarn Lot Number & Details:', audit.yarnLotNumber || 'N/A'],
    ['Lead Auditor:', audit.leadAuditor],
    ['Co-Auditor / QA Manager:', audit.coAuditor || 'N/A'],
    ['Audit Approval Status:', audit.status],
    [''],
    ['EXECUTIVE PERFORMANCE METRICS'],
    [
      'Overall Audit Score:',
      scoreSummary.overallScore !== null ? `${scoreSummary.overallScore.toFixed(2)}%` : 'Not Assessed',
    ],
    ['Overall Performance Status:', scoreSummary.overallStatus],
    ['Rating Banding Standard:', 'GREEN (>80%) | YELLOW (50%–80%) | RED (<50%)'],
    ['Total Factory Sections Evaluated:', sections.length],
    ['Total Checklist Questions:', scoreSummary.totalQuestions],
    ['Total Applicable Questions:', scoreSummary.totalApplicable],
    ['Total Questions Assessed:', scoreSummary.totalAssessed],
    ['Compliant Checkpoints (100 pts):', scoreSummary.compliantCount],
    ['Partially Compliant (50 pts):', scoreSummary.partialCount],
    ['Non-Compliant Findings (0 pts):', scoreSummary.nonCompliantCount],
    ['Not Applicable Items (Excluded):', scoreSummary.naCount],
    ['Pending / Not Verified Items:', scoreSummary.notVerifiedCount],
    ['Critical Safety Findings Count:', scoreSummary.criticalCount],
    ['Critical Finding Protection Rule:', 'A high overall score never overrides critical product safety, needle policy, or child safety non-compliance.'],
    ['Green Sections (>80%):', scoreSummary.greenSectionsCount],
    ['Yellow Sections (50%–80%):', scoreSummary.yellowSectionsCount],
    ['Red Sections (<50%):', scoreSummary.redSectionsCount],
    ['Not Assessed Sections:', scoreSummary.notAssessedSectionsCount],
    [''],
    ['CAPA & CORRECTIVE ACTION STATUS'],
    [
      'Total Open CAPA Findings:',
      Object.values(audit.findings).filter((f) => (f.result === 'Non-Compliant' || f.result === 'Partially Compliant') && f.capaStatus !== 'Verified & Closed').length,
    ],
    [
      'Overdue CAPA Actions:',
      Object.values(audit.findings).filter((f) => (f.result === 'Non-Compliant' || f.result === 'Partially Compliant') && f.capaStatus !== 'Verified & Closed' && calculateOverdueDays(f.targetCompletionDate) > 0).length,
    ],
    [''],
    ['SECTION-WISE SCORECARD PREVIEW'],
    ['#', 'Audit Section Name', 'Questions', 'Score %', 'Rating Status', 'Critical Findings', 'Remarks'],
  ];

  sections.forEach((sec, idx) => {
    const s = scoreSummary.sectionScores[sec.id];
    execSummaryRows.push([
      idx + 1,
      sec.name,
      s ? s.totalQuestions : 0,
      s && s.scorePercentage !== null ? `${s.scorePercentage.toFixed(1)}%` : 'Not Assessed',
      s ? s.status : 'NOT_ASSESSED',
      s ? s.criticalCount : 0,
      s && s.criticalCount > 0 ? 'CRITICAL ATTENTION REQUIRED' : s?.status === 'GREEN' ? 'Conforming' : 'Requires CAPA',
    ]);
  });

  execSummaryRows.push(
    [''],
    ['EXECUTIVE MANAGEMENT REMARKS & INSTRUCTIONS'],
    ['Remarks:', audit.generalRemarks || 'Audit completed per Bangladesh garment export compliance standards. Management review required for open CAPA findings.'],
    ['Generated On:', `${todayStr} (Bangladesh Standard Time, BST)`],
    ['Report Engine:', 'Sweater Factory Audit Management System Pro v2.4']
  );

  const wsExec = XLSX.utils.aoa_to_sheet(execSummaryRows);
  wsExec['!cols'] = [
    { wch: 32 },
    { wch: 50 },
    { wch: 15 },
    { wch: 15 },
    { wch: 18 },
    { wch: 18 },
    { wch: 35 },
  ];
  XLSX.utils.book_append_sheet(wb, wsExec, '1. Executive Summary');

  // -------------------------------------------------------------
  // SHEET 2: SECTION-WISE SCORECARD
  // -------------------------------------------------------------
  const scorecardRows: any[] = [
    ['SWEATER FACTORY SECTION-WISE SCORECARD (19 MANUFACTURING SECTIONS)'],
    ['Factory:', audit.factoryName, 'Buyer:', audit.buyerName, 'Date:', audit.auditDate, 'Audit ID:', audit.id],
    ['Scoring Formula:', 'Section Score (%) = (Total Points Earned / Maximum Applicable Points) × 100'],
    ['Thresholds:', 'RED: < 50.00% | YELLOW: 50.00% to 80.00% | GREEN: > 80.00% | GRAY: Not Assessed'],
    [''],
    [
      'Serial No.',
      'Audit Section',
      'Total Checklist Items',
      'Applicable Items',
      'Compliant (100)',
      'Partially Compliant (50)',
      'Non-Compliant (0)',
      'Not Applicable',
      'Not Verified',
      'Points Earned',
      'Max Points',
      'Section Score (%)',
      'Performance Status',
      'Critical Findings',
      'Open CAPA',
      'Overdue CAPA',
      'Auditor Remarks',
    ],
  ];

  sections.forEach((sec, idx) => {
    const s = scoreSummary.sectionScores[sec.id];
    const secItems = checklistItems.filter((i) => i.sectionId === sec.id);
    const openCapas = secItems.filter((i) => {
      const f = audit.findings[i.id];
      return f && (f.result === 'Non-Compliant' || f.result === 'Partially Compliant') && f.capaStatus !== 'Verified & Closed';
    }).length;
    const overdueCapas = secItems.filter((i) => {
      const f = audit.findings[i.id];
      return f && (f.result === 'Non-Compliant' || f.result === 'Partially Compliant') && f.capaStatus !== 'Verified & Closed' && calculateOverdueDays(f.targetCompletionDate) > 0;
    }).length;

    scorecardRows.push([
      idx + 1,
      sec.name,
      s ? s.totalQuestions : 0,
      s ? s.applicableQuestions : 0,
      s ? s.compliantCount : 0,
      s ? s.partialCount : 0,
      s ? s.nonCompliantCount : 0,
      s ? s.naCount : 0,
      s ? s.notVerifiedCount : 0,
      s ? s.totalPointsEarned : 0,
      s ? s.maxApplicablePoints : 0,
      s && s.scorePercentage !== null ? Number(s.scorePercentage.toFixed(2)) : 'Not Assessed',
      s ? s.status : 'NOT_ASSESSED',
      s ? s.criticalCount : 0,
      openCapas,
      overdueCapas,
      s?.criticalCount && s.criticalCount > 0
        ? 'CRITICAL SAFETY DEFICIENCY: Mandatory 24h CAPA'
        : s?.status === 'GREEN'
        ? 'Meets technical operating requirements'
        : s?.status === 'YELLOW'
        ? 'Process improvement & CAPA required'
        : s?.status === 'RED'
        ? 'Unacceptable performance: Escalated to GM'
        : 'Pending evaluation',
    ]);
  });

  const wsScorecard = XLSX.utils.aoa_to_sheet(scorecardRows);
  wsScorecard['!cols'] = [
    { wch: 10 },
    { wch: 38 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 45 },
  ];
  XLSX.utils.book_append_sheet(wb, wsScorecard, '2. Section-wise Scorecard');

  // -------------------------------------------------------------
  // SHEET 3: DETAILED AUDIT CHECKLIST
  // -------------------------------------------------------------
  const checklistRows: any[] = [
    ['SWEATER FACTORY COMPREHENSIVE AUDIT CHECKLIST RESULTS'],
    ['Factory:', audit.factoryName, 'Audit Ref:', audit.id, 'Buyer:', audit.buyerName, 'Date:', audit.auditDate],
    [''],
    [
      'Audit Item ID',
      'Serial No.',
      'Buyer',
      'Section',
      'Floor / Module / Line',
      'Audit Question',
      'Requirement Description',
      'Requirement Source',
      'Buyer Clause Reference',
      'ISO 9001 Clause Reference',
      'Factory SOP Reference',
      'Acceptance Criteria',
      'Audit Result',
      'Score Points',
      'Finding Description',
      'Risk Classification',
      'Photo Evidence Reference',
      'Corrective Action',
      'Root Cause',
      'Preventive Action',
      'Responsible Person',
      'Target Completion Date',
      'Verification Status',
      'Auditor Remarks',
    ],
  ];

  checklistItems.forEach((item, idx) => {
    const finding = audit.findings[item.id];
    const result = finding?.result || 'Not Verified';
    const scoreVal = result === 'Compliant' ? 100 : result === 'Partially Compliant' ? 50 : result === 'Non-Compliant' ? 0 : result;
    const photoRefs = (finding?.photos || []).map((p) => p.id).join(', ') || (finding?.photos?.length ? `${finding.photos.length} photos` : 'None');

    checklistRows.push([
      item.id,
      idx + 1,
      item.buyer,
      item.sectionName,
      `${audit.floor} / ${audit.line}`,
      item.question,
      item.questionBn || item.question,
      item.source,
      item.buyerClause || 'N/A',
      item.isoClause ? `ISO ${item.isoClause}` : 'N/A',
      item.sourceDocument || 'SOP-QMS-01',
      item.acceptanceCriteria,
      result,
      scoreVal,
      finding?.findingDescription || (result === 'Compliant' ? 'Compliant with standard' : result === 'Not Applicable' ? `N/A: ${finding?.naJustification || 'Not applicable'}` : 'Pending review'),
      finding?.riskLevel || (item.isCritical ? 'Critical' : 'Minor'),
      photoRefs,
      finding?.correctiveAction || 'N/A',
      finding?.rootCause || 'N/A',
      finding?.preventiveAction || 'N/A',
      finding?.responsiblePerson || 'N/A',
      finding?.targetCompletionDate || 'N/A',
      finding?.capaStatus || 'Open',
      finding?.auditorRemarks || 'Verified during floor audit',
    ]);
  });

  const wsChecklist = XLSX.utils.aoa_to_sheet(checklistRows);
  wsChecklist['!cols'] = [
    { wch: 14 },
    { wch: 8 },
    { wch: 14 },
    { wch: 30 },
    { wch: 22 },
    { wch: 45 },
    { wch: 30 },
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
    { wch: 22 },
    { wch: 38 },
    { wch: 16 },
    { wch: 12 },
    { wch: 40 },
    { wch: 14 },
    { wch: 20 },
    { wch: 30 },
    { wch: 25 },
    { wch: 25 },
    { wch: 18 },
    { wch: 15 },
    { wch: 16 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, wsChecklist, '3. Detailed Checklist');

  // -------------------------------------------------------------
  // SHEET 4: NON-COMPLIANCE FINDINGS REGISTER
  // -------------------------------------------------------------
  const ncRows: any[] = [
    ['NON-COMPLIANCE FINDINGS & DEFICIENCY REGISTER'],
    ['Factory:', audit.factoryName, 'Audit Ref:', audit.id, 'Total Findings:', scoreSummary.nonCompliantCount + scoreSummary.partialCount],
    ['Rule:', 'Critical findings must be prioritized and contained within 24 hours regardless of overall audit score.'],
    [''],
    [
      'Finding ID',
      'Finding Date',
      'Buyer',
      'Section',
      'Floor / Module / Line',
      'Audit Question',
      'Detailed Finding',
      'Requirement Reference',
      'Severity / Risk',
      'Immediate Correction',
      'Root Cause',
      'Corrective Action',
      'Preventive Action',
      'Responsible Department',
      'Responsible Person',
      'Target Date',
      'Current Status',
      'Photo Evidence Reference',
      'Verification Remarks',
    ],
  ];

  let ncIndex = 1;
  checklistItems.forEach((item) => {
    const finding = audit.findings[item.id];
    if (finding && (finding.result === 'Non-Compliant' || finding.result === 'Partially Compliant')) {
      const isCritical = item.isCritical || finding.riskLevel === 'Critical';
      const photos = (finding.photos || []).map((p) => p.id).join(', ') || 'No photos attached';

      ncRows.push([
        `NC-${ncIndex.toString().padStart(3, '0')}`,
        audit.auditDate,
        item.buyer,
        item.sectionName,
        `${audit.floor} / ${audit.line}`,
        item.question,
        finding.findingDescription || 'Non-compliance observed during factory audit.',
        `${item.buyerClause || ''} ${item.isoClause ? `(ISO ${item.isoClause})` : ''}`.trim(),
        isCritical ? 'CRITICAL' : finding.riskLevel.toUpperCase(),
        finding.correctiveAction || 'Pending immediate containment plan',
        finding.rootCause || 'Under 5-Why investigation',
        finding.correctiveAction || 'Pending corrective action',
        finding.preventiveAction || 'Pending long-term prevention controls',
        finding.responsibleDepartment || 'Production / QC',
        finding.responsiblePerson || 'Unassigned',
        finding.targetCompletionDate || 'TBD',
        finding.capaStatus,
        photos,
        finding.verificationNotes || finding.auditorRemarks || 'Pending QMS verification',
      ]);
      ncIndex++;
    }
  });

  const wsNC = XLSX.utils.aoa_to_sheet(ncRows);
  wsNC['!cols'] = [
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 28 },
    { wch: 20 },
    { wch: 40 },
    { wch: 45 },
    { wch: 20 },
    { wch: 14 },
    { wch: 32 },
    { wch: 28 },
    { wch: 32 },
    { wch: 32 },
    { wch: 20 },
    { wch: 18 },
    { wch: 14 },
    { wch: 16 },
    { wch: 22 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, wsNC, '4. Non-Compliance Register');

  // -------------------------------------------------------------
  // SHEET 5: PHOTO EVIDENCE REGISTER
  // -------------------------------------------------------------
  const photoRows: any[] = [
    ['AUDIT PHOTO EVIDENCE & INSPECTION PHOTOGRAPH REGISTER'],
    ['Factory:', audit.factoryName, 'Audit Ref:', audit.id, 'Total Attached Photos:'],
    ['Policy:', 'Supports before-action non-compliance and after-action corrective implementation proof.'],
    [''],
    [
      'Evidence ID',
      'Finding ID',
      'Audit Section',
      'Location',
      'Photo Caption',
      'Before / After Classification',
      'Uploaded By',
      'Upload Date',
      'Evidence File Reference / URI Status',
    ],
  ];

  let totalPhotos = 0;
  checklistItems.forEach((item) => {
    const finding = audit.findings[item.id];
    if (finding && finding.photos && finding.photos.length > 0) {
      finding.photos.forEach((photo) => {
        totalPhotos++;
        photoRows.push([
          photo.id,
          item.id,
          photo.sectionName || item.sectionName,
          `${audit.floor} / ${audit.line}`,
          photo.caption || 'Inspection photograph',
          photo.type || 'Observation',
          photo.auditorName || audit.leadAuditor,
          photo.timestamp || todayStr,
          photo.url ? (photo.url.startsWith('data:') ? `Embedded Base64 Image (${Math.round(photo.url.length / 1024)} KB)` : photo.url) : 'Stored in QMS Evidence Vault',
        ]);
      });
    }
  });

  photoRows[1][4] = totalPhotos;
  if (totalPhotos === 0) {
    photoRows.push(['No photo attachments recorded in this audit.', '', '', '', '', '', '', '', '']);
  }

  const wsPhotos = XLSX.utils.aoa_to_sheet(photoRows);
  wsPhotos['!cols'] = [
    { wch: 18 },
    { wch: 16 },
    { wch: 28 },
    { wch: 20 },
    { wch: 35 },
    { wch: 18 },
    { wch: 22 },
    { wch: 18 },
    { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(wb, wsPhotos, '5. Photo Evidence Register');

  // -------------------------------------------------------------
  // SHEET 6: CAPA TRACKER (WITH OVERDUE CALCULATIONS)
  // -------------------------------------------------------------
  const capaRows: any[] = [
    ['CORRECTIVE AND PREVENTIVE ACTION (CAPA) MASTER TRACKER'],
    ['Standard:', 'ISO 9001:2015 Clause 10.2 & Buyer Compliance Protocols', 'Audit Ref:', audit.id],
    ['Current Date:', todayStr, 'Timezone:', 'Bangladesh Standard Time (BST, UTC+6)'],
    [''],
    [
      'CAPA ID',
      'Finding ID',
      'Section',
      'Finding Description',
      'Root Cause Analysis (5-Why)',
      'Immediate Correction',
      'Corrective Action',
      'Preventive Action',
      'Responsible Person',
      'Assigned Department',
      'Opening Date',
      'Target Completion Date',
      'Actual Completion Date',
      'Implementation Status',
      'Verification Status',
      'Effectiveness Review',
      'Closure Date',
      'Overdue Days',
      'QMS Verifier',
      'Final Remarks',
    ],
  ];

  let capaIndex = 1;
  checklistItems.forEach((item) => {
    const finding = audit.findings[item.id];
    if (finding && (finding.result === 'Non-Compliant' || finding.result === 'Partially Compliant' || finding.correctiveAction)) {
      const isClosed = finding.capaStatus === 'Verified & Closed';
      const overdueDays = calculateOverdueDays(finding.targetCompletionDate, isClosed);
      const fiveWhysSummary = finding.fiveWhys?.filter(Boolean).join(' -> ') || finding.rootCause || 'Under review';

      capaRows.push([
        `CAPA-${capaIndex.toString().padStart(3, '0')}`,
        item.id,
        item.sectionName,
        finding.findingDescription || item.question,
        fiveWhysSummary,
        finding.correctiveAction || 'Immediate containment initiated',
        finding.correctiveAction || 'Corrective action plan assigned',
        finding.preventiveAction || 'Preventive systemic control assigned',
        finding.responsiblePerson || 'Unassigned',
        finding.responsibleDepartment || 'Knitting / Linking / Finishing',
        audit.auditDate,
        finding.targetCompletionDate || 'TBD',
        finding.verificationDate || (isClosed ? todayStr : 'Pending'),
        finding.capaStatus === 'Verified & Closed' ? 'Completed' : finding.capaStatus === 'Submitted for Verification' ? 'Under Review' : 'In Progress',
        finding.capaStatus,
        isClosed ? 'Verified Effective by QMS Lead' : 'Pending Verification',
        finding.verificationDate || (isClosed ? todayStr : 'Open'),
        isClosed ? 0 : overdueDays > 0 ? overdueDays : 'On Track',
        finding.verifiedBy || (isClosed ? audit.leadAuditor : 'Pending Verification'),
        finding.verificationNotes || finding.auditorRemarks || (isClosed ? 'Closed with objective evidence' : 'Active tracking'),
      ]);
      capaIndex++;
    }
  });

  const wsCAPA = XLSX.utils.aoa_to_sheet(capaRows);
  wsCAPA['!cols'] = [
    { wch: 12 },
    { wch: 14 },
    { wch: 28 },
    { wch: 40 },
    { wch: 35 },
    { wch: 30 },
    { wch: 30 },
    { wch: 30 },
    { wch: 18 },
    { wch: 20 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 24 },
    { wch: 14 },
    { wch: 14 },
    { wch: 20 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, wsCAPA, '6. CAPA Tracker');

  // -------------------------------------------------------------
  // SHEET 7: ISO 9001:2015 CLAUSE MAPPING
  // -------------------------------------------------------------
  const isoRows: any[] = [
    ['ISO 9001:2015 CLAUSE ALIGNMENT & COMPLIANCE MATRIX'],
    ['Scope:', 'Quality Management System Standard for Sweater Manufacturing', 'Audit:', audit.id],
    ['Key Clauses:', '7.1.5 (Resources), 7.2 (Competence), 7.5 (Docs), 8.5.1 (Production), 8.5.2 (Traceability), 8.5.4 (Preservation), 8.6 (Release), 8.7 (Nonconformity), 10.2 (CAPA)'],
    [''],
    [
      'Audit Item ID',
      'Audit Section',
      'Audit Requirement / Checkpoint',
      'ISO 9001 Clause',
      'Relevant Requirement Summary',
      'Compliance Result',
      'Finding ID',
      'Corrective Action Reference',
    ],
  ];

  checklistItems.forEach((item) => {
    const finding = audit.findings[item.id];
    const isoRef = item.isoClause || '8.5.1';
    const matchedClause = ISO_9001_CLAUSES.find((c) => c.clauseNumber === isoRef || isoRef.includes(c.clauseNumber));

    isoRows.push([
      item.id,
      item.sectionName,
      item.question,
      `Clause ${isoRef}`,
      matchedClause ? `${matchedClause.title}: ${matchedClause.sweaterIndustryApplication}` : 'Operational Control of Production Provision',
      finding?.result || 'Not Verified',
      finding?.result === 'Non-Compliant' || finding?.result === 'Partially Compliant' ? `NC-${item.id}` : 'N/A',
      finding?.correctiveAction ? 'CAPA Assigned' : 'No Action Required',
    ]);
  });

  const wsISO = XLSX.utils.aoa_to_sheet(isoRows);
  wsISO['!cols'] = [
    { wch: 14 },
    { wch: 28 },
    { wch: 45 },
    { wch: 16 },
    { wch: 50 },
    { wch: 16 },
    { wch: 14 },
    { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, wsISO, '7. ISO Clause Mapping');

  // -------------------------------------------------------------
  // SHEET 8: MANAGEMENT ACTION PLAN
  // -------------------------------------------------------------
  const actionPlanRows: any[] = [
    ['MANAGEMENT ACTION PLAN & EXECUTIVE ESCALATION REGISTER'],
    ['Factory:', audit.factoryName, 'Audit Ref:', audit.id, 'Target Audience:', 'Factory General Manager, QA Head, Production Director'],
    ['Prioritization Rule:', 'Priority 1 (Critical Safety & Product Integrity) -> Priority 2 (Major Quality & Buyer Specs) -> Priority 3 (SOP & Housekeeping)'],
    [''],
    [
      'Priority',
      'Finding ID',
      'Department',
      'Main Problem / Deficiency',
      'Risk / Business Impact',
      'Required Management Action',
      'Responsible Manager',
      'Target Date',
      'Resource Requirements',
      'Current Status',
      'Follow-up Remarks',
    ],
  ];

  let planIdx = 1;
  checklistItems.forEach((item) => {
    const finding = audit.findings[item.id];
    if (finding && (finding.result === 'Non-Compliant' || finding.result === 'Partially Compliant')) {
      const isCritical = item.isCritical || finding.riskLevel === 'Critical';
      const priority = isCritical ? 'PRIORITY 1 — CRITICAL' : finding.riskLevel === 'Major' ? 'PRIORITY 2 — HIGH' : 'PRIORITY 3 — MEDIUM';

      actionPlanRows.push([
        priority,
        `MAP-${planIdx.toString().padStart(3, '0')}`,
        finding.responsibleDepartment || item.sectionName,
        finding.findingDescription || item.question,
        isCritical
          ? 'Immediate shipment rejection risk, buyer blacklisting, product recall hazard'
          : 'Buyer audit penalty score, rework cost, customer dissatisfaction',
        finding.correctiveAction
          ? `${finding.correctiveAction} | Enforce: ${finding.preventiveAction || 'SOP compliance'}`
          : 'Initiate mandatory engineering review and re-calibration',
        finding.responsiblePerson || 'Department Head / QMS Manager',
        finding.targetCompletionDate || 'Within 7 Days',
        isCritical ? 'Dedicated QC inspector, 100% metal detector re-scan, new tool tethering' : 'Refresher training, calibration stickers',
        finding.capaStatus,
        'Escalated to GM weekly QMS review meeting',
      ]);
      planIdx++;
    }
  });

  if (planIdx === 1) {
    actionPlanRows.push([
      'N/A',
      'MAP-000',
      'All Departments',
      'No non-compliant findings detected in current audit.',
      'None',
      'Maintain standard operating discipline per ISO 9001:2015.',
      'QMS Lead',
      todayStr,
      'Standard operational resources',
      'Closed',
      'All sections conforming',
    ]);
  }

  const wsPlan = XLSX.utils.aoa_to_sheet(actionPlanRows);
  wsPlan['!cols'] = [
    { wch: 22 },
    { wch: 12 },
    { wch: 24 },
    { wch: 40 },
    { wch: 35 },
    { wch: 45 },
    { wch: 22 },
    { wch: 15 },
    { wch: 30 },
    { wch: 16 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, wsPlan, '8. Management Action Plan');

  // -------------------------------------------------------------
  // SHEET 9: AUDIT APPROVAL & SIGN-OFF
  // -------------------------------------------------------------
  const signOffRows: any[] = [
    ['AUDIT APPROVAL & FORMAL SIGN-OFF RECORD'],
    ['Factory:', audit.factoryName, 'Audit Title:', audit.title],
    ['Audit ID:', audit.id, 'Overall Audit Score:', `${scoreSummary.overallScore !== null ? scoreSummary.overallScore.toFixed(2) : 'Not Assessed'}%`, 'Status:', scoreSummary.overallStatus],
    ['Mandatory Notice:', 'This document serves as an official audit record for buyer compliance submission. Signatures verify accuracy of observations and commitment to agreed CAPA timelines.'],
    [''],
    ['1. AUDIT PREPARATION & CONDUCT'],
    ['Prepared By:', audit.leadAuditor, 'Designation:', 'Lead QMS Auditor'],
    ['Co-Auditor:', audit.coAuditor || 'N/A', 'Designation:', 'Quality Executive'],
    ['Audit Completion Date:', audit.auditDate, 'Audit Time:', audit.auditTime],
    [''],
    ['2. THREE-TIER FORMAL APPROVAL CHAIN'],
    ['Role', 'Designated Official', 'Title / Department', 'Approval Status', 'Sign-Off Date', 'Signature Verification Field'],
    [
      'Lead Auditor',
      audit.leadAuditor,
      'Lead Quality Auditor',
      'Completed & Submitted',
      audit.auditDate,
      '[ Digitally Approved / Signed by Auditor ]',
    ],
    [
      'Quality Assurance Manager',
      audit.approvedBy || 'Nazrul Hassan',
      'Head of Quality Assurance & QMS',
      audit.status === 'Approved & Published' ? 'Approved & Verified' : 'Under QMS Review',
      audit.approvalDate || todayStr,
      '[ ______________________________________ ]',
    ],
    [
      'Department Head',
      'Engr. Shahidul Islam',
      'Production & Maintenance Head',
      'CAPA Commitments Acknowledged',
      todayStr,
      '[ ______________________________________ ]',
    ],
    [
      'Factory General Manager',
      'Engr. M. A. Rahman',
      'General Manager (Operations & Compliance)',
      audit.status === 'Approved & Published' ? 'Executive Approval Granted' : 'Pending Final Sign-Off',
      audit.approvalDate || todayStr,
      '[ ______________________________________ ]',
    ],
    [''],
    ['3. EXECUTIVE SUMMARY OF MANDATORY ACTIONS'],
    ['Total Non-Compliances:', scoreSummary.nonCompliantCount + scoreSummary.partialCount],
    ['Critical Deficiencies:', scoreSummary.criticalCount],
    ['Target CAPA Verification Date:', 'All high-priority items must be verified effective within 14 calendar days.'],
    ['Final Auditor Remarks:', audit.generalRemarks || 'Audit executed with high technical rigor. Verification follow-up scheduled for next week.'],
    [''],
    ['System Seal:', 'Sweater Factory Audit Management System — Certified Export QMS Record'],
  ];

  const wsSignOff = XLSX.utils.aoa_to_sheet(signOffRows);
  wsSignOff['!cols'] = [
    { wch: 26 },
    { wch: 28 },
    { wch: 32 },
    { wch: 26 },
    { wch: 18 },
    { wch: 42 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSignOff, '9. Audit Sign-off');

  const filename = getStandardAuditFilename(audit);
  return { workbook: wb, filename };
}

/**
 * Downloads the complete 9-sheet Excel workbook
 */
export function exportAuditToExcel(
  audit: AuditRecord,
  sections: AuditSection[],
  checklistItems: ChecklistItem[],
  scoreSummary: ScoreSummary,
  factorySettings?: FactorySettings
): string {
  const { workbook, filename } = generateCompleteAuditWorkbook(audit, sections, checklistItems, scoreSummary, factorySettings);
  XLSX.writeFile(workbook, filename);
  return filename;
}

/**
 * Exports single worksheet: Section-wise Scorecard
 */
export function exportScorecardOnly(
  audit: AuditRecord,
  sections: AuditSection[],
  checklistItems: ChecklistItem[],
  scoreSummary: ScoreSummary
): string {
  const { workbook } = generateCompleteAuditWorkbook(audit, sections, checklistItems, scoreSummary);
  const singleWb = XLSX.utils.book_new();
  const sheet = workbook.Sheets['2. Section-wise Scorecard'];
  if (sheet) {
    XLSX.utils.book_append_sheet(singleWb, sheet, 'Section Scorecard');
  }
  const filename = getStandardAuditFilename(audit, 'Section_Scorecard');
  XLSX.writeFile(singleWb, filename);
  return filename;
}

/**
 * Exports single worksheet: Findings Register
 */
export function exportFindingsOnly(
  audit: AuditRecord,
  sections: AuditSection[],
  checklistItems: ChecklistItem[],
  scoreSummary: ScoreSummary
): string {
  const { workbook } = generateCompleteAuditWorkbook(audit, sections, checklistItems, scoreSummary);
  const singleWb = XLSX.utils.book_new();
  const sheet = workbook.Sheets['4. Non-Compliance Register'];
  if (sheet) {
    XLSX.utils.book_append_sheet(singleWb, sheet, 'Non-Compliance Register');
  }
  const filename = getStandardAuditFilename(audit, 'Findings_Register');
  XLSX.writeFile(singleWb, filename);
  return filename;
}

/**
 * Exports single worksheet: CAPA Tracker
 */
export function exportCapaTrackerOnly(
  audit: AuditRecord,
  sections: AuditSection[],
  checklistItems: ChecklistItem[],
  scoreSummary: ScoreSummary
): string {
  const { workbook } = generateCompleteAuditWorkbook(audit, sections, checklistItems, scoreSummary);
  const singleWb = XLSX.utils.book_new();
  const sheet = workbook.Sheets['6. CAPA Tracker'];
  if (sheet) {
    XLSX.utils.book_append_sheet(singleWb, sheet, 'CAPA Tracker');
  }
  const filename = getStandardAuditFilename(audit, 'CAPA_Tracker');
  XLSX.writeFile(singleWb, filename);
  return filename;
}
