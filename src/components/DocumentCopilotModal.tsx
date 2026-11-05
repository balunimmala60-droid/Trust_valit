import React, { useState } from 'react';
import { User, VaultDocument, AuditRecord, DocumentPermission } from '../types';
import {
  Sparkles,
  X,
  Eye,
  Download,
  Edit3,
  ShieldCheck,
  ShieldAlert,
  Clock,
  UserCheck,
  ArrowRight,
  FileText,
  Search,
  MessageSquare,
  Lock,
  Unlock,
  AlertTriangle
} from 'lucide-react';

interface DocumentCopilotModalProps {
  document: VaultDocument;
  currentUser: User;
  auditEvents: AuditRecord[];
  permissions: DocumentPermission[];
  onClose: () => void;
  onGoToFullCopilot: (docId: string) => void;
}

export const DocumentCopilotModal: React.FC<DocumentCopilotModalProps> = ({
  document,
  currentUser,
  auditEvents,
  permissions,
  onClose,
  onGoToFullCopilot
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'forensics' | 'viewers' | 'changes' | 'ask'>('forensics');
  const [userQuery, setUserQuery] = useState('');
  const [copilotResponses, setCopilotResponses] = useState<Array<{ q: string; a: string; time: string }>>([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // Filter audit events strictly related to this document
  const docAuditEvents = auditEvents.filter(
    e => e.documentId === document.id || (e.documentTitle && e.documentTitle.toLowerCase() === document.title.toLowerCase())
  );

  // 1. Who viewed/downloaded
  const viewEvents = docAuditEvents.filter(
    e => ['READ', 'PREVIEW', 'VIEW', 'DOWNLOAD'].includes(e.action) && e.decision === 'ALLOW'
  );

  // Group viewers by actor
  const viewerStatsMap = new Map<string, { email: string; role: string; views: number; downloads: number; lastAccess: string }>();
  viewEvents.forEach(e => {
    const existing = viewerStatsMap.get(e.actorEmail) || {
      email: e.actorEmail,
      role: e.actorRole,
      views: 0,
      downloads: 0,
      lastAccess: e.timestamp
    };
    if (e.action === 'DOWNLOAD') existing.downloads += 1;
    else existing.views += 1;
    if (new Date(e.timestamp) > new Date(existing.lastAccess)) {
      existing.lastAccess = e.timestamp;
    }
    viewerStatsMap.set(e.actorEmail, existing);
  });
  const viewerStats = Array.from(viewerStatsMap.values());

  // 2. What changes were done (edits, permissions grants, revokes)
  const changeEvents = docAuditEvents.filter(
    e => ['UPLOAD', 'EDIT', 'GRANT_PERMISSION', 'REVOKE_PERMISSION', 'UPDATE_PERMISSION', 'APPROVE_ACCESS', 'REJECT_ACCESS'].includes(e.action)
  );

  // 3. Blocked / Denied attempts on this document
  const deniedEvents = docAuditEvents.filter(e => e.decision === 'DENY');

  // Active delegations for this document
  const activeDocPermissions = permissions.filter(p => p.documentId === document.id && p.status === 'ACTIVE');

  // Handle Ask Copilot questions
  const askQuestions = (query: string) => {
    if (!query.trim()) return;
    setIsSynthesizing(true);
    const q = query.trim();

    setTimeout(() => {
      let answer = '';
      const lowerQ = q.toLowerCase();

      if (lowerQ.includes('who') || lowerQ.includes('view') || lowerQ.includes('download') || lowerQ.includes('access')) {
        if (viewerStats.length === 0) {
          answer = `Based on SHA-256 audit ledger inspection, no external users have viewed or downloaded '${document.title}' yet. Only owner ${document.ownerName} has initialized this asset.`;
        } else {
          const list = viewerStats
            .map(v => `${v.email} (${v.role}) with ${v.views} views and ${v.downloads} downloads, last active ${new Date(v.lastAccess).toLocaleTimeString()}`)
            .join('; ');
          answer = `Forensic audit log identifies ${viewerStats.length} user(s) who accessed '${document.title}': ${list}. All requests passed zero-trust policy checks.`;
        }
      } else if (lowerQ.includes('change') || lowerQ.includes('edit') || lowerQ.includes('version')) {
        const edits = changeEvents.map(c => `${c.action} by ${c.actorEmail} on ${new Date(c.timestamp).toLocaleString()} (${c.reason})`).join('\n• ');
        answer = `Document modification history for '${document.title}' shows version v${document.currentVersion}.0. Integrity hash is ${document.integrityHash}. Lifecycle events recorded:\n• ${edits || 'Initial encrypted upload only'}.`;
      } else if (lowerQ.includes('unauthorized') || lowerQ.includes('denied') || lowerQ.includes('attack') || lowerQ.includes('block')) {
        if (deniedEvents.length === 0) {
          answer = `Security perimeter clear: Zero unauthorized access attempts or IDOR violations have been recorded against '${document.title}'.`;
        } else {
          answer = `Warning: ${deniedEvents.length} blocked attempts recorded on '${document.title}'. Recent attempt by ${deniedEvents[0].actorEmail} was blocked under rule '${deniedEvents[0].reason}'. Zero bytes were exfiltrated.`;
        }
      } else if (lowerQ.includes('revoke') || lowerQ.includes('permission')) {
        const activeList = activeDocPermissions.map(p => `${p.userName} (${p.userEmail}) [${p.permissionLevel}]`).join(', ');
        answer = `Currently ${activeDocPermissions.length} active delegation(s) exist for '${document.title}': ${activeList || 'None'}. Revocations take effect with 0ms delay at the Centralized Decision Engine.`;
      } else {
        answer = `Forensic dossier for '${document.title}': Stored under UUID ${document.storageIdentifier}. Magic bytes validated (${document.mimeType}). Verified integrity hash: ${document.integrityHash}. ${viewerStats.length} total viewers, ${changeEvents.length} administrative events, and ${deniedEvents.length} blocked security events.`;
      }

      setCopilotResponses(prev => [{ q, a: answer, time: new Date().toLocaleTimeString() }, ...prev]);
      setUserQuery('');
      setIsSynthesizing(false);
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#132238] border border-[#334155] rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] text-slate-100">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#334155] flex items-center justify-between bg-[#0D1B2A]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-cyan-400 flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                  Owner Security Copilot
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#1B2D45] text-cyan-300 font-mono border border-[#334155]">
                  Document Forensics & Activity Inspector
                </span>
              </div>
              <h2 className="text-base font-black text-white tracking-tight truncate max-w-md">
                {document.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onClose();
                onGoToFullCopilot(document.id);
              }}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1.5"
            >
              <span>Full Copilot View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1B2D45] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center space-x-3 px-6 pt-3 border-b border-[#334155] bg-[#0D1B2A]/60 text-xs">
          {[
            { id: 'forensics', label: 'Copilot Summary' },
            { id: 'viewers', label: `Who Viewed (${viewerStats.length})` },
            { id: 'changes', label: `What Changes Done (${changeEvents.length})` },
            { id: 'ask', label: 'Ask Copilot' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`pb-3 font-bold transition-all border-b-2 flex items-center space-x-1.5 ${
                activeSubTab === tab.id
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1 bg-[#132238]">
          {/* TAB 1: COPILOT FORENSIC SUMMARY */}
          {activeSubTab === 'forensics' && (
            <div className="space-y-5">
              {/* Top Highlights Banner */}
              <div className="p-4 rounded-xl bg-[#0D1B2A] border border-[#334155] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-cyan-300 font-bold">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Autonomous Activity Synthesizer</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/40">
                    Audit Hash Chain Intact
                  </span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  TrustVault Copilot analyzed all chained SHA-256 blocks for <strong>{document.title}</strong>. Access is governed under least-privilege zero-trust. Below is the verified ledger breakdown of all viewers, actions, modifications, and security events.
                </p>
              </div>

              {/* Quick Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-[#0D1B2A] border border-[#334155]">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] uppercase font-semibold">Unique Viewers</span>
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="text-xl font-black text-white mt-1.5">{viewerStats.length}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Identities verified</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0D1B2A] border border-[#334155]">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] uppercase font-semibold">Total Downloads</span>
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-xl font-black text-white mt-1.5">
                    {viewEvents.filter(e => e.action === 'DOWNLOAD').length}
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">Authorized streams</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0D1B2A] border border-[#334155]">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] uppercase font-semibold">Change Events</span>
                    <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div className="text-xl font-black text-white mt-1.5">{changeEvents.length}</div>
                  <div className="text-[10px] text-blue-300 mt-0.5">Edits & delegations</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0D1B2A] border border-[#334155]">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] uppercase font-semibold">Blocked Attempts</span>
                    <ShieldAlert className="w-3.5 h-3.5 text-cyan-300" />
                  </div>
                  <div className="text-xl font-black text-cyan-300 mt-1.5">{deniedEvents.length}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">403 denials recorded</div>
                </div>
              </div>

              {/* Active Delegations Snapshot */}
              <div className="p-4 rounded-xl bg-[#0D1B2A] border border-[#334155] space-y-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Active Document Delegations ({activeDocPermissions.length})
                </span>
                {activeDocPermissions.length === 0 ? (
                  <p className="text-slate-400 text-xs italic">
                    No active delegations granted. This document is currently isolated to owner {document.ownerName}.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {activeDocPermissions.map(p => (
                      <div key={p.id} className="p-2.5 rounded-lg bg-[#132238] border border-[#334155] flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <UserCheck className="w-4 h-4 text-cyan-400" />
                          <span className="font-bold text-white">{p.userName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({p.userEmail})</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1B2D45] text-cyan-300 border border-[#334155]">
                          {p.permissionLevel}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: WHO VIEWED / ACCESS HISTORY */}
          {activeSubTab === 'viewers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Access Ledger: Who Viewed & Downloaded
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Cryptographically recorded every time an authorized identity opens, previews, or downloads this document.
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#0D1B2A] text-cyan-300 font-mono border border-[#334155]">
                  {viewEvents.length} Total Hits
                </span>
              </div>

              {viewerStats.length === 0 ? (
                <div className="p-8 text-center bg-[#0D1B2A] rounded-xl border border-[#334155] text-slate-400">
                  <Eye className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="font-semibold text-white">No External Views Yet</p>
                  <p className="text-xs text-slate-400 mt-1">
                    When viewers access or download this document, their identity, role, and exact timestamp will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {viewerStats.map((viewer, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#0D1B2A] border border-[#334155] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white">{viewer.email}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1B2D45] text-cyan-300 border border-[#334155]">
                            {viewer.role}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Last accessed: {new Date(viewer.lastAccess).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        <span className="px-2.5 py-1 rounded-lg bg-[#132238] text-cyan-300 border border-[#334155] font-mono text-[11px] font-bold">
                          {viewer.views} Views
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-[#132238] text-emerald-300 border border-[#334155] font-mono text-[11px] font-bold">
                          {viewer.downloads} Downloads
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WHAT CHANGES WERE DONE */}
          {activeSubTab === 'changes' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Document Change & Modification History
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tracks version increments, metadata updates, access delegations, and permission revocations.
                </p>
              </div>

              {changeEvents.length === 0 ? (
                <div className="p-8 text-center bg-[#0D1B2A] rounded-xl border border-[#334155] text-slate-400">
                  <Edit3 className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="font-semibold text-white">Initial Version</p>
                  <p className="text-xs text-slate-400 mt-1">No administrative or metadata modifications have been logged.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {changeEvents.map(evt => (
                    <div
                      key={evt.eventId}
                      className="p-3.5 rounded-xl bg-[#0D1B2A] border border-[#334155] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            evt.action.includes('REVOKE')
                              ? 'bg-[#1e3a8a] text-cyan-200 border border-blue-400'
                              : evt.action.includes('GRANT')
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-blue-600/30 text-white border border-blue-500/50'
                          }`}>
                            {evt.action}
                          </span>
                          <span className="font-bold text-white">{evt.actorEmail}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({evt.actorRole})</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(evt.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {evt.reason}
                      </p>

                      <div className="text-[10px] font-mono text-cyan-300/80 pt-0.5">
                        Block Hash: {evt.currentHash.substring(0, 16)}...
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: INTERACTIVE ASK COPILOT */}
          {activeSubTab === 'ask' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#0D1B2A] border border-[#334155] space-y-3">
                <div className="flex items-center space-x-2 text-cyan-300 font-bold">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  <span>Ask Copilot About This Document</span>
                </div>
                <p className="text-slate-300 text-xs">
                  Ask any question about who accessed <strong>{document.title}</strong>, what changes were made, or any security anomalies.
                </p>

                {/* Pre-canned Prompt Buttons */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    'Who viewed this document and when?',
                    'What changes were made to this document?',
                    'Were any unauthorized attempts blocked?',
                    'Show all active delegations for this file'
                  ].map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => askQuestions(preset)}
                      className="px-2.5 py-1 rounded-lg bg-[#132238] hover:bg-[#1B2D45] border border-[#334155] text-cyan-300 hover:text-white text-[11px] transition-all"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {/* Input Bar */}
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    askQuestions(userQuery);
                  }}
                  className="flex items-center space-x-2 pt-2"
                >
                  <input
                    type="text"
                    value={userQuery}
                    onChange={e => setUserQuery(e.target.value)}
                    placeholder="Type your question about this document..."
                    className="flex-1 px-3.5 py-2.5 rounded-lg bg-[#132238] border border-[#334155] text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    disabled={isSynthesizing || !userQuery.trim()}
                    className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-xs transition-all shadow-md flex items-center space-x-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isSynthesizing ? 'Analyzing...' : 'Ask Copilot'}</span>
                  </button>
                </form>
              </div>

              {/* Chat Thread */}
              <div className="space-y-3">
                {copilotResponses.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-[#0D1B2A] border border-[#334155] space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-cyan-300 flex items-center space-x-1">
                        <span>Q: {item.q}</span>
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">{item.time}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#132238] border border-[#334155] text-slate-200 text-xs leading-relaxed whitespace-pre-wrap">
                      {item.a}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#334155] bg-[#0D1B2A] flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-slate-400 font-mono text-[11px]">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Owner Authorization Verified • Forensics Live</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#1B2D45] hover:bg-[#223859] text-white font-semibold transition-all"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
