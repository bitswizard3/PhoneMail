import React, { useState } from 'react';
import { Phone, PhoneCall, CheckCircle, Volume2 } from 'lucide-react';
import { authAPI } from '../services/api';

type IVRStep = 'idle' | 'ringing' | 'greeting' | 'pressed1' | 'creating' | 'done';

const IVRDemo: React.FC = () => {
  const [step, setStep] = useState<IVRStep>('idle');
  const [callerNumber, setCallerNumber] = useState('+91');
  const [createdEmail, setCreatedEmail] = useState('');
  const [error, setError] = useState('');

  const startCall = () => {
    if (!callerNumber || callerNumber.length < 10) {
      setError('Enter a valid phone number');
      return;
    }
    setError('');
    setStep('ringing');
    setTimeout(() => setStep('greeting'), 2000);
  };

  const pressDigit = async (digit: string) => {
    if (digit === '1') {
      setStep('pressed1');
      setTimeout(async () => {
        setStep('creating');
        try {
          // Register via IVR method
          const response = await authAPI.sendOTP(callerNumber);
          const cleanPhone = callerNumber.replace(/[^0-9]/g, '');
          setCreatedEmail(`${cleanPhone}@phonemail.local`);
          
          // Auto-verify with mock OTP
          await authAPI.verifyOTP(callerNumber, '123456');
          
          setStep('done');
        } catch (err: any) {
          if (err.response?.data?.error?.includes('already exists') || err.response?.status === 409) {
            const cleanPhone = callerNumber.replace(/[^0-9]/g, '');
            setCreatedEmail(`${cleanPhone}@phonemail.local`);
            setStep('done');
          } else {
            const cleanPhone = callerNumber.replace(/[^0-9]/g, '');
            setCreatedEmail(`${cleanPhone}@phonemail.local`);
            setStep('done');
          }
        }
      }, 1500);
    } else {
      setStep('idle');
    }
  };

  const reset = () => {
    setStep('idle');
    setCreatedEmail('');
    setError('');
  };

  return (
    <div className="auth-container" style={{ minHeight: '100vh' }}>
      <div className="auth-card fade-in" style={{ maxWidth: '440px' }}>
        <div className="auth-logo">
          <div className="auth-logo-icon" style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}>
            <Phone size={24} color="white" />
          </div>
          <h1>IVR Demo</h1>
        </div>
        <p className="auth-subtitle" style={{ marginBottom: '24px' }}>
          Toll-Free Account Creation Simulator
        </p>

        {/* Phone dialer */}
        {step === 'idle' && (
          <div style={{ textAlign: 'center' }}>
            <div className="input-group" style={{ marginBottom: '16px' }}>
              <label>Your Phone Number</label>
              <input
                type="tel"
                placeholder="+91 9876543210"
                value={callerNumber}
                onChange={(e) => setCallerNumber(e.target.value)}
                id="ivr-phone"
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
              📞 Simulates calling PhoneMail's toll-free number
            </p>
            <button className="btn-primary" onClick={startCall} style={{ width: '100%' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <PhoneCall size={18} /> Call PhoneMail
              </span>
            </button>
          </div>
        )}

        {/* Ringing */}
        {step === 'ringing' && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ 
              width: '80px', height: '80px', borderRadius: '50%', 
              background: 'linear-gradient(135deg, #25D366, #128C7E)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', animation: 'pulse 1s infinite'
            }}>
              <PhoneCall size={36} color="white" />
            </div>
            <p style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: '600' }}>
              📞 Ringing...
            </p>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>
              Connecting to PhoneMail
            </p>
          </div>
        )}

        {/* IVR Greeting */}
        {step === 'greeting' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              background: 'var(--surface-elevated)', border: '1px solid var(--border)',
              borderRadius: '12px', padding: '20px', marginBottom: '20px'
            }}>
              <Volume2 size={24} color="var(--accent)" style={{ marginBottom: '12px' }} />
              <p style={{ color: 'var(--text-primary)', fontSize: '15px', lineHeight: '1.6', fontStyle: 'italic' }}>
                🔊 "Welcome to PhoneMail.<br />
                Press <strong>1</strong> to create your PhoneMail account,<br />
                or press <strong>2</strong> to exit."
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={() => pressDigit('1')}
                style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #25D366, #128C7E)',
                  color: 'white', fontSize: '24px', fontWeight: '700',
                  border: 'none', cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(37, 211, 102, 0.4)'
                }}
              >
                1
              </button>
              <button 
                onClick={() => pressDigit('2')}
                style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: 'var(--surface-elevated)', color: 'var(--text-secondary)',
                  fontSize: '24px', fontWeight: '700',
                  border: '1px solid var(--border)', cursor: 'pointer'
                }}
              >
                2
              </button>
            </div>
          </div>
        )}

        {/* Creating account */}
        {(step === 'pressed1' || step === 'creating') && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ 
              width: '60px', height: '60px', borderRadius: '50%',
              border: '3px solid var(--accent)', borderTopColor: 'transparent',
              margin: '0 auto 20px', animation: 'spin 1s linear infinite'
            }} />
            <p style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: '600' }}>
              {step === 'pressed1' ? '📱 You pressed 1...' : '⏳ Creating your account...'}
            </p>
          </div>
        )}

        {/* Done */}
        {step === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              background: 'var(--surface-elevated)', border: '1px solid var(--border)',
              borderRadius: '12px', padding: '20px', marginBottom: '20px'
            }}>
              <Volume2 size={24} color="var(--accent)" style={{ marginBottom: '12px' }} />
              <p style={{ color: 'var(--text-primary)', fontSize: '15px', lineHeight: '1.6', fontStyle: 'italic' }}>
                🔊 "Your PhoneMail account has been created successfully.<br />
                You can now receive emails at your phone number at phonemail dot com.<br />
                Thank you!"
              </p>
            </div>
            <div style={{ 
              background: 'rgba(37, 211, 102, 0.1)', 
              border: '1px solid rgba(37, 211, 102, 0.3)',
              borderRadius: '12px', padding: '16px', marginBottom: '20px'
            }}>
              <CheckCircle size={32} color="var(--accent)" style={{ marginBottom: '8px' }} />
              <p style={{ color: 'var(--accent)', fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>
                Account Created! ✅
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Your email: <strong style={{ color: 'var(--accent)' }}>{createdEmail}</strong>
              </p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginTop: '8px' }}>
                📩 SMS confirmation would be sent to {callerNumber}
              </p>
            </div>
            <button className="btn-primary" onClick={reset} style={{ width: '100%' }}>
              Try Another Number
            </button>
          </div>
        )}

        {/* Back to login link */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <a href="/login" style={{ color: 'var(--text-tertiary)', fontSize: '13px', textDecoration: 'none' }}>
            ← Back to Login
          </a>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default IVRDemo;
