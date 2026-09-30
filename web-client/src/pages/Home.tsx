import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { emailAPI } from '../services/api';
import { Send, ArrowLeft, Plus, Settings, LogOut, Check, CheckCheck, MessageCircle, Maximize2, Minimize2, Menu, Palette, Sparkles, Paperclip, X } from 'lucide-react';

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
    setIsSending(true);
    try {
      const toList = [activeThread.contactEmail];
      const ccList = composeCc ? composeCc.split(',').map((e) => e.trim()).filter(Boolean) : [];
      const bccList = composeBcc ? composeBcc.split(',').map((e) => e.trim()).filter(Boolean) : [];
      
      await emailAPI.sendEmail({
        to: toList,
        cc: ccList,
        bcc: bccList,
        subject: composeSubject || 'PhoneMail Message',
        body: newMessageText
      });
      setNewMessageText('');
      if(isExpandedCompose) {
        setIsExpandedCompose(false);
        setComposeCc('');
        setComposeBcc('');
        setComposeSubject('');
      }
      fetchEmails();
    } catch (err) {
      console.error('Send failed', err);
    } finally {
      setIsSending(false);
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
      targetEmail = `${phone}@phonemail.local`;
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
    if (name.includes('@')) {
      const parts = name.split('@')[0];
      return parts.slice(-2).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const changeTheme = (color: string) => {
    setActiveTheme(color);
    document.documentElement.style.setProperty('--primary', color);
  };

  return (
    <div className={`hybrid-layout ${activeThread ? 'chat-active' : ''}`}>
      
      {/* SIDEBAR OVERLAY */}
      {isMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMenuOpen(false)}>
          <div className="sidebar-menu" onClick={e => e.stopPropagation()}>
            <div className="sidebar-header">
              <div className="sidebar-avatar">{getInitials(user?.name || user?.email || '')}</div>
              <div className="sidebar-user-info">
                <h3>{user?.name}</h3>
                <p>{user?.email}</p>
              </div>
              <button className="icon-btn" onClick={() => setIsMenuOpen(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="sidebar-content">
              <div className="sidebar-section">
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

              <div className="sidebar-actions">
                <button className="sidebar-btn" onClick={() => { setIsMenuOpen(false); navigate('/settings'); }}>
                  <Settings size={20} /> Account Settings
                </button>
                <button className="sidebar-btn logout-btn" onClick={() => { logout(); navigate('/login'); }}>
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
          <h2>
            <button className="icon-btn" onClick={() => setIsMenuOpen(true)} style={{ marginRight: '8px' }}>
              <Menu size={24} color="var(--primary)" />
            </button>
            Chats
          </h2>
          <div className="header-actions">
            <button className="icon-btn" onClick={() => setIsMenuOpen(true)} title="Menu">
              <div className="sidebar-avatar-small">{getInitials(user?.name || user?.email || '')}</div>
            </button>
          </div>
        </div>
        
        <div className="thread-list-scroll">
          {threads.length === 0 ? (
            <div className="empty-room" style={{ height: '100%', padding: '20px', textAlign: 'center' }}>
              <p>No messages yet. Start a chat by tapping the + button.</p>
            </div>
          ) : (
            threads.map((thread) => (
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
              <button className="back-btn" onClick={() => { setActiveThread(null); setIsExpandedCompose(false); }}>
                <ArrowLeft size={24} />
              </button>
              <div className="thread-avatar" style={{ width: '40px', height: '40px', fontSize: '1rem' }}>
                {getInitials(activeThread.contactName)}
              </div>
              <div>
                <div style={{ fontWeight: '600', color: 'white' }}>{activeThread.contactName}</div>
                {activeThread.contactName !== activeThread.contactEmail && (
                   <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{activeThread.contactEmail}</div>
                )}
              </div>
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
                  return (
                    <div key={msg.id || idx} className={`message-card ${isMine ? 'msg-sent' : 'msg-received'}`}>
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

    </div>
  );
};

export default Home;
