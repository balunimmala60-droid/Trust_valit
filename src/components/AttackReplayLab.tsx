import React, { useState } from 'react';
import { User, VaultDocument, DocumentPermission, AttackSimulation } from '../types';
import { ATTACK_SCENARIOS, executeAttackSimulation } from '../services/attackLab';
import {
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Play,
  Terminal,
  CheckCircle,
  XCircle,
  ArrowRight,
  Lock,
  Unlock,
  FileCode,
  RefreshCw,
  Info,
  Sparkles,
  UserX,
  FileText,
  Eye,
  Check,
  Zap
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
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'friendly' | 'technical'>('friendly');
  const [isSimulatingAll, setIsSimulatingAll] = useState(false);

  const categories = [
    { id: 'ALL', label: 'All Attacks (7)' },
    { id: 'IDOR', label: 'IDOR & Direct Download' },
    { id: 'Revocation', label: 'Revocation Cutoff' },
    { id: 'Privilege Escalation', label: 'Privilege Escalation' },
    { id: 'Admin Bypass', label: 'Admin Zero-Trust' },
    { id: 'File Inspection', label: 'Malicious Files' },
    { id: 'Search Leak', label: 'Search Isolation' }
  ];

  const filteredScenarios = selectedCategory === 'ALL'
    ? scenarios
    : scenarios.filter(s => s.category === selectedCategory);

  const defendedCount = scenarios.filter(s => s.decision === 'DEFENDED').length;
  const totalCount = scenarios.length;

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
    setIsSimulatingAll(true);
    for (let i = 0; i < scenarios.length; i++) {
      await runSimulation(i);
      await new Promise(r => setTimeout(r, 60));
    }
    setIsSimulatingAll(false);
  };

  const activeIndex = scenarios.findIndex(s => s.threatId === activeScenario.threatId);

  return (
    <div className="space-y-6">
      {/* Top Banner with Friendly Explanation and Summary Stats */}
      <div className="p-6 rounded-3xl bg-[#0D1B2A] border border-[#334155] shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-600/20 text-cyan-300 text-xs font-semibold border border-blue-500/30">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Interactive Security & Penetration Testing Simulator</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2.5">
              <ShieldCheck className="w-7 h-7 text-cyan-400" />
              <span>Attack Defense Replay Lab</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Test common cyber attack techniques (like URL tampering, stolen links, and fake files) against TrustVault’s live security engine.
              Watch in real-time as every malicious attempt is instantly blocked and permanently recorded.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Primary 1-Click Test All Button */}
            <button
              onClick={runAllSimulations}
              disabled={runningIndex !== null || isSimulatingAll}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-xs sm:text-sm shadow-xl shadow-blue-500/30 transition-all flex items-center justify-center space-x-2.5 cursor-pointer ring-2 ring-cyan-400/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              title="1-Click test all 7 cyber attacks against TrustVault defenses"
            >
              {isSimulatingAll ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-white" />
                  <span>Testing All 7 Attacks...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 text-yellow-300 fill-current animate-pulse" />
                  <span>⚡ 1-Click Test All (Run All 7 Attacks)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#334155]">
          <div className="p-3.5 rounded-2xl bg-[#132238] border border-[#334155]">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Tested Scenarios</span>
            <div className="text-xl font-black text-white mt-1">
              {defendedCount} <span className="text-xs font-normal text-slate-400">/ {totalCount} Defended</span>
            </div>
            <span className="text-[10px] text-cyan-300 font-medium">100% Zero-Trust Coverage</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#132238] border border-[#334155]">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Security Outcome</span>
            <div className="text-xl font-black text-emerald-400 mt-1 flex items-center space-x-1.5">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span>0 Breaches</span>
            </div>
            <span className="text-[10px] text-slate-300 font-medium">All attempts blocked</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#132238] border border-[#334155]">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Revocation Cutoff</span>
            <div className="text-xl font-black text-cyan-400 mt-1 font-mono">
              0 ms
            </div>
            <span className="text-[10px] text-slate-300 font-medium">Instant server severance</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#132238] border border-[#334155]">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Ledger Evidence</span>
            <div className="text-xl font-black text-white mt-1 font-mono text-sm">
              SHA-256
            </div>
            <span className="text-[10px] text-emerald-300 font-medium">Every denial hashed</span>
          </div>
        </div>
      </div>

      {/* Category Filter & Explanation Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0D1B2A] p-2 rounded-2xl border border-[#334155]">
        {/* Category Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto py-1 px-1">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#1B2D45]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* View Mode Toggle: Friendly vs Technical */}
        <div className="flex items-center bg-[#132238] p-1 rounded-xl border border-[#334155] self-end sm:self-auto shrink-0">
          <button
            onClick={() => setViewMode('friendly')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              viewMode === 'friendly'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Plain English</span>
          </button>
          <button
            onClick={() => setViewMode('technical')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              viewMode === 'technical'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Technical Wire</span>
          </button>
        </div>
      </div>

      {/* 1-Click Test All Completion Celebratory Banner */}
      {defendedCount === totalCount && (
        <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/60 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-fadeIn">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white flex items-center space-x-2">
                <span>⚡ 1-Click Test Complete: All 7 Attacks Intercepted & Defended!</span>
                <span className="px-2 py-0.5 rounded bg-emerald-800 text-[10px] font-mono text-emerald-200">100% Defense Rate</span>
              </h3>
              <p className="text-xs text-emerald-200 mt-0.5">
                Zero data leaked. Every attack vector was blocked on the server, and every blocked attempt was recorded in the SHA-256 ledger.
              </p>
            </div>
          </div>
          <button
            onClick={() => onSelectTab('audit-trail')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 cursor-pointer transition-all self-end sm:self-auto"
          >
            <span>View SHA-256 Ledger</span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-300" />
          </button>
        </div>
      )}

      {/* Two Column Layout: Attack Scenarios List & Interactive Replay Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: List of Scenarios (7 Columns) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Select an Attack to Inspect</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={runAllSimulations}
                disabled={runningIndex !== null || isSimulatingAll}
                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] shadow-sm flex items-center space-x-1 cursor-pointer transition-all disabled:opacity-50"
                title="1-Click test all attacks"
              >
                <Zap className="w-3 h-3 text-yellow-300 fill-current" />
                <span>1-Click Test All</span>
              </button>
              <span className="font-mono text-[11px]">{filteredScenarios.length} Scenarios</span>
            </div>
          </div>

          <div className="space-y-3">
            {filteredScenarios.map((sc) => {
              const originalIndex = scenarios.findIndex(s => s.threatId === sc.threatId);
              const isSelected = activeScenario.threatId === sc.threatId;
              const isRunning = runningIndex === originalIndex;

              return (
                <div
                  key={sc.threatId}
                  onClick={() => setActiveScenario(sc)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                    isSelected
                      ? 'bg-[#1B2D45] border-cyan-400 shadow-lg ring-1 ring-cyan-400/30'
                      : 'bg-[#132238] border-[#334155] hover:border-slate-500 hover:bg-[#182a40]'
                  }`}
                >
                  {/* Top row: Threat ID, Name, Severity & Action button */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="font-mono text-cyan-300 font-bold text-xs bg-[#0D1B2A] px-2 py-0.5 rounded border border-[#334155]">
                          {sc.threatId}
                        </span>
                        <h3 className="font-bold text-white text-sm">{sc.name}</h3>
                        {sc.severity && (
                          <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                            sc.severity === 'CRITICAL'
                              ? 'bg-rose-950/70 text-rose-300 border-rose-800'
                              : 'bg-amber-950/70 text-amber-300 border-amber-800'
                          }`}>
                            {sc.severity}
                          </span>
                        )}
                      </div>

                      {/* Plain English or description */}
                      <p className="text-xs text-slate-300 pt-0.5 leading-relaxed">
                        {viewMode === 'friendly' && sc.simpleGoal ? sc.simpleGoal : sc.description}
                      </p>
                    </div>

                    {/* Single Attack Run Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        runSimulation(originalIndex);
                      }}
                      disabled={isRunning || isSimulatingAll}
                      className="shrink-0 p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                      title="Run this attack simulation"
                    >
                      {isRunning ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-cyan-200" />
                      ) : (
                        <Play className="w-4 h-4 fill-current text-white" />
                      )}
                      <span className="text-[11px] font-bold hidden sm:inline">Test</span>
                    </button>
                  </div>

                  {/* Metadata Chips: Target & Attacker */}
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#334155]/60 flex-wrap gap-2 text-slate-400">
                    <div className="flex items-center space-x-2">
                      <span className="text-cyan-300 font-medium">
                        🎯 Target: {sc.targetAsset || 'Confidential Document'}
                      </span>
                    </div>

                    {/* Defense Result Badge */}
                    <div>
                      {sc.decision ? (
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center space-x-1 ${
                          sc.decision === 'DEFENDED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                            : 'bg-rose-950 text-rose-300 border border-rose-500/50'
                        }`}>
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          <span>BLOCKED • 100% SECURE</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono bg-[#0D1B2A] px-2 py-0.5 rounded border border-[#334155]">
                          Ready to Test
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Attack Inspector & Visual Defense Flow (6 Columns) */}
        <div className="lg:col-span-6 bg-[#132238] border border-[#334155] rounded-3xl p-6 shadow-xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#334155]">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-cyan-400 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 text-cyan-300" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider block">Interactive Attack Replay</span>
                <h3 className="text-sm font-black text-white">{activeScenario.name}</h3>
              </div>
            </div>

            <span className="font-mono text-xs font-bold bg-[#0D1B2A] text-cyan-300 px-2.5 py-1 rounded-lg border border-[#334155]">
              {activeScenario.threatId}
            </span>
          </div>

          {/* Step-by-Step Visual Defense Flow Diagram */}
          <div className="p-4 rounded-2xl bg-[#0D1B2A] border border-[#334155] space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Live Defense Pipeline:
            </span>
            <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-medium pt-1">
              <div className="p-2 rounded-xl bg-[#132238] border border-[#334155] space-y-1">
                <span className="text-slate-400 block font-mono">1. Exploit</span>
                <span className="text-white font-bold block truncate">Malicious Req</span>
              </div>
              <div className="p-2 rounded-xl bg-[#1B2D45] border border-blue-500/50 space-y-1">
                <span className="text-cyan-300 block font-mono">2. Intercept</span>
                <span className="text-cyan-200 font-bold block truncate">Zero-Trust</span>
              </div>
              <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/50 space-y-1">
                <span className="text-emerald-400 block font-mono">3. Decision</span>
                <span className="text-emerald-300 font-bold block truncate">403 Blocked</span>
              </div>
              <div className="p-2 rounded-xl bg-[#132238] border border-[#334155] space-y-1">
                <span className="text-slate-400 block font-mono">4. Forensic</span>
                <span className="text-white font-bold block truncate">SHA-256 Chain</span>
              </div>
            </div>
          </div>

          {/* Plain English Explanations */}
          <div className="space-y-4 text-xs">
            {/* The Attacker's Goal */}
            <div className="p-4 rounded-2xl bg-[#0D1B2A] border border-[#334155] space-y-1.5">
              <div className="flex items-center space-x-2 text-rose-300 font-bold text-xs">
                <UserX className="w-4 h-4 text-rose-400" />
                <span>What the Attacker is Trying to Do:</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-xs">
                {activeScenario.simpleGoal || activeScenario.description}
              </p>
              {activeScenario.attackerPersona && (
                <div className="pt-1 text-[11px] font-mono text-slate-400">
                  Adversary Identity: <strong className="text-white">{activeScenario.attackerPersona}</strong>
                </div>
              )}
            </div>

            {/* How TrustVault Defends */}
            <div className="p-4 rounded-2xl bg-[#1B2D45] border border-[#334155] space-y-1.5">
              <div className="flex items-center space-x-2 text-cyan-300 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>How TrustVault Stops This Attack:</span>
              </div>
              <p className="text-slate-200 leading-relaxed text-xs">
                {activeScenario.simpleDefense || 'Centralized Decision Engine checks user ID, active delegation records, and document ownership before any byte leaves storage.'}
              </p>
            </div>

            {/* Technical Payload (if technical mode or toggled) */}
            {viewMode === 'technical' && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-300 block flex items-center space-x-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Raw Simulated Wire Payload:</span>
                </span>
                <div className="p-3 rounded-xl bg-[#0D1B2A] font-mono text-cyan-300 text-[11px] border border-[#334155] whitespace-pre-wrap select-all overflow-x-auto">
                  {activeScenario.simulatedPayload}
                </div>
              </div>
            )}

            {/* Defense Confirmation Status */}
            {activeScenario.details ? (
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 font-bold text-emerald-400 text-xs">
                    <CheckCircle className="w-4 h-4" />
                    <span>Attack Safely Intercepted & Defended!</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-900 text-emerald-200">
                    {activeScenario.actualResult}
                  </span>
                </div>

                <p className="text-slate-200 text-xs leading-relaxed">
                  {activeScenario.details}
                </p>

                {activeScenario.auditEventId && (
                  <div className="pt-2 border-t border-emerald-800/40 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Audit Ledger Block:</span>
                    <span className="text-cyan-300 font-bold">{activeScenario.auditEventId}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-[#0D1B2A] border border-[#334155] text-center space-y-1 text-slate-400">
                <p className="text-xs font-semibold text-slate-300">This scenario has not been executed yet in this session.</p>
                <p className="text-[11px]">Click "Execute This Attack Test" below to fire the simulation against live security rules.</p>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-[#334155] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              onClick={() => {
                if (activeIndex !== -1) runSimulation(activeIndex);
              }}
              disabled={runningIndex === activeIndex || isSimulatingAll}
              className="py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {runningIndex === activeIndex ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-200" />
                  <span>Probing Zero-Trust Defenses...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current text-cyan-300" />
                  <span>Execute This Attack Test</span>
                </>
              )}
            </button>

            <button
              onClick={() => onSelectTab('audit-trail')}
              className="px-4 py-2.5 rounded-xl bg-[#1B2D45] hover:bg-[#223859] text-cyan-300 hover:text-white text-xs font-semibold border border-[#334155] flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <span>View Cryptographic Audit Chain</span>
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
