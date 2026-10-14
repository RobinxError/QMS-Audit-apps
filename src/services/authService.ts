import { FactorySettings, UserAccount, SharedAccessLink, AuthSession, AccessRole } from '../types/audit';
import { DEFAULT_FACTORY_SETTINGS, INITIAL_DEMO_USERS } from '../data/defaultSettings';

const STORAGE_KEYS = {
  AUTH_TOKEN: 'sweater_audit_auth_token_v2',
  AUTH_USER: 'sweater_audit_auth_user_v2',
  SETTINGS: 'sweater_audit_factory_settings_v2',
};

// -------------------------------------------------------------
// FACTORY SETTINGS CLIENT SERVICE
// -------------------------------------------------------------
export function loadLocalFactorySettings(): FactorySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.factoryName) return parsed;
    }
  } catch (e) {
    console.warn('Failed loading local settings, fallback to defaults:', e);
  }
  return DEFAULT_FACTORY_SETTINGS;
}

export function saveLocalFactorySettings(settings: FactorySettings) {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed saving local settings:', e);
  }
}

export async function fetchServerFactorySettings(): Promise<FactorySettings> {
  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.settings) {
        saveLocalFactorySettings(data.settings);
        return data.settings;
      }
    }
  } catch (err) {
    console.warn('Server settings fetch failed, using local copy:', err);
  }
  return loadLocalFactorySettings();
}

export async function updateServerFactorySettings(settings: FactorySettings): Promise<{ success: boolean; error?: string; settings?: FactorySettings }> {
  try {
    saveLocalFactorySettings(settings); // Optimistic local save
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (data.success && data.settings) {
      saveLocalFactorySettings(data.settings);
      return { success: true, settings: data.settings };
    }
    return { success: false, error: data.error || 'Failed to save factory settings.' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error saving settings.' };
  }
}

// -------------------------------------------------------------
// AUTHENTICATION & SESSION MANAGEMENT
// -------------------------------------------------------------
export function getSavedAuthSession(): AuthSession | null {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const rawUser = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    if (token && rawUser) {
      const user = JSON.parse(rawUser);
      return {
        token,
        user,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
    }
  } catch (e) {}
  return null;
}

export function saveAuthSession(session: AuthSession) {
  try {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, session.token);
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(session.user));
  } catch (e) {}
}

export function clearAuthSession() {
  try {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  } catch (e) {}
}

export async function loginWithCredentials(
  usernameOrEmail: string,
  password: string
): Promise<{ success: boolean; session?: AuthSession; error?: string; remainingSeconds?: number }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail, password }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      const session: AuthSession = {
        token: data.token,
        user: data.user,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
      saveAuthSession(session);
      return { success: true, session };
    }

    return {
      success: false,
      error: data.error || 'Invalid credentials',
      remainingSeconds: data.remainingSeconds,
    };
  } catch (err: any) {
    // Graceful offline fallback for demo/prototype if server offline
    const clean = usernameOrEmail.toLowerCase().trim();
    const matched = INITIAL_DEMO_USERS.find(
      (u) => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean
    );
    if (matched && password.length >= 4) {
      const session: AuthSession = {
        token: 'ses_offline_' + Date.now(),
        user: {
          id: matched.id,
          username: matched.username,
          email: matched.email,
          fullName: matched.fullName,
          role: matched.role,
          department: matched.department,
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
      saveAuthSession(session);
      return { success: true, session };
    }
    return { success: false, error: err.message || 'Authentication service unreachable.' };
  }
}

export async function verifyShareLink(
  token: string,
  password?: string
): Promise<{
  success: boolean;
  requiresPassword?: boolean;
  linkName?: string;
  assignedRole?: AccessRole;
  session?: AuthSession;
  error?: string;
}> {
  try {
    const res = await fetch('/api/auth/verify-share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      const session: AuthSession = {
        token: data.token,
        user: data.user,
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        isGuestShare: true,
      };
      saveAuthSession(session);
      return { success: true, session };
    }

    return {
      success: false,
      requiresPassword: !!data.requiresPassword,
      linkName: data.linkName,
      assignedRole: data.assignedRole,
      error: data.error || 'Failed to verify share invitation.',
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Verification service unreachable.' };
  }
}

export async function logoutUser(token?: string) {
  try {
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  } catch (err) {}
  clearAuthSession();
}

// -------------------------------------------------------------
// USER MANAGEMENT API CALLS (ADMIN)
// -------------------------------------------------------------
export async function fetchUsers(): Promise<UserAccount[]> {
  try {
    const res = await fetch('/api/users');
    if (res.ok) {
      const data = await res.json();
      if (data.success) return data.users;
    }
  } catch (err) {}
  return INITIAL_DEMO_USERS;
}

export async function createUser(userData: {
  username: string;
  email: string;
  fullName: string;
  role: AccessRole;
  department: string;
  password: string;
}): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (data.success) return { success: true, user: data.user };
    return { success: false, error: data.error || 'Failed to create user' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function resetUserPassword(userId: string, newPassword: string): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const res = await fetch('/api/users/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, newPassword }),
    });
    const data = await res.json();
    if (data.success) return { success: true, message: data.message };
    return { success: false, error: data.error || 'Failed to reset password' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function toggleUserStatus(userId: string, status: 'Active' | 'Suspended', role?: AccessRole): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/users/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, status, role }),
    });
    const data = await res.json();
    return { success: !!data.success, error: data.error };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
    const data = await res.json();
    return { success: !!data.success, error: data.error };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// -------------------------------------------------------------
