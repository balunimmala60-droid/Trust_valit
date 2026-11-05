import React, { useState, useRef } from 'react';
import { User, VaultDocument, PermissionLevel } from '../types';
import { inspectFileMagicBytes, sha256Bytes, formatBytes } from '../services/crypto';
import {
  X,
  Upload,
  FileCheck,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Lock,
  Unlock,
  ShieldCheck,
  Clock,
  Shield
} from 'lucide-react';

interface UploadModalProps {
  currentUser: User;
  allUsers: User[];
  onClose: () => void;
  onUploadSuccess: (
    newDoc: VaultDocument,
    initialPermission?: {
      targetEmail: string;
      level: PermissionLevel;
      expiresInHours?: number;
    }
  ) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  currentUser,
  allUsers,
  onClose,
  onUploadSuccess
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileValidation, setFileValidation] = useState<{
    valid: boolean;
    detectedType: string;
    expectedExtension: string;
    error?: string;
  } | null>(null);
  const [fileHash, setFileHash] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'Financial' | 'Legal' | 'Technical' | 'Security' | 'General'>('General');
  const [tags, setTags] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Grant & Revoke & Copilot states
  const [shouldGrantOnUpload, setShouldGrantOnUpload] = useState<boolean>(false);
  const [targetGrantEmail, setTargetGrantEmail] = useState<string>(
    allUsers.find(u => u.id !== currentUser.id && u.role === 'VIEWER')?.email || allUsers[0]?.email || ''
  );
  const [grantLevel, setGrantLevel] = useState<PermissionLevel>('READ');
  const [grantDurationHours, setGrantDurationHours] = useState<number>(24);
  const [simulateImmediateRevoke, setSimulateImmediateRevoke] = useState<boolean>(false);

  // In-modal Copilot score
  const [copilotAnalyzed, setCopilotAnalyzed] = useState(false);
  const [copilotScore, setCopilotScore] = useState<{
    score: number; // 0 - 100
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    recommendation: string;
    safeguards: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const calculateCopilotScore = (cat: string, targetEmail: string, level: PermissionLevel, hours: number) => {
    let score = 92; // default high security score
    let risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    const safeguards: string[] = [];

    if (cat === 'Financial' || cat === 'Security') {
      score -= 15;
      risk = 'HIGH';
      safeguards.push(`High Sensitivity Classification (${cat}). Requires strict temporal boundary.`);
    } else {
      safeguards.push(`Standard classification (${cat}). Baseline zero-trust protections active.`);
    }

    if (level === 'EDIT') {
      score -= 20;
      risk = risk === 'HIGH' ? 'CRITICAL' : 'MEDIUM';
      safeguards.push('EDIT authorization increases tampering risk; restrict to authorized reviewers only.');
    } else {
      safeguards.push('Least-Privilege READ-only permission verified.');
    }

    if (hours > 48) {
      score -= 10;
      safeguards.push('Access duration exceeds 48h; shorter delegation minimizes exposure window.');
    } else {
      safeguards.push(`Time-bound cutoff enforced: ${hours} hours expiration.`);
    }

    if (simulateImmediateRevoke) {
      score += 15;
      safeguards.push('Immediate zero-delay revocation will be primed and ready (0ms cutoff).');
    }

    const finalScore = Math.max(35, Math.min(100, score));
    return {
      score: finalScore,
      riskLevel: risk,
      recommendation: `Copilot evaluated security index at ${finalScore}/100. ${
        finalScore >= 80 ? 'Recommended configuration meets zero-trust standards.' : 'Caution: High privilege exposure detected.'
      }`,
      safeguards
    };
  };

  const handleRunCopilotScore = () => {
    const analysis = calculateCopilotScore(category, targetGrantEmail, grantLevel, grantDurationHours);
    setCopilotScore(analysis);
    setCopilotAnalyzed(true);
  };

  const handleFileChange = async (file: File) => {
    setSelectedFile(file);
    setIsProcessing(true);

    try {
      const validation = await inspectFileMagicBytes(file);
      setFileValidation(validation);

      const buffer = await file.arrayBuffer();
      const hash = await sha256Bytes(buffer);
      setFileHash(hash);

      if (!title) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_.-]/g, ' ');
        setTitle(cleanName);
      }

      // Auto-compute Copilot score on file load
      const analysis = calculateCopilotScore(category, targetGrantEmail, grantLevel, grantDurationHours);
      setCopilotScore(analysis);
      setCopilotAnalyzed(true);
    } catch (e) {
      console.error('File inspection failed:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !fileValidation?.valid) return;

    const ext = selectedFile.name.split('.').pop()?.toLowerCase() || 'bin';
    const storageId = `enc_blob_${Math.random().toString(36).substring(2, 10)}_${Date.now()}.${ext}`;

    const newDoc: VaultDocument = {
      id: 'doc_vault_' + Math.random().toString(36).substring(2, 9),
      ownerId: currentUser.id,
      ownerName: currentUser.fullName,
      ownerEmail: currentUser.email,
      title: title || selectedFile.name,
      description,
      category,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      originalFilename: selectedFile.name,
      storageIdentifier: storageId,
      mimeType: fileValidation.detectedType,
      sizeBytes: selectedFile.size,
      fileExtension: ext,
      integrityHash: fileHash,
      currentVersion: 1,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      contentPreview: `TRUSTVAULT SECURE PAYLOAD: ${title}. Validated byte stream stored at ${storageId}. Original hash: ${fileHash}. Verified by ${currentUser.fullName}.`
    };

    const initialPermission = shouldGrantOnUpload && targetGrantEmail
      ? {
          targetEmail: targetGrantEmail,
          level: grantLevel,
          expiresInHours: grantDurationHours,
          revokeImmediately: simulateImmediateRevoke
        }
      : undefined;

    onUploadSuccess(newDoc, initialPermission as any);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#0f1d40] border border-blue-500/50 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] text-white">
        {/* Header */}
        <div className="p-5 border-b border-blue-900/60 flex items-center justify-between bg-[#0b1a3d]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight">Upload, Grant & Copilot Assessment</h2>
              <p className="text-xs text-blue-200">Inspect magic bytes, prime grants/revocations, and verify AI Copilot security score.</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-lg text-blue-300 hover:text-white hover:bg-blue-900/60">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs flex-1 bg-[#0f1d40] text-slate-100">
          {/* File Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
              selectedFile
                ? fileValidation?.valid
                  ? 'border-emerald-500 bg-emerald-950/30'
                  : 'border-blue-500 bg-[#162447]'
                : 'border-blue-700/60 hover:border-blue-400 bg-[#0a1636]'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={e => {
                if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
              }}
              className="hidden"
              accept=".pdf,.docx,.jpg,.jpeg,.png"
            />

            {selectedFile ? (
              <div className="space-y-1.5">
                <FileCheck className={`w-8 h-8 mx-auto ${fileValidation?.valid ? 'text-emerald-400' : 'text-blue-300'}`} />
                <div className="font-bold text-white text-sm">{selectedFile.name}</div>
                <div className="text-blue-300 text-xs font-mono">{formatBytes(selectedFile.size)}</div>

                {isProcessing ? (
                  <div className="text-blue-200 font-mono">Inspecting magic bytes & computing SHA-256...</div>
                ) : fileValidation?.valid ? (
                  <div className="flex items-center justify-center space-x-1.5 text-emerald-300 text-xs font-bold">
                    <CheckCircle className="w-4 h-4" />
                    <span>File Signature Verified: {fileValidation.detectedType}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-1.5 text-blue-300 text-xs font-bold">
                    <AlertCircle className="w-4 h-4" />
                    <span>{fileValidation?.error || 'Signature inspection failed!'}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <Upload className="w-8 h-8 text-blue-400 mx-auto" />
                <div className="font-bold text-white">Choose or drop document to upload</div>
                <div className="text-blue-300 text-[11px]">
                  Supported formats: PDF, DOCX, PNG, JPG, JPEG (Max 15MB)
                </div>
              </div>
            )}
          </div>

          {/* Real-time Integrity Hash Display */}
          {fileHash && (
            <div className="p-3 bg-[#0a1636] border border-blue-900/80 rounded-xl space-y-1">
              <span className="text-[10px] text-blue-300 uppercase font-bold tracking-wider block">
                Calculated SHA-256 Integrity Checksum
              </span>
              <div className="font-mono text-white text-[11px] break-all select-all font-semibold">
                {fileHash}
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="text-blue-200 block mb-1 font-semibold">Document Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Q3 Audited Financial Statements"
                className="w-full bg-[#0a1636] border border-blue-700/60 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-400 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-blue-200 block mb-1 font-semibold">Category</label>
                <select
                  value={category}
                  onChange={e => {
                    const newCat = e.target.value as any;
                    setCategory(newCat);
                    const analysis = calculateCopilotScore(newCat, targetGrantEmail, grantLevel, grantDurationHours);
                    setCopilotScore(analysis);
                  }}
                  className="w-full bg-[#0a1636] border border-blue-700/60 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-400 font-medium"
                >
                  <option value="Financial">Financial</option>
                  <option value="Legal">Legal</option>
                  <option value="Technical">Technical</option>
                  <option value="Security">Security</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="text-blue-200 block mb-1 font-semibold">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  placeholder="Audit, Q3, Confidential"
                  className="w-full bg-[#0a1636] border border-blue-700/60 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>

            <div>
              <label className="text-blue-200 block mb-1 font-semibold">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                placeholder="Describe document purpose, security classification, and handling instructions..."
                className="w-full bg-[#0a1636] border border-blue-700/60 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          {/* Section: Prime Grant & Revoke on Upload */}
          <div className="p-4 rounded-xl border border-blue-500/40 bg-[#0a1636] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-white text-xs uppercase tracking-wider">
                  Initial Permission Delegation & Revocation
                </span>
              </div>

              <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-blue-200">
                <input
                  type="checkbox"
                  checked={shouldGrantOnUpload}
                  onChange={e => {
                    setShouldGrantOnUpload(e.target.checked);
                    if (e.target.checked) handleRunCopilotScore();
                  }}
                  className="rounded border-blue-600 bg-blue-900 text-blue-500 focus:ring-0"
                />
                <span>Grant access immediately upon upload</span>
              </label>
            </div>

            {shouldGrantOnUpload && (
              <div className="space-y-3 pt-2 border-t border-blue-900/60 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-blue-300 block mb-1 text-[11px] font-semibold">Recipient User</label>
                    <select
                      value={targetGrantEmail}
                      onChange={e => {
                        setTargetGrantEmail(e.target.value);
                        const analysis = calculateCopilotScore(category, e.target.value, grantLevel, grantDurationHours);
                        setCopilotScore(analysis);
                      }}
                      className="w-full bg-[#121c38] border border-blue-700/60 rounded-lg p-2 text-xs text-white font-medium"
                    >
                      {allUsers
                        .filter(u => u.id !== currentUser.id)
                        .map(u => (
                          <option key={u.id} value={u.email}>
                            {u.fullName} ({u.role})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-blue-300 block mb-1 text-[11px] font-semibold">Permission Level</label>
                    <select
                      value={grantLevel}
                      onChange={e => {
                        const newLvl = e.target.value as PermissionLevel;
                        setGrantLevel(newLvl);
                        const analysis = calculateCopilotScore(category, targetGrantEmail, newLvl, grantDurationHours);
                        setCopilotScore(analysis);
                      }}
                      className="w-full bg-[#121c38] border border-blue-700/60 rounded-lg p-2 text-xs text-white font-medium"
                    >
                      <option value="READ">READ (Preview & Download only)</option>
                      <option value="EDIT">EDIT (Modify Document metadata)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-blue-300 block mb-1 text-[11px] font-semibold">Expiration Cutoff</label>
                    <select
                      value={grantDurationHours}
                      onChange={e => {
                        const hrs = Number(e.target.value);
                        setGrantDurationHours(hrs);
                        const analysis = calculateCopilotScore(category, targetGrantEmail, grantLevel, hrs);
                        setCopilotScore(analysis);
                      }}
                      className="w-full bg-[#121c38] border border-blue-700/60 rounded-lg p-2 text-xs text-white font-medium"
                    >
                      <option value={1}>1 Hour (Strict Least-Privilege)</option>
                      <option value={24}>24 Hours (Standard Review)</option>
                      <option value={168}>7 Days (Extended)</option>
                      <option value={720}>30 Days (Maximum)</option>
                    </select>
                  </div>
                </div>

                {/* Simulate Immediate Revoke option */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#142854] border border-blue-500/40">
                  <div className="flex items-center space-x-2">
                    <Unlock className="w-3.5 h-3.5 text-blue-300" />
                    <span className="text-[11px] text-blue-100 font-medium">
                      Simulate Immediate Revocation (Grant & Revoke immediately to test 0ms denial cutoff)
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={simulateImmediateRevoke}
                    onChange={e => {
                      setSimulateImmediateRevoke(e.target.checked);
                      const analysis = calculateCopilotScore(category, targetGrantEmail, grantLevel, grantDurationHours);
                      setCopilotScore(analysis);
                    }}
                    className="rounded border-blue-600 bg-blue-900 text-blue-500 focus:ring-0"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section: In-Modal Copilot Score */}
          <div className="p-4 rounded-xl border border-blue-500/40 bg-[#0a1636] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-white text-xs uppercase tracking-wider">
                  TrustVault AI Copilot Security Score
                </span>
              </div>

              <button
                type="button"
                onClick={handleRunCopilotScore}
                className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs"
              >
                Re-calculate Score
              </button>
            </div>

            {copilotScore ? (
              <div className="space-y-2.5 pt-1 animate-fadeIn">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#142854] border border-blue-400/30">
                  <div>
                    <div className="text-[10px] text-blue-300 uppercase font-mono font-bold">
                      Zero-Trust Copilot Index
                    </div>
                    <div className="text-xl font-black text-white flex items-center space-x-2 mt-0.5">
                      <span>{copilotScore.score} / 100</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                        copilotScore.score >= 80
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : copilotScore.score >= 60
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}>
                        RISK: {copilotScore.riskLevel}
                      </span>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-blue-200 max-w-xs leading-tight">
                    {copilotScore.recommendation}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-blue-300 uppercase">Copilot Safeguards Evaluated:</div>
                  <div className="space-y-1">
                    {copilotScore.safeguards.map((item, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-[11px] text-blue-100">
                        <CheckCircle className="w-3 h-3 text-blue-400 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-blue-300/80 italic">
                Select or upload a file above to view the automated Copilot security score.
              </div>
            )}
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-blue-900/60 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-blue-300 hover:text-white hover:bg-blue-900/40 font-semibold"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!selectedFile || !fileValidation?.valid || isProcessing}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold shadow-md shadow-blue-600/30 transition-all flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Confirm & Store in Vault</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
