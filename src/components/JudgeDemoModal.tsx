import React, { useState } from 'react';
import { User } from '../types';
import {
  Sparkles,
  X,
  ArrowRight,
  ShieldCheck,
  Lock,
  Unlock,
  Eye,
  Database,
  CheckCircle,
  FileText
} from 'lucide-react';

interface JudgeDemoModalProps {
  onClose: () => void;
  allUsers: User[];
  onSwitchUser: (user: User) => void;
  onSelectTab: (tab: string) => void;
}

export const JudgeDemoModal: React.FC<JudgeDemoModalProps> = ({
  onClose,
  allUsers,
  onSwitchUser,
  onSelectTab
}) => {
  const [currentStep, setCurrentStep] = useState(1);

  const owner = allUsers.find(u => u.role === 'OWNER') || allUsers[0];
  const viewerDavid = allUsers.find(u => u.id === 'user_viewer_01') || allUsers[0];
  const admin = allUsers.find(u => u.role === 'ADMIN') || allUsers[0];

  const steps = [
    {
      stepNumber: 1,
      badge: 'Step 1 • Owner Control',
      title: 'Upload Confidential Documents as Owner',
      icon: <FileText className="w-5 h-5 text-cyan-400" />,
      simpleExplanation: 'As an Owner (Sarah Chen), you have complete management authority over confidential assets. When you upload a document, TrustVault encrypts it with AES-256 and generates a cryptographic SHA-256 integrity hash so it can never be tampered with in storage.',
      keyPoints: [
        'Isolated private storage UUID for every uploaded file',
        'Cryptographic SHA-256 checksum computed on raw byte contents',
        'Zero-trust perimeter: files are completely private by default'
      ],
      actionLabel: 'Try Step 1: Switch to Sarah (Owner) & Open Documents',
      action: () => {
        onSwitchUser(owner);
        onSelectTab('documents');
        onClose();
      }
    },
    {
      stepNumber: 2,
      badge: 'Step 2 • Controlled Sharing',
      title: 'Grant Explicit READ or EDIT Permissions',
      icon: <Lock className="w-5 h-5 text-emerald-400" />,
      simpleExplanation: 'Nobody has access unless the Owner explicitly grants it. You choose whether the recipient can only view/download (READ) or collaborate (EDIT), and you can set an automatic expiration timer (1 hour, 24 hours, or 7 days).',
      keyPoints: [
        'Granular READ vs. EDIT permission delegation',
        'Automatic expiration timers prevent stale or lingering access',
        'Every grant is recorded as an immutable block in the SHA-256 audit ledger'
      ],
      actionLabel: 'Try Step 2: Open Documents & Inspect Cap Table Passport',
      action: () => {
        onSwitchUser(owner);
        onSelectTab('documents');
        onClose();
      }
    },
    {
      stepNumber: 3,
      badge: 'Step 3 • Viewer Least Privilege',
      title: 'Experience Zero-Trust as a Viewer',
      icon: <Eye className="w-5 h-5 text-blue-400" />,
      simpleExplanation: 'Switch to David Ross (Viewer). David can preview and download documents explicitly shared with him. Any attempt to touch an unshared document triggers an immediate HTTP 403 Forbidden denial.',
      keyPoints: [
        'Direct URL IDOR attempts are strictly blocked at the Centralized Engine',
        'Viewers cannot grant permissions, revoke access, or alter ownership',
        'Watermarked enclave preview protects confidential content'
      ],
      actionLabel: 'Try Step 3: Switch to David (Viewer) & Test Shared Access',
      action: () => {
        onSwitchUser(viewerDavid);
        onSelectTab('documents');
        onClose();
      }
    },
    {
      stepNumber: 4,
      badge: 'Step 4 • Instant Revoke',
      title: 'Immediate 0ms Revocation Cutoff',
      icon: <Unlock className="w-3.5 h-3.5 text-cyan-300" />,
      simpleExplanation: 'Need to cut off access immediately? The owner clicks Revoke on the document card. Access terminates instantly across the entire platform with zero cached grace period!',
      keyPoints: [
        'Immediate 0ms server-side revocation enforcement',
        'Subsequent download attempts fail instantly with a 403 Forbidden block',
        'Revocation event is cryptographically linked to the SHA-256 audit ledger'
      ],
      actionLabel: 'Try Step 4: Switch to Sarah (Owner) to Test 1-Click Revoke',
      action: () => {
        onSwitchUser(owner);
        onSelectTab('documents');
        onClose();
      }
    },
    {
      stepNumber: 5,
      badge: 'Step 5 • Cryptographic Proofs',
      title: 'Verifiable Audit Chain & Security Proofs',
      icon: <Database className="w-5 h-5 text-cyan-400" />,
      simpleExplanation: 'Every view, download, grant, revocation, and denial is linked by SHA-256 block hashes (H_n = SHA-256(H_n-1 || payload)). If anyone attempts to tamper with a single byte, TrustVault catches it instantly!',
      keyPoints: [
        'Verify SHA-256 Merkle chain integrity in 1 click',
        'Simulate payload tampering to watch cryptographic detection in action',
        'Mandatory Two-Step Verification (2FA) protects all account sessions'
      ],
      actionLabel: 'Try Step 5: Open Security Proof Center & Audit Chain',
      action: () => {
        onSwitchUser(admin);
        onSelectTab('proof-center');
        onClose();
      }
    }
  ];

  const currentStepData = steps[currentStep - 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#132238] border border-[#334155] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] text-slate-100">
        {/* Header */}
        <div className="p-5 border-b border-[#334155] flex items-center justify-between bg-[#0D1B2A]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 border border-blue-400/40">
              <Sparkles className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                  Interactive Demo
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Zero-Trust Guided Walkthrough</span>
              </div>
              <h2 className="text-base font-black text-white tracking-tight">
                TrustVault Interactive Demo
              </h2>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#1B2D45] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Tabs Navigation */}
        <div className="flex items-center justify-between px-6 pt-3.5 border-b border-[#334155] bg-[#0D1B2A]/70 text-xs overflow-x-auto">
          {steps.map(s => (
            <button
              key={s.stepNumber}
              onClick={() => setCurrentStep(s.stepNumber)}
              className={`pb-3 font-bold transition-all border-b-2 flex items-center space-x-1.5 whitespace-nowrap px-2 ${
                currentStep === s.stepNumber
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                currentStep === s.stepNumber ? 'bg-blue-600 text-white' : 'bg-[#1B2D45] text-slate-400'
              }`}>
                {s.stepNumber}
              </span>
              <span>Step {s.stepNumber}</span>
            </button>
          ))}
        </div>

        {/* Current Step Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1 bg-[#132238] text-slate-200">
          <div className="space-y-4">
            <div className="flex items-center space-x-2.5">
              <span className="px-2.5 py-1 rounded-lg bg-blue-600/30 border border-cyan-400 text-cyan-300 font-bold font-mono text-[10px]">
                {currentStepData.badge}
              </span>
              <h3 className="text-base font-black text-white">{currentStepData.title}</h3>
            </div>

            {/* Plain English Explanation */}
            <div className="p-4 rounded-2xl bg-[#0D1B2A] border border-[#334155] text-slate-200 leading-relaxed text-xs">
              <p className="text-sm font-medium text-white mb-1">How it works:</p>
              {currentStepData.simpleExplanation}
            </div>

            {/* Key Takeaways */}
            <div className="p-4 rounded-2xl bg-[#1B2D45] border border-[#334155] space-y-2">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                Security Capabilities Highlight:
              </span>
              <ul className="space-y-1.5">
                {currentStepData.keyPoints.map((pt, i) => (
                  <li key={i} className="flex items-start space-x-2 text-slate-300 text-xs">
                    <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <button
                onClick={currentStepData.action}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2"
              >
                <span>{currentStepData.actionLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-[#334155] bg-[#0D1B2A] flex items-center justify-between text-xs">
          <button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 font-semibold transition-colors"
          >
            ← Previous Step
          </button>

          <span className="text-slate-400 text-[11px] font-mono">
            Step {currentStep} of {steps.length}
          </span>

          <button
            onClick={() => setCurrentStep(prev => Math.min(steps.length, prev + 1))}
            disabled={currentStep === steps.length}
            className="px-3.5 py-1.5 rounded-lg text-cyan-400 hover:text-cyan-300 disabled:opacity-30 font-bold transition-colors"
          >
            Next Step →
          </button>
        </div>
      </div>
    </div>
  );
};
