import React from 'react';
import { User, VaultDocument, DocumentPermission, AuditRecord, AccessRequest } from '../types';
import {
  ShieldCheck,
  ShieldAlert,
  FileText,
  Lock,
  Unlock,
  Users,
  Activity,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Database,
  Plus,
  HardDrive,
  Eye,
  Edit3,
  Clock,
  UserCheck,
  History
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface DashboardViewProps {
  currentUser: User;
  allUsers: User[];
  documents: VaultDocument[];
  permissions: DocumentPermission[];
  auditEvents: AuditRecord[];
  accessRequests?: AccessRequest[];
  onSelectTab: (tab: string) => void;
  onSwitchUser: (user: User) => void;
  onOpenUpload: () => void;
  chainValid: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  allUsers,
  documents,
  permissions,
  auditEvents,
  accessRequests = [],
  onSelectTab,
  onSwitchUser,
  onOpenUpload,
  chainValid
}) => {
  const activePermissions = permissions.filter(p => p.status === 'ACTIVE');
  const revokedPermissions = permissions.filter(p => p.status === 'REVOKED');
  const deniedAttempts = auditEvents.filter(e => e.decision === 'DENY');

  // Role-specific metrics calculations
  // 1. OWNER
  const ownerDocs = documents.filter(d => d.ownerId === currentUser.id);
  const ownerSharedDocs = ownerDocs.filter(d =>
    permissions.some(p => p.documentId === d.id && p.status === 'ACTIVE')
  );
  const ownerActivePerms = permissions.filter(
    p => p.status === 'ACTIVE' && ownerDocs.some(d => d.id === p.documentId)
  );
  const ownerPendingRequests = accessRequests.filter(
    r => r.status === 'PENDING' && ownerDocs.some(d => d.id === r.documentId)
  );
  const totalOwnerBytes = ownerDocs.reduce((acc, d) => acc + (d.sizeBytes || 0), 0);
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // 2. VIEWER
  const viewerSharedPerms = permissions.filter(
    p => p.userEmail === currentUser.email && p.status === 'ACTIVE'
  );
  const viewerReadPerms = viewerSharedPerms.filter(p => p.permissionLevel === 'READ');
  const viewerEditPerms = viewerSharedPerms.filter(p => p.permissionLevel === 'EDIT');
  const viewerPendingRequests = accessRequests.filter(
    r => r.requesterEmail === currentUser.email && r.status === 'PENDING'
  );

  // 3. ADMIN
  const permissionChanges = auditEvents.filter(e =>
    ['GRANT_PERMISSION', 'REVOKE_PERMISSION', 'UPDATE_PERMISSION'].includes(e.action)
  );

  // Chart data: Allowed vs Denied by common actions
  const chartData = [
    {
      name: 'Reads',
      allowed: auditEvents.filter(e => e.action === 'READ' && e.decision === 'ALLOW').length,
      denied: auditEvents.filter(e => e.action === 'READ' && e.decision === 'DENY').length
    },
    {
      name: 'Downloads',
      allowed: auditEvents.filter(e => e.action === 'DOWNLOAD' && e.decision === 'ALLOW').length,
      denied: auditEvents.filter(e => e.action === 'DOWNLOAD' && e.decision === 'DENY').length
    },
    {
      name: 'Uploads',
      allowed: auditEvents.filter(e => e.action === 'UPLOAD' && e.decision === 'ALLOW').length,
      denied: auditEvents.filter(e => e.action === 'UPLOAD' && e.decision === 'DENY').length
    },
    {
      name: 'Grants',
      allowed: auditEvents.filter(e => e.action === 'GRANT_PERMISSION' && e.decision === 'ALLOW').length,
      denied: auditEvents.filter(e => e.action === 'GRANT_PERMISSION' && e.decision === 'DENY').length
    },
    {
      name: 'Attacks',
      allowed: 0,
      denied: auditEvents.filter(e => e.action === 'ATTACK_SIMULATION').length
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: Enterprise Document Control Overview */}
      <div className="p-6 rounded-2xl bg-[#132238] border border-[#334155] shadow-lg relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
              <span>Zero-Trust Security Perimeter Active</span>
              <span>•</span>
              <span className="text-slate-300 font-sans font-normal">Your Documents. Your Control. Your Security.</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Welcome back, {currentUser.fullName}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Operating as <span className="font-mono font-semibold text-white bg-[#1B2D45] px-1.5 py-0.5 rounded border border-[#334155]">{currentUser.email}</span> with role <span className="font-mono font-bold text-cyan-300 uppercase bg-[#1B2D45] px-1.5 py-0.5 rounded border border-[#334155]">{currentUser.role}</span>. All operations pass through the Centralized Decision Engine and are cryptographically chained to the SHA-256 audit ledger.
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            {currentUser.role === 'OWNER' && (
              <>
                <button
                  onClick={onOpenUpload}
                  className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload Document</span>
                </button>

                <button
                  onClick={() => onSelectTab('record-history')}
                  className="px-4 py-2.5 rounded-lg bg-[#1B2D45] hover:bg-[#223859] border border-cyan-400/50 text-cyan-200 hover:text-white font-semibold text-xs shadow-sm transition-all flex items-center space-x-2"
                >
                  <History className="w-4 h-4 text-cyan-400" />
                  <span>Record History</span>
                </button>
              </>
            )}

            <button
              onClick={() => onSelectTab('attack-lab')}
              className="px-4 py-2.5 rounded-lg bg-[#1B2D45] hover:bg-[#223859] border border-[#334155] text-slate-200 font-semibold text-xs transition-all flex items-center space-x-2 shadow-sm"
            >
              <AlertTriangle className="w-4 h-4 text-cyan-400" />
              <span>Simulate Attacks</span>
            </button>
          </div>
        </div>
      </div>

      {/* Role-Specific Metrics Section */}
      {currentUser.role === 'OWNER' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Owner Resource & Delegation Overview
            </span>
            <span className="text-[11px] font-mono text-cyan-400">
              Personal Repository Vault
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl bg-[#132238] border border-[#334155] shadow-sm hover:border-blue-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Documents</span>
                <FileText className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-white mt-2">{ownerDocs.length}</div>
              <div className="text-[11px] text-slate-400 mt-1">Owned encrypted assets</div>
            </div>

            <div className="p-4 rounded-xl bg-[#132238] border border-[#334155] shadow-sm hover:border-blue-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Shared Documents</span>
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-black text-white mt-2">{ownerSharedDocs.length}</div>
              <div className="text-[11px] text-slate-400 mt-1">With active external grants</div>
            </div>

            <div className="p-4 rounded-xl bg-[#132238] border border-[#334155] shadow-sm hover:border-blue-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Active Permissions</span>
                <Lock className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white mt-2">{ownerActivePerms.length}</div>
              <div className="text-[11px] text-emerald-400 font-medium mt-1">READ / EDIT delegations</div>
            </div>

            <div className="p-4 rounded-xl bg-[#132238] border border-[#334155] shadow-sm hover:border-blue-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Pending Requests</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white mt-2">{ownerPendingRequests.length}</div>
              <div className="text-[11px] text-amber-400 font-medium mt-1">Awaiting your approval</div>
            </div>

            <div className="p-4 rounded-xl bg-[#132238] border border-[#334155] shadow-sm hover:border-blue-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Storage Usage</span>
                <HardDrive className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-white mt-2">{formatBytes(totalOwnerBytes)}</div>
              <div className="text-[11px] text-slate-400 mt-1">Encrypted blob allocation</div>
            </div>
          </div>
        </div>
      )}

      {currentUser.role === 'VIEWER' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Viewer Access & Delegations Overview
            </span>
            <span className="text-[11px] font-mono text-cyan-400">
              Zero-Trust Principle: Least Privilege
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#132238] border border-[#334155] shadow-sm hover:border-blue-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Shared With Me</span>
                <FileText className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-white mt-2">{viewerSharedPerms.length}</div>
              <div className="text-[11px] text-slate-400 mt-1">Accessible documents</div>
            </div>

            <div className="p-4 rounded-xl bg-[#132238] border border-[#334155] shadow-sm hover:border-blue-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">READ Permissions</span>
                <Eye className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white mt-2">{viewerReadPerms.length}</div>
              <div className="text-[11px] text-emerald-400 font-medium mt-1">Preview & download rights</div>
            </div>

            <div className="p-4 rounded-xl bg-[#132238] border border-[#334155] shadow-sm hover:border-blue-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">EDIT Permissions</span>
                <Edit3 className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-black text-white mt-2">{viewerEditPerms.length}</div>
              <div className="text-[11px] text-blue-300 font-medium mt-1">Modification rights</div>
            </div>

            <div className="p-4 rounded-xl bg-[#132238] border border-[#334155] shadow-sm hover:border-blue-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Pending Requests</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white mt-2">{viewerPendingRequests.length}</div>
              <div className="text-[11px] text-amber-400 font-medium mt-1">Under review by owners</div>
            </div>
          </div>
        </div>
      )}

      {currentUser.role === 'ADMIN' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Enterprise Admin & Security Governance
            </span>
            <span className="text-[11px] font-mono text-cyan-400">
              Audit & Policy Authority
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-xl bg-[#132238] border border-[#334155] shadow-sm hover:border-blue-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Users</span>
                <Users className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-white mt-2">{allUsers.length}</div>
              <div className="text-[11px] text-slate-400 mt-1">Enrolled identities</div>
            </div>

            <div className="p-4 rounded-xl bg-[#132238] border border-[#334155] shadow-sm hover:border-blue-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Documents</span>
                <FileText className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-black text-white mt-2">{documents.length}</div>
              <div className="text-[11px] text-slate-400 mt-1">System-wide assets</div>
            </div>

            <div className="p-4 rounded-xl bg-[#132238] border border-[#334155] shadow-sm hover:border-blue-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Permission Changes</span>
                <Unlock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white mt-2">{permissionChanges.length}</div>
              <div className="text-[11px] text-slate-400 mt-1">Grants & revocations</div>
            </div>

            <div className="p-4 rounded-xl bg-[#1e3a8a]/40 border border-blue-500/50 shadow-sm hover:border-blue-400 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-200 font-semibold uppercase tracking-wider">Denied Attempts</span>
                <ShieldAlert className="w-4 h-4 text-blue-300" />
              </div>
              <div className="text-2xl font-black text-cyan-300 mt-2">{deniedAttempts.length}</div>
              <div className="text-[11px] text-blue-200 mt-1">403 Zero-Trust blocks</div>
            </div>

            <div className="p-4 rounded-xl bg-[#132238] border border-[#334155] shadow-sm hover:border-blue-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Security Events</span>
                <Database className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-white mt-2">{auditEvents.length}</div>
              <div className="text-[11px] text-slate-400 mt-1">Chained SHA-256 blocks</div>
            </div>

            <div className="p-4 rounded-xl bg-[#132238] border border-[#334155] shadow-sm hover:border-blue-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Audit Integrity</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-base font-black text-emerald-400 mt-2 truncate">
                {chainValid ? 'VERIFIED' : 'TAMPERED'}
              </div>
              <div className="text-[11px] text-emerald-300 font-medium mt-1">SHA-256 Hash Chain</div>
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout: Live Access Radar & Security Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Access Radar */}
        <div className="lg:col-span-7 bg-[#132238] border border-[#334155] rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-[#334155]">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">Live Access Radar</h2>
            </div>
            <button
              onClick={() => onSelectTab('audit-trail')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 transition-colors"
            >
              <span>View Full Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-slate-400 mt-2">
            Real-time server-evaluated access decisions. Denied events are forensically recorded alongside authorized requests.
          </p>

          <div className="mt-4 space-y-2 flex-1 overflow-y-auto max-h-[340px] pr-1">
            {auditEvents.slice(-6).reverse().map(evt => (
              <div
                key={evt.eventId}
                className={`p-3 rounded-xl border text-xs transition-all flex items-start justify-between ${
                  evt.decision === 'ALLOW'
                    ? 'bg-[#1B2D45]/70 border-[#334155] hover:border-blue-500/50'
                    : 'bg-[#1e3a8a]/50 border-blue-500 hover:border-blue-400 shadow-sm'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                        evt.decision === 'ALLOW'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-blue-600 text-white border border-blue-400 shadow-xs'
                      }`}
                    >
                      {evt.decision}
                    </span>
                    <span className="font-bold text-white">{evt.action}</span>
                    {evt.documentTitle && (
                      <span className="text-slate-300 truncate max-w-[220px]" title={evt.documentTitle}>
                        • {evt.documentTitle}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Actor: <span className="text-white font-mono font-medium">{evt.actorEmail}</span> ({evt.actorRole})
                  </div>
                  <div className="text-[11px] text-cyan-300 italic">
                    Reason: {evt.reason}
                  </div>
                </div>

                <div className="text-right text-[10px] text-slate-400 shrink-0">
                  <div>{new Date(evt.timestamp).toLocaleTimeString()}</div>
                  <div className="font-mono text-cyan-400 mt-1">H: {evt.currentHash.substring(0, 8)}...</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Persona Switcher & Decisions Chart */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Role & Identity Switcher */}
          <div className="bg-[#132238] border border-[#334155] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Active Role & Identity Switcher</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#1B2D45] text-cyan-300 border border-[#334155] font-mono font-semibold">
                Instant Simulation
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Switch roles to evaluate document permissions and access control boundaries:
            </p>

            <div className="space-y-2">
              {allUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => onSwitchUser(user)}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                    currentUser.id === user.id
                      ? 'bg-blue-600/20 border-cyan-400 text-white shadow-sm font-semibold'
                      : 'bg-[#1B2D45] border-[#334155] hover:border-slate-500 text-slate-300 hover:text-white'
                  }`}
                >
                  <div>
                    <div className="font-bold flex items-center space-x-1.5">
                      <span className="text-white">{user.fullName}</span>
                      {currentUser.id === user.id && (
                        <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{user.email}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0D1B2A] text-cyan-300 border border-[#334155]">
                    {user.role}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Decision Chart in Cyber Blue */}
          <div className="bg-[#132238] border border-[#334155] rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
              Security Decisions Breakdown
            </h3>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} />
                  <YAxis stroke="#94A3B8" fontSize={10} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0D1B2A',
                      borderColor: '#334155',
                      color: '#F8FAFC',
                      borderRadius: '8px',
                      fontSize: '11px'
                    }}
                  />
                  <Bar dataKey="allowed" fill="#2563EB" name="Allowed" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="denied" fill="#38BDF8" name="Denied" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
