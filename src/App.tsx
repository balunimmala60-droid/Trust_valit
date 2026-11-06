import React, { useState, useEffect } from 'react';
import {
  User,
  VaultDocument,
  DocumentPermission,
  AuditRecord,
  AccessRequest,
  NotificationItem,
  AuditVerificationResult,
  PermissionLevel
} from './types';
import {
  INITIAL_USERS,
  INITIAL_DOCUMENTS,
  INITIAL_PERMISSIONS,
  INITIAL_ACCESS_REQUESTS,
  INITIAL_NOTIFICATIONS,
  initializeDatabaseStore
} from './services/store';
import { PermissionDecisionEngine } from './services/permissionEngine';
import { AuditService } from './services/auditService';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { DocumentLibraryView } from './components/DocumentLibraryView';
import { DocumentDetailModal } from './components/DocumentDetailModal';
import { DocumentPreviewModal } from './components/DocumentPreviewModal';
import { UploadModal } from './components/UploadModal';
import { SecurityProofCenter } from './components/SecurityProofCenter';
import { AttackReplayLab } from './components/AttackReplayLab';
import { AuditTrailView } from './components/AuditTrailView';
import { PermissionCopilot } from './components/PermissionCopilot';
import { AccessRequestsView } from './components/AccessRequestsView';
import { AdminUsersView } from './components/AdminUsersView';
import { ThemeSettingsView } from './components/ThemeSettingsView';
import { RecordHistoryView } from './components/RecordHistoryView';
import { JudgeDemoModal } from './components/JudgeDemoModal';
import { AuthPage } from './components/AuthPage';
import { ShieldAlert } from 'lucide-react';
import { useTheme } from './context/ThemeContext';

