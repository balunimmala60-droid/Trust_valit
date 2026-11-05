import React, { useState } from 'react';
import { User, VaultDocument, AuditRecord } from '../types';
import {
  History,
  FileText,
  Lock,
  Unlock,
  Eye,
  Download,
  Trash2,
  Plus,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  ArrowRight,
  Database,
  CheckCircle,
  FileDown
} from 'lucide-react';

interface RecordHistoryViewProps {
  currentUser: User;
  documents: VaultDocument[];
  auditEvents: AuditRecord[];
  onSelectTab: (tab: string) => void;
  onSelectDocument?: (doc: VaultDocument) => void;
}

export const RecordHistoryView: React.FC<RecordHistoryViewProps> = ({
  currentUser,
  documents,
  auditEvents,
  onSelectTab,
  onSelectDocument
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'my-actions' | 'viewer-access' | 'denials'>('all');
  const [selectedDocFilter, setSelectedDocFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const ownerDocs = documents.filter(d => d.ownerId === currentUser.id);
  const ownerDocIds = new Set(ownerDocs.map(d => d.id));

  // Events that are relevant to this owner:
  // 1. Actions performed BY this owner (actorId === currentUser.id)
  // 2. Actions performed ON documents owned by this owner (documentId in ownerDocIds)
  const ownerRelevantEvents = auditEvents.filter(e => {
    const isActor = e.actorId === currentUser.id || e.actorEmail === currentUser.email;
    const isMyDoc = e.documentId ? ownerDocIds.has(e.documentId) : false;
    return isActor || isMyDoc;
  });

  const filteredEvents = ownerRelevantEvents.filter(evt => {
    // Mode filter
    if (filterMode === 'my-actions') {
      if (evt.actorId !== currentUser.id && evt.actorEmail !== currentUser.email) return false;
    } else if (filterMode === 'viewer-access') {
      if (evt.actorId === currentUser.id) return false;
      if (!['READ', 'PREVIEW', 'VIEW', 'DOWNLOAD'].includes(evt.action)) return false;
    } else if (filterMode === 'denials') {
      if (evt.decision !== 'DENY') return false;
    }

    // Document filter
    if (selectedDocFilter !== 'ALL' && evt.documentId !== selectedDocFilter) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDoc = evt.documentTitle?.toLowerCase().includes(q);
      const matchActor = evt.actorEmail.toLowerCase().includes(q);
      const matchAction = evt.action.toLowerCase().includes(q);
      const matchReason = evt.reason.toLowerCase().includes(q);
      const matchHash = evt.currentHash.toLowerCase().includes(q);
      return matchDoc || matchActor || matchAction || matchReason || matchHash;
    }

    return true;
  });

  // Calculate metrics
  const myDirectActionsCount = ownerRelevantEvents.filter(
    e => e.actorId === currentUser.id || e.actorEmail === currentUser.email
  ).length;

  const externalViewerAccessCount = ownerRelevantEvents.filter(
    e => e.actorId !== currentUser.id && ['READ', 'PREVIEW', 'VIEW', 'DOWNLOAD'].includes(e.action) && e.decision === 'ALLOW'
  ).length;

  const grantsAndRevocationsCount = ownerRelevantEvents.filter(
    e => ['GRANT_PERMISSION', 'REVOKE_PERMISSION', 'UPDATE_PERMISSION'].includes(e.action)
  ).length;

  const blockedOnMyDocsCount = ownerRelevantEvents.filter(
    e => e.decision === 'DENY'
  ).length;

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredEvents, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `trustvault_owner_record_history_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-[#132238] border border-[#334155] shadow-md relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1.5">
              <History className="w-4 h-4 text-cyan-400" />
              <span>Owner Activity Ledger & Record History</span>
              <span>•</span>
              <span className="text-slate-300 font-sans font-normal">Cryptographic SHA-256 Ledger</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Complete Activity Record & Audit Timeline
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Forensic timeline of all uploads, permission delegations, immediate revocations, document deletions, and external viewer access across your assets.
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleExportJSON}
              className="px-4 py-2.5 rounded-lg bg-[#1B2D45] hover:bg-[#223859] border border-[#334155] text-slate-200 font-semibold text-xs transition-all flex items-center space-x-2 shadow-sm"
              title="Export filtered records as JSON"
            >
              <FileDown className="w-4 h-4 text-cyan-400" />
              <span>Export History (JSON)</span>
            </button>

            <button
              onClick={() => onSelectTab('audit-trail')}
              className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all flex items-center space-x-2"
            >
              <Database className="w-4 h-4" />
              <span>Global Audit Chain</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#132238] border border-[#334155] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Direct Actions</span>
            <FileText className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">{myDirectActionsCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Uploads, delegations, updates</div>
        </div>

        <div className="p-4 rounded-xl bg-[#132238] border border-[#334155] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">External Views</span>
            <Eye className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">{externalViewerAccessCount}</div>
          <div className="text-[11px] text-blue-300 mt-1">Views on your assets</div>
        </div>

        <div className="p-4 rounded-xl bg-[#132238] border border-[#334155] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Delegations Logged</span>
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">{grantsAndRevocationsCount}</div>
          <div className="text-[11px] text-emerald-400 mt-1">Grants & 0ms revocations</div>
        </div>

        <div className="p-4 rounded-xl bg-[#132238] border border-[#334155] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Blocked Attempts</span>
            <ShieldAlert className="w-4 h-4 text-cyan-300" />
          </div>
          <div className="text-2xl font-black text-cyan-300 mt-2">{blockedOnMyDocsCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Zero-Trust defenses triggered</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#132238] p-4 rounded-2xl border border-[#334155] shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Filter Mode Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto">
            {[
              { id: 'all', label: 'All Record History' },
              { id: 'my-actions', label: 'My Direct Actions' },
              { id: 'viewer-access', label: 'External Viewer Activity' },
              { id: 'denials', label: 'Blocked Denials' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterMode(tab.id as any)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterMode === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-[#1B2D45]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Document Selector */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Document Filter */}
            <div className="flex items-center space-x-1.5 bg-[#0D1B2A] px-3 py-1.5 rounded-lg border border-[#334155] text-xs text-white">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <select
                value={selectedDocFilter}
                onChange={e => setSelectedDocFilter(e.target.value)}
                className="bg-transparent border-none text-white focus:outline-none text-xs font-medium"
              >
                <option value="ALL" className="bg-[#0D1B2A]">All My Documents</option>
                {ownerDocs.map(d => (
                  <option key={d.id} value={d.id} className="bg-[#0D1B2A]">
                    {d.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search history, hash, user..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#0D1B2A] border border-[#334155] rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Record History Timeline */}
      <div className="space-y-2.5">
        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center bg-[#132238] rounded-2xl border border-[#334155] shadow-sm text-slate-400">
            <History className="w-10 h-10 text-slate-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-white">No Activity Records Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No actions match the selected filter criteria. As you upload, delegate, revoke, or users view your files, records will append here.
            </p>
          </div>
        ) : (
          filteredEvents.map(evt => {
            const isMyDirectAction = evt.actorId === currentUser.id || evt.actorEmail === currentUser.email;

            return (
              <div
                key={evt.eventId}
                className={`p-4 rounded-xl border text-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm ${
                  evt.decision === 'DENY'
                    ? 'bg-[#1e3a8a]/60 border-blue-500'
                    : 'bg-[#132238] border-[#334155] hover:border-blue-500/50'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                      evt.decision === 'DENY'
                        ? 'bg-blue-600 text-white border border-blue-400'
                        : evt.action.includes('REVOKE')
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : evt.action === 'UPLOAD' || evt.action.includes('GRANT')
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-[#1B2D45] text-cyan-300 border border-[#334155]'
                    }`}>
                      {evt.action}
                    </span>

                    {evt.documentTitle && (
                      <span className="font-bold text-white truncate max-w-xs" title={evt.documentTitle}>
                        {evt.documentTitle}
                      </span>
                    )}

                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      isMyDirectAction
                        ? 'bg-blue-600/30 text-white border border-blue-500/40'
                        : 'bg-[#0D1B2A] text-slate-300 border border-[#334155]'
                    }`}>
                      {isMyDirectAction ? 'Initiated by You' : `Viewer: ${evt.actorEmail}`}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {evt.reason}
                  </p>

                  <div className="flex items-center space-x-3 text-[10px] text-slate-400 font-mono pt-0.5">
                    <span>Actor: <span className="text-white">{evt.actorEmail}</span> ({evt.actorRole})</span>
                    <span>•</span>
                    <span>Time: {new Date(evt.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-right shrink-0 font-mono text-[11px] space-y-1">
                  <div className="text-slate-400 text-[10px]">Chained Block Hash</div>
                  <div className="text-cyan-300 font-bold">{evt.currentHash.substring(0, 16)}...</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