// SHARED ACCESS LINKS API CALLS
// -------------------------------------------------------------
export async function fetchShareLinks(): Promise<SharedAccessLink[]> {
  try {
    const res = await fetch('/api/shares');
    if (res.ok) {
      const data = await res.json();
      if (data.success) return data.shares;
    }
  } catch (err) {}
  return [];
}

export async function createShareLink(payload: {
  name: string;
  assignedRole: AccessRole;
  isPasswordProtected: boolean;
  password?: string;
  expiresDuration: '24h' | '3d' | '7d' | '30d' | 'never';
  maxUses?: number;
  createdBy: string;
}): Promise<{ success: boolean; share?: SharedAccessLink; error?: string }> {
  try {
    const res = await fetch('/api/shares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) return { success: true, share: data.share };
    return { success: false, error: data.error || 'Failed to create share link' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function toggleShareLinkRevoke(shareId: string): Promise<{ success: boolean; status?: string; error?: string }> {
  try {
    const res = await fetch(`/api/shares/${shareId}/revoke`, { method: 'POST' });
    const data = await res.json();
    if (data.success) return { success: true, status: data.status };
    return { success: false, error: data.error };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteShareLink(shareId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/shares/${shareId}`, { method: 'DELETE' });
    const data = await res.json();
    return { success: !!data.success, error: data.error };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// -------------------------------------------------------------
// LOGO VALIDATOR & PROCESSOR
// -------------------------------------------------------------
export function validateAndProcessLogoFile(file: File): Promise<{
  valid: boolean;
  error?: string;
  dataUrl?: string;
  dimensions?: { width: number; height: number };
  sizeKb?: number;
}> {
  return new Promise((resolve) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return resolve({
        valid: false,
        error: 'Unsupported image format. Please upload PNG, JPG, SVG, or WebP.',
      });
    }

    const maxBytes = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxBytes) {
      return resolve({
        valid: false,
        error: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds the 5MB maximum limit.`,
      });
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (file.type === 'image/svg+xml') {
        resolve({
          valid: true,
          dataUrl,
          sizeKb: Math.round(file.size / 1024),
          dimensions: { width: 240, height: 60 },
        });
      } else {
        const img = new Image();
        img.onload = () => {
          resolve({
            valid: true,
            dataUrl,
            sizeKb: Math.round(file.size / 1024),
            dimensions: { width: img.naturalWidth, height: img.naturalHeight },
          });
        };
        img.onerror = () => {
          resolve({ valid: false, error: 'Failed to render image preview.' });
        };
        img.src = dataUrl;
      }
    };
    reader.onerror = () => {
      resolve({ valid: false, error: 'Could not read image file.' });
    };
    reader.readAsDataURL(file);
  });
}

// -------------------------------------------------------------
// DEMO MODE & EVALUATION CREDENTIAL SELECTOR HELPERS
// -------------------------------------------------------------
export interface DemoAccountInfo {
  username: string;
  role: AccessRole;
  label: string;
  department: string;
}

export async function fetchDemoStatus(): Promise<{ demoModeEnabled: boolean; accounts: DemoAccountInfo[] }> {
  try {
    const res = await fetch('/api/auth/demo-status');
    if (res.ok) {
      const data = await res.json();
      return {
        demoModeEnabled: !!data.demoModeEnabled,
        accounts: data.accounts || [],
      };
    }
  } catch (err) {
    console.warn('Demo status fetch error, using evaluation defaults:', err);
  }
  return {
    demoModeEnabled: true,
    accounts: [
      { username: 'admin', role: 'Admin', label: 'Administrator', department: 'Quality Assurance & Compliance' },
      { username: 'qms.manager', role: 'QMS Manager', label: 'QMS Manager', department: 'Quality Management System' },
      { username: 'auditor', role: 'Auditor', label: 'Lead Auditor', department: 'Floor Quality & Audit Execution' },
      { username: 'viewer', role: 'Viewer', label: 'Buyer Viewer', department: 'Buyer Technical Audit & Sourcing' },
    ],
  };
}

export async function fetchDemoCredentials(
  username: string
): Promise<{ success: boolean; username?: string; password?: string; role?: string; label?: string; error?: string }> {
  try {
    const res = await fetch(`/api/auth/demo-credentials?username=${encodeURIComponent(username)}`);
    const data = await res.json();
    if (res.ok && data.success) {
      return data;
    }
    return { success: false, error: data.error || 'Demo credentials unavailable' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch demo credentials' };
  }
}

export async function toggleDemoMode(
  enabled: boolean
): Promise<{ success: boolean; demoModeEnabled?: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/auth/demo-mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return data;
    }
    return { success: false, error: data.error || 'Failed to update demo mode status' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
