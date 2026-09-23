import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, ArrowRight, Shield, PhoneCall, PhoneOff } from 'lucide-react';
import { authAPI } from '../services/api';

type AuthStep = 'phone' | 'otp';

const Auth: React.FC = () => {
  const [step, setStep] = useState<AuthStep>('phone');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
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
      <div className="auth-card fade-in">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Mail size={24} color="white" />
          </div>
          <h1>PhoneMail</h1>
        </div>

        {step === 'phone' ? (
          <>
            <p className="auth-subtitle">
              Enter your phone number to sign in or create an account
            </p>

            {error && <div className="error-message" style={{ marginBottom: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '14px' }}>{error}</div>}
            {successMsg && <div className="success-message" style={{ marginBottom: '16px', padding: '12px', background: 'rgba(37, 211, 102, 0.1)', border: '1px solid rgba(37, 211, 102, 0.3)', borderRadius: '8px', color: '#25D366', fontSize: '14px' }}>{successMsg}</div>}

            <form className="auth-form" onSubmit={handleSendOTP}>
              <div className="input-group">
                <label>Phone Number</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'var(--surface)',
                    borderBottom: '2px solid var(--primary)',
                    padding: '0 8px',
                    width: '90px'
                  }}>
                    <span style={{ fontSize: '18px', marginRight: '6px' }}>🇮🇳</span>
                    <select 
                      value={countryCode} 
                      onChange={(e) => setCountryCode(e.target.value)}
                      style={{ 
                        backgroundColor: 'transparent', 
                        color: 'var(--text-primary)', 
                        border: 'none', 
                        padding: '10px 0',
                        outline: 'none',
                        cursor: 'pointer',
                        fontSize: '16px',
                        flex: 1
                      }}
                    >
                      <option value="+91" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>+91</option>
                      <option value="+1" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>+1</option>
                      <option value="+44" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>+44</option>
                      <option value="+61" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>+61</option>
                    </select>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'var(--surface)',
                    borderBottom: '2px solid var(--primary)',
                    flex: 1
                  }}>
                    <input
                      type="tel"
                      placeholder="Phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoFocus
                      id="auth-phone"
                      style={{ 
                        flex: 1,
                        backgroundColor: 'transparent',
                        border: 'none',
                        padding: '10px 12px',
                        fontSize: '18px',
                        color: 'var(--text-primary)',
                        letterSpacing: '1px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="auth-tos" style={{ textAlign: 'center', marginBottom: '16px', fontSize: '13px', color: 'var(--text-tertiary)' }}>
                By signing up, you agree to the{' '}
                <a href="#" onClick={(e) => e.preventDefault()} style={{ color: 'var(--accent)', textDecoration: 'none' }}>Terms of Service</a>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading}
                id="auth-submit"
              >
                {isLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span className="loading-spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
                    Sending OTP...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    Next <ArrowRight size={18} />
                  </span>
                )}
              </button>
            </form>

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <button 
                className="btn-secondary" 
                style={{ 
                  backgroundColor: 'var(--surface)', 
                  border: '1px solid var(--primary)',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  fontSize: '15px'
                }}
                onClick={() => {
                  if (!phone) {
                    setError('Please enter a phone number first to simulate call.');
                    return;
                  }
                  setIsCallUIOpen(true);
                  setCallStatus('Calling Twilio IVR...');
                  setShowKeypad(false);
                  
                  setTimeout(() => {
                    setCallStatus('Connected. "Welcome to PhoneMail. Press 1 to activate your account."');
                    setShowKeypad(true);
                  }, 2500);
                }}
              >
                <span style={{ fontSize: '18px' }}>📞</span> 
                Simulate Toll-Free Call (Demo)
              </button>
            </div>
          </>
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
                      const response = await fetch('http://localhost:4000/api/voice/simulate', {
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
