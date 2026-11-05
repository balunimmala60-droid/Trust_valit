import React from 'react';
import { User, VaultDocument } from '../types';
import { formatBytes } from '../services/crypto';
import { X, ShieldCheck, Download, FileText } from 'lucide-react';

interface DocumentPreviewModalProps {
  document: VaultDocument;
  currentUser: User;
  onClose: () => void;
  onDownload: (doc: VaultDocument) => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document,
  currentUser,
  onClose,
  onDownload
}) => {
  const currentTimestamp = new Date().toISOString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#132238] border border-[#334155] rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="p-4 border-b border-[#334155] flex items-center justify-between bg-[#0D1B2A] text-white">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-bold text-cyan-300 bg-[#1B2D45] px-2 py-0.5 rounded border border-[#334155]">
                  Zero-Trust Enclave Preview
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {formatBytes(document.sizeBytes)}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white tracking-tight truncate max-w-md">
                {document.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => onDownload(document)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1B2D45] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Security Banner */}
        <div className="bg-[#0D1B2A] border-b border-[#334155] px-4 py-2 flex items-center justify-between text-[11px] text-slate-300">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Watermarked session logged in audit ledger. Document integrity verified:</span>
            <span className="font-mono font-bold text-cyan-300">{document.integrityHash.substring(0, 16)}...</span>
          </div>
          <div className="hidden sm:block text-slate-400 font-mono text-[10px]">
            Viewer: {currentUser.email}
          </div>
        </div>

        {/* Watermarked Document Preview Canvas */}
        <div className="p-8 overflow-y-auto flex-1 bg-[#081426] relative select-none">
          {/* Repeating Diagonal Watermark Pattern */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.07] flex flex-wrap gap-24 p-8 overflow-hidden">
            {Array.from({ length: 24 }).map((_, idx) => (
              <div key={idx} className="rotate-[-25deg] text-base font-bold font-mono text-cyan-300 whitespace-nowrap">
                TRUSTVAULT CONFIDENTIAL • {currentUser.email} • {currentTimestamp.substring(0, 10)}
              </div>
            ))}
          </div>

          {/* Document Content Container */}
          <div className="max-w-2xl mx-auto bg-[#132238] border border-[#334155] rounded-xl p-8 shadow-xl relative z-10 space-y-6 text-slate-200">
            <div className="border-b border-[#334155] pb-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-bold uppercase tracking-wider text-cyan-400">
                  {document.category} Document • Classified
                </span>
                <span className="font-mono font-bold text-white">v{document.currentVersion}.0</span>
              </div>
              <h1 className="text-xl font-black text-white">{document.title}</h1>
              <p className="text-xs text-slate-400 mt-1">Author / Owner: {document.ownerName}</p>
            </div>

            <div className="text-sm leading-relaxed text-slate-200 space-y-4">
              <p className="font-medium text-white">
                {document.description}
              </p>

              <div className="p-4 rounded-lg bg-[#0D1B2A] border border-[#334155] font-mono text-xs text-cyan-300 leading-normal">
                {document.contentPreview || (
                  `DOCUMENT PAYLOAD CONTENTS: This document is encrypted at rest using AES-256-GCM. Decrypted stream verified with SHA-256 integrity hash: ${document.integrityHash}. Zero-trust policy validated by Centralized Decision Engine.`
                )}
              </div>

              <div className="space-y-2 pt-4 border-t border-[#334155] text-xs text-slate-300">
                <div className="font-bold text-white">Security Covenants & Access Boundaries:</div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>This document is proprietary and governed by confidentiality agreements.</li>
                  <li>Permission is granted on a least-privilege basis and may be revoked immediately without notice.</li>
                  <li>All viewing, downloading, and access attempts are cryptographically hashed into the audit ledger.</li>
                </ul>
              </div>
            </div>

            <div className="pt-6 border-t border-[#334155] flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span className="text-cyan-300">SHA-256: {document.integrityHash.substring(0, 24)}...</span>
              <span>Storage UUID: {document.storageIdentifier.substring(0, 18)}...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
