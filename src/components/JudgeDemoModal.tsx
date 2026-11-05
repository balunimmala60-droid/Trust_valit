import React, { useState } from 'react';
import { User } from '../types';
import {
  HelpCircle,
  X,
  ArrowRight
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
      minute: 'Minute 1',
      title: 'Platform Architecture & Owner Context',
      description: 'Explain TrustVault: Zero-Trust Document Sharing with a Cryptographic Audit Trail. Begin logged in as Sarah Chen (Owner). Explore the real-time access radar and live system metrics.',
      actionLabel: 'Switch to Sarah Chen (Owner) & Open Dashboard',
      action: () => {
        onSwitchUser(owner);
        onSelectTab('dashboard');
        onClose();
      }
    },
    {
      minute: 'Minute 2',
      title: 'Document Integrity & Granular Delegation',
      description: 'Navigate to Document Library. Open the Security Passport for "Series B Financial Cap Table". Observe the SHA-256 checksum and isolated storage UUID. Grant READ permission to David Ross (Viewer) with optional expiration.',
      actionLabel: 'Open Documents as Sarah (Owner)',
      action: () => {
        onSwitchUser(owner);
        onSelectTab('documents');
        onClose();
      }
    },
    {
      minute: 'Minute 3',
      title: 'Viewer Access & IDOR Defense Demonstration',
      description: 'Switch persona to David Ross (Viewer). Demonstrate that David can securely preview and download the authorized Cap Table. Then observe that unshared documents are strictly denied (HTTP 403 Forbidden).',
      actionLabel: 'Switch to David Ross (Viewer)',
      action: () => {
        onSwitchUser(viewerDavid);
        onSelectTab('documents');
        onClose();
      }
    },
    {
      minute: 'Minute 4',
      title: 'Immediate Server Revocation (0ms Window)',
      description: 'Switch back to Sarah Chen (Owner) and revoke David\'s access. Switch immediately back to David and attempt download: observe instant 403 denial with zero cached grace period! Inspect the audit log showing the revocation event.',
      actionLabel: 'Switch to Sarah to Revoke / David to Verify',
      action: () => {
        onSwitchUser(owner);
        onSelectTab('documents');
        onClose();
      }
    },
    {
      minute: 'Minute 5',
      title: 'Cryptographic Audit Proof & Attack Replay Lab',
      description: 'Open the Audit Chain view: click "Verify Hash Chain Integrity" to validate every SHA-256 link. Click "Simulate Tampering" to watch the engine immediately catch an altered byte! Finally, open the Attack Replay Lab to run live IDOR and privilege escalation attacks.',
      actionLabel: 'Open Security Proof Center & Attack Lab',
      action: () => {
        onSwitchUser(admin);
        onSelectTab('proof-center');
        onClose();
      }
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#132238] border border-[#334155] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#334155] flex items-center justify-between bg-[#0D1B2A]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <HelpCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                  Enterprise Architecture Tour
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Zero-Trust Guided Walkthrough</span>
              </div>
              <h2 className="text-base font-black text-white tracking-tight">
                TrustVault Architecture & Security Tour
              </h2>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#1B2D45] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Navigation */}
        <div className="flex items-center justify-between px-6 pt-4 border-b border-[#334155] bg-[#0D1B2A]/70 text-xs">
          {steps.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx + 1)}
              className={`pb-3 font-bold transition-all border-b-2 flex items-center space-x-1 ${
                currentStep === idx + 1
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{s.minute}</span>
            </button>
          ))}
        </div>

        {/* Current Step Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1 bg-[#132238] text-slate-200">
          {(() => {
            const step = steps[currentStep - 1];
            return (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded bg-blue-600 text-white font-bold font-mono text-[10px]">
                    {step.minute}
                  </span>
                  <h3 className="text-base font-black text-white">{step.title}</h3>
                </div>

                <div className="p-4 rounded-xl bg-[#0D1B2A] border border-[#334155] text-slate-300 leading-relaxed text-xs">
                  {step.description}
                </div>

                <div className="p-4 rounded-xl bg-[#1B2D45] border border-[#334155] space-y-2">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                    Recommended Platform Interaction:
                  </span>

                  <button
                    onClick={step.action}
                    className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
                  >
                    <span>{step.actionLabel}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-[#334155] bg-[#0D1B2A] flex items-center justify-between text-xs">
          <button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 font-semibold transition-colors"
          >
            Previous Minute
          </button>

          <span className="text-slate-400 text-[11px] font-mono">
            Step {currentStep} of {steps.length}
          </span>

          <button
            onClick={() => setCurrentStep(prev => Math.min(steps.length, prev + 1))}
            disabled={currentStep === steps.length}
            className="px-3 py-1.5 rounded-lg text-cyan-400 hover:text-cyan-300 disabled:opacity-30 font-bold transition-colors"
          >
            Next Minute
          </button>
        </div>
      </div>
    </div>
  );
};
