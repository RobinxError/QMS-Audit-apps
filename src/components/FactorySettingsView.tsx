import React, { useState, useRef } from 'react';
import { 
  Building2, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  RotateCcw, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  FileText, 
  ShieldCheck, 
  Users, 
  Sparkles,
  Info,
  Calendar,
  Award,
  KeyRound,
  ShieldAlert,
  Lock,
  Unlock
} from 'lucide-react';
import { FactorySettings, UserRole } from '../types/audit';
import { DEFAULT_FACTORY_LOGO_SVG } from '../data/defaultSettings';
import { validateAndProcessLogoFile, toggleDemoMode } from '../services/authService';

interface FactorySettingsViewProps {
  settings: FactorySettings;
  onSaveSettings: (newSettings: FactorySettings) => Promise<boolean>;
  userRole: UserRole;
  language: 'EN' | 'BN';
}

export const FactorySettingsView: React.FC<FactorySettingsViewProps> = ({
  settings,
  onSaveSettings,
  userRole,
  language,
}) => {
  const [formData, setFormData] = useState<FactorySettings>({ ...settings });
  const [logoPreview, setLogoPreview] = useState<string>(settings.factoryLogo || DEFAULT_FACTORY_LOGO_SVG);
  const [logoFileStats, setLogoFileStats] = useState<{ sizeKb?: number; dimensions?: { width: number; height: number } }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [logoError, setLogoError] = useState<string>('');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(settings.demoModeEnabled !== false);
  const [isTogglingDemo, setIsTogglingDemo] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = userRole === 'Super Administrator' || (userRole as string) === 'Admin';

  const handleToggleDemo = async () => {
    setIsTogglingDemo(true);
    try {
      const nextVal = !isDemoMode;
      const res = await toggleDemoMode(nextVal);
      if (res.success) {
        setIsDemoMode(nextVal);
        setFormData((prev) => ({ ...prev, demoModeEnabled: nextVal }));
        setStatusMessage(nextVal ? 'Demo Mode enabled for evaluation.' : 'Demo Mode disabled for production.');
        setSaveStatus('success');
      } else {
        setStatusMessage(res.error || 'Failed to update Demo Mode');
        setSaveStatus('error');
      }
    } catch (err: any) {
      setStatusMessage('Error toggling Demo Mode');
      setSaveStatus('error');
    } finally {
      setIsTogglingDemo(false);
    }
  };

  const handleInputChange = (field: keyof FactorySettings, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSaveStatus('idle');
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoError('');
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await validateAndProcessLogoFile(file);
    if (!result.valid || !result.dataUrl) {
      setLogoError(result.error || 'Failed to process image');
      return;
    }

    setLogoPreview(result.dataUrl);
    setLogoFileStats({ sizeKb: result.sizeKb, dimensions: result.dimensions });
    setFormData((prev) => ({ ...prev, factoryLogo: result.dataUrl! }));
    setSaveStatus('idle');
  };

  const handleResetToDefaultLogo = () => {
    setLogoPreview(DEFAULT_FACTORY_LOGO_SVG);
    setFormData((prev) => ({ ...prev, factoryLogo: DEFAULT_FACTORY_LOGO_SVG }));
    setLogoFileStats({});
    setLogoError('');
  };

  const handleRemoveLogo = () => {
    setLogoPreview('');
    setFormData((prev) => ({ ...prev, factoryLogo: '' }));
    setLogoFileStats({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Only authorized administrators can modify factory branding.');
      return;
    }

    setIsSaving(true);
    setSaveStatus('idle');
    try {
      const updated: FactorySettings = {
        ...formData,
        factoryLogo: logoPreview,
        updatedAt: new Date().toISOString(),
      };
      const ok = await onSaveSettings(updated);
      if (ok) {
        setSaveStatus('success');
        setStatusMessage(language === 'EN' ? 'Factory branding & settings saved successfully! All reports updated.' : 'ফ্যাক্টরি ব্র্যান্ডিং ও সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
        setTimeout(() => setSaveStatus('idle'), 4000);
      } else {
        setSaveStatus('error');
        setStatusMessage(language === 'EN' ? 'Failed to save settings. Please verify inputs.' : 'সেটিংস সংরক্ষণ ব্যর্থ হয়েছে।');
      }
    } catch (err: any) {
      setSaveStatus('error');
      setStatusMessage(err.message || 'Error occurred while saving settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-blue-500/10 transform skew-x-12 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-blue-400 uppercase tracking-widest mb-1.5">
              <Building2 className="w-4 h-4" />
              <span>{language === 'EN' ? 'Enterprise Facility Configuration' : 'এন্টারপ্রাইজ ফ্যাক্টরি কনফিগারেশন'}</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
              {language === 'EN' ? 'Factory Branding & Settings' : 'ফ্যাক্টরি ব্র্যান্ডিং ও সেটিংস'}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              {language === 'EN'
                ? 'Configure factory profile, official logo, registration details, and contact person. Changes apply automatically to all audit documents, Excel exports, printable reports, and system dashboards.'
                : 'ফ্যাক্টরির প্রোফাইল, লোগো, নিবন্ধন ও যোগাযোগের তথ্য পরিবর্তন করুন। এটি সকল অডিট ও রিপোর্টে স্বয়ংক্রিয়ভাবে প্রযোজ্য হবে।'}
            </p>
          </div>

          <div className="shrink-0 flex items-center space-x-2">
            <span className="px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-mono font-bold flex items-center space-x-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>ISO 9001:2015</span>
            </span>
          </div>
        </div>
      </div>

      {/* Status Alert Toast */}
      {saveStatus === 'success' && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center space-x-3 shadow-sm animate-fade-in text-xs sm:text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-900 rounded-2xl flex items-center space-x-3 shadow-sm animate-fade-in text-xs sm:text-sm font-semibold">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT 2 COLS: Profile & Contacts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card 1: Factory Profile */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">
                  {language === 'EN' ? 'Factory Identification & Legal Entity' : 'ফ্যাক্টরি পরিচিতি ও নিবন্ধন'}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    {language === 'EN' ? 'Factory Full Legal Name' : 'ফ্যাক্টরির পূর্ণ আইনি নাম'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.factoryName}
                    onChange={(e) => handleInputChange('factoryName', e.target.value)}
                    disabled={!isAdmin}
                    placeholder="e.g. Apex Sweater Mills Limited"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all disabled:opacity-70"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    {language === 'EN' ? 'BGMEA / BKMEA Reg. No.' : 'বিজিএমইএ / বিকেএমইএ নম্বর'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.registrationNumber}
                    onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                    disabled={!isAdmin}
                    placeholder="e.g. BGMEA-REG-20419"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all disabled:opacity-70"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    {language === 'EN' ? 'Tax ID / TIN / Trade License' : 'ট্যাক্স আইডি / টিআইএন নম্বর'}
                  </label>
                  <input
                    type="text"
                    value={formData.taxIdOrTin || ''}
                    onChange={(e) => handleInputChange('taxIdOrTin', e.target.value)}
                    disabled={!isAdmin}
                    placeholder="e.g. TIN-8931-4029-1029"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all disabled:opacity-70"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    {language === 'EN' ? 'Factory Slogan / Tagline' : 'ফ্যাক্টরি স্লোগান'}
                  </label>
                  <input
                    type="text"
                    value={formData.tagline || ''}
                    onChange={(e) => handleInputChange('tagline', e.target.value)}
                    disabled={!isAdmin}
                    placeholder="e.g. Excellence in Export Knitwear & Sustainable Quality Management"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all disabled:opacity-70"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    {language === 'EN' ? 'Established Year' : 'প্রতিষ্ঠা সাল'}
                  </label>
                  <input
                    type="text"
                    value={formData.establishedYear || ''}
                    onChange={(e) => handleInputChange('establishedYear', e.target.value)}
                    disabled={!isAdmin}
                    placeholder="e.g. 2008"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all disabled:opacity-70"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    {language === 'EN' ? 'Total Workforce & Capacity' : 'কর্মীবাহিনী ও যন্ত্রপাতি'}
                  </label>
                  <input
                    type="text"
                    value={formData.totalWorkforce || ''}
                    onChange={(e) => handleInputChange('totalWorkforce', e.target.value)}
                    disabled={!isAdmin}
                    placeholder="e.g. 1,850 Workers • 450 Computerized Knitting Machines"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all disabled:opacity-70"
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Plant Location & Contacts */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">
                  {language === 'EN' ? 'Factory Location & Official Contacts' : 'কারখানার ঠিকানা ও যোগাযোগ'}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    {language === 'EN' ? 'Plant Physical Address & Industrial Belt' : 'কারখানার পূর্ণ ঠিকানা'} *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={formData.factoryAddress}
                    onChange={(e) => handleInputChange('factoryAddress', e.target.value)}
                    disabled={!isAdmin}
                    placeholder="e.g. Plot 42-48, Industrial Estate, Board Bazar, Gazipur 1704, Bangladesh"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all disabled:opacity-70 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center space-x-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{language === 'EN' ? 'Official Phone' : 'টেলিফোন / মোবাইল'} *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    disabled={!isAdmin}
                    placeholder="+880 2-9298412"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all disabled:opacity-70"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center space-x-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{language === 'EN' ? 'Compliance Email' : 'ইমেইল'} *</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    disabled={!isAdmin}
                    placeholder="compliance@apexsweater.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all disabled:opacity-70"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center space-x-1">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span>{language === 'EN' ? 'Official Website' : 'ওয়েবসাইট'}</span>
                  </label>
                  <input
                    type="url"
                    value={formData.website || ''}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    disabled={!isAdmin}
                    placeholder="https://www.apexsweater-bd.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all disabled:opacity-70"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    {language === 'EN' ? 'Head of Quality & Compliance' : 'মান ও কমপ্লায়েন্স প্রধান'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.headOfQMS}
                    onChange={(e) => handleInputChange('headOfQMS', e.target.value)}
                    disabled={!isAdmin}
                    placeholder="Engr. Robiul Islam (Lead QMS Auditor)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all disabled:opacity-70"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{language === 'EN' ? 'Active Quality & Social Certifications' : 'সক্রিয় কোয়ালিটি ও সোশ্যাল সনদ'}</span>
                  </label>
                  <input
                    type="text"
                    value={formData.isoCertifications || ''}
                    onChange={(e) => handleInputChange('isoCertifications', e.target.value)}
                    disabled={!isAdmin}
                    placeholder="e.g. ISO 9001:2015, OEKO-TEX Standard 100, GOTS, WRAP Gold, Sedex SMETA"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all disabled:opacity-70"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT 1 COL: Factory Logo Management & Live Preview */}
          <div className="space-y-6">
            {/* Card 3: Logo Upload & Validation */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                <ImageIcon className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">
                  {language === 'EN' ? 'Factory Official Logo' : 'ফ্যাক্টরির অফিসিয়াল লোগো'}
                </h2>
              </div>

              {/* Logo Preview Frame */}
              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col items-center justify-center min-h-[140px] text-center relative group">
                {logoPreview ? (
                  <div className="flex flex-col items-center space-y-2">
                    <img
                      src={logoPreview}
                      alt="Factory Logo Preview"
                      className="max-h-20 max-w-full object-contain filter drop-shadow-md rounded"
                    />
                    {logoFileStats.sizeKb && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {logoFileStats.sizeKb} KB • {logoFileStats.dimensions?.width}x{logoFileStats.dimensions?.height}px
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-400 text-xs flex flex-col items-center space-y-1">
                    <ImageIcon className="w-8 h-8 text-slate-600" />
                    <span>{language === 'EN' ? 'No logo uploaded' : 'কোনো লোগো নেই'}</span>
                  </div>
                )}
              </div>

              {logoError && (
                <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl flex items-center space-x-1.5 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{logoError}</span>
                </div>
              )}

              {/* Upload Controls */}
              {isAdmin && (
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center space-x-2 transition-all min-h-[44px]"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{language === 'EN' ? 'Upload New Logo' : 'নতুন লোগো আপলোড'}</span>
                  </button>

                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={handleResetToDefaultLogo}
                      className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition-all min-h-[40px]"
                      title="Reset to default Apex Sweater logo"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      <span>{language === 'EN' ? 'Default Logo' : 'ডিফল্ট লোগো'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-xl flex items-center justify-center space-x-1 transition-all min-h-[40px]"
                      title="Clear logo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-tight pt-1">
                    Supported: <strong>PNG, JPG, SVG, WebP</strong>. Maximum file size: <strong>5MB</strong>.
                  </p>
                </div>
              )}
            </div>

            {/* Card 4: Live Branding Preview */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{language === 'EN' ? 'Report Header Preview' : 'রিপোর্ট হেডার প্রিভিউ'}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Live Sync</span>
              </div>

              {/* Miniature simulated document header */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 space-y-2">
                <div className="flex items-start justify-between gap-2 border-b border-slate-300 pb-2">
                  <div className="min-w-0">
                    <div className="font-extrabold text-xs text-slate-900 truncate">
                      {formData.factoryName || 'Factory Legal Name'}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {formData.factoryAddress || 'Factory Address'}
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                      Reg: {formData.registrationNumber || 'N/A'} • {formData.isoCertifications?.split(',')[0] || 'ISO 9001:2015'}
                    </div>
                  </div>
                  {logoPreview && (
                    <img
                      src={logoPreview}
                      alt="Mini Logo"
                      className="h-7 max-w-[80px] object-contain shrink-0"
                    />
                  )}
                </div>

                <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                  <span>Contact: {formData.contactPhone}</span>
                  <span className="font-bold text-blue-600">QMS Verified</span>
                </div>
              </div>
            </div>

            {/* Card 5: System Security & Evaluation Demo Mode */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                  <span>{language === 'EN' ? 'System Access & Demo Mode' : 'সিস্টেম এক্সেস ও ডেমো মোড'}</span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isDemoMode
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {isDemoMode ? 'Evaluation Active' : 'Production Enforced'}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'EN'
                  ? 'Demo Mode enables the credential selector on the login portal for authorized evaluation of Admin (admin), QMS Manager (qms.manager), Auditor (auditor), and Viewer (viewer) roles. Disable this in production to prevent demo credentials from being loaded.'
                  : 'ডেমো মোড চালু থাকলে লগইন স্ক্রিনে মূল অ্যাকাউন্টগুলোর এক্সেস প্যানেল প্রদর্শিত হয়। প্রোডাকশনে এটি বন্ধ রাখুন।'}
              </p>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800">
                    {language === 'EN' ? 'Login Credential Selector' : 'লগইন ক্রেডেনশিয়াল বার'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {isDemoMode
                      ? 'Active: Auto-fills login credentials for testing'
                      : 'Strict Security: Hidden from ordinary users in production'}
                  </div>
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    disabled={isTogglingDemo}
                    onClick={handleToggleDemo}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 min-h-[36px] ${
                      isDemoMode
                        ? 'bg-amber-600 hover:bg-amber-700 active:scale-95 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white'
                    }`}
                  >
                    {isDemoMode ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    <span>
                      {isTogglingDemo
                        ? 'Updating...'
                        : isDemoMode
                        ? 'Disable Demo Mode'
                        : 'Enable Demo Mode'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Save Bar */}
        {isAdmin && (
          <div className="sticky bottom-16 sm:bottom-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-xs text-slate-600">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                {language === 'EN'
                  ? 'Saving applies changes immediately across active audits, exports, and headers.'
                  : 'সংরক্ষণ করলে তাৎক্ষণিকভাবে সমগ্র সিস্টেমে তথ্য আপডেট হবে।'}
              </span>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setFormData({ ...settings })}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all min-h-[44px]"
              >
                {language === 'EN' ? 'Discard Changes' : 'বাতিল'}
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all min-h-[44px]"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? (language === 'EN' ? 'Saving...' : 'সংরক্ষণ হচ্ছে...') : (language === 'EN' ? 'Save Branding Settings' : 'ব্র্যান্ডিং সংরক্ষণ করুন')}</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
