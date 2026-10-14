export type AuditResult = 'Compliant' | 'Non-Compliant' | 'Partially Compliant' | 'Not Applicable' | 'Not Verified';

export type RiskLevel = 'Minor' | 'Major' | 'Critical';

export type RequirementSource = 'Buyer' | 'ISO 9001' | 'Factory SOP' | 'Legal Requirement' | 'Internal QMS';

export type VerificationMethod = 
  | 'Physical Inspection' 
  | 'Document Verification' 
  | 'Record Review' 
  | 'Personnel Interview' 
  | 'Test Measurement';

export type CAPAStatus = 
  | 'Open' 
  | 'In Progress' 
  | 'Submitted for Verification' 
  | 'Verified & Closed' 
  | 'Rejected';

export type UserRole = 
  | 'Admin'
  | 'Super Administrator'
  | 'QMS Manager'
  | 'Auditor'
  | 'QMS Executive / Auditor'
  | 'Viewer'
  | 'Management Viewer'
  | 'Department Head'
  | 'CAPA Responsible Person';

export interface PhotoAttachment {
  id: string;
  url: string; // base64 or blob URL
  caption: string;
  evidenceNotes?: string;
  type: 'Before' | 'After' | 'Observation';
  questionId: string;
  findingId?: string;
  sectionName: string;
  auditorName: string;
  timestamp: string;
}

export interface ChecklistItem {
  id: string;
  question: string;
  questionBn?: string;
  sectionId: string;
  sectionName: string;
  buyer: string;
  source: RequirementSource;
  buyerClause?: string;
  isoClause?: string;
  acceptanceCriteria: string;
  verificationMethod: VerificationMethod;
  evidenceRequired: string;
  weight?: number; // 1 (normal), 2 (high risk), 3 (critical)
  isCritical: boolean; // Product safety, broken needle, pull test, child safety, etc.
  mandatoryPhoto?: boolean;
  sourceDocument?: string;
  sourceRowOrPage?: string;
  version?: string;
  approvalStatus?: 'Draft' | 'Approved' | 'Archived';
}

export interface AuditItemFinding {
  itemId: string;
  result: AuditResult;
  findingDescription: string;
  riskLevel: RiskLevel;
  naJustification?: string;
  photos: PhotoAttachment[];
  correctiveAction?: string;
  rootCause?: string;
  fiveWhys?: string[];
  preventiveAction?: string;
  responsiblePerson?: string;
  responsibleDepartment?: string;
  targetCompletionDate?: string;
  capaStatus: CAPAStatus;
  auditorRemarks?: string;
  verifiedBy?: string;
  verificationDate?: string;
  verificationNotes?: string;
  updatedAt: string;
}

export interface AuditSection {
  id: string;
  name: string;
  nameBn: string;
  description: string;
  defaultWeight: number;
  order: number;
  isMandatory: boolean;
}

export interface SectionScore {
  sectionId: string;
  sectionName: string;
  totalQuestions: number;
  applicableQuestions: number;
  assessedQuestions: number;
  compliantCount: number;
  partialCount: number;
  nonCompliantCount: number;
  naCount: number;
  notVerifiedCount: number;
  criticalCount: number;
  totalPointsEarned: number;
  maxApplicablePoints: number;
  scorePercentage: number | null; // null if Not Assessed
  status: 'RED' | 'YELLOW' | 'GREEN' | 'NOT_ASSESSED';
}

export interface AuditRecord {
  id: string;
  title: string;
  factoryName: string;
  factoryLocation: string;
  auditType: 'Internal QMS Audit' | 'Buyer Compliance Audit' | 'Pre-Shipment Audit' | 'Process Quality Audit';
  buyerName: string;
  checklistVersion: string;
  auditDate: string;
  auditTime: string;
  floor: string;
  module: string;
  line: string;
  orderOrPoNumber?: string;
  styleNumber?: string;
  yarnLotNumber?: string;
  leadAuditor: string;
  coAuditor?: string;
  auditedDepartments: string[];
  status: 'In Progress' | 'Completed' | 'Submitted for Review' | 'Approved & Published';
  overallScore: number | null;
  overallStatus: 'RED' | 'YELLOW' | 'GREEN' | 'NOT_ASSESSED';
  criticalFindingsCount: number;
  sectionScores: Record<string, SectionScore>;
  findings: Record<string, AuditItemFinding>; // keyed by itemId
  generalRemarks?: string;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvalDate?: string;
  reportVersions?: ReportVersion[];
}

export interface ReportVersion {
  id: string;
  versionNumber: string;
  generatedAt: string;
  generatedBy: string;
  filename: string;
  overallScore: number | null;
  overallStatus: 'RED' | 'YELLOW' | 'GREEN' | 'NOT_ASSESSED';
  criticalFindingsCount: number;
  openCapaCount: number;
  approvalStatus: 'Draft' | 'Submitted for Review' | 'Approved & Signed';
  fileSizeEstimate: string;
  notes?: string;
}

export interface ISOClauseInfo {
  clauseNumber: string;
  title: string;
  description: string;
  sweaterIndustryApplication: string;
}

export type AccessRole = 'Admin' | 'QMS Manager' | 'Auditor' | 'Viewer';

export interface FactorySettings {
  factoryName: string;
  factoryLogo: string; // Base64 Data URL or hosted image URL
  factoryAddress: string;
  registrationNumber: string; // BGMEA Reg No. / Trade License
  taxIdOrTin?: string;
  contactPhone: string;
  contactEmail: string;
  website?: string;
  headOfQMS: string;
  generalManager?: string;
  tagline?: string;
  establishedYear?: string;
  totalWorkforce?: string;
  isoCertifications?: string;
  demoModeEnabled?: boolean;
  updatedAt: string;
}

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: AccessRole;
  department: string;
  passwordHash?: string;
  salt?: string;
  status: 'Active' | 'Suspended';
  createdAt: string;
  lastLoginAt?: string;
}

export interface SharedAccessLink {
  id: string;
  token: string;
  name: string;
  assignedRole: AccessRole;
  isPasswordProtected: boolean;
  passwordHash?: string;
  salt?: string;
  expiresAt: string | null; // null = Never
  maxUses?: number;
  useCount: number;
  status: 'Active' | 'Revoked' | 'Expired';
  createdBy: string;
  createdAt: string;
  lastAccessedAt?: string;
}

export interface AuthSession {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    fullName: string;
    role: AccessRole;
    department: string;
  };
  expiresAt: string;
  isGuestShare?: boolean;
}
