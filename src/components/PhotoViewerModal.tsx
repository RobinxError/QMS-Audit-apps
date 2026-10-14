import React from 'react';
import { X, Calendar, User, Tag, Download } from 'lucide-react';
import { PhotoAttachment } from '../types/audit';

interface PhotoViewerModalProps {
  photo: PhotoAttachment | null;
  onClose: () => void;
}

export const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({ photo, onClose }) => {
  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl text-white">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  photo.type === 'After'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}
              >
                {photo.type === 'After' ? 'After-Action Proof' : 'Audit Non-Compliance Evidence'}
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {photo.id}</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white mt-1">
              {photo.caption || 'Inspection Photograph'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Photo Container */}
        <div className="p-4 bg-black flex items-center justify-center max-h-[60vh] overflow-hidden">
          <img
            src={photo.url}
            alt={photo.caption}
            className="max-h-[55vh] max-w-full object-contain rounded-lg"
          />
        </div>

        {/* Metadata Footer */}
        <div className="p-4 bg-slate-900 text-xs text-slate-300 space-y-2 border-t border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-4">
              <span className="flex items-center text-slate-400">
                <Tag className="w-3.5 h-3.5 mr-1 text-blue-400" />
                Section: <strong className="text-white ml-1">{photo.sectionName}</strong>
              </span>

              <span className="flex items-center text-slate-400">
                <User className="w-3.5 h-3.5 mr-1 text-amber-400" />
                Auditor: <strong className="text-white ml-1">{photo.auditorName}</strong>
              </span>

              <span className="flex items-center text-slate-400 font-mono">
                <Calendar className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                {photo.timestamp}
              </span>
            </div>

            <a
              href={photo.url}
              download={`Evidence_${photo.id}.jpg`}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
          </div>

          {photo.evidenceNotes && (
            <div className="p-2.5 bg-slate-800/60 rounded-lg text-slate-300 text-[11px]">
              <strong className="text-white">Evidence Notes:</strong> {photo.evidenceNotes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
