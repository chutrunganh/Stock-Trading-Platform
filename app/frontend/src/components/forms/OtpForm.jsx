import React, { useState, useEffect } from 'react';
import './OtpForm.css';

function OtpForm({ onSubmit, identifier, previewUrl, isLoading, error, onResend }) {
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(60); // 1 minute countdown
  const [expired, setExpired] = useState(false);

  // Monitor previewUrl changes
  useEffect(() => {
    console.log('OtpForm: previewUrl changed:', previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    if (timer > 0 && !expired) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) {
      setExpired(true);
    }
  }, [timer, expired]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (otp.trim() && !expired) {
      onSubmit({ identifier, otp });
    }
  };

  const handleResend = () => {
    console.log('OtpForm: handleResend triggered, current previewUrl:', previewUrl);
    setTimer(60);
    setExpired(false);
    setOtp('');
    if (onResend) {
      console.log('OtpForm: Calling onResend function');
      onResend();
    }
  };

  return (
    <form className="otp-form" onSubmit={handleSubmit} style={{ background: '#121314', color: '#f0b90b', padding: 20, borderRadius: 8 }}>
      <h2 style={{ textAlign: 'center' }}>Two-Factor Authentication with OTP</h2>
      {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}
      <div className="form-group">
        <label>OTP Code:</label>
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
          placeholder="Enter the OTP you received"
          disabled={isLoading || expired}
          style={{ width: '100%', padding: 10, border: 'none', borderRadius: 4, background: '#202127', color: '#f0b90b' }}
        />
      </div>
      <div style={{ marginBottom: 10, textAlign: 'center', color: expired ? 'red' : '#f0b90b', fontWeight: 'bold' }}>
        {expired ? (
          <span>OTP expired. <button type="button" className="resend-button" onClick={handleResend} style={{ color: '#f0b90b', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Resend OTP</button></span>
        ) : (
          <span>Expires in 0:{timer.toString().padStart(2, '0')}</span>
        )}
      </div>
      {previewUrl && (
        <div className="preview-url" style={{ textAlign: 'center', marginBottom: 10 }}>
          <a href={previewUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#f0b90b' }}>
            Click here to view your simulated OTP email <br /> ( we use Ethereal mail)
          </a>
        </div>
      )}
      <button type="submit" className="submit-button" disabled={isLoading || expired} style={{ background: '#f0b90b', color: '#121314', border: 'none', padding: 10, borderRadius: 4, width: '100%', fontWeight: 'bold', marginBottom: 10 }}>
        {isLoading ? 'Verifying...' : 'Verify OTP'}
      </button>
      {onResend && !expired && (
        <button type="button" className="resend-button" onClick={handleResend} disabled={isLoading} style={{ background: 'none', color: '#f0b90b', border: 'none', cursor: 'pointer', textDecoration: 'underline', width: '100%' }}>
          Resend OTP
        </button>
      )}
    </form>
  );
}

export default OtpForm; 