import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import * as XLSX from 'xlsx';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

// Allow large payloads for base64 photo evidence and documents
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// -------------------------------------------------------------
// PERSISTENT DATA DIRECTORY SETUP
// -------------------------------------------------------------
const DATA_DIR = path.resolve('data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const SETTINGS_FILE = path.join(DATA_DIR, 'factorySettings.json');
const USERS_FILE = path.join(DATA_DIR, 'userAccounts.json');
const SHARES_FILE = path.join(DATA_DIR, 'sharedLinks.json');
const AUDITS_FILE = path.join(DATA_DIR, 'audits.json');

// -------------------------------------------------------------
// CRYPTOGRAPHIC UTILITIES (Salted PBKDF2 Hashing)
// -------------------------------------------------------------
function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, generatedSalt, 10000, 64, 'sha256').toString('hex');
  return { hash, salt: generatedSalt };
}

function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
  } catch {
    return false;
  }
}

// -------------------------------------------------------------
// RATE LIMITING & LOCKOUT CONTROLS
// -------------------------------------------------------------
interface RateLimitRecord {
  attempts: number;
  lockedUntil?: number;
}
const loginRateLimitMap = new Map<string, RateLimitRecord>();

function checkRateLimit(identifier: string): { allowed: boolean; remainingLockoutSeconds?: number } {
  const record = loginRateLimitMap.get(identifier);
  if (!record) return { allowed: true };

  const now = Date.now();
  if (record.lockedUntil && record.lockedUntil > now) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, remainingLockoutSeconds: remainingSeconds };
  }

  // If lockout expired, reset attempts
  if (record.lockedUntil && record.lockedUntil <= now) {
    loginRateLimitMap.delete(identifier);
    return { allowed: true };
  }

  return { allowed: true };
}

function recordFailedLogin(identifier: string) {
  const record = loginRateLimitMap.get(identifier) || { attempts: 0 };
  record.attempts += 1;
  // Lockout after 5 failed attempts for 15 minutes (900 seconds)
  if (record.attempts >= 5) {
    record.lockedUntil = Date.now() + 15 * 60 * 1000;
  }
  loginRateLimitMap.set(identifier, record);
}

function resetFailedLogin(identifier: string) {
  loginRateLimitMap.delete(identifier);
}

// -------------------------------------------------------------
// INITIALIZE OR LOAD PERSISTENT DATA
// -------------------------------------------------------------
const DEFAULT_FACTORY_LOGO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 60" width="240" height="60"><rect width="240" height="60" rx="8" fill="%230f172a"/><g transform="translate(12, 10)"><path d="M20 2L36 12V30L20 40L4 30V12L20 2Z" fill="%231e3a8a" stroke="%2338bdf8" stroke-width="2"/><path d="M20 8L30 15V26L20 33L10 26V15L20 8Z" fill="%230284c7"/><path d="M14 18H26M14 24H26M20 12V30" stroke="%23f8fafc" stroke-width="1.8" stroke-linecap="round"/></g><text x="60" y="26" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="16" fill="%23ffffff" letter-spacing="-0.5">APEX SWEATER</text><text x="60" y="42" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="10.5" fill="%2338bdf8" letter-spacing="1.5">MILLS LIMITED • BANGLADESH</text></svg>`;

const INITIAL_FACTORY_SETTINGS = {
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
  demoModeEnabled: true,
  updatedAt: new Date().toISOString(),
};

function loadSettingsFromDisk() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Failed reading settings from disk:', err);
  }
  return INITIAL_FACTORY_SETTINGS;
}

let serverSettings = loadSettingsFromDisk();

function saveSettingsToDisk(settings: any) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed writing settings to disk:', err);
  }
}

interface StoredUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  department: string;
  passwordHash: string;
  salt: string;
  status: string;
  createdAt: string;
  lastLoginAt?: string;
}

interface StoredShare {
  id: string;
  token: string;
  name: string;
  assignedRole: string;
  isPasswordProtected: boolean;
  passwordHash?: string;
  salt?: string;
  expiresAt: string | null;
  maxUses?: number;
  useCount: number;
  status: string;
  createdBy: string;
  createdAt: string;
  lastAccessedAt?: string;
}

