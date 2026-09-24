import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { emailAPI } from '../services/api';
import {
  Mail, Search, Inbox, Send, FileText, AlertTriangle, Trash2,
  Star, Paperclip, PenSquare, Settings, LogOut, Menu, RefreshCw,
  MoreVertical, Reply, Forward, Archive, ChevronDown, X, User,
  Check, CheckCheck, CheckSquare
} from 'lucide-react';

interface Email {
  id: string;
  sender_email: string;
  sender_name: string;
  sender_phone: string;
  subject: string;
  body: string;
  html_body: string;
  is_read: boolean;
  is_favorite: boolean;
  is_spam: boolean;
  is_trash: boolean;
  has_attachments: boolean;
  created_at: string;
  recipients?: { recipient_email: string; recipient_type: string; is_read?: boolean }[];
}

const Home: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [folder, setFolder] = useState('inbox');
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Compose state
  const [composeTo, setComposeTo] = useState('');
  const [composeCc, setComposeCc] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [composeError, setComposeError] = useState('');

  useEffect(() => {
    setSelectedEmails(new Set());
    setIsSelectionMode(false);
    fetchEmails();
    
    const intervalId = setInterval(async () => {
      try {
        const response = await emailAPI.getEmails(folder, filter);
        setEmails(response.data.emails || []);
      } catch (error) {
        // silently fail on background polling
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [folder, filter]);

  // (Removed redundant markAsRead useEffect)

  const fetchEmails = async () => {
    setIsLoading(true);
    try {
      const response = await emailAPI.getEmails(folder, filter);
      setEmails(response.data.emails || []);
    } catch (error) {
      console.error('Failed to fetch emails:', error);
      setEmails([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEmailSelection = (id: string, e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
    const newSelection = new Set(selectedEmails);
    if (newSelection.has(id)) newSelection.delete(id);
    else newSelection.add(id);
    setSelectedEmails(newSelection);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedEmails(new Set());
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedEmails(new Set(filteredEmails.map(em => em.id)));
    } else {
      setSelectedEmails(new Set());
    }
  };

  const handleBulkTrash = async () => {
    if (selectedEmails.size === 0) return;
    try {
      setIsLoading(true);
      const ids = Array.from(selectedEmails);
      if (folder === 'trash') {
        await Promise.all(ids.map(id => emailAPI.deleteEmail(id)));
      } else {
        await Promise.all(ids.map(id => emailAPI.updateEmail(id, { isTrash: true })));
      }
      setSelectedEmails(new Set());
      fetchEmails();
    } catch (error) {
      console.error('Bulk action failed', error);
      setIsLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!composeTo.trim()) return;

    setIsSending(true);
    try {
      const toList = composeTo.split(',').map((e) => e.trim()).filter(Boolean);
      const ccList = composeCc ? composeCc.split(',').map((e) => e.trim()).filter(Boolean) : [];

      await emailAPI.sendEmail({
        to: toList,
        cc: ccList,
        subject: composeSubject,
        body: composeBody,
        replyToEmailId: replyToId || undefined,
      });

      setIsComposing(false);
      setComposeTo('');
      setComposeCc('');
      setComposeSubject('');
      setComposeBody('');
      setReplyToId(null);
      setComposeError('');
      fetchEmails();
    } catch (error: any) {
      setComposeError(error.response?.data?.error || 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  const handleReply = (email: Email) => {
    setReplyToId(email.id);
    setComposeTo(email.sender_email);
    setComposeSubject(`Re: ${email.subject}`);
    setComposeBody(`\n\n--- Original Message ---\nFrom: ${email.sender_name || email.sender_email}\nDate: ${formatDate(email.created_at)}\n\n${email.body}`);
    setComposeError('');
    setIsComposing(true);
  };

  const handleForward = (email: Email) => {
    setReplyToId(null);
    setComposeTo('');
    setComposeSubject(`Fwd: ${email.subject}`);
    setComposeBody(`\n\n--- Forwarded Message ---\nFrom: ${email.sender_name || email.sender_email}\nDate: ${formatDate(email.created_at)}\n\n${email.body}`);
    setComposeError('');
    setIsComposing(true);
  };

  const handleToggleFavorite = async (email: Email, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await emailAPI.updateEmail(email.id, { isFavorite: !email.is_favorite });
      setEmails((prev) =>
        prev.map((em) => (em.id === email.id ? { ...em, is_favorite: !em.is_favorite } : em))
      );
      if (selectedEmail?.id === email.id) {
        setSelectedEmail({ ...selectedEmail, is_favorite: !selectedEmail.is_favorite });
      }
    } catch (error) {
      console.error('Failed to update email:', error);
    }
  };

  const handleMoveToTrash = async (email: Email) => {
    try {
      if (folder === 'trash') {
        await emailAPI.deleteEmail(email.id);
      } else {
        await emailAPI.updateEmail(email.id, { isTrash: true });
      }
      setSelectedEmail(null);
      fetchEmails();
    } catch (error) {
      console.error('Failed to trash/delete email:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = diffMs / (1000 * 60 * 60);

    if (diffHrs < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    if (diffHrs < 168) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getInitials = (name: string, email: string) => {
    if (name && name !== 'null') {
      return name.slice(0, 2).toUpperCase();
    }
    return email?.slice(0, 2).toUpperCase() || '??';
  };

  const filteredEmails = emails.filter((email) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      email.subject?.toLowerCase().includes(q) ||
      email.sender_name?.toLowerCase().includes(q) ||
      email.sender_email?.toLowerCase().includes(q) ||
      email.body?.toLowerCase().includes(q)
    );
  });

  const folders = [
    { id: 'inbox', icon: Inbox, label: 'Inbox', count: emails.filter((e) => !e.is_read).length },
    { id: 'sent', icon: Send, label: 'Sent' },
    { id: 'drafts', icon: FileText, label: 'Drafts' },
    { id: 'spam', icon: AlertTriangle, label: 'Spam' },
    { id: 'trash', icon: Trash2, label: 'Trash' },
  ];

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'attachments', label: 'Attachments' },
    { id: 'favorites', label: 'Favorites' },
  ];

  return (
    <div className="app-layout">
      {/* Mobile Sidebar Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Mail size={18} color="white" />
          </div>
          <span className="sidebar-title">PhoneMail</span>
        </div>

        <button className="compose-btn" onClick={() => { setReplyToId(null); setComposeTo(''); setComposeCc(''); setComposeSubject(''); setComposeBody(''); setIsComposing(true); setSidebarOpen(false); }} id="compose-btn">
          <PenSquare size={18} />
          <span>Compose</span>
        </button>

        <nav className="sidebar-nav">
          {folders.map((f) => (
            <div
              key={f.id}
              className={`nav-item ${folder === f.id ? 'active' : ''}`}
              onClick={() => { setFolder(f.id); setSelectedEmail(null); setSidebarOpen(false); }}
              id={`nav-${f.id}`}
            >
              <f.icon size={20} />
              <span>{f.label}</span>
              {f.count && f.count > 0 ? <span className="nav-badge">{f.count}</span> : null}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer" style={{ position: 'relative' }}>
          {showProfileMenu && (
            <div className="profile-dropdown">
              <div className="profile-dropdown-item" onClick={() => { navigate('/settings'); setShowProfileMenu(false); setSidebarOpen(false); }}>
                <Settings size={18} />
                <span>Settings</span>
              </div>
              <div className="profile-dropdown-item danger" onClick={() => { logout(); navigate('/login'); }}>
                <LogOut size={18} />
                <span>Sign out</span>
              </div>
            </div>
          )}
          <div className="sidebar-user" onClick={() => setShowProfileMenu(!showProfileMenu)} id="sidebar-user">
            <div className="user-avatar">
              {user?.displayName?.slice(0, 2).toUpperCase() || user?.phone?.slice(-2) || 'U'}
            </div>
            <div className="user-info">
              <div className="user-name">{user?.displayName || user?.phone || 'User'}</div>
              <div className="user-email">{user?.email || ''}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <div className="main-header">
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} id="mobile-menu-btn">
            <Menu size={22} />
          </button>
          <div className="search-container">
            <Search size={18} />
            <input
              type="text"
              className="search-input"
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="search-input"
            />
          </div>
          <div className="header-actions">
            <button 
              className={`icon-btn ${isSelectionMode ? 'active' : ''}`} 
              onClick={toggleSelectionMode} 
              title="Select Multiple"
              style={{ background: isSelectionMode ? 'var(--primary-color)' : 'transparent', color: isSelectionMode ? 'white' : 'inherit' }}
            >
              <CheckSquare size={18} />
            </button>
            <button className="icon-btn" onClick={fetchEmails} title="Refresh">
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="filter-bar">
          {filters.map((f) => (
            <button
              key={f.id}
              className={`filter-chip ${filter === f.id ? 'active' : ''}`}
              onClick={() => setFilter(f.id)}
              id={`filter-${f.id}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Email List + View */}
        <div className="email-list-container">
          {/* Email List */}
          <div className="email-list">
            {isSelectionMode && filteredEmails.length > 0 && (
              <div className="bulk-actions-bar" style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                <input 
                  type="checkbox" 
                  checked={selectedEmails.size > 0 && selectedEmails.size === filteredEmails.length}
                  onChange={handleSelectAll}
                  style={{ marginRight: '16px', transform: 'scale(1.2)' }}
                />
                {selectedEmails.size > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{selectedEmails.size} selected</span>
                    <button className="icon-btn" onClick={handleBulkTrash} title="Delete selected">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ) : (
                  <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Select all</span>
                )}
              </div>
            )}
            {isLoading ? (
              <div className="empty-state">
                <div className="loading-spinner" />
                <p>Loading emails...</p>
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="empty-state">
                <Inbox size={64} />
                <h3>No emails</h3>
                <p>{folder === 'inbox' ? 'Your inbox is empty. Compose a new email!' : `No emails in ${folder}.`}</p>
              </div>
            ) : (
              filteredEmails.map((email) => (
                <div
                  key={email.id}
                  className={`email-item ${selectedEmail?.id === email.id ? 'active' : ''} ${!email.is_read ? 'unread' : ''}`}
                  onClick={(e) => {
                    if (isSelectionMode) {
                      toggleEmailSelection(email.id, e);
                      return;
                    }
                    if (!email.is_read) {
                      emailAPI.markAsRead(email.id).catch(console.error);
                      setEmails(prev => prev.map(e => e.id === email.id ? { ...e, is_read: true } : e));
                      setSelectedEmail({ ...email, is_read: true });
                    } else {
                      setSelectedEmail(email);
                    }
                  }}
                >
                  {isSelectionMode && (
                    <div style={{ marginRight: '12px', display: 'flex', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedEmails.has(email.id)}
                        onChange={(e) => toggleEmailSelection(email.id, e)}
                        style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                      />
                    </div>
                  )}
                  <div className="email-avatar">
                    {folder === 'sent' 
                      ? getInitials('', email.recipients?.[0]?.recipient_email || 'Unknown')
                      : getInitials(email.sender_name, email.sender_email)}
                  </div>
                  <div className="email-content">
                    <div className="email-top-row">
                      <span className="email-sender">
                        {folder === 'sent' 
                          ? `To: ${email.recipients?.[0]?.recipient_email || 'Unknown'}`
                          : (email.sender_name || email.sender_email)}
                      </span>
                      <span className="email-time">{formatDate(email.created_at)}</span>
                    </div>
                    <div className="email-subject">{email.subject || '(No Subject)'}</div>
                    <div className="email-preview">{email.body?.substring(0, 80) || ''}</div>
                    <div className="email-indicators">
                      {!email.is_read && folder === 'inbox' && <span className="indicator-dot" />}
                      {folder === 'sent' && (
                        email.recipients?.some(r => r.is_read) ? (
                          <span title="Read by at least one recipient" style={{ display: 'flex', alignItems: 'center' }}>
                            <CheckCheck size={16} color="#3b82f6" style={{ marginRight: 4 }} />
                          </span>
                        ) : (
                          <span title="Delivered" style={{ display: 'flex', alignItems: 'center' }}>
                            <Check size={16} color="var(--text-tertiary)" style={{ marginRight: 4 }} />
                          </span>
                        )
                      )}
                      {email.has_attachments && <Paperclip size={14} style={{ color: 'var(--text-tertiary)' }} />}
                      <button
                        onClick={(e) => handleToggleFavorite(email, e)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        <Star
                          size={14}
                          fill={email.is_favorite ? '#f59e0b' : 'none'}
                          color={email.is_favorite ? '#f59e0b' : 'var(--text-tertiary)'}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Email View */}
          <div className={`email-view ${selectedEmail ? 'mobile-visible' : ''}`}>
            {selectedEmail ? (
              <div className="email-view-inner fade-in">
                {/* Modern App Header */}
                <div className="email-view-topbar">
                  <div className="topbar-left">
                    <button className="icon-btn mobile-back-btn" onClick={() => setSelectedEmail(null)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                    <div className="email-view-actions">
                      <button className="icon-btn" onClick={() => handleMoveToTrash(selectedEmail)} title="Delete">
                        <Trash2 size={20} />
                      </button>
                      <button className="icon-btn" onClick={(e) => handleToggleFavorite(selectedEmail, e)} title="Star">
                        <Star
                          size={20}
                          fill={selectedEmail.is_favorite ? '#f59e0b' : 'none'}
                          color={selectedEmail.is_favorite ? '#f59e0b' : 'currentColor'}
                        />
                      </button>
                      <button className="icon-btn" title="More">
                        <MoreVertical size={20} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Email Content Scrollable Area */}
                <div className="email-view-scroll-content">
                  <h1 className="email-view-subject">{selectedEmail.subject || '(No Subject)'}</h1>
                  
                  <div className="email-view-meta">
                    <div className="email-view-sender-avatar">
                      {getInitials(selectedEmail.sender_name, selectedEmail.sender_email)}
                    </div>
                    <div className="email-view-sender-info">
                      <div className="sender-row-main">
                        <span className="email-view-sender-name">
                          {selectedEmail.sender_name || selectedEmail.sender_email}
                        </span>
                        <span className="email-view-date">
                          {formatDate(selectedEmail.created_at)}
                        </span>
                      </div>
                      <div className="sender-row-sub">
                        <span className="email-view-sender-email">
                          {folder === 'sent' 
                            ? `to ${selectedEmail.recipients?.map(r => r.recipient_email).join(', ') || 'unknown'}`
                            : 'to me'}
                        </span>
                        <ChevronDown size={14} style={{ color: 'var(--text-tertiary)', marginLeft: '4px' }} />
                      </div>
                    </div>
                  </div>

                  <div className="email-view-body">
                    {selectedEmail.html_body && selectedEmail.html_body !== selectedEmail.body ? (
                      <div dangerouslySetInnerHTML={{ __html: selectedEmail.html_body }} />
                    ) : (
                      <div className="plaintext-body">{selectedEmail.body}</div>
                    )}
                  </div>

                  {/* Smart Replies */}
                  <div className="smart-replies-container">
                    <div className="smart-replies-label">Suggested replies</div>
                    <div className="quick-replies">
                      {['Thanks!', 'Sounds good.', "I'll check this.", "Got it."].map((reply, i) => (
                        <button
                          key={i}
                          className="smart-reply-chip"
                          onClick={() => {
                            setReplyToId(selectedEmail.id);
                            setComposeTo(selectedEmail.sender_email);
                            setComposeSubject(`Re: ${selectedEmail.subject}`);
                            setComposeBody(`${reply}\n\n--- Original Message ---\nFrom: ${selectedEmail.sender_name || selectedEmail.sender_email}\nDate: ${formatDate(selectedEmail.created_at)}\n\n${selectedEmail.body}`);
                            setIsComposing(true);
                          }}
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Fixed Reply Bar at Bottom */}
                <div className="email-reply-bar-fixed">
                  <button className="reply-btn primary" onClick={() => handleReply(selectedEmail)}>
                    <Reply size={18} /> Reply
                  </button>
                  <button className="reply-btn secondary" onClick={() => handleForward(selectedEmail)}>
                    <Forward size={18} /> Forward
                  </button>
                </div>
              </div>
            ) : (
              <div className="email-view-empty">
                <Mail size={64} />
                <h3>Select an email to read</h3>
                <p style={{ color: 'var(--text-tertiary)' }}>Choose an email from the list to view its contents</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Compose Modal */}
      {isComposing && (
        <div className="compose-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsComposing(false); }}>
          <div className="compose-modal">
            <div className="compose-header">
              <h3>{replyToId ? 'Reply' : 'New Message'}</h3>
              <button className="compose-close" onClick={() => setIsComposing(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="compose-fields">
              {composeError && (
                <div className="compose-error">
                  <AlertTriangle size={16} />
                  <span>{composeError}</span>
                </div>
              )}
              <div className="compose-field">
                <label>To</label>
                <input
                  type="text"
                  placeholder="Phone number or email"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  id="compose-to"
                  autoFocus
                />
              </div>
              <div className="compose-field">
                <label>Cc</label>
                <input
                  type="text"
                  placeholder="Add CC recipients"
                  value={composeCc}
                  onChange={(e) => setComposeCc(e.target.value)}
                  id="compose-cc"
                />
              </div>
              <div className="compose-field">
                <label>Subject</label>
                <input
                  type="text"
                  placeholder="Email subject"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  id="compose-subject"
                />
              </div>
            </div>

            <div className="compose-body">
              <textarea
                placeholder="Write your email..."
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                id="compose-body"
              />
            </div>

            <div className="compose-footer">
              <button
                className="compose-send-btn"
                onClick={handleSendEmail}
                disabled={isSending}
                id="compose-send"
              >
                {isSending ? (
                  <>
                    <span className="loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={16} /> Send
                  </>
                )}
              </button>
              <div className="compose-toolbar">
                <button className="icon-btn" title="Attach file">
                  <Paperclip size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      {!selectedEmail && (
        <div className="bottom-nav">
        <div className={`bottom-nav-item ${folder === 'inbox' ? 'active' : ''}`} onClick={() => { setFolder('inbox'); setSelectedEmail(null); }}>
          <Inbox size={24} />
          <span>Inbox</span>
        </div>
        <div className={`bottom-nav-item ${folder === 'sent' ? 'active' : ''}`} onClick={() => { setFolder('sent'); setSelectedEmail(null); }}>
          <Send size={24} />
          <span>Sent</span>
        </div>
        <div className="bottom-nav-item compose-fab" onClick={() => { setReplyToId(null); setComposeTo(''); setComposeCc(''); setComposeSubject(''); setComposeBody(''); setIsComposing(true); }}>
          <div className="fab-inner">
            <PenSquare size={24} color="white" />
          </div>
        </div>
        <div className="bottom-nav-item" onClick={fetchEmails}>
          <RefreshCw size={24} />
          <span>Refresh</span>
        </div>
        <div className="bottom-nav-item" onClick={() => navigate('/settings')}>
          <User size={24} />
          <span>Profile</span>
        </div>
      </div>
      )}
    </div>
  );
};

export default Home;
