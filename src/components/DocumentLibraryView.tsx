import React, { useState } from 'react';
import { User, VaultDocument, DocumentPermission, AuditRecord } from '../types';
import { PermissionDecisionEngine } from '../services/permissionEngine';
import { formatBytes } from '../services/crypto';
import { DocumentCopilotModal } from './DocumentCopilotModal';
import {
  FileText,
  Search,
  Filter,
  Lock,
  Unlock,
  ShieldCheck,
  Download,
  Eye,
  Plus,
  KeyRound,
  Trash2,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

interface DocumentLibraryViewProps {
  currentUser: User;
  documents: VaultDocument[];
  permissions: DocumentPermission[];
  auditEvents: AuditRecord[];
  onOpenUpload: () => void;
  onSelectDocument: (doc: VaultDocument) => void;
  onPreviewDocument: (doc: VaultDocument) => void;
  onDownloadDocument: (doc: VaultDocument) => void;
  onRequestAccess: (doc: VaultDocument) => void;
  onDeleteDocument: (docId: string) => void;
  onRevokePermission?: (permId: string) => void;
  onGoToFullCopilot?: (docId: string) => void;
}

export const DocumentLibraryView: React.FC<DocumentLibraryViewProps> = ({
  currentUser,
  documents,
  permissions,
  auditEvents,
  onOpenUpload,
  onSelectDocument,
  onPreviewDocument,
  onDownloadDocument,
  onRequestAccess,
  onDeleteDocument,
  onRevokePermission,
  onGoToFullCopilot
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'owned' | 'shared'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Copilot inspector modal state
  const [copilotDoc, setCopilotDoc] = useState<VaultDocument | null>(null);

  // Direct Delete confirmation modal state
  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState<VaultDocument | null>(null);

  const getPermissionForDoc = (doc: VaultDocument): DocumentPermission | undefined => {
    return permissions.find(p => p.documentId === doc.id && p.userId === currentUser.id);
  };

  const accessibleDocuments = documents.filter(doc => {
    const isOwner = doc.ownerId === currentUser.id;
    const perm = getPermissionForDoc(doc);
    const isAdmin = currentUser.role === 'ADMIN';

    if (filterTab === 'owned') return isOwner;
    if (filterTab === 'shared') return !isOwner && !!perm;
    if (isAdmin) return true;
    return isOwner || !!perm;
  });

  const filteredDocuments = accessibleDocuments.filter(doc => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'All' || doc.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const categories = ['All', 'Financial', 'Legal', 'Technical', 'Security', 'General'];

  const confirmDelete = () => {
    if (!deleteConfirmDoc) return;
    onDeleteDocument(deleteConfirmDoc.id);
    setDeleteConfirmDoc(null);
  };

  return (
    <div className="space-y-6">
      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center space-x-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>Document Repository & Security Passports</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Zero-trust storage with SHA-256 integrity fingerprints, access control boundaries, and versioning.
          </p>
        </div>

        {currentUser.role === 'OWNER' && (
          <button
            onClick={onOpenUpload}
            className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all flex items-center space-x-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New Document</span>
          </button>
        )}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#132238] p-4 rounded-2xl border border-[#334155] shadow-sm">
        <div className="flex items-center space-x-2">
          {[
            { id: 'all', label: 'All Accessible' },
            { id: 'owned', label: 'My Documents' },
            { id: 'shared', label: 'Shared With Me' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-[#1B2D45]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Category Dropdown */}
          <div className="flex items-center space-x-1.5 bg-[#0D1B2A] px-3 py-1.5 rounded-lg border border-[#334155] text-xs text-white">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-transparent border-none text-white focus:outline-none text-xs font-medium"
            >
              {categories.map(c => (
                <option key={c} value={c} className="bg-[#0D1B2A] text-white">
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search title, tags, description..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#0D1B2A] border border-[#334155] rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>
      </div>

      {/* Document Grid */}
      {filteredDocuments.length === 0 ? (
        <div className="p-12 text-center bg-[#132238] rounded-2xl border border-[#334155] shadow-sm">
          <FileText className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white">No Documents Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Zero-trust access policy strictly confines visibility to documents you own or that have been explicitly delegated to your identity.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocuments.map(doc => {
            const isOwner = doc.ownerId === currentUser.id;
            const perm = getPermissionForDoc(doc);
            const canRead = PermissionDecisionEngine.evaluate(currentUser, doc, 'READ', perm).allowed;
            const isRevoked = perm?.status === 'REVOKED';

            return (
              <div
                key={doc.id}
                className="bg-[#132238] border border-[#334155] hover:border-blue-500/50 rounded-2xl p-5 shadow-sm flex flex-col justify-between transition-all hover:shadow-md group"
              >
                <div>
                  {/* Category & Status Badges */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0D1B2A] text-cyan-300 border border-[#334155] uppercase tracking-wider font-mono">
                      {doc.category}
                    </span>

                    <div>
                      {isOwner ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0D1B2A] text-cyan-300 border border-[#334155]">
                          OWNER
                        </span>
                      ) : isRevoked ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1e3a8a] text-cyan-200 border border-blue-400 flex items-center space-x-1">
                          <Unlock className="w-3 h-3" />
                          <span>REVOKED</span>
                        </span>
                      ) : perm ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
                          <Lock className="w-3 h-3" />
                          <span>{perm.permissionLevel} GRANTED</span>
                        </span>
                      ) : currentUser.role === 'ADMIN' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1B2D45] text-slate-300 border border-[#334155]">
                          ADMIN (AUDIT ONLY)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0D1B2A] text-slate-400 border border-[#334155]">
                          UNSHARED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Document Title & Description */}
                  <h3
                    onClick={() => onSelectDocument(doc)}
                    className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors cursor-pointer line-clamp-1"
                    title={doc.title}
                  >
                    {doc.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2 min-h-[32px]">
                    {doc.description || 'No description provided.'}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {doc.tags.map(t => (
                      <span key={t} className="text-[10px] text-slate-300 bg-[#0D1B2A] px-2 py-0.5 rounded border border-[#334155]">
                        #{t}
                      </span>
                    ))}
                  </div>

                  {/* Document Integrity & Metadata */}
                  <div className="mt-4 pt-3 border-t border-[#334155] space-y-1.5 text-[11px] text-slate-300 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">SHA-256 Hash:</span>
                      <span className="text-cyan-300 font-mono font-medium" title={doc.integrityHash}>
                        {doc.integrityHash.substring(0, 12)}...
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Size & Ver:</span>
                      <span className="text-slate-300">{formatBytes(doc.sizeBytes)} • v{doc.currentVersion}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Owner:</span>
                      <span className="text-white font-sans font-medium truncate max-w-[140px]">{doc.ownerName}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="mt-5 pt-3 border-t border-[#334155] flex items-center justify-between gap-1.5 flex-wrap">
                  {/* Passport Details */}
                  <button
                    onClick={() => onSelectDocument(doc)}
                    className="py-1.5 px-2.5 rounded-lg bg-[#1B2D45] hover:bg-[#223859] text-slate-200 text-xs font-semibold transition-all flex items-center justify-center space-x-1 border border-[#334155]"
                    title="View Full Document Security Passport"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Passport</span>
                  </button>

                  {/* OWNER ONLY: Ask Copilot (who viewed & what changes done) */}
                  {isOwner && (
                    <button
                      onClick={() => setCopilotDoc(doc)}
                      className="py-1.5 px-2.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 border border-cyan-400/60 text-cyan-200 hover:text-white text-xs font-bold transition-all flex items-center space-x-1"
                      title="Ask Copilot: See who viewed, what changes were made, and inspect document activity"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                      <span>Ask Copilot</span>
                    </button>
                  )}

                  {/* OWNER ONLY: 1-Click Revoke (if active delegations exist) */}
                  {isOwner && permissions.some(p => p.documentId === doc.id && p.status === 'ACTIVE') && (
                    <button
                      onClick={() => {
                        const activePerms = permissions.filter(p => p.documentId === doc.id && p.status === 'ACTIVE');
                        if (activePerms.length > 0 && onRevokePermission) {
                          activePerms.forEach(p => onRevokePermission(p.id));
                        }
                      }}
                      className="py-1.5 px-2 rounded-lg bg-[#1e3a8a] hover:bg-blue-900 border border-blue-500 text-cyan-200 hover:text-white text-xs font-bold transition-all flex items-center space-x-1"
                      title="Immediate 0ms Revoke: Sever all external delegations for this document immediately"
                    >
                      <Unlock className="w-3.5 h-3.5 text-cyan-300" />
                      <span>Revoke</span>
                    </button>
                  )}

                  {/* OWNER ONLY: Delete Document Whenever Desired */}
                  {isOwner && (
                    <button
                      onClick={() => setDeleteConfirmDoc(doc)}
                      className="py-1.5 px-2 rounded-lg bg-[#1B2D45] hover:bg-rose-950 border border-blue-400/40 hover:border-blue-400 text-cyan-300 hover:text-white text-xs font-semibold transition-all flex items-center space-x-1"
                      title="Permanently delete this document from storage and append deletion to audit chain"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  )}

                  {/* Viewer / Reader Actions */}
                  {canRead ? (
                    <>
                      <button
                        onClick={() => onPreviewDocument(doc)}
                        className="py-1.5 px-2 rounded-lg bg-[#1B2D45] hover:bg-[#223859] border border-[#334155] text-slate-200 text-xs font-semibold transition-all flex items-center space-x-1 shadow-sm"
                        title="Secure Watermarked Preview"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="hidden sm:inline">Preview</span>
                      </button>

                      <button
                        onClick={() => onDownloadDocument(doc)}
                        className="py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all flex items-center space-x-1 shadow-md"
                        title="Authorized Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Download</span>
                      </button>
                    </>
                  ) : isRevoked ? (
                    <button
                      onClick={() => onDownloadDocument(doc)}
                      className="py-1.5 px-2.5 rounded-lg bg-[#1e3a8a] hover:bg-blue-900 border border-blue-400 text-cyan-200 text-xs font-semibold transition-all flex items-center space-x-1"
                      title="Attempt Download to Verify Revocation Rejection"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Test Revocation</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onRequestAccess(doc)}
                      className="py-1.5 px-2.5 rounded-lg bg-[#1B2D45] hover:bg-[#223859] border border-[#334155] text-slate-200 text-xs font-semibold transition-all flex items-center space-x-1 shadow-sm"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Request Access</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Document Copilot Inspector Modal */}
      {copilotDoc && (
        <DocumentCopilotModal
          document={copilotDoc}
          currentUser={currentUser}
          auditEvents={auditEvents}
          permissions={permissions}
          onClose={() => setCopilotDoc(null)}
          onGoToFullCopilot={(docId) => {
            setCopilotDoc(null);
            if (onGoToFullCopilot) onGoToFullCopilot(docId);
          }}
        />
      )}

      {/* Direct Delete Confirmation Modal */}
      {deleteConfirmDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#132238] border border-[#334155] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-xs text-white">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Document</h3>
                <span className="text-[10px] text-cyan-300 font-mono font-bold tracking-wider">IMMUTABLE AUDIT PURGE</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0D1B2A] border border-[#334155] text-slate-200 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">'{deleteConfirmDoc.title}'</strong>?
              This will remove the file from active storage and record a permanent deletion event in the SHA-256 audit chain.
            </div>

            <div className="flex items-center justify-end space-x-2.5 pt-2">
              <button
                onClick={() => setDeleteConfirmDoc(null)}
                className="px-4 py-2 rounded-lg bg-[#1B2D45] hover:bg-[#223859] text-slate-300 hover:text-white font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-md transition-all flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Deletion</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
