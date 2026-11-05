import React, { useState } from 'react';
import { User, VaultDocument, DocumentPermission, AttackSimulation } from '../types';
import { ATTACK_SCENARIOS, executeAttackSimulation } from '../services/attackLab';
import {
  AlertTriangle,
  ShieldCheck,
  Play,
  Terminal,
  CheckCircle,
  XCircle,
  ArrowRight
} from 'lucide-react';

interface AttackReplayLabProps {
  currentUser: User;
  allUsers: User[];
  documents: VaultDocument[];
  permissions: DocumentPermission[];
  onAuditUpdated: () => void;
  onSelectTab: (tab: string) => void;
}

export const AttackReplayLab: React.FC<AttackReplayLabProps> = ({
  currentUser,
  allUsers,
  documents,
  permissions,
  onAuditUpdated,
  onSelectTab
}) => {
  const [scenarios, setScenarios] = useState<AttackSimulation[]>(ATTACK_SCENARIOS);
  const [runningIndex, setRunningIndex] = useState<number | null>(null);
  const [activeScenario, setActiveScenario] = useState<AttackSimulation>(ATTACK_SCENARIOS[0]);

  const runSimulation = async (index: number) => {
    setRunningIndex(index);
    const scenario = scenarios[index];

    const updated = await executeAttackSimulation(scenario, {
      users: allUsers,
      documents,
      permissions
    });

    const newScenarios = [...scenarios];
    newScenarios[index] = updated;
    setScenarios(newScenarios);
    setActiveScenario(updated);
    setRunningIndex(null);
    onAuditUpdated();
  };

  const runAllSimulations = async () => {
    for (let i = 0; i < scenarios.length; i++) {
      await runSimulation(i);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-cyan-400" />
            <span>Attack Replay Lab (Safe Threat Simulations)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Simulate real adversary exploits (IDOR, Privilege Escalation, Revocation Bypass, Magic Byte Spoofing) against TrustVault live defenses.
          </p>
        </div>

        <button
          onClick={runAllSimulations}
          disabled={runningIndex !== null}
          className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all flex items-center space-x-2"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{runningIndex !== null ? 'Simulating...' : 'Run All 6 Attack Simulations'}</span>
        </button>
      </div>

      {/* Grid: Attack Matrix & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Attack Vector List */}
        <div className="lg:col-span-7 space-y-3">
          {scenarios.map((sc, idx) => (
            <div
              key={sc.threatId}
              onClick={() => setActiveScenario(sc)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                activeScenario.threatId === sc.threatId
                  ? 'bg-[#1B2D45] border-cyan-400 shadow-md'
                  : 'bg-[#132238] border-[#334155] hover:border-slate-500'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-cyan-300 font-bold text-xs">{sc.threatId}</span>
                    <h3 className="font-bold text-white text-xs">{sc.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#0D1B2A] text-slate-300 font-mono border border-[#334155]">
                      {sc.category}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{sc.description}</p>
                </div>

                <div className="shrink-0 flex items-center space-x-2">
                  {sc.decision ? (
                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center space-x-1 ${
                      sc.decision === 'DEFENDED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-[#1e3a8a] text-cyan-200 border border-blue-400'
                    }`}>
                      {sc.decision === 'DEFENDED' ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-cyan-300" />
                      )}
                      <span>{sc.decision}</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] text-slate-400 bg-[#0D1B2A] border border-[#334155]">
                      Untested
                    </span>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      runSimulation(idx);
                    }}
                    disabled={runningIndex === idx}
                    className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-sm"
                    title="Run Attack"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              </div>

              {sc.details && (
                <div className="mt-3 pt-2.5 border-t border-[#334155] text-[11px] flex items-center justify-between text-slate-400">
                  <span className="truncate max-w-md text-emerald-300 font-mono font-medium">
                    Backend: {sc.actualResult}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Audited: {sc.auditEventId?.substring(0, 10)}...
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right Column: Detailed Attack Inspector */}
        <div className="lg:col-span-5 bg-[#132238] border border-[#334155] rounded-2xl p-5 shadow-md flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#334155]">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Attack Vector Inspector</h3>
              </div>
              <span className="font-mono text-xs text-cyan-300 font-bold bg-[#0D1B2A] px-2 py-0.5 rounded border border-[#334155]">{activeScenario.threatId}</span>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white">{activeScenario.name}</h4>
              <p className="text-xs text-slate-300 mt-1">{activeScenario.description}</p>
            </div>

            {/* Wire Payload Box */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-300 block">Simulated Wire Payload</span>
              <div className="p-3 rounded-xl bg-[#0D1B2A] font-mono text-cyan-300 text-[11px] border border-[#334155] whitespace-pre-wrap select-all">
                {activeScenario.simulatedPayload}
              </div>
            </div>

            {/* Attack Results Comparison */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#0D1B2A] border border-[#334155]">
                <span className="text-slate-400 block text-[10px]">Expected Defense</span>
                <span className="font-bold text-emerald-400 mt-0.5 block">{activeScenario.expectedResult}</span>
              </div>

              <div className="p-3 rounded-lg bg-[#0D1B2A] border border-[#334155]">
                <span className="text-slate-400 block text-[10px]">Actual Server Result</span>
                <span className="font-bold text-white mt-0.5 block font-mono">
                  {activeScenario.actualResult || 'Run test to verify'}
                </span>
              </div>
            </div>

            {/* Exploit Analysis */}
            {activeScenario.details && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1">
                <div className="font-bold text-emerald-400 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Defense Confirmed</span>
                </div>
                <p className="text-slate-200 text-[11px]">{activeScenario.details}</p>
                {activeScenario.auditEventId && (
                  <div className="pt-2 text-[10px] text-slate-400 font-mono">
                    Forensic Event ID: <span className="text-cyan-300 font-bold">{activeScenario.auditEventId}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#334155] flex items-center justify-between">
            <button
              onClick={() => {
                const idx = scenarios.findIndex(s => s.threatId === activeScenario.threatId);
                if (idx !== -1) runSimulation(idx);
              }}
              className="py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all flex items-center space-x-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Execute This Attack</span>
            </button>

            <button
              onClick={() => onSelectTab('audit-trail')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 transition-colors"
            >
              <span>View Audit Hash</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
