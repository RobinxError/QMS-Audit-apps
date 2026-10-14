import { FactorySettings, UserAccount } from '../types/audit';

// High-fidelity SVG logo data URL for Apex Sweater Mills Limited
export const DEFAULT_FACTORY_LOGO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 60" width="240" height="60"><rect width="240" height="60" rx="8" fill="%230f172a"/><g transform="translate(12, 10)"><path d="M20 2L36 12V30L20 40L4 30V12L20 2Z" fill="%231e3a8a" stroke="%2338bdf8" stroke-width="2"/><path d="M20 8L30 15V26L20 33L10 26V15L20 8Z" fill="%230284c7"/><path d="M14 18H26M14 24H26M20 12V30" stroke="%23f8fafc" stroke-width="1.8" stroke-linecap="round"/></g><text x="60" y="26" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="16" fill="%23ffffff" letter-spacing="-0.5">APEX SWEATER</text><text x="60" y="42" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="10.5" fill="%2338bdf8" letter-spacing="1.5">MILLS LIMITED • BANGLADESH</text></svg>`;

export const DEFAULT_FACTORY_SETTINGS: FactorySettings = {
  factoryName: 'Apex Sweater Mills Limited',
  factoryLogo: DEFAULT_FACTORY_LOGO_SVG,
  factoryAddress: 'Plot 42-48, Industrial Estate, Board Bazar, Gazipur 1704, Bangladesh',
  registrationNumber: 'BGMEA-REG-20419 / BKMEA-0891',
  taxIdOrTin: 'TIN-8931-4029-1029',
  contactPhone: '+880 2-9298412 / +880 1711-000000',
  contactEmail: 'compliance@apexsweater.com',
  website: 'https://www.apexsweater-bd.com',
  headOfQMS: 'Engr. Robiul Islam (Lead QMS Auditor & DGM Quality)',
  generalManager: 'Syed Farhad Hossain (Executive Director)',
  tagline: 'Excellence in Export Knitwear & Sustainable Quality Management',
  establishedYear: '2008',
  totalWorkforce: '1,850 Workers • 450 Computerized Flat Knitting Machines',
  isoCertifications: 'ISO 9001:2015, OEKO-TEX Standard 100, GOTS, WRAP Gold, Sedex SMETA',
  updatedAt: new Date().toISOString(),
};

export const INITIAL_DEMO_USERS: UserAccount[] = [
  {
    id: 'usr-admin-01',
    username: 'admin',
    email: 'admin@apexsweater.com',
    fullName: 'Engr. Robiul Islam',
    role: 'Admin',
    department: 'Quality Assurance & Compliance',
    status: 'Active',
    createdAt: '2026-01-10T08:00:00Z',
    lastLoginAt: '2026-10-14T02:30:00Z',
  },
  {
    id: 'usr-qms-01',
    username: 'qms.manager',
    email: 'tanvir.qms@apexsweater.com',
    fullName: 'Engr. Tanvir Ahmed',
    role: 'QMS Manager',
    department: 'Quality Management System',
    status: 'Active',
    createdAt: '2026-01-15T09:00:00Z',
    lastLoginAt: '2026-10-13T16:45:00Z',
  },
  {
    id: 'usr-auditor-01',
    username: 'auditor',
    email: 'shahidul.qc@apexsweater.com',
    fullName: 'Md. Shahidul Alam',
    role: 'Auditor',
    department: 'Floor Quality & Audit Execution',
    status: 'Active',
    createdAt: '2026-02-01T10:00:00Z',
    lastLoginAt: '2026-10-14T01:15:00Z',
  },
  {
    id: 'usr-viewer-01',
    username: 'viewer',
    email: 'buyer.rep@ca-inspection.com',
    fullName: 'C&A / Buyer Delegation Rep',
    role: 'Viewer',
    department: 'Buyer Technical Audit & Sourcing',
    status: 'Active',
    createdAt: '2026-03-01T11:00:00Z',
    lastLoginAt: '2026-10-12T14:20:00Z',
  },
];
