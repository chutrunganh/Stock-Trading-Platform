import React, { useState } from 'react';

function OtpForm({ onSubmit, identifier, previewUrl, isLoading, error, onResend }) {
  const [otp, setOtp] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (otp.trim()) {
      onSubmit({ identifier, otp });
    }
  };

  return (
    <form className="otp-form" onSubmit={handleSubmit}>
      <h2>Enter OTP</h2>
      {error && <p className="error-message">{error}</p>}
      <div className="form-group">
        <label>OTP Code:</label>
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
          placeholder="Enter the OTP you received"
          disabled={isLoading}
        />
      </div>
      {previewUrl && (
        <div className="preview-url">
          <a href={previewUrl} target="_blank" rel="noopener noreferrer">
            Click here to view your simulated OTP email (Ethereal)
          </a>
        </div>
      )}
      <button type="submit" className="submit-button" disabled={isLoading}>
        {isLoading ? 'Verifying...' : 'Verify OTP'}
      </button>
      {onResend && (
        <button type="button" className="resend-button" onClick={onResend} disabled={isLoading}>
          Resend OTP
        </button>
      )}
    </form>
  );
}

export default OtpForm; 