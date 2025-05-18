import React, { useState, useEffect } from 'react';
import './OtpForm.css';

function OtpForm({ 
  onSubmit, 
  identifier, 
  previewUrl, 
  isLoading, 
  error, 
  onResend, 
  title, 
  description, 
  className, 
  rememberDevice, 
  onRememberDeviceChange,
  warning,
  type = 'login' // Add type prop to distinguish between login and forgot password
}) {
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

  const getButtonText = () => {
    if (isLoading) return 'Verifying...';
    return type === 'login' ? 'Verify OTP' : 'Reset Password';
  };

  return (
    <form className={`otp-form${className ? ' ' + className : ''}`} onSubmit={handleSubmit}>
      <div className="otp-content">
        <h2>{title || (type === 'login' ? 'Two-Factor Authentication with OTP' : 'Reset Password')}</h2>
        {error && <p className="error-message">{error}</p>}
        {warning && <p className="warning-message" style={{ color: '#f0b90b' }}>{warning}</p>}
        <div className="form-group">
          <label>{description || 'Please check your email linked to this account for the OTP code'}</label>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            placeholder="Enter the 8-character OTP you received"
            pattern="[A-Za-z0-9]{8}"
            maxLength={8}
            disabled={isLoading || expired}
          />
        </div>
        <div className="otp-timer" style={{ color: expired ? 'red' : undefined }}>
          {expired ? (
            <span>OTP expired. <button type="button" className="resend-button" onClick={handleResend}>Resend OTP</button></span>
          ) : (
            <span>Code expires in {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</span>
          )}
        </div>
        {previewUrl && (
          <div className="preview-url">
            <a href={previewUrl} target="_blank" rel="noopener noreferrer">
              Click here for your simulated Ethereal email
            </a>
          </div>
        )}
        <div className="form-actions">
          {onResend && !expired && (
            <button type="button" className="resend-button" onClick={handleResend} disabled={isLoading}>
              Resend OTP
            </button>
          )}
          <button type="submit" className="submit-button" disabled={isLoading || expired}>
            {getButtonText()}
          </button>
        </div>
      </div>
      {/* Only show remember device checkbox for login 2FA */}
      {type === 'login' && (
        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={onRememberDeviceChange}
              disabled={isLoading}
            />
            <div className="checkbox-wrapper"></div>
            <span>Remember this device (for 1 minute by testing purposes) and skip 2FA next time</span>
          </label>
        </div>
      )}
    </form>
  );
}

export default OtpForm; 