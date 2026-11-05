import React from 'react';
import { User } from '../types';
import {
  Shield,
  UserX,
  Lock,
  CheckCircle
} from 'lucide-react';

interface AdminUsersViewProps {
  currentUser: User;
  allUsers: User[];
  onToggleUserStatus: (userId: string) => void;
}

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({
  currentUser,
  allUsers,
  onToggleUserStatus
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-[#132238] border border-[#334155] shadow-md">
        <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1.5">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span>System Administration & Identity Governance</span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          User Directory & Tenant Access Management
        </h1>
        <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
          Administrators control user provisioning, lifecycle state, and system auditing. In accordance with TrustVault zero-trust separation of duties, administrative accounts do not inherit blanket read access to tenant document contents.
        </p>
      </div>

      {/* Zero-Trust Notice */}
      <div className="p-4 rounded-xl bg-[#1B2D45] border border-[#334155] text-xs text-slate-200 flex items-start space-x-3 shadow-sm">
        <Lock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-white">Administrative Privilege Boundary:</div>
          <p className="text-slate-300 mt-0.5">
            The ADMIN role has authority to suspend accounts, monitor system health, and inspect audit logs. Attempting to view confidential document files triggers an intentional 403 Forbidden denial unless an owner has explicitly granted permission.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#132238] border border-[#334155] rounded-2xl overflow-hidden shadow-md">
        <div className="p-4 border-b border-[#334155] flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Registered Identities ({allUsers.length})
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            Click status toggle to test suspension behavior in real time
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0D1B2A] text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-[#334155]">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Account Status</th>
                <th className="p-4">Created</th>
                <th className="p-4">Last Login</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155] text-slate-200">
              {allUsers.map(u => (
                <tr key={u.id} className="hover:bg-[#1B2D45]/50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-white">{u.fullName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                  </td>

                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0D1B2A] text-cyan-300 border border-[#334155]">
                      {u.role}
                    </span>
                  </td>

                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold inline-flex items-center space-x-1 ${
                      u.accountStatus === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-[#1e3a8a] text-cyan-200 border border-blue-400'
                    }`}>
                      {u.accountStatus === 'ACTIVE' ? (
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <UserX className="w-3 h-3 text-cyan-300" />
                      )}
                      <span>{u.accountStatus}</span>
                    </span>
                  </td>

                  <td className="p-4 text-slate-400 font-mono">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>

                  <td className="p-4 text-slate-400 font-mono">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleTimeString() : 'Never'}
                  </td>

                  <td className="p-4 text-right">
                    {u.id !== currentUser.id ? (
                      <button
                        onClick={() => onToggleUserStatus(u.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          u.accountStatus === 'ACTIVE'
                            ? 'bg-[#1B2D45] hover:bg-[#223859] border border-blue-400/50 text-cyan-300'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                        }`}
                      >
                        {u.accountStatus === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Self (Active)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
