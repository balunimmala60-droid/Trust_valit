import React, { useState } from 'react';
import { User, VaultDocument, AccessRequest, PermissionLevel } from '../types';
import {
  KeyRound,
  CheckCircle,
  XCircle,
  Send,
  X
} from 'lucide-react';

interface AccessRequestsViewProps {
  currentUser: User;
  documents: VaultDocument[];
  accessRequests: AccessRequest[];
  onApproveRequest: (requestId: string, level: PermissionLevel) => void;
  onRejectRequest: (requestId: string, reason: string) => void;
  onCreateRequest: (docId: string, level: PermissionLevel, justification: string) => void;
}

export const AccessRequestsView: React.FC<AccessRequestsViewProps> = ({
  currentUser,
  documents,
  accessRequests,
  onApproveRequest,
  onRejectRequest,
  onCreateRequest
}) => {
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(documents[0]?.id || '');
  const [requestedLevel, setRequestedLevel] = useState<PermissionLevel>('READ');
  const [justification, setJustification] = useState('');

  const isOwner = currentUser.role === 'OWNER';

  const relevantRequests = accessRequests.filter(req => {
    if (currentUser.role === 'ADMIN') return true;
    if (isOwner) return req.ownerId === currentUser.id;
    return req.requesterId === currentUser.id;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId || !justification) return;
    onCreateRequest(selectedDocId, requestedLevel, justification);
    setJustification('');
    setShowNewRequestModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center space-x-2">
            <KeyRound className="w-5 h-5 text-cyan-400" />
            <span>Document Access Delegation Requests</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Formal, audited workflow for requesting and approving granular READ/EDIT document privileges.
          </p>
        </div>

        <button
          onClick={() => setShowNewRequestModal(true)}
          className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all flex items-center space-x-2"
        >
          <Send className="w-4 h-4" />
          <span>Submit Access Request</span>
        </button>
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {relevantRequests.length === 0 ? (
          <div className="p-12 text-center bg-[#132238] rounded-2xl border border-[#334155] shadow-sm">
            <KeyRound className="w-10 h-10 text-slate-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-white">No Access Requests</h3>
            <p className="text-xs text-slate-400 mt-1">
              There are currently no pending or resolved access requests in your purview.
            </p>
          </div>
        ) : (
          relevantRequests.map(req => {
            const canReview = isOwner && req.ownerId === currentUser.id && req.status === 'PENDING';

            return (
              <div
                key={req.id}
                className="p-5 rounded-2xl bg-[#132238] border border-[#334155] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs hover:border-blue-500/50 transition-all"
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      req.status === 'PENDING'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : req.status === 'APPROVED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-[#1e3a8a] text-cyan-200 border border-blue-400'
                    }`}>
                      {req.status}
                    </span>
                    <span className="font-bold text-white text-sm">{req.documentTitle}</span>
                    <span className="px-2 py-0.5 rounded bg-[#0D1B2A] font-mono text-cyan-300 text-[10px] font-bold border border-[#334155]">
                      Requested: {req.requestedLevel}
                    </span>
                  </div>

                  <div className="text-slate-400 text-[11px]">
                    Requester: <span className="text-white font-semibold">{req.requesterName}</span> ({req.requesterEmail}) • {new Date(req.createdAt).toLocaleString()}
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#0D1B2A] border border-[#334155] text-slate-200 text-[11px]">
                    <span className="text-slate-400 font-semibold">Justification: </span>
                    {req.justification}
                  </div>
                </div>

                {/* Owner Decision Actions */}
                <div className="flex items-center space-x-2 shrink-0">
                  {canReview ? (
                    <>
                      <button
                        onClick={() => onApproveRequest(req.id, req.requestedLevel)}
                        className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all flex items-center space-x-1 shadow-md"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Approve ({req.requestedLevel})</span>
                      </button>

                      <button
                        onClick={() => onRejectRequest(req.id, 'Business justification insufficient.')}
                        className="px-3.5 py-2 rounded-lg bg-[#1B2D45] hover:bg-[#223859] border border-blue-400/50 text-cyan-300 font-semibold text-xs transition-all flex items-center space-x-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </>
                  ) : (
                    <div className="text-slate-400 text-[11px] font-mono font-medium">
                      {req.status === 'PENDING' ? 'Awaiting Owner Review' : `Resolved: ${req.status}`}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Request Modal */}
      {showNewRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#132238] border border-[#334155] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-xs text-white">
            <div className="flex items-center justify-between pb-2 border-b border-[#334155]">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <KeyRound className="w-4 h-4 text-cyan-400" />
                <span>Submit Document Access Request</span>
              </h3>
              <button onClick={() => setShowNewRequestModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Select Target Document</label>
                <select
                  value={selectedDocId}
                  onChange={e => setSelectedDocId(e.target.value)}
                  className="w-full bg-[#0D1B2A] border border-[#334155] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-medium"
                  required
                >
                  {documents.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.title} (Owner: {d.ownerName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Requested Privilege Level</label>
                <select
                  value={requestedLevel}
                  onChange={e => setRequestedLevel(e.target.value as PermissionLevel)}
                  className="w-full bg-[#0D1B2A] border border-[#334155] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-medium"
                >
                  <option value="READ">READ (Secure Viewing & Downloading)</option>
                  <option value="EDIT">EDIT (Metadata & Version Modification)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Business Justification</label>
                <textarea
                  required
                  rows={3}
                  value={justification}
                  onChange={e => setJustification(e.target.value)}
                  placeholder="State the regulatory or operational need for access..."
                  className="w-full bg-[#0D1B2A] border border-[#334155] rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#334155]">
                <button
                  type="button"
                  onClick={() => setShowNewRequestModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#1B2D45]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-md"
                >
                  Submit for Owner Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
