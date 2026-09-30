import React, { useState } from 'react';
import { Phone, PhoneCall, CheckCircle } from 'lucide-react';
import { authAPI } from '../services/api';

const IVRDemo: React.FC = () => {
  const [callerNumber, setCallerNumber] = useState('+91');
  const [isLoading, setIsLoading] = useState(false);
  const [callInitiated, setCallInitiated] = useState(false);
  const [error, setError] = useState('');

  const startCall = async () => {
    if (!callerNumber || callerNumber.length < 10) {
      setError('Enter a valid phone number');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      // Use the actual Twilio integration
      const baseUrl = window.location.origin;
      const response = await authAPI.initiateCall(callerNumber, baseUrl);
      
      if (response.data.success) {
        setCallInitiated(true);
      } else {
        throw new Error('Call initiation failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to initiate call. Please ensure Twilio is configured.');
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setCallInitiated(false);
    setCallerNumber('+91');
    setError('');
  };

  return (
    <div className="auth-container" style={{ minHeight: '100dvh' }}>
      <div className="auth-card fade-in" style={{ maxWidth: '440px' }}>
        <div className="auth-logo">
          <div className="auth-logo-icon" style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}>
            <Phone size={24} color="white" />
          </div>
          <h1>PhoneMail IVR</h1>
        </div>
        <p className="auth-subtitle" style={{ marginBottom: '24px' }}>
          Activate your account via a real phone call
        </p>

        {!callInitiated ? (
          <div style={{ textAlign: 'center' }}>
            <div className="input-group" style={{ marginBottom: '16px' }}>
              <label>Your Phone Number</label>
              <input
                type="tel"
                placeholder="+91 9876543210"
                value={callerNumber}
                onChange={(e) => setCallerNumber(e.target.value)}
                id="ivr-phone"
                disabled={isLoading}
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
              📞 You will receive a real phone call to activate your account.
            </p>
            <button className="btn-primary" onClick={startCall} disabled={isLoading} style={{ width: '100%' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <PhoneCall size={18} /> {isLoading ? 'Initiating Call...' : 'Call Me'}
              </span>
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              background: 'rgba(37, 211, 102, 0.1)', 
              border: '1px solid rgba(37, 211, 102, 0.3)',
              borderRadius: '12px', padding: '16px', marginBottom: '20px'
            }}>
              <CheckCircle size={32} color="var(--accent)" style={{ marginBottom: '8px' }} />
              <p style={{ color: 'var(--accent)', fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>
                Call Initiated! 📞
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>
                You should receive a call on <strong>{callerNumber}</strong> shortly. 
                Answer the call and follow the instructions to activate your account.
              </p>
            </div>
            <button className="btn-primary" onClick={reset} style={{ width: '100%' }}>
              Try Another Number
            </button>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <a href="/login" style={{ color: 'var(--text-tertiary)', fontSize: '13px', textDecoration: 'none' }}>
            ← Back to Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default IVRDemo;
