import React, { useState, useEffect } from 'react';
import './OtpForm.css';

function OtpForm({ onSubmit, identifier, previewUrl, isLoading, error, onResend, title, description, className }) {
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
    <form className={`otp-form${className ? ' ' + className : ''}`} onSubmit={handleSubmit}>
      <h2>{title || 'Two-Factor Authentication with OTP'}</h2>
      {error && <p className="error-message">{error}</p>}
      <div className="form-group">
        <label>{description || 'Please check your email linked to this account for the OTP code'}</label>
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
          placeholder="Enter the OTP you received"
          disabled={isLoading || expired}
        />
      </div>
      <div className="otp-timer" style={{ color: expired ? 'red' : undefined }}>
        {expired ? (
          <span>OTP expired. <button type="button" className="resend-button" onClick={handleResend}>Resend OTP</button></span>
        ) : (
          <span>Expires in 0:{timer.toString().padStart(2, '0')}</span>
        )}
      </div>
      {previewUrl && (
        <div className="preview-url">
          <a href={previewUrl} target="_blank" rel="noopener noreferrer">
            Click here to view your simulated OTP email <br /> ( we use Ethereal mail)
          </a>
        </div>
      )}
      <button type="submit" className="submit-button" disabled={isLoading || expired}>
        {isLoading ? 'Verifying...' : 'Verify OTP'}
      </button>
      {onResend && !expired && (
        <button type="button" className="resend-button" onClick={handleResend} disabled={isLoading}>
          Resend OTP
        </button>
      )}
    </form>
  );
}

export default OtpForm; 