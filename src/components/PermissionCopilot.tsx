import React, { useState } from 'react';
import { User, VaultDocument, PermissionLevel } from '../types';
import {
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Lock,
  Clock,
  Info
} from 'lucide-react';

interface PermissionCopilotProps {
  currentUser: User;
  allUsers: User[];
  documents: VaultDocument[];
  onGrantPermission: (docId: string, targetEmail: string, level: PermissionLevel, expiresInHours?: number) => void;
  initialDocId?: string;
}

export const PermissionCopilot: React.FC<PermissionCopilotProps> = ({
  currentUser,
  allUsers,
  documents,
  onGrantPermission,
  initialDocId
}) => {
  const [selectedDocId, setSelectedDocId] = useState<string>(initialDocId || documents[0]?.id || '');
  const [targetEmail, setTargetEmail] = useState<string>(allUsers.find(u => u.role === 'VIEWER')?.email || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    recommendedLevel: PermissionLevel;
    recommendedHours?: number;
    rationale: string;
    identifiedRisks: string[];
    leastPrivilegePrinciple: string;
  } | null>(null);
  const [appliedMsg, setAppliedMsg] = useState('');

  const selectedDoc = documents.find(d => d.id === selectedDocId);
  const targetUser = allUsers.find(u => u.email === targetEmail);

  const runCopilotAnalysis = () => {
    if (!selectedDoc || !targetUser) return;
    setIsAnalyzing(true);

    setTimeout(() => {
      const isFinancial = selectedDoc.category === 'Financial';
      const isSecurity = selectedDoc.category === 'Security';
      const isContractor = targetUser.email.includes('contractor');

      let risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
      let recLevel: PermissionLevel = 'READ';
      let recHours: number | undefined = undefined;
      const risks: string[] = [];

      if (isFinancial) {
        risk = isContractor ? 'CRITICAL' : 'HIGH';
        recLevel = 'READ';
        recHours = 24;
        risks.push('Document contains equity valuation, cap table numbers, and investor covenants.');
        risks.push('Granting EDIT access risks inadvertent parameter alteration or data exfiltration.');
        if (isContractor) {
          risks.push('Recipient identity is an external contractor with transient organizational tenure.');
        }
      } else if (isSecurity) {
        risk = 'HIGH';
        recLevel = 'READ';
        recHours = 48;
        risks.push('Document contains red-team penetration findings and vulnerability maps.');
        risks.push('Stale or permanent access could leak unresolved exploit vectors.');
      } else {
        risk = 'MEDIUM';
        recLevel = 'READ';
        recHours = 168; // 7 days
        risks.push('Technical blueprint contains internal architecture specifications.');
      }

      setAnalysisResult({
        riskLevel: risk,
        recommendedLevel: recLevel,
        recommendedHours: recHours,
        rationale: `Based on automated sensitivity scoring of '${selectedDoc.title}', TrustVault Copilot recommends a strictly time-bounded ${recLevel} delegation (${recHours ? recHours + ' hours' : 'unlimited'}).`,
        identifiedRisks: risks,
        leastPrivilegePrinciple: 'Least Privilege mandates that subjects receive only the minimum authorizations required to complete their immediate task, for the shortest defensible timeframe.',
      });

      setIsAnalyzing(false);
    }, 600);
  };

  const handleOwnerConfirm = () => {
    if (!selectedDoc || !targetUser || !analysisResult) return;
    onGrantPermission(
      selectedDoc.id,
      targetUser.email,
      analysisResult.recommendedLevel,
      analysisResult.recommendedHours
    );
    setAppliedMsg(`Successfully granted ${analysisResult.recommendedLevel} delegation to ${targetUser.email} with ${analysisResult.recommendedHours}h expiration.`);
    setTimeout(() => setAppliedMsg(''), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-[#132238] border border-[#334155] shadow-md">
        <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1.5">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>AI Permission Copilot & Least-Privilege Advisory</span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Intelligent Least-Privilege Recommendation Engine
        </h1>
        <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
          Analyzes classification tags, recipient risk tier, and organizational sensitivity to recommend least-privilege access rules. AI acts strictly as an advisor; the human owner retains final authority.
        </p>

        {/* Anti-Autonomous Guardrail Notice */}
        <div className="mt-3 p-3 rounded-xl bg-[#1B2D45] border border-[#334155] text-xs text-slate-300 flex items-center space-x-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            <strong className="text-white">Zero-Trust Guardrail:</strong> AI cannot grant access automatically or expand permissions without explicit human owner confirmation.
          </span>
        </div>
      </div>

      {appliedMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2 font-medium">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{appliedMsg}</span>
        </div>
      )}

      {/* Inputs & Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration */}
        <div className="lg:col-span-5 bg-[#132238] border border-[#334155] rounded-2xl p-5 shadow-md space-y-4">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Target Delegation Setup
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Select Document to Analyze</label>
              <select
                value={selectedDocId}
                onChange={e => {
                  setSelectedDocId(e.target.value);
                  setAnalysisResult(null);
                }}
                className="w-full bg-[#0D1B2A] border border-[#334155] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-medium"
              >
                {documents.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({d.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Recipient Identity</label>
              <select
                value={targetEmail}
                onChange={e => {
                  setTargetEmail(e.target.value);
                  setAnalysisResult(null);
                }}
                className="w-full bg-[#0D1B2A] border border-[#334155] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-medium"
              >
                {allUsers.filter(u => u.id !== currentUser.id).map(u => (
                  <option key={u.id} value={u.email}>
                    {u.fullName} ({u.email} - {u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={runCopilotAnalysis}
            disabled={isAnalyzing || !selectedDoc}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isAnalyzing ? 'Analyzing Classification & Risks...' : 'Run Least-Privilege Analysis'}</span>
          </button>
        </div>

        {/* Right Column: AI Analysis Card */}
        <div className="lg:col-span-7 bg-[#132238] border border-[#334155] rounded-2xl p-5 shadow-md flex flex-col justify-between">
          {analysisResult ? (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#334155]">
                <span className="font-bold text-white text-sm">Copilot Least-Privilege Assessment</span>
                <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                  analysisResult.riskLevel === 'CRITICAL'
                    ? 'bg-[#1e3a8a] text-cyan-200 border border-blue-400'
                    : analysisResult.riskLevel === 'HIGH'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {analysisResult.riskLevel} RISK EVALUATION
                </span>
              </div>

              {/* Rationale */}
              <div className="p-3 rounded-xl bg-[#0D1B2A] border border-[#334155] space-y-1">
                <span className="text-[10px] font-bold text-cyan-400 uppercase">Assessment Rationale</span>
                <p className="text-slate-200 leading-relaxed">{analysisResult.rationale}</p>
              </div>

              {/* Recommendation Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#0D1B2A] rounded-xl border border-[#334155]">
                  <span className="text-slate-400 text-[10px] block">Recommended Delegation</span>
                  <div className="font-black text-white text-sm mt-1 flex items-center space-x-1">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span>{analysisResult.recommendedLevel} ONLY</span>
                  </div>
                </div>

                <div className="p-3 bg-[#0D1B2A] rounded-xl border border-[#334155]">
                  <span className="text-slate-400 text-[10px] block">Suggested Auto-Expiry</span>
                  <div className="font-black text-white text-sm mt-1 flex items-center space-x-1">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>{analysisResult.recommendedHours} Hours</span>
                  </div>
                </div>
              </div>

              {/* Identified Threat Risks */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Identified Exposure Factors</span>
                <ul className="space-y-1">
                  {analysisResult.identifiedRisks.map((r, i) => (
                    <li key={i} className="flex items-start space-x-2 text-slate-300 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Confirmation Gate */}
              <div className="pt-4 border-t border-[#334155] flex items-center justify-between">
                <div className="text-[10px] text-slate-400">
                  Owner Signature Required • Logged to Audit Ledger
                </div>

                <button
                  onClick={handleOwnerConfirm}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all flex items-center space-x-1.5"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Confirm & Apply Delegation</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <Sparkles className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-xs max-w-sm mx-auto text-slate-300">
                Select a document and recipient identity on the left, then click "Run Least-Privilege Analysis" to evaluate risk factors and get recommendations.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
