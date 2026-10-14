import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, ArrowUpDown, Layers, Save, AlertCircle } from 'lucide-react';
import { AuditSection, UserRole } from '../types/audit';

interface SectionsConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections: AuditSection[];
  setSections: React.Dispatch<React.SetStateAction<AuditSection[]>>;
  userRole: UserRole;
}

export const SectionsConfigModal: React.FC<SectionsConfigModalProps> = ({
  isOpen,
  onClose,
  sections,
  setSections,
  userRole,
}) => {
  const [editingSec, setEditingSec] = useState<AuditSection | null>(null);
  const [nameEn, setNameEn] = useState<string>('');
  const [nameBn, setNameBn] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [weight, setWeight] = useState<number>(1.0);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleStartEdit = (sec: AuditSection) => {
    setEditingSec(sec);
    setNameEn(sec.name);
    setNameBn(sec.nameBn);
    setDescription(sec.description);
    setWeight(sec.defaultWeight || 1.0);
    setIsAddingNew(false);
  };

  const handleStartAdd = () => {
    setEditingSec(null);
    setNameEn('');
    setNameBn('');
    setDescription('');
    setWeight(1.0);
    setIsAddingNew(true);
  };

  const handleSave = () => {
    if (!nameEn.trim()) {
      alert('Section name cannot be empty.');
      return;
    }

    if (isAddingNew) {
      const newSec: AuditSection = {
        id: 'sec-' + Date.now(),
        name: nameEn,
        nameBn: nameBn || nameEn,
        description: description || 'Factory quality section',
        defaultWeight: Number(weight) || 1.0,
        order: sections.length + 1,
        isMandatory: true,
      };
      setSections([...sections, newSec]);
      setIsAddingNew(false);
    } else if (editingSec) {
      setSections(
        sections.map((s) =>
          s.id === editingSec.id
            ? {
                ...s,
                name: nameEn,
                nameBn: nameBn || s.nameBn,
                description,
                defaultWeight: Number(weight) || 1.0,
              }
            : s
        )
      );
      setEditingSec(null);
    }
  };

  const handleDelete = (secId: string) => {
    if (sections.length <= 1) {
      alert('Cannot delete all sections. Factory must have at least one audit module.');
      return;
    }
    if (confirm('Are you sure you want to remove this factory section?')) {
      setSections(sections.filter((s) => s.id !== secId));
      if (editingSec?.id === secId) setEditingSec(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 my-4 sm:my-8 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Configure Factory Audit Sections (19 Modules)
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 mt-2">
          Add, rename, re-weight, or adjust audit modules according to specific factory configurations (e.g. Jacquard vs Semi-auto knitting, rotary printing, garment dye).
        </p>

        {/* Section Edit / Add Form */}
        {(editingSec || isAddingNew) && (
          <div className="mt-4 p-4 bg-blue-50/60 rounded-xl border border-blue-200 text-xs space-y-3">
            <div className="font-bold text-blue-900">
              {isAddingNew ? 'Add New Factory Section' : `Edit Section: ${editingSec?.name}`}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Section Name (English) *</label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Section Name (বাংলা)</label>
                <input
                  type="text"
                  value={nameBn}
                  onChange={(e) => setNameBn(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Process Scope & Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Weight Multiplier (1.0 - 2.0)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="3.0"
                  value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:outline-none font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => {
                  setEditingSec(null);
                  setIsAddingNew(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-white text-slate-700 border border-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 flex items-center space-x-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Section</span>
              </button>
            </div>
          </div>
        )}

        {/* Existing Sections List */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">
            Current Sections ({sections.length})
          </span>
          {!isAddingNew && !editingSec && (
            <button
              onClick={handleStartAdd}
              className="px-3 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Section</span>
            </button>
          )}
        </div>

        <div className="mt-2 border border-slate-200 rounded-lg overflow-hidden max-h-80 overflow-y-auto text-xs">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
              <tr>
                <th scope="col" className="p-2.5 text-left">#</th>
                <th scope="col" className="p-2.5 text-left">Section Name</th>
                <th scope="col" className="p-2.5 text-center">Weight</th>
                <th scope="col" className="p-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {sections.map((sec, idx) => (
                <tr key={sec.id} className="hover:bg-slate-50">
                  <td className="p-2.5 font-mono text-slate-400">{idx + 1}</td>
                  <td className="p-2.5">
                    <span className="font-bold text-slate-900">{sec.name}</span>
                    <span className="text-slate-500 font-bengali ml-2">({sec.nameBn})</span>
                    <div className="text-[11px] text-slate-400 truncate max-w-md">{sec.description}</div>
                  </td>
                  <td className="p-2.5 text-center font-bold text-slate-700 font-mono">
                    {sec.defaultWeight}x
                  </td>
                  <td className="p-2.5 text-right space-x-1">
                    <button
                      onClick={() => handleStartEdit(sec)}
                      className="p-1 text-slate-500 hover:text-blue-600 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(sec.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
