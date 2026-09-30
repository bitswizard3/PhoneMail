import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { emailAPI } from '../services/api';
import { Send, ArrowLeft, Plus, Settings, LogOut, Check, CheckCheck, MessageCircle, Maximize2, Minimize2, Menu, Palette, Sparkles, Paperclip, X, User, Trash2, Search, HelpCircle, Info } from 'lucide-react';
import { App } from '@capacitor/app';

interface Email {
  id: string;
  sender_email: string;
  sender_name: string;
  subject: string;
  body: string;
  is_read: boolean;
  created_at: string;
  recipients?: { recipient_email: string; is_read?: boolean }[];
  cc?: { recipient_email: string }[];
  bcc?: { recipient_email: string }[];
}

interface Thread {
  contactEmail: string;
  contactName: string;
  messages: Email[];
  lastMessageAt: string;
  unreadCount: number;
}

const THEMES = [
  { name: 'Cyan', color: '#00E5FF' },
  { name: 'Pink', color: '#FF007F' },
  { name: 'Green', color: '#00FF66' },
  { name: 'Purple', color: '#B300FF' }
];

const QUICK_REPLIES = [
  "Sounds good!",
  "I'll get back to you.",
  "Thanks!",
  "Can we call?"
];

const Home: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [newMessageText, setNewMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Sidebar State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState(THEMES[0].color);

  // Expanded Compose State
  const [isExpandedCompose, setIsExpandedCompose] = useState(false);
  const [composeCc, setComposeCc] = useState('');
  const [composeBcc, setComposeBcc] = useState('');
  const [composeSubject, setComposeSubject] = useState('');

  // New chat modal
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatInput, setNewChatInput] = useState('');
  const [newChatError, setNewChatError] = useState('');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Message selection state
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchEmails();
    const intervalId = setInterval(fetchEmails, 3000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (activeThread && !isExpandedCompose) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeThread?.messages, isExpandedCompose]);

  useEffect(() => {
    const handleBackButton = async () => {
      if (showAboutModal) {
        setShowAboutModal(false);
      } else if (showHelpModal) {
        setShowHelpModal(false);
      } else if (isSelectMode) {
        setIsSelectMode(false);
        setSelectedMessages(new Set());
      } else if (showNewChat) {
        setShowNewChat(false);
      } else if (isMenuOpen) {
        setIsMenuOpen(false);
      } else if (isExpandedCompose) {
        setIsExpandedCompose(false);
      } else if (activeThread) {
        setActiveThread(null);
      } else {
        App.minimizeApp();
      }
    };
    
    const listener = App.addListener('backButton', handleBackButton);
    return () => {
      listener.then(l => l.remove());
    };
  }, [showAboutModal, showHelpModal, isSelectMode, showNewChat, isMenuOpen, isExpandedCompose, activeThread]);

  const fetchEmails = async () => {
    try {
      const [inboxRes, sentRes] = await Promise.all([
        emailAPI.getEmails('inbox', 'all', 1),
        emailAPI.getEmails('sent', 'all', 1)
      ]);
      
      const allMails = [...(inboxRes.data.emails || []), ...(sentRes.data.emails || [])]
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      const threadsMap = new Map<string, Thread>();

      allMails.forEach(email => {
        const isSentByMe = email.sender_email === user?.email;
        let counterpartEmail = '';
        let counterpartName = '';

        if (isSentByMe) {
          counterpartEmail = email.recipients?.[0]?.recipient_email || 'Unknown';
          counterpartName = counterpartEmail;
        } else {
          counterpartEmail = email.sender_email;
          counterpartName = email.sender_name || email.sender_email;
        }

        if (!threadsMap.has(counterpartEmail)) {
          threadsMap.set(counterpartEmail, {
            contactEmail: counterpartEmail,
            contactName: counterpartName,
            messages: [],
            lastMessageAt: email.created_at,
            unreadCount: 0
          });
        }

        const thread = threadsMap.get(counterpartEmail)!;
        
        if (!thread.messages.some(m => m.id === email.id)) {
          thread.messages.push(email);
        }
        
        thread.lastMessageAt = email.created_at;
        
        if (!isSentByMe && !email.is_read) {
          thread.unreadCount += 1;
        }
      });

      const sortedThreads = Array.from(threadsMap.values()).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
      setThreads(sortedThreads);

      if (activeThread) {
        const updated = sortedThreads.find(t => t.contactEmail === activeThread.contactEmail);
        if (updated) {
          if (updated.messages.length !== activeThread.messages.length) {
            setActiveThread(updated);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch emails', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessageText.trim() || !activeThread) return;
    
    const messageText = newMessageText.trim();
    const toList = [activeThread.contactEmail];
    const ccList = composeCc ? composeCc.split(',').map((e) => e.trim()).filter(Boolean) : [];
    const bccList = composeBcc ? composeBcc.split(',').map((e) => e.trim()).filter(Boolean) : [];
    const subject = composeSubject || 'PhoneMail Message';
    
    // 1. Optimistic UI Update - Instant UX
    const optimisticMessage: any = {
      id: `temp-${Date.now()}`,
      thread_id: 'temp',
      sender_email: user?.email || '',
      subject: subject,
      body: messageText,
      snippet: messageText.substring(0, 50),
      created_at: new Date().toISOString(),
      is_read: true,
      recipients: toList.map(email => ({ recipient_email: email, is_read: false }))
    };

    const updatedThread = {
      ...activeThread,
      messages: [...activeThread.messages, optimisticMessage],
      lastMessageAt: optimisticMessage.created_at
    };

    setActiveThread(updatedThread);
    setThreads(prevThreads => prevThreads.map(t => 
      t.contactEmail === activeThread.contactEmail ? updatedThread : t
    ));

    // 2. Clear inputs instantly
    setNewMessageText('');
    if(isExpandedCompose) {
      setIsExpandedCompose(false);
      setComposeCc('');
      setComposeBcc('');
      setComposeSubject('');
    }

    // 3. Background API Request
    try {
      await emailAPI.sendEmail({
        to: toList,
        cc: ccList,
        bcc: bccList,
        subject: subject,
        body: messageText
      });
      // Silent fetch in background to sync real IDs later
      fetchEmails();
    } catch (err) {
      console.error('Send failed', err);
    }
  };

  const handleStartNewChat = async () => {
    if (!newChatInput.trim()) {
      setNewChatError('Enter a phone number or email ID');
      return;
    }
    
    let targetEmail = newChatInput.trim();
    if (!targetEmail.includes('@')) {
      let phone = targetEmail.replace(/[^0-9+]/g, '');
      if (!phone.startsWith('+')) {
        phone = `+91${phone}`;
      }
      targetEmail = `${phone}@phonemail.app`;
    }

    let existingThread = threads.find(t => t.contactEmail === targetEmail);
    if (!existingThread) {
      existingThread = {
        contactEmail: targetEmail,
        contactName: targetEmail,
        messages: [],
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0
      };
      setThreads([existingThread, ...threads]);
    }
    
    setActiveThread(existingThread);
    setShowNewChat(false);
    setNewChatInput('');
    setNewChatError('');
  };

  const markThreadAsRead = async (thread: Thread) => {
    const unreadMessages = thread.messages.filter(m => !m.is_read && m.sender_email !== user?.email);
    if (unreadMessages.length > 0) {
      for (const msg of unreadMessages) {
        try {
          await emailAPI.markAsRead(msg.id);
        } catch (e) {
          console.error(e);
        }
      }
      fetchEmails();
    }
  };

  const getInitials = (name: string) => {
    let cleanName = name.split('@')[0];
    cleanName = cleanName.replace(/[^a-zA-Z]/g, '');
    if (!cleanName) return <User size={20} />;
    return cleanName.slice(0, 2).toUpperCase();
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const changeTheme = (color: string) => {
    setActiveTheme(color);
    document.documentElement.style.setProperty('--primary', color);
  };

  const toggleSelectMessage = (msgId: string) => {
    setSelectedMessages(prev => {
      const next = new Set(prev);
      if (next.has(msgId)) {
        next.delete(msgId);
      } else {
        next.add(msgId);
      }
      if (next.size === 0) setIsSelectMode(false);
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    const count = selectedMessages.size;
    if (count === 0) return;
    const confirmed = confirm(`Delete ${count} message${count > 1 ? 's' : ''}?`);
    if (!confirmed) return;
    for (const msgId of selectedMessages) {
      try {
        await emailAPI.deleteEmail(msgId);
      } catch (e) {
        console.error('Delete failed for', msgId, e);
      }
    }
    setSelectedMessages(new Set());
    setIsSelectMode(false);
    fetchEmails();
  };

  const filteredThreads = threads.filter(t => 
    t.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.contactEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`hybrid-layout ${activeThread ? 'chat-active' : ''}`}>
      
      {/* SIDEBAR OVERLAY */}
      {isMenuOpen && (
        <div className="hb-overlay" onClick={() => setIsMenuOpen(false)}>
          <div className="hb-menu" onClick={e => e.stopPropagation()}>
            <div className="hb-header">
              <div className="hb-avatar">{getInitials(user?.email || '')}</div>
              <div className="hb-user-info">
                <h3>{(user?.email || '').split('@')[0]}</h3>
                <p>{user?.email}</p>
              </div>
              <button className="icon-btn" onClick={() => setIsMenuOpen(false)} style={{ background: 'transparent', border: 'none' }}>
                <X size={24} color="white" />
              </button>
            </div>
            
            <div className="hb-content">
              {/* Profile Section */}
              <div className="hb-section">
                <button className="hb-btn" onClick={() => { setIsMenuOpen(false); navigate('/settings'); }}>
                  <User size={20} color="var(--primary)" /> My Profile
                </button>
                <button className="hb-btn" onClick={() => { setIsMenuOpen(false); setSearchQuery(''); }}>
                  <Search size={20} color="var(--primary)" /> Search Chats
                </button>
              </div>

              {/* Theme Section */}
              <div className="hb-section">
                <h4><Palette size={16} /> Theme Color</h4>
                <div className="theme-picker">
                  {THEMES.map(theme => (
                    <button 
                      key={theme.color}
                      className={`theme-circle ${activeTheme === theme.color ? 'active' : ''}`}
                      style={{ backgroundColor: theme.color }}
                      onClick={() => changeTheme(theme.color)}
                      title={theme.name}
                    />
                  ))}
                </div>
              </div>

              {/* Menu Options */}
              <div className="hb-section">
                <button className="hb-btn" onClick={() => { setIsMenuOpen(false); navigate('/settings'); }}>
                  <Settings size={20} color="var(--primary)" /> Settings
                </button>
                <button className="hb-btn" onClick={() => { setIsMenuOpen(false); setShowAboutModal(true); }}>
                  <Info size={20} color="var(--primary)" /> About PhoneMail
                </button>
                <button className="hb-btn" onClick={() => { setIsMenuOpen(false); setShowHelpModal(true); }}>
                  <HelpCircle size={20} color="var(--primary)" /> Help & FAQ
                </button>
              </div>

              <div className="hb-actions">
                <button className="hb-btn hb-logout" onClick={() => { logout(); navigate('/login'); }}>
                  <LogOut size={20} /> Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LEFT PANE */}
      <div className="thread-list-pane">
        <div className="hybrid-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="icon-btn" onClick={() => setIsMenuOpen(true)} style={{ border: 'none', background: 'transparent' }} title="Menu">
              <Menu size={24} color="var(--primary)" />
            </button>
            <h2 style={{ margin: 0 }}>Chats</h2>
          </div>
          <div className="header-actions">
            <button className="icon-btn" onClick={() => setIsMenuOpen(true)} title="Profile">
              <div className="hb-avatar-small">{getInitials(user?.email || '')}</div>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ padding: '4px 12px', background: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-elevated)', borderRadius: '24px', padding: '6px 14px' }}>
            <Search size={16} color="var(--text-tertiary)" />
            <input 
              type="text" 
              placeholder="Search chats..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                <X size={14} color="var(--text-tertiary)" />
              </button>
            )}
          </div>
        </div>
        
        <div className="thread-list-scroll">
          {filteredThreads.length === 0 ? (
            <div className="empty-room" style={{ height: '100%', padding: '20px', textAlign: 'center' }}>
              <p>{searchQuery ? 'No chats found.' : 'No messages yet. Start a chat by tapping the + button.'}</p>
            </div>
          ) : (
            filteredThreads.map((thread) => (
              <div 
                key={thread.contactEmail} 
                className={`thread-item ${activeThread?.contactEmail === thread.contactEmail ? 'active' : ''}`}
                onClick={() => {
                  setActiveThread(thread);
                  markThreadAsRead(thread);
                }}
              >
                <div className="thread-avatar">
                  {getInitials(thread.contactName)}
                </div>
                <div className="thread-info">
                  <div className="thread-top">
                    <span className="thread-name">{thread.contactName.split('@')[0]}</span>
                    <span className="thread-time">{formatTime(thread.lastMessageAt)}</span>
                  </div>
                  <div className="thread-preview" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>
                      {thread.messages.length > 0 
                        ? (thread.messages[thread.messages.length - 1].sender_email === user?.email ? 'You: ' : '') + thread.messages[thread.messages.length - 1].body
                        : 'New Chat'}
                    </span>
                    {thread.unreadCount > 0 && (
                      <span className="unread-badge">{thread.unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <button className="fab-new-chat" onClick={() => setShowNewChat(true)}>
          <Plus size={28} />
        </button>
      </div>

      {/* RIGHT PANE */}
      <div className="thread-room-pane">
        {activeThread ? (
          <>
            <div className="room-header">
              {isSelectMode ? (
                <>
                  <button className="back-btn" onClick={() => { setIsSelectMode(false); setSelectedMessages(new Set()); }}>
                    <X size={24} />
                  </button>
                  <div style={{ flex: 1, fontWeight: '600', color: 'white', fontSize: '1.1rem' }}>
                    {selectedMessages.size} selected
                  </div>
                  <button 
                    className="icon-btn" 
                    title="Delete Selected" 
                    onClick={handleDeleteSelected}
                    style={{ background: 'transparent', border: 'none' }}
                  >
                    <Trash2 size={22} color="#ff4444" />
                  </button>
                </>
              ) : (
                <>
                  <button className="back-btn" onClick={() => { setActiveThread(null); setIsExpandedCompose(false); }}>
                    <ArrowLeft size={24} />
                  </button>
                  <div className="thread-avatar" style={{ width: '40px', height: '40px', fontSize: '1rem' }}>
                    {getInitials(activeThread.contactName)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', color: 'white' }}>{activeThread.contactName}</div>
                    {activeThread.contactName !== activeThread.contactEmail && (
                       <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{activeThread.contactEmail}</div>
                    )}
                  </div>
                  <button 
                    className="icon-btn" 
                    title="Clear Chat" 
                    onClick={async () => {
                      if (!window.confirm("Are you sure you want to clear this chat?")) return;
                      const threadToDelete = activeThread;
                      setThreads(prev => prev.filter(t => t.contactEmail !== threadToDelete.contactEmail));
                      setActiveThread(null);
                      try {
                        const promises = threadToDelete.messages.map(msg => emailAPI.deleteEmail(msg.id));
                        await Promise.all(promises);
                      } catch (err) {
                        console.error("Failed to delete all messages", err);
                      }
                    }}
                    style={{ background: 'transparent', border: 'none' }}
                  >
                    <Trash2 size={20} color="var(--danger, #ff4444)" />
                  </button>
                </>
              )}
            </div>

            <div className="room-messages">
              {activeThread.messages.length === 0 ? (
                <div className="empty-room">
                  <MessageCircle size={48} />
                  <p>Send a message to start the conversation.</p>
                </div>
              ) : (
                activeThread.messages.map((msg, idx) => {
                  const isMine = msg.sender_email === user?.email;
                  const isReadByRecipient = msg.recipients?.some(r => r.is_read);
                  const isSelected = selectedMessages.has(msg.id);
                  return (
                    <div 
                      key={msg.id || idx} 
                      className={`message-card ${isMine ? 'msg-sent' : 'msg-received'} ${isSelected ? 'msg-selected' : ''}`}
                      onClick={() => isSelectMode && msg.id && toggleSelectMessage(msg.id)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (msg.id) {
                          setIsSelectMode(true);
                          toggleSelectMessage(msg.id);
                        }
                      }}
                      onTouchStart={() => {
                        if (!isSelectMode && msg.id) {
                          const timer = setTimeout(() => {
                            setIsSelectMode(true);
                            toggleSelectMessage(msg.id);
                          }, 500);
                          (window as any).__longPressTimer = timer;
                        }
                      }}
                      onTouchEnd={() => {
                        clearTimeout((window as any).__longPressTimer);
                      }}
                      onTouchMove={() => {
                        clearTimeout((window as any).__longPressTimer);
                      }}
                      style={{ position: 'relative', cursor: isSelectMode ? 'pointer' : 'default' }}
                    >
                      {isSelectMode && (
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          left: isMine ? 'auto' : '8px',
                          right: isMine ? '8px' : 'auto',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: isSelected ? 'none' : '2px solid var(--text-tertiary)',
                          background: isSelected ? 'var(--primary)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 2
                        }}>
                          {isSelected && <Check size={14} color="black" />}
                        </div>
                      )}
                      {msg.subject && msg.subject !== 'PhoneMail Message' && msg.subject !== '(No Subject)' && (
                        <span className="msg-subject">{msg.subject}</span>
                      )}
                      <div style={{ whiteSpace: 'pre-wrap' }}>{msg.body}</div>
                      <div className={`msg-time ${isMine ? 'sent-time' : ''}`}>
                        {formatTime(msg.created_at)}
                        {isMine && (
                          <CheckCheck size={16} color={isReadByRecipient ? 'var(--primary)' : 'rgba(255,255,255,0.4)'} />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies - Smart Feature */}
            {!isExpandedCompose && (
              <div className="quick-replies-wrapper">
                <Sparkles size={14} color="var(--primary)" style={{ marginLeft: '12px' }} />
                <div className="quick-replies-scroll">
                  {QUICK_REPLIES.map(reply => (
                    <button 
                      key={reply} 
                      className="quick-reply-chip"
                      onClick={() => setNewMessageText(reply)}
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isExpandedCompose ? (
              <div className="expanded-compose">
                <div className="compose-field-row">
                  <label>To</label>
                  <input type="text" value={activeThread.contactEmail} disabled />
                </div>
                <div className="compose-field-row">
                  <label>Cc</label>
                  <input type="text" placeholder="Add Cc" value={composeCc} onChange={e => setComposeCc(e.target.value)} />
                </div>
                <div className="compose-field-row">
                  <label>Bcc</label>
                  <input type="text" placeholder="Add Bcc" value={composeBcc} onChange={e => setComposeBcc(e.target.value)} />
                </div>
                <div className="compose-field-row">
                  <label>Subject</label>
                  <input type="text" placeholder="Subject" value={composeSubject} onChange={e => setComposeSubject(e.target.value)} />
                </div>
                <textarea 
                  placeholder="Write your email..." 
                  value={newMessageText} 
                  onChange={e => setNewMessageText(e.target.value)}
                  autoFocus
                />
                <div className="compose-actions">
                  <button className="btn-collapse" onClick={() => setIsExpandedCompose(false)}>
                    <Minimize2 size={16} /> Chat Mode
                  </button>
                  <button 
                    className="send-btn" 
                    style={{ borderRadius: '8px', width: 'auto', padding: '0 24px' }}
                    onClick={handleSendMessage} 
                    disabled={!newMessageText.trim() || isSending}
                  >
                    <Send size={18} style={{ marginRight: '8px' }} /> Send Email
                  </button>
                </div>
              </div>
            ) : (
              <div className="room-input-area">
                <button 
                  className="icon-btn" 
                  title="Expand Compose" 
                  onClick={() => setIsExpandedCompose(true)}
                >
                  <Maximize2 size={20} color="var(--text-tertiary)" />
                </button>
                
                <button 
                  className="icon-btn" 
                  title="Attach File" 
                  onClick={() => alert("Attachment feature coming soon!")}
                >
                  <Paperclip size={20} color="var(--text-tertiary)" />
                </button>

                <input
                  type="text"
                  className="chat-input"
                  placeholder="Message"
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                />
                <button 
                  className="send-btn" 
                  onClick={handleSendMessage} 
                  disabled={!newMessageText.trim() || isSending}
                >
                  <Send size={20} style={{ marginLeft: '-2px' }} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-room" style={{ display: 'none' }}>
            <MessageCircle size={64} />
            <h2>PhoneMail</h2>
            <p>Select a chat to start messaging</p>
          </div>
        )}
      </div>

      {/* NEW CHAT MODAL */}
      {showNewChat && (
        <div className="new-chat-modal" onClick={(e) => { if(e.target === e.currentTarget) setShowNewChat(false); }}>
          <div className="new-chat-box">
            <h3>New Message</h3>
            <input 
              type="text"
              placeholder="Enter mobile number or Email ID"
              value={newChatInput}
              onChange={(e) => setNewChatInput(e.target.value)}
              autoFocus
            />
            {newChatError && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '12px' }}>{newChatError}</div>}
            <div className="new-chat-actions">
              <button className="btn-cancel" onClick={() => setShowNewChat(false)}>Cancel</button>
              <button className="btn-start" onClick={handleStartNewChat}>Start Chat</button>
            </div>
          </div>
        </div>
      )}

      {/* ABOUT MODAL */}
      {showAboutModal && (
        <div className="modal-overlay" onClick={() => setShowAboutModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '24px', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '16px', maxWidth: '340px', width: '90%' }}>
            <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, var(--primary), #a855f7)', borderRadius: '16px', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Info size={32} color="white" />
            </div>
            <h2 style={{ color: 'white', marginBottom: '8px', fontSize: '1.4rem' }}>About PhoneMail</h2>
            <p style={{ color: 'var(--primary)', fontWeight: 'bold', marginBottom: '16px' }}>Version 1.0 (Hackathon Build) 🚀</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '24px', textAlign: 'left' }}>
              PhoneMail is a revolutionary app that transforms your phone number into your email address. It combines the simplicity of WhatsApp with the power of email. 
              <br/><br/>
              <b>Your Email:</b> number@phonemail.app
            </p>
            <button className="btn-primary" onClick={() => setShowAboutModal(false)} style={{ width: '100%' }}>Close</button>
          </div>
        </div>
      )}

      {/* HELP MODAL */}
      {showHelpModal && (
        <div className="modal-overlay" onClick={() => setShowHelpModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '24px', background: 'var(--bg-secondary)', borderRadius: '16px', maxWidth: '340px', width: '90%' }}>
            <h2 style={{ color: 'white', marginBottom: '20px', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle color="var(--primary)" /> Help & FAQ
            </h2>
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              <div>
                <b style={{ color: 'white' }}>How do I send an email?</b>
                <div>Tap the '+' button, enter a phone number or email, and start chatting. It will be sent as a real email!</div>
              </div>
              <div>
                <b style={{ color: 'white' }}>What is my email address?</b>
                <div>Your email is your phone number followed by @phonemail.app.</div>
              </div>
              <div>
                <b style={{ color: 'white' }}>How do I delete messages?</b>
                <div>Long-press on any message to enter selection mode, then tap the trash icon at the top.</div>
              </div>
            </div>
            <button className="btn-primary" onClick={() => setShowHelpModal(false)} style={{ width: '100%', marginTop: '24px' }}>Close</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Home;
