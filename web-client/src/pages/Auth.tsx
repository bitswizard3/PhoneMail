import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, ArrowRight, Shield } from 'lucide-react';
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
                onClick={async () => {
                  if (!phone) {
                    setError('Please enter a phone number first to simulate call.');
                    return;
                  }
                  setIsLoading(true);
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
                      setTimeout(() => setSuccessMsg(''), 5000);
                    } else {
                      setError('Simulation failed.');
                      setSuccessMsg('');
                    }
                  } catch (e) {
                    setError('Server error during simulation.');
                  } finally {
                    setIsLoading(false);
                  }
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
    </div>
  );
};

export default Auth;
