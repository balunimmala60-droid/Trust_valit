import React, { useState } from 'react';
import { AuditRecord, AuditVerificationResult } from '../types';
import { AuditService } from '../services/auditService';
import {
  Database,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  AlertTriangle,
  Search,
  CheckCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface AuditTrailViewProps {
  auditEvents: AuditRecord[];
  auditResult: AuditVerificationResult;
  onRefreshAudit: () => void;
  onTamperSimulated: () => void;
  onResetChain: () => void;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({
  auditEvents,
  auditResult,
  onRefreshAudit,
  onTamperSimulated,
  onResetChain
}) => {
  const [filterAction, setFilterAction] = useState('ALL');
  const [filterDecision, setFilterDecision] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [tamperAlert, setTamperAlert] = useState<string | null>(null);

  const filteredEvents = auditEvents.filter(evt => {
    const matchesAction = filterAction === 'ALL' || evt.action === filterAction;
    const matchesDecision = filterDecision === 'ALL' || evt.decision === filterDecision;
    const matchesSearch =
      evt.actorEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (evt.documentTitle && evt.documentTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      evt.currentHash.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesAction && matchesDecision && matchesSearch;
  });

  const handleSimulateTamper = () => {
    const res = AuditService.injectTamperingForDemo();
    if (res.success) {
      setTamperAlert(`Injected synthetic byte mutation into event '${res.eventId}'. Click 'Verify Hash Chain' to observe cryptographic detection!`);
      onTamperSimulated();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center space-x-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <span>Verifiable Audit Trail & Cryptographic Hash Chain</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Server-controlled append-only ledger linked by SHA-256 block hashes. Forensically captures both authorized and denied access.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSimulateTamper}
            className="px-3 py-2 rounded-lg bg-[#1B2D45] hover:bg-[#223859] border border-amber-500/50 text-amber-300 font-semibold text-xs transition-all flex items-center space-x-1.5 shadow-sm"
            title="Simulate unauthorized payload mutation to test tamper detection"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate Tampering</span>
          </button>

          <button
            onClick={onResetChain}
            className="px-3 py-2 rounded-lg bg-[#1B2D45] hover:bg-[#223859] border border-[#334155] text-slate-300 text-xs font-semibold transition-all flex items-center space-x-1.5 shadow-sm"
            title="Reset audit chain back to valid seed state"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Reset Chain</span>
          </button>

          <button
            onClick={onRefreshAudit}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all flex items-center space-x-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verify Hash Chain Integrity</span>
          </button>
        </div>
      </div>

      {/* Tamper Alert Notification */}
      {tamperAlert && (
        <div className="p-4 rounded-xl bg-[#1B2D45] border border-amber-500/60 text-amber-200 text-xs flex items-start justify-between shadow-md">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-300">Tamper Injection Active:</div>
              <p className="mt-0.5 text-slate-200">{tamperAlert}</p>
            </div>
          </div>
          <button onClick={() => setTamperAlert(null)} className="text-amber-400 hover:text-white font-bold ml-2">✕</button>
        </div>
      )}

      {/* Verification Status Card */}
      <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md ${
        auditResult.valid
          ? 'bg-[#132238] border-[#334155]'
          : 'bg-[#1e3a8a]/60 border-blue-400 animate-pulse'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            {auditResult.valid ? (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-cyan-300" />
            )}
            <h2 className="text-base font-black text-white">
              {auditResult.valid ? 'Cryptographic Hash Chain: 100% INTACT' : 'CHAIN COMPROMISE: TAMPER DETECTED!'}
            </h2>
          </div>
          <p className="text-xs text-slate-300">
            {auditResult.message}
          </p>
          {auditResult.reason && (
            <p className="text-xs text-cyan-300 font-mono mt-1 font-bold">
              Diagnosis: {auditResult.reason}
            </p>
          )}
        </div>

        <div className="text-right shrink-0 font-mono text-xs space-y-1">
          <div className="text-slate-400">Total Validated Blocks: <span className="text-white font-bold">{auditResult.totalEvents}</span></div>
          <div className="text-slate-400 text-[10px] truncate max-w-xs">
            Tip: <span className="text-cyan-300 font-bold">{auditResult.latestHash?.substring(0, 20)}...</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#132238] p-4 rounded-2xl border border-[#334155] shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Action Filter */}
          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="bg-[#0D1B2A] border border-[#334155] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-medium"
          >
            <option value="ALL">All Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="UPLOAD">UPLOAD</option>
            <option value="READ">READ</option>
            <option value="DOWNLOAD">DOWNLOAD</option>
            <option value="GRANT_PERMISSION">GRANT_PERMISSION</option>
            <option value="REVOKE_PERMISSION">REVOKE_PERMISSION</option>
            <option value="ATTACK_SIMULATION">ATTACK_SIMULATION</option>
          </select>

          {/* Decision Filter */}
          <select
            value={filterDecision}
            onChange={e => setFilterDecision(e.target.value)}
            className="bg-[#0D1B2A] border border-[#334155] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-medium"
          >
            <option value="ALL">All Decisions (ALLOW & DENY)</option>
            <option value="ALLOW">ALLOW Only</option>
            <option value="DENY">DENY Only (Zero-Trust Blocks)</option>
          </select>
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search email, action, doc, hash..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#0D1B2A] border border-[#334155] rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Ledger Block Timeline */}
      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-[#132238] rounded-xl border border-[#334155]">
            No audit records match the current filter.
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const isExpanded = expandedEventId === evt.eventId;

            return (
              <div
                key={evt.eventId}
                className={`rounded-2xl border transition-all ${
                  evt.decision === 'ALLOW'
                    ? 'bg-[#132238] border-[#334155] hover:border-blue-500/50 shadow-sm'
                    : 'bg-[#1e3a8a]/60 border-blue-500 hover:border-blue-400 shadow-md'
                }`}
              >
                <div
                  onClick={() => setExpandedEventId(isExpanded ? null : evt.eventId)}
                  className="p-4 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                        evt.decision === 'ALLOW'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-blue-600 text-white border border-blue-400 shadow-xs'
                      }`}>
                        {evt.decision}
                      </span>
                      <span className="font-bold text-white">{evt.action}</span>
                      {evt.documentTitle && (
                        <span className="text-cyan-300 font-medium">
                          • {evt.documentTitle}
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-300">
                      Actor: <span className="text-white font-mono font-medium">{evt.actorEmail}</span> ({evt.actorRole}) • {new Date(evt.timestamp).toLocaleString()}
                    </div>

                    <div className="text-[11px] text-slate-400 italic">
                      {evt.reason}
                    </div>
                  </div>

                  {/* Hash Summary */}
                  <div className="flex items-center space-x-3 shrink-0 font-mono text-[11px]">
                    <div className="text-right">
                      <div className="text-slate-400 text-[10px]">Current Block Hash</div>
                      <div className="text-cyan-300 font-bold">{evt.currentHash.substring(0, 16)}...</div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {/* Expanded Block Details */}
                {isExpanded && (
                  <div className="p-4 border-t border-[#334155] bg-[#0D1B2A] rounded-b-2xl space-y-3 text-xs font-mono">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 bg-[#132238] rounded-xl border border-[#334155] shadow-sm">
                        <span className="text-slate-400 text-[10px] block mb-1 font-semibold uppercase">Previous Block Hash (Link)</span>
                        <div className="text-slate-200 break-all select-all text-[11px]">
                          {evt.previousHash}
                        </div>
                      </div>

                      <div className="p-3 bg-[#132238] rounded-xl border border-[#334155] shadow-sm">
                        <span className="text-slate-400 text-[10px] block mb-1 font-semibold uppercase">Current Block Hash (H_n)</span>
                        <div className="text-cyan-300 break-all select-all text-[11px] font-bold">
                          {evt.currentHash}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-[#132238] rounded-xl border border-[#334155] space-y-1 shadow-sm">
                      <span className="text-slate-400 text-[10px] block font-semibold uppercase">Raw Serialized Payload Metadata:</span>
                      <pre className="text-[10px] text-slate-300 overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(evt.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
