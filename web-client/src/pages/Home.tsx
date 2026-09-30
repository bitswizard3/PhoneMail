import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { emailAPI } from '../services/api';
import { Send, ArrowLeft, Plus, Settings, LogOut, Check, CheckCheck, RefreshCw, MessageCircle } from 'lucide-react';

interface Email {
  id: string;
  sender_email: string;
  sender_name: string;
  subject: string;
  body: string;
  is_read: boolean;
  created_at: string;
  recipients?: { recipient_email: string; is_read?: boolean }[];
}

interface Thread {
  contactEmail: string;
  contactName: string;
  messages: Email[];
  lastMessageAt: string;
  unreadCount: number;
}

const Home: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newMessageText, setNewMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // New chat modal
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatPhone, setNewChatPhone] = useState('');
  const [newChatError, setNewChatError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchEmails();
    const intervalId = setInterval(fetchEmails, 3000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (activeThread) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeThread?.messages]);

  const fetchEmails = async () => {
    try {
      // Fetch both inbox and sent
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
          counterpartName = counterpartEmail; // Fallback
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
        
        // Prevent duplicate messages in case they somehow exist in both
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

      // Update active thread if one is selected
      if (activeThread) {
        const updated = sortedThreads.find(t => t.contactEmail === activeThread.contactEmail);
        if (updated) {
          // If there's a new message, update state
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
      await emailAPI.sendEmail({
        to: [activeThread.contactEmail],
        subject: 'PhoneMail Message',
        body: newMessageText
      });
      setNewMessageText('');
      fetchEmails(); // immediately fetch to update UI
    } catch (err) {
      console.error('Send failed', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleStartNewChat = async () => {
    if (!newChatPhone.trim()) {
      setNewChatError('Enter a phone number');
      return;
    }
    
    // Normalize phone to email
    let phone = newChatPhone.replace(/[^0-9+]/g, '');
    if (!phone.startsWith('+')) {
      phone = `+91${phone}`; // default IN
    }
    const targetEmail = `${phone}@phonemail.local`; // replace with actual domain if needed

    // Check if thread exists
    let existingThread = threads.find(t => t.contactEmail === targetEmail);
    if (!existingThread) {
      // Create empty thread locally
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
    setNewChatPhone('');
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

  return (
    <div className={`hybrid-layout ${activeThread ? 'chat-active' : ''}`}>
      
      {/* LEFT PANE: THREAD LIST */}
      <div className="thread-list-pane">
        <div className="hybrid-header">
          <h2><MessageCircle color="var(--primary)" size={24} /> Chats</h2>
          <div className="header-actions">
            <button className="icon-btn" onClick={() => navigate('/settings')} title="Settings">
              <Settings size={20} />
            </button>
            <button className="icon-btn" onClick={() => { logout(); navigate('/login'); }} title="Logout">
              <LogOut size={20} />
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

      {/* RIGHT PANE: CHAT ROOM */}
      <div className="thread-room-pane">
        {activeThread ? (
          <>
            <div className="room-header">
              <button className="back-btn" onClick={() => setActiveThread(null)}>
                <ArrowLeft size={24} />
              </button>
              <div className="thread-avatar" style={{ width: '40px', height: '40px', fontSize: '1rem' }}>
                {getInitials(activeThread.contactName)}
              </div>
              <div>
                <div style={{ fontWeight: '600', color: 'white' }}>{activeThread.contactName.split('@')[0]}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{activeThread.contactEmail}</div>
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
                  return (
                    <div key={msg.id || idx} className={`message-card ${isMine ? 'msg-sent' : 'msg-received'}`}>
                      {msg.subject && msg.subject !== 'PhoneMail Message' && msg.subject !== '(No Subject)' && (
                        <span className="msg-subject">{msg.subject}</span>
                      )}
                      <div style={{ whiteSpace: 'pre-wrap' }}>{msg.body}</div>
                      <div className={`msg-time ${isMine ? 'sent-time' : ''}`}>
                        {formatTime(msg.created_at)}
                        {isMine && (
                          <CheckCheck size={14} color={msg.recipients?.some(r => r.is_read) ? 'var(--primary)' : 'currentColor'} />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="room-input-area">
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
              type="tel"
              placeholder="Enter mobile number"
              value={newChatPhone}
              onChange={(e) => setNewChatPhone(e.target.value)}
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
