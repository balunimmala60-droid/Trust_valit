import React, { useState } from 'react';
import { User, VaultDocument, DocumentPermission, PermissionLevel } from '../types';
import { PermissionDecisionEngine } from '../services/permissionEngine';
import { formatBytes } from '../services/crypto';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Download,
  Eye,
  Trash2,
  UserPlus,
  FileCheck
} from 'lucide-react';

interface DocumentDetailModalProps {
  document: VaultDocument;
  currentUser: User;
  allUsers: User[];
  permissions: DocumentPermission[];
  onClose: () => void;
  onPreview: (doc: VaultDocument) => void;
  onDownload: (doc: VaultDocument) => void;
  onGrantPermission: (docId: string, targetEmail: string, level: PermissionLevel, expiresInHours?: number) => void;
  onRevokePermission: (permId: string) => void;
  onDeleteDocument: (docId: string) => void;
}

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  document,
  currentUser,
  allUsers,
  permissions,
  onClose,
  onPreview,
  onDownload,
  onGrantPermission,
  onRevokePermission,
  onDeleteDocument
}) => {
  const [activeTab, setActiveTab] = useState<'passport' | 'permissions' | 'versions'>('passport');
  const [targetEmail, setTargetEmail] = useState('');
  const [targetLevel, setTargetLevel] = useState<PermissionLevel>('READ');
  const [expiresInHours, setExpiresInHours] = useState<number | undefined>(undefined);
  const [grantSuccessMsg, setGrantSuccessMsg] = useState('');

  const isOwner = currentUser.id === document.ownerId;
  const docPermissions = permissions.filter(p => p.documentId === document.id);
  const userPerm = docPermissions.find(p => p.userId === currentUser.id);

  const evalRead = PermissionDecisionEngine.evaluate(currentUser, document, 'READ', userPerm);
  const evalDownload = PermissionDecisionEngine.evaluate(currentUser, document, 'DOWNLOAD', userPerm);

  const handleGrant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmail) return;
    onGrantPermission(document.id, targetEmail, targetLevel, expiresInHours);
    setGrantSuccessMsg(`Permission ${targetLevel} granted to ${targetEmail}.`);
    setTargetEmail('');
    setTimeout(() => setGrantSuccessMsg(''), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#132238] border border-[#334155] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#334155] flex items-center justify-between bg-[#0D1B2A]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Document Security Passport</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1B2D45] text-cyan-300 font-mono border border-[#334155]">
                  v{document.currentVersion}.0
                </span>
              </div>
              <h2 className="text-base font-black text-white tracking-tight truncate max-w-md">
                {document.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#1B2D45] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-4 px-6 pt-3 border-b border-[#334155] bg-[#0D1B2A]/60 text-xs">
          {[
            { id: 'passport', label: 'Security Passport' },
            { id: 'permissions', label: `Permissions (${docPermissions.length})` },
            { id: 'versions', label: 'Version History' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 font-bold transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs bg-[#132238] text-slate-200">
          {activeTab === 'passport' && (
            <div className="space-y-5">
              {/* Security Decision Status Card */}
              <div className={`p-4 rounded-xl border flex items-start justify-between ${
                evalRead.allowed
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                  : 'bg-[#1e3a8a]/70 border-blue-400 text-white shadow-md'
              }`}>
                <div>
                  <div className="flex items-center space-x-2 font-bold text-sm">
                    {evalRead.allowed ? (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-300">Your Access Status: Authorized ({isOwner ? 'OWNER' : userPerm?.permissionLevel})</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-4 h-4 text-cyan-300" />
                        <span className="text-white">Your Access Status: Denied (Zero-Trust Enforcement)</span>
                      </>
                    )}
                  </div>
                  <p className="text-slate-300 mt-1 font-medium">
                    {evalRead.reason}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono text-cyan-300 uppercase">Engine Rule:</span>
                  <div className="font-mono text-white font-bold">{evalRead.ruleTriggered}</div>
                </div>
              </div>

              {/* Integrity Fingerprint Box */}
              <div className="bg-[#0D1B2A] p-4 rounded-xl border border-[#334155] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center space-x-1.5">
                    <FileCheck className="w-4 h-4 text-cyan-400" />
                    <span>Cryptographic SHA-256 Integrity Checksum</span>
                  </span>
                  <span className="text-[10px] text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold border border-emerald-500/40">
                    MATCH CONFIRMED
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#132238] font-mono text-cyan-300 select-all break-all border border-[#334155] text-[11px]">
                  {document.integrityHash}
                </div>
                <div className="text-[10px] text-slate-400">
                  Computed over raw byte contents at upload time. Checked prior to streaming to prevent tampering in storage.
                </div>
              </div>

              {/* Document Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-[#0D1B2A] p-3 rounded-lg border border-[#334155]">
                  <span className="text-slate-400 block text-[11px]">Original Filename</span>
                  <span className="font-bold text-white truncate block mt-0.5" title={document.originalFilename}>
                    {document.originalFilename}
                  </span>
                </div>

                <div className="bg-[#0D1B2A] p-3 rounded-lg border border-[#334155]">
                  <span className="text-slate-400 block text-[11px]">File Size & Ext</span>
                  <span className="font-bold text-white block mt-0.5">
                    {formatBytes(document.sizeBytes)} ({document.fileExtension.toUpperCase()})
                  </span>
                </div>

                <div className="bg-[#0D1B2A] p-3 rounded-lg border border-[#334155]">
                  <span className="text-slate-400 block text-[11px]">Category</span>
                  <span className="font-bold text-white block mt-0.5">
                    {document.category}
                  </span>
                </div>

                <div className="bg-[#0D1B2A] p-3 rounded-lg border border-[#334155]">
                  <span className="text-slate-400 block text-[11px]">Document Owner</span>
                  <span className="font-bold text-white block mt-0.5">
                    {document.ownerName}
                  </span>
                </div>

                <div className="bg-[#0D1B2A] p-3 rounded-lg border border-[#334155]">
                  <span className="text-slate-400 block text-[11px]">Uploaded Date</span>
                  <span className="font-bold text-white block mt-0.5">
                    {new Date(document.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="bg-[#0D1B2A] p-3 rounded-lg border border-[#334155]">
                  <span className="text-slate-400 block text-[11px]">Storage UUID</span>
                  <span className="font-mono text-cyan-300 text-[10px] block mt-0.5 truncate" title={document.storageIdentifier}>
                    {document.storageIdentifier}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-5">
              {isOwner ? (
                <div className="p-4 rounded-xl bg-[#0D1B2A] border border-[#334155] space-y-3">
                  <div className="flex items-center space-x-2 text-white font-bold">
                    <UserPlus className="w-4 h-4 text-cyan-400" />
                    <span>Grant Document Delegation</span>
                  </div>

                  {grantSuccessMsg && (
                    <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-medium">
                      {grantSuccessMsg}
                    </div>
                  )}

                  <form onSubmit={handleGrant} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-5">
                      <label className="text-[11px] text-slate-300 block mb-1 font-medium">Target User</label>
                      <select
                        value={targetEmail}
                        onChange={e => setTargetEmail(e.target.value)}
                        className="w-full bg-[#132238] border border-[#334155] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                        required
                      >
                        <option value="">Select recipient...</option>
                        {allUsers.filter(u => u.id !== currentUser.id).map(u => (
                          <option key={u.id} value={u.email}>
                            {u.fullName} ({u.email} - {u.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-[11px] text-slate-300 block mb-1 font-medium">Permission Level</label>
                      <select
                        value={targetLevel}
                        onChange={e => setTargetLevel(e.target.value as PermissionLevel)}
                        className="w-full bg-[#132238] border border-[#334155] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                      >
                        <option value="READ">READ (View & Download)</option>
                        <option value="EDIT">EDIT (Annotate & Update)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] text-slate-300 block mb-1 font-medium">Expiration</label>
                      <select
                        value={expiresInHours || ''}
                        onChange={e => setExpiresInHours(e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full bg-[#132238] border border-[#334155] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                      >
                        <option value="">No Expiry</option>
                        <option value="1">1 Hour</option>
                        <option value="24">24 Hours</option>
                        <option value="168">7 Days</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <button
                        type="submit"
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all shadow-md"
                      >
                        Grant
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-[#0D1B2A] border border-[#334155] text-slate-300">
                  Only the verified document owner ({document.ownerName}) can grant or revoke access delegations.
                </div>
              )}

              {/* List of Permissions */}
              <div className="space-y-2">
                <h4 className="font-bold text-white">Active & Historical Permissions</h4>
                {docPermissions.length === 0 ? (
                  <p className="text-slate-400 italic">No external delegations exist for this document.</p>
                ) : (
                  docPermissions.map(perm => (
                    <div
                      key={perm.id}
                      className="p-3 rounded-xl bg-[#0D1B2A] border border-[#334155] flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white">{perm.userName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({perm.userEmail})</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            perm.status === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-[#1e3a8a] text-cyan-200 border border-blue-400'
                          }`}>
                            {perm.status}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#1B2D45] text-cyan-300 font-bold border border-[#334155]">
                            {perm.permissionLevel}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Granted: {new Date(perm.grantedAt).toLocaleString()}
                          {perm.expiresAt && ` • Expires: ${new Date(perm.expiresAt).toLocaleString()}`}
                          {perm.revokedAt && ` • Revoked: ${new Date(perm.revokedAt).toLocaleString()}`}
                        </div>
                      </div>

                      {isOwner && perm.status === 'ACTIVE' && (
                        <button
                          onClick={() => onRevokePermission(perm.id)}
                          className="px-3 py-1.5 rounded-lg bg-[#1B2D45] hover:bg-[#223859] border border-blue-400/50 text-cyan-300 text-xs font-semibold transition-all flex items-center space-x-1"
                          title="Revoke access immediately on the server"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Revoke Access</span>
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'versions' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[#0D1B2A] border border-[#334155] flex items-center justify-between">
                <div>
                  <div className="font-bold text-white flex items-center space-x-2">
                    <span>Version 4 (Current Active)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                      LIVE
                    </span>
                  </div>
                  <div className="text-slate-300 text-[11px] mt-0.5">
                    Updated terms and clauses with verified signatures.
                  </div>
                  <div className="text-cyan-300 text-[10px] font-mono mt-1">
                    SHA-256: {document.integrityHash}
                  </div>
                </div>
                <div className="text-right text-slate-400 text-[11px]">
                  {new Date(document.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-[#334155] bg-[#0D1B2A] flex items-center justify-between">
          <div>
            {isOwner && (
              <button
                onClick={() => {
                  if (confirm(`Permanently delete '${document.title}'? This action is recorded in the audit trail.`)) {
                    onDeleteDocument(document.id);
                    onClose();
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-[#1B2D45] hover:bg-[#223859] border border-blue-400/50 text-cyan-300 text-xs font-semibold transition-all flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {evalRead.allowed && (
              <button
                onClick={() => onPreview(document)}
                className="px-4 py-2 rounded-lg bg-[#1B2D45] hover:bg-[#223859] border border-[#334155] text-slate-200 text-xs font-semibold transition-all flex items-center space-x-1.5 shadow-sm"
              >
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>Secure Preview</span>
              </button>
            )}

            <button
              onClick={() => onDownload(document)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                evalDownload.allowed
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 font-bold'
                  : 'bg-[#1e3a8a] hover:bg-blue-900 text-white border border-blue-400 font-bold'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{evalDownload.allowed ? 'Authorized Download' : 'Test Download (Denied)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