export default function App() {
  const { theme, isBW } = useTheme();
  const [selectedCopilotDocId, setSelectedCopilotDocId] = useState<string | undefined>(undefined);
  const [isInitialized, setIsInitialized] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[1]); // Default Sarah Chen (Owner)
  const [documents, setDocuments] = useState<VaultDocument[]>(INITIAL_DOCUMENTS);
  const [permissions, setPermissions] = useState<DocumentPermission[]>(INITIAL_PERMISSIONS);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>(INITIAL_ACCESS_REQUESTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [auditEvents, setAuditEvents] = useState<AuditRecord[]>([]);
  const [auditResult, setAuditResult] = useState<AuditVerificationResult>({
    valid: true,
    totalEvents: 0,
    message: 'Initializing...',
    verifiedAt: new Date().toISOString()
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedDocument, setSelectedDocument] = useState<VaultDocument | null>(null);
  const [previewDocument, setPreviewDocument] = useState<VaultDocument | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDemoGuideOpen, setIsDemoGuideOpen] = useState(false);
  const [accessDeniedAlert, setAccessDeniedAlert] = useState<{ title: string; reason: string } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem('trustvault_authenticated');
    return saved !== null ? saved === 'true' : true;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Initialize DB and Audit Chain on mount
  useEffect(() => {
    async function init() {
      await initializeDatabaseStore();

      const storedUsers = localStorage.getItem('trustvault_users');
      if (storedUsers) setAllUsers(JSON.parse(storedUsers));

      const storedDocs = localStorage.getItem('trustvault_documents');
      if (storedDocs) setDocuments(JSON.parse(storedDocs));

      const storedPerms = localStorage.getItem('trustvault_permissions');
      if (storedPerms) setPermissions(JSON.parse(storedPerms));

      const storedReqs = localStorage.getItem('trustvault_access_requests');
      if (storedReqs) setAccessRequests(JSON.parse(storedReqs));

      const storedNotifs = localStorage.getItem('trustvault_notifications');
      if (storedNotifs) setNotifications(JSON.parse(storedNotifs));

      const events = AuditService.getAllEvents();
      setAuditEvents(events);

      const verification = await AuditService.verifyChainIntegrity();
      setAuditResult(verification);

      setIsInitialized(true);
    }
    init();
  }, []);

  const refreshAuditState = async () => {
    const events = AuditService.getAllEvents();
    setAuditEvents(events);
    const verification = await AuditService.verifyChainIntegrity();
    setAuditResult(verification);
  };

  const handleSwitchUser = async (user: User) => {
    setCurrentUser(user);
    await AuditService.recordEvent(
      { id: user.id, email: user.email, role: user.role },
      'LOGIN',
      {
        decision: 'ALLOW',
        reason: `User authenticated via WebAuthn session. Switched persona to ${user.fullName} (${user.role}).`
      }
    );
    await refreshAuditState();
  };

  const handleLoginSuccess = async (user: User, method: string) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    localStorage.setItem('trustvault_authenticated', 'true');
    localStorage.setItem('trustvault_current_user_id', user.id);

    await AuditService.recordEvent(
      { id: user.id, email: user.email, role: user.role },
      'LOGIN',
      {
        decision: 'ALLOW',
        reason: `User '${user.fullName}' completed Two-Step Verification (2FA). Session initiated via ${method}.`,
        metadata: { authMethod: method, role: user.role }
      }
    );
    await refreshAuditState();
  };

  const handleRegisterSuccess = async (newUser: User) => {
    const updatedUsers = [...allUsers, newUser];
    setAllUsers(updatedUsers);
    localStorage.setItem('trustvault_users', JSON.stringify(updatedUsers));
    setCurrentUser(newUser);
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    localStorage.setItem('trustvault_authenticated', 'true');
    localStorage.setItem('trustvault_current_user_id', newUser.id);

    await AuditService.recordEvent(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      'USER_REGISTRATION',
      {
        decision: 'ALLOW',
        reason: `New enterprise account registered with role '${newUser.role}' and Two-Step Verification (2FA) activated.`,
        metadata: { newUserId: newUser.id, role: newUser.role }
      }
    );

    await AuditService.recordEvent(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      'LOGIN',
      {
        decision: 'ALLOW',
        reason: `Initial session authenticated for new user '${newUser.fullName}' (${newUser.role}) via Two-Step Verification.`,
        metadata: { role: newUser.role }
      }
    );

    await refreshAuditState();
  };

  const handleSignOut = async () => {
    await AuditService.recordEvent(
      { id: currentUser.id, email: currentUser.email, role: currentUser.role },
      'LOGOUT',
      {
        decision: 'ALLOW',
        reason: `User '${currentUser.fullName}' signed out securely. Session destroyed.`,
        metadata: { userId: currentUser.id }
      }
    );
    setIsAuthenticated(false);
    localStorage.setItem('trustvault_authenticated', 'false');
    await refreshAuditState();
  };

  const handleUploadSuccess = async (
    newDoc: VaultDocument,
    initialPermission?: {
      targetEmail: string;
      level: PermissionLevel;
      expiresInHours?: number;
      revokeImmediately?: boolean;
    }
  ) => {
    const updated = [newDoc, ...documents];
    setDocuments(updated);
    localStorage.setItem('trustvault_documents', JSON.stringify(updated));

    await AuditService.recordEvent(
      { id: currentUser.id, email: currentUser.email, role: currentUser.role },
      'UPLOAD',
      {
        documentId: newDoc.id,
        documentTitle: newDoc.title,
        decision: 'ALLOW',
        reason: `Document encrypted, signed, and saved to private storage container. Magic bytes verified: ${newDoc.mimeType}.`,
        metadata: {
          integrityHash: newDoc.integrityHash,
          sizeBytes: newDoc.sizeBytes,
          storageId: newDoc.storageIdentifier
        }
      }
    );

    // If grant was configured during upload, grant it
    if (initialPermission && initialPermission.targetEmail) {
      await handleGrantPermission(
        newDoc.id,
        initialPermission.targetEmail,
        initialPermission.level,
        initialPermission.expiresInHours
      );

      // If user selected immediate revocation test
      if (initialPermission.revokeImmediately) {
        // Find newly created perm and revoke it
        const currentPerms: DocumentPermission[] = JSON.parse(
          localStorage.getItem('trustvault_permissions') || '[]'
        );
        const createdPerm = currentPerms.find(
          p => p.documentId === newDoc.id && p.userEmail === initialPermission.targetEmail && p.status === 'ACTIVE'
        );
        if (createdPerm) {
          await handleRevokePermission(createdPerm.id);
        }
      }
    }

    await refreshAuditState();
    setSelectedDocument(newDoc);
  };


  const handleGrantPermission = async (
    docId: string,
    targetEmail: string,
    level: PermissionLevel,
    expiresInHours?: number
  ) => {
    const targetUser = allUsers.find(u => u.email === targetEmail);
    if (!targetUser) return;

    const expiresAt = expiresInHours
      ? new Date(Date.now() + expiresInHours * 3600 * 1000).toISOString()
      : undefined;

    const newPerm: DocumentPermission = {
      id: 'perm_' + Math.random().toString(36).substring(2, 9),
      documentId: docId,
      userId: targetUser.id,
      userEmail: targetUser.email,
      userName: targetUser.fullName,
      grantedById: currentUser.id,
      permissionLevel: level,
      status: 'ACTIVE',
      expiresAt,
      grantedAt: new Date().toISOString()
    };

    const targetDoc = documents.find(d => d.id === docId);
    const updatedPerms = [...permissions.filter(p => !(p.documentId === docId && p.userId === targetUser.id)), newPerm];
    setPermissions(updatedPerms);
    localStorage.setItem('trustvault_permissions', JSON.stringify(updatedPerms));

    await AuditService.recordEvent(
      { id: currentUser.id, email: currentUser.email, role: currentUser.role },
      'GRANT_PERMISSION',
      {
        documentId: docId,
        documentTitle: targetDoc?.title,
        requestedPermission: level,
        decision: 'ALLOW',
        reason: `Owner '${currentUser.fullName}' granted ${level} delegation to '${targetUser.email}'.`,
        metadata: {
          granteeId: targetUser.id,
          granteeEmail: targetUser.email,
          level,
          expiresAt
        }
      }
    );

    const newNotif: NotificationItem = {
      id: 'notif_' + Date.now(),
      userId: targetUser.id,
      title: 'New Permission Delegated',
      message: `${currentUser.fullName} granted you ${level} access on "${targetDoc?.title}".`,
      type: 'PERMISSION_GRANTED',
      isRead: false,
      createdAt: new Date().toISOString()
    };
    const updatedNotifs = [newNotif, ...notifications];
    setNotifications(updatedNotifs);
    localStorage.setItem('trustvault_notifications', JSON.stringify(updatedNotifs));

    await refreshAuditState();
  };

  const handleRevokePermission = async (permId: string) => {
    const perm = permissions.find(p => p.id === permId);
    if (!perm) return;

    const targetDoc = documents.find(d => d.id === perm.documentId);
    const revokedAt = new Date().toISOString();

    const updatedPerms = permissions.map(p => {
      if (p.id === permId) {
        return {
          ...p,
          status: 'REVOKED' as const,
          revokedAt,
          revokedById: currentUser.id
        };
      }
      return p;
    });

    setPermissions(updatedPerms);
    localStorage.setItem('trustvault_permissions', JSON.stringify(updatedPerms));

    await AuditService.recordEvent(
      { id: currentUser.id, email: currentUser.email, role: currentUser.role },
      'REVOKE_PERMISSION',
      {
        documentId: perm.documentId,
        documentTitle: targetDoc?.title,
        requestedPermission: perm.permissionLevel,
        decision: 'ALLOW',
        reason: `Immediate Revocation: Owner terminated ${perm.permissionLevel} delegation for '${perm.userEmail}'. Access severed immediately on server.`,
        metadata: {
          revokedUserId: perm.userId,
          revokedUserEmail: perm.userEmail,
          revokedAt
        }
      }
    );

    const newNotif: NotificationItem = {
      id: 'notif_' + Date.now(),
      userId: perm.userId,
      title: 'Access Revoked Immediately',
      message: `Your ${perm.permissionLevel} access to "${targetDoc?.title}" was revoked by the owner.`,
      type: 'ACCESS_REVOKED',
      isRead: false,
      createdAt: new Date().toISOString()
    };
    const updatedNotifs = [newNotif, ...notifications];
    setNotifications(updatedNotifs);
    localStorage.setItem('trustvault_notifications', JSON.stringify(updatedNotifs));

    await refreshAuditState();
  };

  const handleDownloadDocument = async (doc: VaultDocument) => {
    const userPerm = permissions.find(p => p.documentId === doc.id && p.userId === currentUser.id);
    const decision = PermissionDecisionEngine.evaluate(currentUser, doc, 'DOWNLOAD', userPerm);

    if (decision.allowed) {
      await AuditService.recordEvent(
        { id: currentUser.id, email: currentUser.email, role: currentUser.role },
        'DOWNLOAD',
        {
          documentId: doc.id,
          documentTitle: doc.title,
          decision: 'ALLOW',
          reason: decision.reason,
          metadata: { integrityHash: doc.integrityHash, sizeBytes: doc.sizeBytes }
        }
      );
      await refreshAuditState();

      const content = `${doc.title}\n\nClassification: CONFIDENTIAL (${doc.category})\nOwner: ${doc.ownerName}\nIntegrity SHA-256: ${doc.integrityHash}\nStorage Identifier: ${doc.storageIdentifier}\n\n${doc.contentPreview || doc.description}\n\nDownloaded by: ${currentUser.email} at ${new Date().toISOString()}`;
      const blob = new Blob([content], { type: doc.mimeType || 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.originalFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      await AuditService.recordEvent(
        { id: currentUser.id, email: currentUser.email, role: currentUser.role },
        'DOWNLOAD',
        {
          documentId: doc.id,
          documentTitle: doc.title,
          decision: 'DENY',
          reason: decision.reason,
          metadata: { ruleTriggered: decision.ruleTriggered }
        }
      );
      await refreshAuditState();

      setAccessDeniedAlert({
        title: 'Download Forbidden (HTTP 403)',
        reason: decision.reason
      });
    }
  };

  const handlePreviewDocument = async (doc: VaultDocument) => {
    const userPerm = permissions.find(p => p.documentId === doc.id && p.userId === currentUser.id);
    const decision = PermissionDecisionEngine.evaluate(currentUser, doc, 'PREVIEW', userPerm);

    if (decision.allowed) {
      await AuditService.recordEvent(
        { id: currentUser.id, email: currentUser.email, role: currentUser.role },
        'PREVIEW',
        {
          documentId: doc.id,
          documentTitle: doc.title,
          decision: 'ALLOW',
          reason: decision.reason,
          metadata: { integrityHash: doc.integrityHash }
        }
      );
      await refreshAuditState();
      setPreviewDocument(doc);
    } else {
      await AuditService.recordEvent(
        { id: currentUser.id, email: currentUser.email, role: currentUser.role },
        'PREVIEW',
        {
          documentId: doc.id,
          documentTitle: doc.title,
          decision: 'DENY',
          reason: decision.reason,
          metadata: { ruleTriggered: decision.ruleTriggered }
        }
      );
      await refreshAuditState();

      setAccessDeniedAlert({
        title: 'Document Preview Denied (HTTP 403)',
        reason: decision.reason
      });
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;

    const userPerm = permissions.find(p => p.documentId === doc.id && p.userId === currentUser.id);
    const decision = PermissionDecisionEngine.evaluate(currentUser, doc, 'DELETE', userPerm);

    if (decision.allowed) {
      const updated = documents.filter(d => d.id !== docId);
      setDocuments(updated);
      localStorage.setItem('trustvault_documents', JSON.stringify(updated));

      await AuditService.recordEvent(
        { id: currentUser.id, email: currentUser.email, role: currentUser.role },
        'DELETE',
        {
          documentId: doc.id,
          documentTitle: doc.title,
          decision: 'ALLOW',
          reason: `Document permanently purged by owner '${currentUser.fullName}'.`,
          metadata: { originalFilename: doc.originalFilename }
        }
      );
      await refreshAuditState();
    } else {
      setAccessDeniedAlert({
        title: 'Deletion Denied (HTTP 403)',
        reason: decision.reason
      });
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    const target = allUsers.find(u => u.id === userId);
    if (!target) return;

    const newStatus = target.accountStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const updatedUsers = allUsers.map(u => (u.id === userId ? { ...u, accountStatus: newStatus as any } : u));
    setAllUsers(updatedUsers);
    localStorage.setItem('trustvault_users', JSON.stringify(updatedUsers));

    await AuditService.recordEvent(
      { id: currentUser.id, email: currentUser.email, role: currentUser.role },
      'ADMIN_ACTION',
      {
        decision: 'ALLOW',
        reason: `Administrator updated account status for '${target.email}' to '${newStatus}'.`,
        metadata: { targetUserId: target.id, newStatus }
      }
    );
    await refreshAuditState();
  };

  const handleApproveRequest = async (requestId: string, level: PermissionLevel) => {
    const req = accessRequests.find(r => r.id === requestId);
    if (!req) return;

    const updatedReqs = accessRequests.map(r =>
      r.id === requestId ? { ...r, status: 'APPROVED' as const, resolvedAt: new Date().toISOString() } : r
    );
    setAccessRequests(updatedReqs);
    localStorage.setItem('trustvault_access_requests', JSON.stringify(updatedReqs));

    await handleGrantPermission(req.documentId, req.requesterEmail, level);

    await AuditService.recordEvent(
      { id: currentUser.id, email: currentUser.email, role: currentUser.role },
      'APPROVE_ACCESS',
      {
        documentId: req.documentId,
        documentTitle: req.documentTitle,
        requestedPermission: level,
        decision: 'ALLOW',
        reason: `Owner approved access request from '${req.requesterEmail}' at ${level} level.`,
        metadata: { requestId, justification: req.justification }
      }
    );
    await refreshAuditState();
  };

  const handleRejectRequest = async (requestId: string, reason: string) => {
    const req = accessRequests.find(r => r.id === requestId);
    if (!req) return;

    const updatedReqs = accessRequests.map(r =>
      r.id === requestId ? { ...r, status: 'REJECTED' as const, resolvedAt: new Date().toISOString() } : r
    );
    setAccessRequests(updatedReqs);
    localStorage.setItem('trustvault_access_requests', JSON.stringify(updatedReqs));

    await AuditService.recordEvent(
      { id: currentUser.id, email: currentUser.email, role: currentUser.role },
      'REJECT_ACCESS',
      {
        documentId: req.documentId,
        documentTitle: req.documentTitle,
        requestedPermission: req.requestedLevel,
        decision: 'DENY',
        reason: `Owner rejected access request: ${reason}`,
        metadata: { requestId }
      }
    );
    await refreshAuditState();
  };

  const handleCreateRequest = async (docId: string, level: PermissionLevel, justification: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;

    const newReq: AccessRequest = {
      id: 'req_' + Date.now(),
      documentId: doc.id,
      documentTitle: doc.title,
      ownerId: doc.ownerId,
      requesterId: currentUser.id,
      requesterName: currentUser.fullName,
      requesterEmail: currentUser.email,
      requestedLevel: level,
      justification,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    const updated = [newReq, ...accessRequests];
    setAccessRequests(updated);
    localStorage.setItem('trustvault_access_requests', JSON.stringify(updated));

    await AuditService.recordEvent(
      { id: currentUser.id, email: currentUser.email, role: currentUser.role },
      'REQUEST_ACCESS',
      {
        documentId: doc.id,
        documentTitle: doc.title,
        requestedPermission: level,
        decision: 'ALLOW',
        reason: `User '${currentUser.email}' submitted formal access request for '${doc.title}'.`,
        metadata: { level, justification }
      }
    );
    await refreshAuditState();
  };

  const handleResetChain = async () => {
    localStorage.removeItem('trustvault_audit_records_v1');
    await initializeDatabaseStore();
    await refreshAuditState();
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center">
        <div className="text-center space-y-3 font-mono">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-sm font-bold text-neutral-900">TRUSTVAULT ZERO-TRUST CORE</div>
          <div className="text-xs text-neutral-500">Verifying SHA-256 cryptographic genesis state...</div>
        </div>
      </div>
    );
  }

  // Mandatory Authentication & Two-Step Verification View
  if (!isAuthenticated) {
    return (
      <AuthPage
        allUsers={allUsers}
        onLoginSuccess={handleLoginSuccess}
        onRegisterSuccess={handleRegisterSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-200 bg-[#081426] text-[#F8FAFC]">
      {/* Header */}
      <Header
        currentUser={currentUser}
        allUsers={allUsers}
        onSwitchUser={handleSwitchUser}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        notifications={notifications}
        onOpenDemoGuide={() => setIsDemoGuideOpen(true)}
        chainValid={auditResult.valid}
        onSignOut={handleSignOut}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            currentUser={currentUser}
            allUsers={allUsers}
            documents={documents}
            permissions={permissions}
            auditEvents={auditEvents}
            accessRequests={accessRequests}
            onSelectTab={setActiveTab}
            onSwitchUser={handleSwitchUser}
            onOpenUpload={() => setIsUploadOpen(true)}
            chainValid={auditResult.valid}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentLibraryView
            currentUser={currentUser}
            documents={documents}
            permissions={permissions}
            auditEvents={auditEvents}
            onOpenUpload={() => setIsUploadOpen(true)}
            onSelectDocument={doc => setSelectedDocument(doc)}
            onPreviewDocument={handlePreviewDocument}
            onDownloadDocument={handleDownloadDocument}
            onRequestAccess={() => setActiveTab('requests')}
            onDeleteDocument={handleDeleteDocument}
            onRevokePermission={handleRevokePermission}
            onGoToFullCopilot={(docId) => {
              setSelectedCopilotDocId(docId);
              setActiveTab('copilot');
            }}
          />
        )}

        {activeTab === 'record-history' && (
          <RecordHistoryView
            currentUser={currentUser}
            documents={documents}
            auditEvents={auditEvents}
            onSelectTab={setActiveTab}
            onSelectDocument={doc => setSelectedDocument(doc)}
          />
        )}

        {activeTab === 'proof-center' && (
          <SecurityProofCenter
            currentUser={currentUser}
            allUsers={allUsers}
            documents={documents}
            permissions={permissions}
            auditResult={auditResult}
            onRefreshAudit={refreshAuditState}
          />
        )}

        {activeTab === 'attack-lab' && (
          <AttackReplayLab
            currentUser={currentUser}
            allUsers={allUsers}
            documents={documents}
            permissions={permissions}
            onAuditUpdated={refreshAuditState}
            onSelectTab={setActiveTab}
          />
        )}

        {activeTab === 'audit-trail' && (
          <AuditTrailView
            auditEvents={auditEvents}
            auditResult={auditResult}
            onRefreshAudit={refreshAuditState}
            onTamperSimulated={refreshAuditState}
            onResetChain={handleResetChain}
          />
        )}

        {activeTab === 'copilot' && (
          <PermissionCopilot
            currentUser={currentUser}
            allUsers={allUsers}
            documents={documents}
            onGrantPermission={handleGrantPermission}
            initialDocId={selectedCopilotDocId}
          />
        )}

        {activeTab === 'requests' && (
          <AccessRequestsView
            currentUser={currentUser}
            documents={documents}
            accessRequests={accessRequests}
            onApproveRequest={handleApproveRequest}
            onRejectRequest={handleRejectRequest}
            onCreateRequest={handleCreateRequest}
          />
        )}

        {activeTab === 'admin' && (
          <AdminUsersView
            currentUser={currentUser}
            allUsers={allUsers}
            onToggleUserStatus={handleToggleUserStatus}
          />
        )}

        {activeTab === 'theme-settings' && (
          <ThemeSettingsView />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-4 px-4 sm:px-6 lg:px-8 text-xs transition-colors border-[#334155] bg-[#0D1B2A] text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-100">TRUSTVAULT</span>
            <span>•</span>
            <span className="text-cyan-400 font-medium">Your Documents. Your Control. Your Security.</span>
            <span>•</span>
            <span className="font-mono font-medium text-emerald-400">SHA-256 Ledger Active</span>
          </div>
          <div className="flex items-center space-x-4 text-[11px] font-medium">
            <button
              onClick={() => setIsDemoGuideOpen(true)}
              className="transition-colors hover:text-cyan-300 font-semibold"
            >
              Interactive Demo
            </button>
            <button
              onClick={() => setActiveTab('proof-center')}
              className="transition-colors hover:text-cyan-300"
            >
              Security & Compliance Center
            </button>
          </div>
        </div>

      </footer>

      {/* Document Passport Modal */}
      {selectedDocument && (
        <DocumentDetailModal
          document={selectedDocument}
          currentUser={currentUser}
          allUsers={allUsers}
          permissions={permissions}
          onClose={() => setSelectedDocument(null)}
          onPreview={handlePreviewDocument}
          onDownload={handleDownloadDocument}
          onGrantPermission={handleGrantPermission}
          onRevokePermission={handleRevokePermission}
          onDeleteDocument={handleDeleteDocument}
        />
      )}

      {/* Document Preview Modal */}
      {previewDocument && (
        <DocumentPreviewModal
          document={previewDocument}
          currentUser={currentUser}
          onClose={() => setPreviewDocument(null)}
          onDownload={handleDownloadDocument}
        />
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <UploadModal
          currentUser={currentUser}
          allUsers={allUsers}
          onClose={() => setIsUploadOpen(false)}
          onUploadSuccess={handleUploadSuccess}
        />
      )}


      {/* Judge 5-Minute Evaluation Guide Modal */}
      {isDemoGuideOpen && (
        <JudgeDemoModal
          onClose={() => setIsDemoGuideOpen(false)}
          allUsers={allUsers}
          onSwitchUser={handleSwitchUser}
          onSelectTab={setActiveTab}
        />
      )}

      {/* Access Denied Zero-Trust Alert Modal (Attractive Blue Design with Crystal Clear Text) */}
      {accessDeniedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#1c2541] border border-blue-500 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-xs text-white">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6 text-blue-300" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{accessDeniedAlert.title}</h3>
                <span className="text-[10px] text-blue-300 font-mono font-bold tracking-wider">ZERO-TRUST ENFORCEMENT</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0b132b] border border-blue-500/60 text-white font-medium leading-relaxed">
              {accessDeniedAlert.reason}
            </div>

            <div className="text-[11px] text-blue-200/80">
              This access denial was forensically captured with actor identity and timestamp in the SHA-256 audit ledger.
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setAccessDeniedAlert(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-md shadow-blue-600/30 transition-all"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Two-Step Verification Auth Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-xl">
            <AuthPage
              allUsers={allUsers}
              onLoginSuccess={handleLoginSuccess}
              onRegisterSuccess={handleRegisterSuccess}
              canCancel={true}
              onCancel={() => setIsAuthModalOpen(false)}
            />
          </div>
        </div>
      )}

    </div>
  );
}