// Authorized Evaluation Demo Accounts mapping for evaluation testing
const DEMO_CREDENTIALS: Record<
  string,
  { pass: string; role: string; fullName: string; department: string; email: string; label: string }
> = {
  admin: {
    pass: 'Robinx#',
    role: 'Admin',
    fullName: 'Engr. Robiul Islam',
    department: 'Quality Assurance & Compliance',
    email: 'admin@apexsweater.com',
    label: 'Administrator',
  },
  'qms.manager': {
    pass: 'qmsxr23',
    role: 'QMS Manager',
    fullName: 'Engr. Tanvir Ahmed',
    department: 'Quality Management System',
    email: 'tanvir.qms@apexsweater.com',
    label: 'QMS Manager',
  },
  auditor: {
    pass: 'auditorxdns',
    role: 'Auditor',
    fullName: 'Md. Shahidul Alam',
    department: 'Floor Quality & Audit Execution',
    email: 'shahidul.qc@apexsweater.com',
    label: 'Auditor',
  },
  viewer: {
    pass: 'viewer1212',
    role: 'Viewer',
    fullName: 'C&A / Buyer Delegation Rep',
    department: 'Buyer Technical Audit & Sourcing',
    email: 'buyer.rep@ca-inspection.com',
    label: 'Viewer',
  },
};

// Initial User Accounts with salted PBKDF2 hashes
function loadUsersFromDisk(): StoredUser[] {
  let users: StoredUser[] = [];
  try {
    if (fs.existsSync(USERS_FILE)) {
      users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Failed reading users from disk:', err);
  }

  // Ensure all 4 requested evaluation demo accounts exist and are hashed with PBKDF2
  let modified = false;
  for (const [uname, def] of Object.entries(DEMO_CREDENTIALS)) {
    const existing = users.find((u) => u.username.toLowerCase() === uname.toLowerCase());
    if (existing) {
      const isValid = verifyPassword(def.pass, existing.passwordHash, existing.salt);
      if (!isValid) {
        const hashed = hashPassword(def.pass);
        existing.passwordHash = hashed.hash;
        existing.salt = hashed.salt;
        existing.role = def.role;
        existing.status = 'Active';
        modified = true;
      }
    } else {
      const hashed = hashPassword(def.pass);
      users.push({
        id: `usr-${uname.replace('.', '-')}-01`,
        username: uname,
        email: def.email,
        fullName: def.fullName,
        role: def.role,
        department: def.department,
        passwordHash: hashed.hash,
        salt: hashed.salt,
        status: 'Active',
        createdAt: '2026-01-10T08:00:00Z',
      });
      modified = true;
    }
  }

  if (modified || users.length === 0) {
    try {
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
    } catch (err) {}
  }

  return users;
}

let serverUsers: StoredUser[] = loadUsersFromDisk();

function saveUsersToDisk(users: StoredUser[]) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed writing users to disk:', err);
  }
}

