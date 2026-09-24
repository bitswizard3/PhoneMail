import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { settingsAPI } from '../services/api';
import {
  ArrowLeft, User, Mail, Globe, Shield, Plus, Trash2, Save, Camera,
  Inbox, Send, PenSquare, RefreshCw
} from 'lucide-react';

const Settings: React.FC = () => {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [language, setLanguage] = useState('en');
  const [aliases, setAliases] = useState<any[]>([]);
  const [newAlias, setNewAlias] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await settingsAPI.getSettings();
      const settings = response.data.settings;
      setDisplayName(settings.display_name || '');
      setLanguage(settings.language || 'en');
      setAliases(settings.aliases || []);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      await settingsAPI.updateSettings({ displayName, language });
      setUser({ ...user!, displayName });
      localStorage.setItem('phonemail_user', JSON.stringify({ ...user, displayName }));
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAlias = async () => {
    if (!newAlias.trim()) return;
    try {
      const response = await settingsAPI.createAlias(newAlias);
      setAliases([...aliases, response.data.alias]);
      setNewAlias('');
      setMessage('Alias created successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Failed to create alias');
    }
  };

  const handleDeleteAlias = async (id: string) => {
    try {
      await settingsAPI.deleteAlias(id);
      setAliases(aliases.filter((a) => a.id !== id));
    } catch (error) {
      console.error('Failed to delete alias:', error);
    }
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <button className="icon-btn" onClick={() => navigate('/')} style={{ marginRight: '4px' }}>
            <ArrowLeft size={20} />
          </button>
          <span className="sidebar-title">Settings</span>
        </div>
        <nav className="sidebar-nav" style={{ padding: '12px 8px' }}>
          <a href="#profile" className="nav-item active">
            <User size={20} /> <span>Profile</span>
          </a>
          <a href="#aliases" className="nav-item">
            <Mail size={20} /> <span>Alias IDs</span>
          </a>
          <a href="#security" className="nav-item">
            <Shield size={20} /> <span>Security</span>
          </a>
          <a href="#language" className="nav-item">
            <Globe size={20} /> <span>Language</span>
          </a>
        </nav>
      </aside>

      <main className="main-content">
        <div className="settings-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="icon-btn" onClick={() => navigate('/')} style={{ color: 'var(--primary)' }}>
            <ArrowLeft size={24} />
          </button>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Account Settings</h2>
        </div>
        <div className="settings-container" style={{ padding: '24px 20px', paddingBottom: '120px' }}>

          {message && (
            <div className={`toast ${message.includes('success') ? 'success' : 'error'}`} style={{ position: 'relative', marginBottom: '20px' }}>
              {message}
            </div>
          )}

          {/* Profile Section */}
          <section className="settings-section" id="profile">
            <h3>Profile</h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
              <div className="user-avatar" style={{ width: '72px', height: '72px', fontSize: '1.5rem' }}>
                {user?.displayName?.slice(0, 2).toUpperCase() || user?.phone?.slice(-2)}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{user?.displayName || user?.phone}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{user?.email}</div>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem' }}>{user?.phone}</div>
              </div>
            </div>

            <div className="settings-field">
              <span className="settings-field-label">Display Name</span>
              <div className="settings-field-value">
                <input
                  type="text"
                  className="settings-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                />
              </div>
            </div>

            <div className="settings-field">
              <span className="settings-field-label">Phone Number</span>
              <span className="settings-field-value">{user?.phone}</span>
            </div>

            <div className="settings-field">
              <span className="settings-field-label">Email Address</span>
              <span className="settings-field-value">{user?.email}</span>
            </div>

            <div style={{ marginTop: '16px' }}>
              <button className="btn-primary" style={{ width: 'auto', padding: '10px 24px' }} onClick={handleSaveProfile} disabled={isLoading}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Save size={16} /> Save Changes
                </span>
              </button>
            </div>
          </section>

          {/* Alias IDs Section */}
          <section className="settings-section" id="aliases">
            <h3>Manage Alias IDs</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '16px' }}>
              Create additional email addresses that forward to your main inbox.
            </p>

            <div className="alias-list">
              <div className="alias-item">
                <span className="alias-email">{user?.email}</span>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem' }}>Primary</span>
              </div>
              {aliases.map((alias) => (
                <div key={alias.id} className="alias-item">
                  <span className="alias-email">{alias.alias_email}</span>
                  <button className="btn-danger" onClick={() => handleDeleteAlias(alias.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="alias-add">
              <input
                type="text"
                className="settings-input"
                placeholder="New alias name"
                value={newAlias}
                onChange={(e) => setNewAlias(e.target.value)}
                style={{ flex: 1 }}
              />
              <button className="btn-secondary" onClick={handleAddAlias}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={16} /> Add Alias
                </span>
              </button>
            </div>
          </section>

          {/* Language Section */}
          <section className="settings-section" id="language">
            <h3>Language</h3>
            <div className="settings-field">
              <span className="settings-field-label">Display Language</span>
              <select
                className="settings-input"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{ width: '200px' }}
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="es">Español (Spanish)</option>
                <option value="fr">Français (French)</option>
                <option value="de">Deutsch (German)</option>
                <option value="ja">日本語 (Japanese)</option>
                <option value="zh">中文 (Chinese)</option>
                <option value="ar">العربية (Arabic)</option>
              </select>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="settings-section">
            <h3 style={{ color: 'var(--danger)' }}>Danger Zone</h3>
            <div className="settings-field">
              <div>
                <span className="settings-field-label">Sign Out</span>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem' }}>Sign out from all devices</p>
              </div>
              <button className="btn-danger" onClick={() => { logout(); navigate('/login'); }}>
                Sign Out
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="bottom-nav">
        <div className="bottom-nav-item" onClick={() => navigate('/')}>
          <Inbox size={24} />
          <span>Inbox</span>
        </div>
        <div className="bottom-nav-item" onClick={() => navigate('/')}>
          <Send size={24} />
          <span>Sent</span>
        </div>
        <div className="bottom-nav-item compose-fab" onClick={() => navigate('/')}>
          <div className="fab-inner">
            <PenSquare size={24} color="white" />
          </div>
        </div>
        <div className="bottom-nav-item" onClick={() => window.location.reload()}>
          <RefreshCw size={24} />
          <span>Refresh</span>
        </div>
        <div className="bottom-nav-item active">
          <User size={24} />
          <span>Profile</span>
        </div>
      </div>
    </div>
  );
};

export default Settings;
