import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, ArrowRight, Shield, PhoneCall, PhoneOff, Globe, CheckCircle, Settings, Check } from 'lucide-react';
import { authAPI } from '../services/api';

type AuthStep = 'language' | 'terms' | 'phone' | 'otp';

const Auth: React.FC = () => {
  const [step, setStep] = useState<AuthStep>('language');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [onboardLang, setOnboardLang] = useState('en');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [devHint, setDevHint] = useState('');
  
  // Call Simulation State
  const [isCallUIOpen, setIsCallUIOpen] = useState(false);
  const [callStatus, setCallStatus] = useState('');
  const [showKeypad, setShowKeypad] = useState(false);
  
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone.trim()) {
      setError('Phone number is required');
      return;
    }

    const fullPhone = `${countryCode}${phone.replace(/\s/g, '')}`;

    setIsLoading(true);
    try {
      const response = await authAPI.sendOTP(fullPhone);
      setIsNewUser(response.data.isNewUser);
      if (response.data.devHint) {
        setDevHint(response.data.devHint);
      }
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    const fullPhone = `${countryCode}${phone.replace(/\s/g, '')}`;

    setIsLoading(true);
    try {
      const response = await authAPI.verifyOTP(fullPhone, otp);
      const { token, user } = response.data;

      if (token) {
        localStorage.setItem('phonemail_token', token);
        localStorage.setItem('phonemail_user', JSON.stringify(user));
        setUser(user);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid OTP. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep('phone');
    setOtp('');
    setError('');
    setDevHint('');
  };

  return (
    <div className="auth-container">
      <div className="auth-card fade-in" style={{ position: 'relative' }}>
        {step === 'otp' && (
          <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
            <button style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Settings size={20} color="var(--text-secondary)" />
            </button>
          </div>
        )}
        <div className="auth-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '32px' }}>
          <div className="auth-logo-icon" style={{ background: 'var(--primary)', width: '64px', height: '64px', borderRadius: '20px' }}>
            <Mail size={32} color="white" />
          </div>
          <h1 style={{ marginTop: '16px', fontSize: '24px', background: 'none', color: 'var(--text-primary)', WebkitTextFillColor: 'var(--text-primary)' }}>Welcome to PhoneMail</h1>
        </div>

        {step === 'language' ? (
          <div className="onboarding-step fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <p className="auth-subtitle" style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>Choose your language</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto', minHeight: 0, paddingRight: '8px' }}>
              {[
                { id: 'en', label: 'English', sub: 'English' },
                { id: 'hi', label: 'हिन्दी', sub: 'Hindi' },
                { id: 'es', label: 'Español', sub: 'Spanish' },
                { id: 'fr', label: 'Français', sub: 'French' },
                { id: 'de', label: 'Deutsch', sub: 'German' },
                { id: 'ja', label: '日本語', sub: 'Japanese' }
              ].map(l => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setOnboardLang(l.id)}
                  style={{
                    padding: '16px 20px',
                    borderRadius: '16px',
                    border: 'none',
                    background: onboardLang === l.id ? 'var(--primary-light)' : 'transparent',
                    color: onboardLang === l.id ? 'var(--primary)' : 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ 
                    width: '24px', height: '24px', borderRadius: '50%', 
                    border: onboardLang === l.id ? '2px solid var(--primary)' : '2px solid var(--text-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {onboardLang === l.id && <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)' }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '500' }}>{l.label}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{l.sub}</div>
                  </div>
                </button>
              ))}
            </div>
            
            <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
              <button className="btn-primary" onClick={() => setStep('terms')} style={{ width: '100%', padding: '16px', borderRadius: '100px', background: 'var(--primary)', color: 'black', fontWeight: 'bold', fontSize: '16px' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  Next <ArrowRight size={18} />
                </span>
              </button>
            </div>
          </div>
        ) : step === 'terms' ? (
          <div className="onboarding-step fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', color: 'white' }}>Terms & Conditions</h2>
              <p className="auth-subtitle" style={{ color: 'var(--primary)', fontWeight: 'bold', marginTop: '8px', fontSize: '18px' }}>Welcome to PhoneMail</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5', marginTop: '16px' }}>
                Please read our Terms of Service and Privacy Policy before using PhoneMail. By tapping "Agree & Continue", you accept our terms.
              </p>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'left', marginBottom: '24px', paddingRight: '8px', minHeight: 0 }}>
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '16px' }}>📧 What is PhoneMail?</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5', marginTop: '8px' }}>PhoneMail transforms your phone number into your email ID (e.g., 0000000000@phonemail.local). We organize all your emails into chat-style conversations, completely eliminating the clutter of traditional Inbox and Sent folders.</p>
              </div>
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '16px' }}>📱 Required Permissions</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5', marginTop: '8px' }}>To provide a seamless experience, PhoneMail requires access to:</p>
                <ul style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', marginTop: '4px', listStyleType: 'none', padding: 0 }}>
                  <li>• <strong>Phone/SIM Detection:</strong> To automatically detect and pre-fill your number.</li>
                  <li>• <strong>SMS Access:</strong> For automatic OTP verification during login.</li>
                  <li>• <strong>Contacts Access:</strong> To search and start email conversations with people you know.</li>
                </ul>
              </div>
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '16px' }}>🔔 SMS Notifications</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5', marginTop: '8px' }}>If you access PhoneMail primarily via the Web Client or Toll-Free number, you agree to receive SMS alerts for new incoming emails to keep you instantly updated.</p>
              </div>
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '16px' }}>🔒 Account Security</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5', marginTop: '8px' }}>Your account is strictly verified via secure OTP. You can manage your Alias IDs and personal details anytime through Profile Settings.</p>
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
              <button 
                className="btn-primary" 
                onClick={() => { setAcceptedTerms(true); setStep('phone'); }}
                style={{ width: '100%', padding: '16px', borderRadius: '100px', background: 'var(--primary)', color: 'black', fontWeight: 'bold', fontSize: '16px' }}
              >
                Agree & Continue
              </button>
            </div>
          </div>
        ) : step === 'phone' ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '24px', color: 'white' }}>Enter your phone number</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '12px' }}>PhoneMail will create your email as</p>
              <p style={{ color: 'var(--primary)', fontSize: '14px', fontWeight: 'bold' }}>{phone ? `${phone}@phonemail.local` : 'your-number@phonemail.local'}</p>
            </div>

            {error && <div className="error-message" style={{ marginBottom: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '14px' }}>{error}</div>}
            {successMsg && <div className="success-message" style={{ marginBottom: '16px', padding: '12px', background: 'rgba(37, 211, 102, 0.1)', border: '1px solid rgba(37, 211, 102, 0.3)', borderRadius: '8px', color: '#25D366', fontSize: '14px' }}>{successMsg}</div>}

            <form className="auth-form" onSubmit={handleSendOTP} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: '12px', padding: '0 16px', width: '110px',
                  border: '1px solid var(--border)'
                }}>
                  <span style={{ fontSize: '18px', marginRight: '8px' }}>🇮🇳</span>
                  <select 
                    value={countryCode} 
                    onChange={(e) => setCountryCode(e.target.value)}
                    style={{ backgroundColor: 'transparent', color: 'var(--text-primary)', border: 'none', padding: '16px 0', outline: 'none', cursor: 'pointer', fontSize: '16px', flex: 1, appearance: 'none' }}
                  >
                    <option value="+91">+91</option>
                    <option value="+1">+1</option>
                    <option value="+44">+44</option>
                  </select>
                </div>
                
                <div style={{
                  display: 'flex', alignItems: 'center', flex: 1,
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: '12px',
                  border: '1px solid var(--border)'
                }}>
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    style={{ width: '100%', padding: '16px', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '16px', outline: 'none' }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '16px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Already have an account? <span style={{ color: 'var(--primary)', cursor: 'pointer' }}>Sign In</span></span>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={isLoading}
                  style={{ width: '100%', padding: '16px', borderRadius: '100px', background: 'var(--primary)', color: 'black', fontWeight: 'bold', fontSize: '16px', opacity: isLoading ? 0.7 : 1 }}
                >
                  {isLoading ? 'Processing...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            <p className="auth-subtitle" style={{ marginBottom: '4px' }}>
              <Shield size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              Enter the 6-digit code sent to
            </p>
            <p style={{ color: 'var(--accent)', fontWeight: '600', fontSize: '15px', textAlign: 'center', marginBottom: '16px' }}>
              {countryCode} {phone}
            </p>

            {isNewUser && (
              <div style={{ 
                background: 'rgba(37, 211, 102, 0.1)', 
                border: '1px solid rgba(37, 211, 102, 0.3)', 
                borderRadius: '8px', 
                padding: '10px 14px', 
                marginBottom: '16px', 
                textAlign: 'center',
                fontSize: '13px',
                color: 'var(--accent)' 
              }}>
                🎉 New account will be created automatically
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <form className="auth-form" onSubmit={handleVerifyOTP}>
              <div className="input-group">
                <label>OTP Code</label>
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  autoFocus
                  maxLength={6}
                  id="auth-otp"
                  style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '8px', fontWeight: '700' }}
                />
              </div>



              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading}
                id="auth-verify"
              >
                {isLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span className="loading-spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
                    Verifying...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    Verify & Continue <ArrowRight size={18} />
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={handleBack}
                style={{ 
                  marginTop: '12px', width: '100%', padding: '10px', 
                  background: 'transparent', border: '1px solid var(--border)', 
                  borderRadius: '8px', color: 'var(--text-secondary)', 
                  cursor: 'pointer', fontSize: '14px' 
                }}
              >
                ← Change number
              </button>

              <button
                type="button"
                onClick={() => alert(`Fallback Demo OTP: 123456`)}
                style={{ 
                  marginTop: '16px', width: '100%', padding: '4px', 
                  background: 'transparent', border: 'none', 
                  color: 'var(--text-tertiary)', 
                  cursor: 'pointer', fontSize: '12px', textDecoration: 'underline'
                }}
              >
                Need Help?
              </button>
            </form>
          </>
        )}
      </div>

      {isCallUIOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          color: 'white',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            background: 'var(--surface)',
            padding: '40px 30px',
            borderRadius: '24px',
            width: '90%',
            maxWidth: '360px',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ 
                width: '80px', height: '80px', borderRadius: '40px', 
                backgroundColor: 'rgba(168, 85, 247, 0.2)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid var(--accent)'
              }}>
                <PhoneCall size={40} color="var(--accent)" className={!showKeypad ? 'pulse-anim' : ''} />
              </div>
            </div>
            
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
              Toll-Free IVR
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', minHeight: '45px', marginBottom: '32px' }}>
              {callStatus}
            </p>

            {showKeypad ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                <button 
                  style={{
                    width: '72px', height: '72px', borderRadius: '36px',
                    border: 'none', background: 'var(--accent)',
                    color: 'white', fontSize: '28px', fontWeight: 'bold',
                    cursor: 'pointer', boxShadow: '0 10px 25px -5px rgba(168, 85, 247, 0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                  onClick={async () => {
                    setCallStatus('Processing keystroke "1"...');
                    setShowKeypad(false);
                    try {
                      const fullPhone = `${countryCode}${phone.replace(/\s/g, '')}`;
                      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
                      const response = await fetch(`${apiUrl}/voice/simulate`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone: fullPhone })
                      });
                      const data = await response.json();
                      if (data.success) {
                        setSuccessMsg(data.message);
                        setError('');
                      } else {
                        setError('Simulation failed.');
                      }
                    } catch (e) {
                      setError('Server error during simulation.');
                    }
                    setTimeout(() => {
                      setIsCallUIOpen(false);
                    }, 1500);
                  }}
                >
                  1
                </button>
                <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Press 1 to verify
                </span>
              </div>
            ) : null}

            <div style={{ marginTop: '40px' }}>
              <button
                style={{
                  width: '64px', height: '64px', borderRadius: '32px',
                  border: 'none', background: '#ef4444',
                  color: 'white', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto', boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.4)'
                }}
                onClick={() => setIsCallUIOpen(false)}
              >
                <PhoneOff size={28} />
              </button>
            </div>
          </div>
          <style>{`
            @keyframes pulse {
              0% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.1); opacity: 0.7; }
              100% { transform: scale(1); opacity: 1; }
            }
            .pulse-anim {
              animation: pulse 1.5s infinite ease-in-out;
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default Auth;