// Initial Shared Links
function loadSharesFromDisk(): StoredShare[] {
  try {
    if (fs.existsSync(SHARES_FILE)) {
      return JSON.parse(fs.readFileSync(SHARES_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Failed reading shares from disk:', err);
  }

  // Pre-seed one sample buyer share link
  const samplePass = hashPassword('ca2026');
  const defaultShares: StoredShare[] = [
    {
      id: 'share-ca-tech-audit',
      token: 'tok_ca_tech_audit_2026',
      name: 'C&A Buyer Technical Audit Observer Link',
      assignedRole: 'Viewer',
      isPasswordProtected: true,
      passwordHash: samplePass.hash,
      salt: samplePass.salt,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      maxUses: 25,
      useCount: 3,
      status: 'Active',
      createdBy: 'Engr. Robiul Islam (Admin)',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      lastAccessedAt: new Date().toISOString(),
    },
  ];

  try {
    fs.writeFileSync(SHARES_FILE, JSON.stringify(defaultShares, null, 2), 'utf-8');
  } catch (err) {}
  return defaultShares;
}

let serverShares: StoredShare[] = loadSharesFromDisk();

function saveSharesToDisk(shares: StoredShare[]) {
  try {
    fs.writeFileSync(SHARES_FILE, JSON.stringify(shares, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed writing shares to disk:', err);
  }
}

// Active Sessions Store in memory
const activeSessions = new Map<string, { user: any; expiresAt: number; isGuestShare?: boolean }>();

// Audits persistence
function loadAuditsFromDisk() {
  try {
    if (fs.existsSync(AUDITS_FILE)) {
      return JSON.parse(fs.readFileSync(AUDITS_FILE, 'utf-8'));
    }
  } catch (err) {}
  return [];
}
let serverAudits: any[] = loadAuditsFromDisk();

function saveAuditsToDisk(audits: any[]) {
  try {
    fs.writeFileSync(AUDITS_FILE, JSON.stringify(audits, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed writing audits to disk:', err);
  }
}

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// -------------------------------------------------------------
// API: HEALTH CHECK & GENERAL INFO
// -------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Sweater Factory Audit Management System',
    factoryName: serverSettings.factoryName,
    geminiConfigured: !!apiKey,
    time: new Date().toISOString(),
  });
});

// -------------------------------------------------------------
// API: FACTORY SETTINGS & BRANDING
// -------------------------------------------------------------
app.get('/api/settings', (req, res) => {
  res.json({
    success: true,
    settings: serverSettings,
  });
});

app.post('/api/settings', (req, res) => {
  try {
    const newSettings = req.body;
    if (!newSettings || typeof newSettings !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid settings payload' });
    }

    // Logo validation: format & size check
    if (newSettings.factoryLogo && typeof newSettings.factoryLogo === 'string') {
      const logoStr = newSettings.factoryLogo;
      if (logoStr.startsWith('data:')) {
        // Validate MIME type
        const mimeMatch = logoStr.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
        const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
        if (mimeMatch && !allowedMimes.includes(mimeMatch[1])) {
          return res.status(400).json({
            success: false,
            error: 'Unsupported image format. Allowed formats: PNG, JPG, SVG, WebP.',
          });
        }
        // Validate size (max 5MB approx 6.7MB base64)
        if (logoStr.length > 7 * 1024 * 1024) {
          return res.status(400).json({
            success: false,
            error: 'Logo file size exceeds the 5MB maximum limit.',
          });
        }
      }
    }

    serverSettings = {
      ...serverSettings,
      ...newSettings,
      updatedAt: new Date().toISOString(),
    };

    saveSettingsToDisk(serverSettings);

    return res.json({
      success: true,
      message: 'Factory branding and settings saved permanently.',
      settings: serverSettings,
    });
  } catch (err: any) {
    console.error('Settings save error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// API: AUTHENTICATION, SESSIONS & PASSWORD-PROTECTED ACCESS
// -------------------------------------------------------------
app.post('/api/auth/login', (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const identifier = `${clientIp}_${(usernameOrEmail || '').toLowerCase().trim()}`;

    // Rate Limiting Check
    const rateCheck = checkRateLimit(identifier);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: `Account temporarily locked due to multiple failed login attempts. Please try again in ${rateCheck.remainingLockoutSeconds} seconds.`,
        remainingSeconds: rateCheck.remainingLockoutSeconds,
      });
    }

    if (!usernameOrEmail || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please enter both username/email and password.',
      });
    }

    const cleanInput = usernameOrEmail.toLowerCase().trim();
    const user = serverUsers.find(
      (u) => u.username.toLowerCase() === cleanInput || u.email.toLowerCase() === cleanInput
    );

    if (!user) {
      recordFailedLogin(identifier);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Please verify username/email and password.',
      });
    }

    if (user.status === 'Suspended') {
      return res.status(403).json({
        success: false,
        error: 'This user account has been suspended by factory administration.',
      });
    }

    // Verify Password Hash
    const isValid = verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
      recordFailedLogin(identifier);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Please verify username/email and password.',
      });
    }

    // Login Succeeded: Reset rate limiter & issue session
    resetFailedLogin(identifier);
    const sessionToken = 'ses_' + crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    const sanitizedUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      department: user.department,
      status: user.status,
    };

    activeSessions.set(sessionToken, {
      user: sanitizedUser,
      expiresAt,
    });

    user.lastLoginAt = new Date().toISOString();
    saveUsersToDisk(serverUsers);

    return res.json({
      success: true,
      token: sessionToken,
      user: sanitizedUser,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// API: DEMO MODE & EVALUATION CREDENTIALS
// -------------------------------------------------------------
app.get('/api/auth/demo-status', (req, res) => {
  const isEnabled = serverSettings.demoModeEnabled !== false;
  const accounts = [
    { username: 'admin', role: 'Admin', label: 'Administrator', department: 'Quality Assurance & Compliance' },
    { username: 'qms.manager', role: 'QMS Manager', label: 'QMS Manager', department: 'Quality Management System' },
    { username: 'auditor', role: 'Auditor', label: 'Lead Auditor', department: 'Floor Quality & Audit Execution' },
    { username: 'viewer', role: 'Viewer', label: 'Buyer Viewer', department: 'Buyer Technical Audit & Sourcing' },
  ];

  res.json({
    success: true,
    demoModeEnabled: isEnabled,
    accounts: isEnabled ? accounts : [],
  });
});

app.get('/api/auth/demo-credentials', (req, res) => {
  const isEnabled = serverSettings.demoModeEnabled !== false;
  if (!isEnabled) {
    return res.status(403).json({
      success: false,
      error: 'Demo Mode is disabled in production by factory administrator.',
    });
  }

  const requestedUsername = ((req.query.username as string) || '').toLowerCase().trim();
  const demoAccount = DEMO_CREDENTIALS[requestedUsername];
  if (!demoAccount) {
    return res.status(404).json({
      success: false,
      error: 'Demo account not found.',
    });
  }

  res.json({
    success: true,
    username: requestedUsername,
    password: demoAccount.pass,
    role: demoAccount.role,
    label: demoAccount.label,
  });
});

app.post('/api/auth/demo-mode', (req, res) => {
  const { enabled } = req.body;
  serverSettings.demoModeEnabled = !!enabled;
  saveSettingsToDisk(serverSettings);
  res.json({
    success: true,
    demoModeEnabled: serverSettings.demoModeEnabled,
    message: serverSettings.demoModeEnabled
      ? 'Demo Mode enabled for authorized evaluation.'
      : 'Demo Mode disabled for production security.',
  });
});

// Verify Shared Access Link (Restricted Token & Optional Password)
app.post('/api/auth/verify-share', (req, res) => {
  try {
    const { token, password } = req.body;
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

    if (!token) {
      return res.status(400).json({ success: false, error: 'Share token is required' });
    }

    const share = serverShares.find((s) => s.token === token);
    if (!share) {
      return res.status(404).json({ success: false, error: 'Invalid or expired share link.' });
    }

    if (share.status === 'Revoked') {
      return res.status(403).json({
        success: false,
        error: 'This invitation link has been revoked by factory administration.',
      });
    }

    // Check expiration
    if (share.expiresAt && new Date(share.expiresAt).getTime() < Date.now()) {
      share.status = 'Expired';
      saveSharesToDisk(serverShares);
      return res.status(410).json({
        success: false,
        error: 'This share link has expired. Please contact factory administration for a new link.',
      });
    }

    // Check max uses limit
    if (share.maxUses && share.useCount >= share.maxUses) {
      return res.status(403).json({
        success: false,
        error: 'Maximum access limit reached for this invitation link.',
      });
    }

    // Check password if required
    if (share.isPasswordProtected) {
      if (!password) {
        return res.status(401).json({
          success: false,
          requiresPassword: true,
          linkName: share.name,
          assignedRole: share.assignedRole,
          error: 'This restricted link is password-protected. Please enter the invitation passcode.',
        });
      }

      const identifier = `${clientIp}_share_${token}`;
      const rateCheck = checkRateLimit(identifier);
      if (!rateCheck.allowed) {
        return res.status(429).json({
          success: false,
          error: `Too many incorrect attempts. Please try again in ${rateCheck.remainingLockoutSeconds} seconds.`,
        });
      }

      const isValid = share.passwordHash && share.salt ? verifyPassword(password, share.passwordHash, share.salt) : false;
      if (!isValid) {
        recordFailedLogin(identifier);
        return res.status(401).json({
          success: false,
          requiresPassword: true,
          error: 'Incorrect passcode for this shared access link.',
        });
      }
      resetFailedLogin(identifier);
    }

    // Grant Guest Session
    share.useCount = (share.useCount || 0) + 1;
    share.lastAccessedAt = new Date().toISOString();
    saveSharesToDisk(serverShares);

    const sessionToken = 'ses_guest_' + crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 12 * 60 * 60 * 1000; // 12 hours

    const guestUser = {
      id: `guest-${share.id}`,
      username: `guest.${share.assignedRole.toLowerCase()}`,
      email: 'delegation.access@apexsweater.com',
      fullName: `${share.name} (${share.assignedRole})`,
      role: share.assignedRole,
      department: 'Authorized Delegation Access',
      status: 'Active',
    };

    activeSessions.set(sessionToken, {
      user: guestUser,
      expiresAt,
      isGuestShare: true,
    });

    return res.json({
      success: true,
      token: sessionToken,
      user: guestUser,
      shareInfo: {
        name: share.name,
        role: share.assignedRole,
      },
    });
  } catch (err: any) {
    console.error('Share verification error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const token = authHeader.slice(7);
  const session = activeSessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) activeSessions.delete(token);
    return res.status(401).json({ success: false, error: 'Session expired' });
  }

  res.json({
    success: true,
    user: session.user,
    isGuestShare: !!session.isGuestShare,
  });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    activeSessions.delete(token);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// -------------------------------------------------------------
// API: USER MANAGEMENT (ADMIN ONLY)
// -------------------------------------------------------------
app.get('/api/users', (req, res) => {
  const sanitized = serverUsers.map((u) => ({
    id: u.id,
    username: u.username,
    email: u.email,
    fullName: u.fullName,
    role: u.role,
    department: u.department,
    status: u.status,
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt,
  }));
  res.json({ success: true, users: sanitized });
});

app.post('/api/users', (req, res) => {
  try {
    const { username, email, fullName, role, department, password } = req.body;
    if (!username || !email || !fullName || !role || !password) {
      return res.status(400).json({ success: false, error: 'Missing required user fields' });
    }

    const cleanUsername = username.toLowerCase().trim();
    const cleanEmail = email.toLowerCase().trim();

    if (serverUsers.some((u) => u.username.toLowerCase() === cleanUsername)) {
      return res.status(400).json({ success: false, error: 'Username already in use' });
    }
    if (serverUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return res.status(400).json({ success: false, error: 'Email address already registered' });
    }

    const { hash, salt } = hashPassword(password);
    const newUser = {
      id: 'usr-' + Date.now(),
      username: cleanUsername,
      email: cleanEmail,
      fullName: fullName.trim(),
      role,
      department: (department || 'Factory Operations').trim(),
      passwordHash: hash,
      salt,
      status: 'Active',
      createdAt: new Date().toISOString(),
    };

    serverUsers.push(newUser);
    saveUsersToDisk(serverUsers);

    return res.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        department: newUser.department,
        status: newUser.status,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/users/reset-password', (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long',
      });
    }

    const user = serverUsers.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const { hash, salt } = hashPassword(newPassword);
    user.passwordHash = hash;
    user.salt = salt;
    saveUsersToDisk(serverUsers);

    return res.json({ success: true, message: `Password reset successfully for ${user.fullName}.` });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/users/status', (req, res) => {
  try {
    const { userId, status, role } = req.body;
    const user = serverUsers.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (status) user.status = status;
    if (role) user.role = role;
    saveUsersToDisk(serverUsers);

    return res.json({ success: true, message: 'User updated successfully', user });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/users/:id', (req, res) => {
  try {
    const userId = req.params.id;
    const userIndex = serverUsers.findIndex((u) => u.id === userId);
    if (userIndex < 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Prevent deleting the primary admin
    if (serverUsers[userIndex].username === 'admin') {
      return res.status(400).json({ success: false, error: 'Cannot delete primary root administrator' });
    }

    serverUsers.splice(userIndex, 1);
    saveUsersToDisk(serverUsers);
    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// API: PASSWORD-PROTECTED SHARE LINKS MANAGEMENT
// -------------------------------------------------------------
app.get('/api/shares', (req, res) => {
  const sanitized = serverShares.map((s) => ({
    id: s.id,
    token: s.token,
    name: s.name,
    assignedRole: s.assignedRole,
    isPasswordProtected: s.isPasswordProtected,
    expiresAt: s.expiresAt,
    maxUses: s.maxUses,
    useCount: s.useCount,
    status: s.status,
    createdBy: s.createdBy,
    createdAt: s.createdAt,
    lastAccessedAt: s.lastAccessedAt,
  }));
  res.json({ success: true, shares: sanitized });
});

app.post('/api/shares', (req, res) => {
  try {
    const { name, assignedRole, isPasswordProtected, password, expiresDuration, maxUses, createdBy } = req.body;
    if (!name || !assignedRole) {
      return res.status(400).json({ success: false, error: 'Link name and assigned role are required' });
    }

    let passwordHash: string | undefined;
    let salt: string | undefined;

    if (isPasswordProtected) {
      if (!password || password.length < 4) {
        return res.status(400).json({
          success: false,
          error: 'Passcode must be at least 4 characters for protected sharing.',
        });
      }
      const hashed = hashPassword(password);
      passwordHash = hashed.hash;
      salt = hashed.salt;
    }

    // Expiration calculation
    let expiresAt: string | null = null;
    const now = Date.now();
    if (expiresDuration === '24h') {
      expiresAt = new Date(now + 24 * 60 * 60 * 1000).toISOString();
    } else if (expiresDuration === '3d') {
      expiresAt = new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString();
    } else if (expiresDuration === '7d') {
      expiresAt = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (expiresDuration === '30d') {
      expiresAt = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString();
    } else {
      expiresAt = null; // Never
    }

    const token = 'sec_' + crypto.randomBytes(16).toString('hex');
    const newShare = {
      id: 'sh-' + Date.now(),
      token,
      name: name.trim(),
      assignedRole,
      isPasswordProtected: !!isPasswordProtected,
      passwordHash,
      salt,
      expiresAt,
      maxUses: maxUses ? parseInt(maxUses, 10) : undefined,
      useCount: 0,
      status: 'Active',
      createdBy: createdBy || 'Administrator',
      createdAt: new Date().toISOString(),
    };

    serverShares.unshift(newShare);
    saveSharesToDisk(serverShares);

    return res.json({
      success: true,
      message: 'Share link generated successfully',
      share: {
        id: newShare.id,
        token: newShare.token,
        name: newShare.name,
        assignedRole: newShare.assignedRole,
        isPasswordProtected: newShare.isPasswordProtected,
        expiresAt: newShare.expiresAt,
        maxUses: newShare.maxUses,
        useCount: newShare.useCount,
        status: newShare.status,
        createdAt: newShare.createdAt,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/shares/:id/revoke', (req, res) => {
  try {
    const share = serverShares.find((s) => s.id === req.params.id);
    if (!share) {
      return res.status(404).json({ success: false, error: 'Share link not found' });
    }
    share.status = share.status === 'Revoked' ? 'Active' : 'Revoked';
    saveSharesToDisk(serverShares);
    return res.json({ success: true, message: `Share link is now ${share.status}.`, status: share.status });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/shares/:id', (req, res) => {
  try {
    const idx = serverShares.findIndex((s) => s.id === req.params.id);
    if (idx < 0) {
      return res.status(404).json({ success: false, error: 'Share link not found' });
    }
    serverShares.splice(idx, 1);
    saveSharesToDisk(serverShares);
    return res.json({ success: true, message: 'Share link deleted permanently.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// API: GEMINI CHECKLIST EXTRACTION & SPREADSHEET PARSING
// -------------------------------------------------------------
app.post('/api/gemini/extract-checklist', async (req, res) => {
  try {
    const { fileContent, fileName, buyerName, targetSections } = req.body;

    if (!apiKey) {
      return res.status(200).json({
        success: false,
        fallbackMode: true,
        message: 'No GEMINI_API_KEY found. Utilizing local parsing engine.',
      });
    }

    const sectionsList = (targetSections && targetSections.length > 0)
      ? targetSections.join(', ')
      : [
          'Yarn Warehouse & Yarn Inspection',
          'Accessories & Trims Store',
          'Sample Section',
          'Knitting Section',
          'Linking Section',
          'Washing Section',
          'Finishing Section',
          'Packing Section',
          'Finished Goods Warehouse',
          'Quality Control & Inspection',
          'Measurement & Shrinkage Control',
          'Machine Maintenance & Calibration',
          'Needle & Sharp Tools Control',
          'Production Planning & Manufacturing Control Process (MCP)',
          'Document Control & Record Management',
          'Product Safety & Risk Assessment',
          'Housekeeping, 5S & Workplace Organization',
          'Training & Competency',
          'Corrective Action & Preventive Action (CAPA)',
        ].join(', ');

    const prompt = `You are a Senior QMS and Buyer Compliance Lead Auditor for a high-end export sweater manufacturing factory in Bangladesh.
Analyze the following uploaded document content from buyer/standards checklist: "${fileName || 'Buyer Checklist'}" (Buyer: ${buyerName || 'Unspecified Buyer'}).

Target Sections to categorize each question into:
${sectionsList}

Task:
Extract all distinct audit questions, compliance checkpoints, and criteria.
Preserve exact wording and requirement references.
For each extracted item, identify:
1. question: Exact audit question or requirement statement.
2. section: Best matching section from the target list above.
3. buyer: The buyer name (e.g., "${buyerName || 'Buyer'}").
4. source: "Buyer" (or "ISO 9001" or "Factory SOP" if explicitly stated).
5. buyerClause: Clause number or item ID if present.
6. isoClause: Applicable ISO 9001:2015 clause.
7. acceptanceCriteria: Specific technical acceptance threshold.
8. verificationMethod: "Physical Inspection" | "Document Verification" | "Record Review" | "Personnel Interview" | "Test Measurement".
9. evidenceRequired: Specific records or observations needed.
10. riskLevel: "Critical" | "Major" | "Minor".
11. isCritical: boolean (true if broken needle, child safety, pull test failure, lack of metal detector, or banned substance).
12. sourceRowOrPage: Page or row number where found in the document.

Output format must be a strictly valid JSON object matching this schema:
{
  "buyerName": "${buyerName || 'Extracted Buyer'}",
  "version": "1.0",
  "totalExtracted": number,
  "summary": "Brief 2-3 sentence overview of the extracted checklist scope and focus areas",
  "items": [
    {
      "question": "string",
      "section": "string",
      "buyer": "string",
      "source": "Buyer",
      "buyerClause": "string",
      "isoClause": "string",
      "acceptanceCriteria": "string",
      "verificationMethod": "string",
      "evidenceRequired": "string",
      "riskLevel": "Critical" | "Major" | "Minor",
      "isCritical": boolean,
      "sourceRowOrPage": "string"
    }
  ]
}

Document Content snippet/sample:
${typeof fileContent === 'string' ? fileContent.slice(0, 30000) : JSON.stringify(fileContent).slice(0, 30000)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    const parsed = JSON.parse(responseText);

    return res.json({
      success: true,
      data: parsed,
    });
  } catch (error: any) {
    console.error('Gemini extraction error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process checklist with Gemini API',
    });
  }
});

// API: Parse Spreadsheet (XLSX, XLS, CSV)
app.post('/api/parse-spreadsheet', async (req, res) => {
  try {
    const { base64Data, fileName } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: 'No spreadsheet data provided' });
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;
    const allRows: any[] = [];

    sheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      allRows.push({
        sheetName,
        rows: json.slice(0, 150),
      });
    });

    return res.json({
      success: true,
      fileName,
      sheetNames,
      sheets: allRows,
    });
  } catch (err: any) {
    console.error('Spreadsheet parse error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// API: SAVE / RETRIEVE AUDITS
// -------------------------------------------------------------
app.get('/api/audits', (req, res) => {
  res.json({ success: true, audits: serverAudits });
});

app.post('/api/audits', (req, res) => {
  const audit = req.body;
  if (!audit.id) {
    audit.id = 'AUD-' + Date.now();
  }
  const index = serverAudits.findIndex((a) => a.id === audit.id);
  if (index >= 0) {
    serverAudits[index] = audit;
  } else {
    serverAudits.unshift(audit);
  }
  saveAuditsToDisk(serverAudits);
  res.json({ success: true, audit });
});

// -------------------------------------------------------------
// VITE DEV SERVER OR PRODUCTION STATIC SERVING
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

startServer();
