import { ChecklistItem, AuditItemFinding, SectionScore, AuditSection } from '../types/audit';

export interface ScoreSummary {
  sectionScores: Record<string, SectionScore>;
  overallScore: number | null;
  overallStatus: 'RED' | 'YELLOW' | 'GREEN' | 'NOT_ASSESSED';
  totalPointsEarned: number;
  maxApplicablePoints: number;
  totalQuestions: number;
  totalAssessed: number;
  totalApplicable: number;
  compliantCount: number;
  partialCount: number;
  nonCompliantCount: number;
  naCount: number;
  notVerifiedCount: number;
  criticalCount: number;
  criticalFindings: Array<{
    item: ChecklistItem;
    finding: AuditItemFinding;
  }>;
  redSectionsCount: number;
  yellowSectionsCount: number;
  greenSectionsCount: number;
  notAssessedSectionsCount: number;
}

/**
 * Determines score status category according to mandatory threshold:
 * RED: Below 50% (< 50)
 * YELLOW: 50% to 80% inclusive (50 <= score <= 80)
 * GREEN: Above 80% (> 80)
 */
export function getScoreStatus(score: number | null): 'RED' | 'YELLOW' | 'GREEN' | 'NOT_ASSESSED' {
  if (score === null || isNaN(score)) return 'NOT_ASSESSED';
  if (score < 50.0) return 'RED';
  if (score <= 80.0) return 'YELLOW';
  return 'GREEN';
}

/**
 * Calculates section-by-section and overall audit scores.
 */
export function calculateAuditScores(
  sections: AuditSection[],
  checklistItems: ChecklistItem[],
  findings: Record<string, AuditItemFinding>
): ScoreSummary {
  const sectionScores: Record<string, SectionScore> = {};

  let grandTotalEarnedPoints = 0;
  let grandMaxApplicablePoints = 0;
  let totalAssessed = 0;
  let totalApplicable = 0;
  let compliantCount = 0;
  let partialCount = 0;
  let nonCompliantCount = 0;
  let naCount = 0;
  let notVerifiedCount = 0;
  let criticalCount = 0;
  const criticalFindings: Array<{ item: ChecklistItem; finding: AuditItemFinding }> = [];

  let redSectionsCount = 0;
  let yellowSectionsCount = 0;
  let greenSectionsCount = 0;
  let notAssessedSectionsCount = 0;

  // Group items by section
  const itemsBySection: Record<string, ChecklistItem[]> = {};
  sections.forEach((sec) => {
    itemsBySection[sec.id] = [];
  });

  checklistItems.forEach((item) => {
    if (!itemsBySection[item.sectionId]) {
      itemsBySection[item.sectionId] = [];
    }
    itemsBySection[item.sectionId].push(item);
  });

  // Calculate score for each section
  sections.forEach((section) => {
    const items = itemsBySection[section.id] || [];
    let secEarnedPoints = 0;
    let secMaxApplicablePoints = 0;
    let secAssessed = 0;
    let secApplicable = 0;
    let secCompliant = 0;
    let secPartial = 0;
    let secNonCompliant = 0;
    let secNa = 0;
    let secNotVerified = 0;
    let secCritical = 0;

    items.forEach((item) => {
      const finding = findings[item.id];
      const result = finding?.result || 'Not Verified';
      const weight = item.weight || 1.0;

      // Track critical findings
      if (item.isCritical && (result === 'Non-Compliant' || result === 'Partially Compliant')) {
        secCritical++;
        criticalCount++;
        criticalFindings.push({ item, finding });
      }

      switch (result) {
        case 'Compliant':
          secEarnedPoints += 100 * weight;
          secMaxApplicablePoints += 100 * weight;
          secAssessed++;
          secApplicable++;
          secCompliant++;
          compliantCount++;
          break;

        case 'Partially Compliant':
          secEarnedPoints += 50 * weight;
          secMaxApplicablePoints += 100 * weight;
          secAssessed++;
          secApplicable++;
          secPartial++;
          partialCount++;
          break;

        case 'Non-Compliant':
          secEarnedPoints += 0;
          secMaxApplicablePoints += 100 * weight;
          secAssessed++;
          secApplicable++;
          secNonCompliant++;
          nonCompliantCount++;
          break;

        case 'Not Applicable':
          // Excluded from both numerator and denominator
          secNa++;
          naCount++;
          break;

        case 'Not Verified':
        default:
          // Pending verification - not counted as compliant and not in denominator until assessed
          secNotVerified++;
          notVerifiedCount++;
          break;
      }
    });

    totalAssessed += secAssessed;
    totalApplicable += secApplicable;
    grandTotalEarnedPoints += secEarnedPoints;
    grandMaxApplicablePoints += secMaxApplicablePoints;

    let scorePercentage: number | null = null;
    let status: 'RED' | 'YELLOW' | 'GREEN' | 'NOT_ASSESSED' = 'NOT_ASSESSED';

    if (secMaxApplicablePoints > 0 && secAssessed > 0) {
      scorePercentage = Math.round((secEarnedPoints / secMaxApplicablePoints) * 10000) / 100;
      status = getScoreStatus(scorePercentage);
    }

    if (status === 'RED') redSectionsCount++;
    else if (status === 'YELLOW') yellowSectionsCount++;
    else if (status === 'GREEN') greenSectionsCount++;
    else notAssessedSectionsCount++;

    sectionScores[section.id] = {
      sectionId: section.id,
      sectionName: section.name,
      totalQuestions: items.length,
      applicableQuestions: secApplicable,
      assessedQuestions: secAssessed,
      compliantCount: secCompliant,
      partialCount: secPartial,
      nonCompliantCount: secNonCompliant,
      naCount: secNa,
      notVerifiedCount: secNotVerified,
      criticalCount: secCritical,
      totalPointsEarned: secEarnedPoints,
      maxApplicablePoints: secMaxApplicablePoints,
      scorePercentage,
      status,
    };
  });

  // Calculate overall score
  let overallScore: number | null = null;
  let overallStatus: 'RED' | 'YELLOW' | 'GREEN' | 'NOT_ASSESSED' = 'NOT_ASSESSED';

  if (grandMaxApplicablePoints > 0 && totalAssessed > 0) {
    overallScore = Math.round((grandTotalEarnedPoints / grandMaxApplicablePoints) * 10000) / 100;
    overallStatus = getScoreStatus(overallScore);
  }

  return {
    sectionScores,
    overallScore,
    overallStatus,
    totalPointsEarned: grandTotalEarnedPoints,
    maxApplicablePoints: grandMaxApplicablePoints,
    totalQuestions: checklistItems.length,
    totalAssessed,
    totalApplicable,
    compliantCount,
    partialCount,
    nonCompliantCount,
    naCount,
    notVerifiedCount,
    criticalCount,
    criticalFindings,
    redSectionsCount,
    yellowSectionsCount,
    greenSectionsCount,
    notAssessedSectionsCount,
  };
}
