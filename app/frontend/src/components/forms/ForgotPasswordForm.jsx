import React, { useState } from 'react';
import './ForgotPasswordForm.css';
import { requestPasswordReset, verifyLoginOtp, resetPassword } from '../../api/user';
import OtpForm from './OtpForm';

/**
 * ForgotPasswordForm component
 * Displays a message indicating the feature is not yet implemented
 */
function ForgotPasswordForm({ onClose }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  // Password regex for validation
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,72}$/;

  // Step 1: Request OTP
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);
    try {
      const response = await requestPasswordReset(email);
      setMessage(response.message || 'OTP has been sent to your email.');
      setPreviewUrl(response.data?.previewUrl || '');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify OTP (for forgot password, just move to next step)
  const handleOtpSubmit = async ({ identifier, otp }) => {
    setError('');
    setMessage('');
    setOtp(otp); // Store OTP for use in reset step
    setStep(3);  // Move to password reset step
  };

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    setError('');
    setMessage('');
    setIsSubmitting(true);
    try {
      const response = await requestPasswordReset(email);
      setMessage(response.message || 'OTP has been resent to your email.');
      setPreviewUrl(response.data?.previewUrl || '');
    } catch (err) {
      setError(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Reset Password
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!passwordRegex.test(newPassword)) {
      setError('Password must include uppercase, lowercase, numbers, symbols, and be 6-72 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await resetPassword({ email, otp, newPassword });
      setMessage(response.message || 'Password successfully changed!');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="forgot-password-form">
      <h2>Reset Password</h2>
      {step === 1 && (
        <form onSubmit={handleEmailSubmit}>
          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              disabled={isSubmitting}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="submit-btn" disabled={isSubmitting}>{isSubmitting ? 'Sending...' : 'Send OTP'}</button>
          </div>
        </form>
      )}
      {step === 2 && (
        // Reuse the OTP from for easy maintainable
        <OtpForm
          onSubmit={handleOtpSubmit}
          identifier={email}
          previewUrl={previewUrl}
          isLoading={isSubmitting}
          error={error}
          onResend={handleResendOtp}
          title=" "
          description="Enter the OTP sent to your email to continue."
          className="forgot-password-form"
        />
      )}
      {step === 3 && (
        <form onSubmit={handlePasswordReset}>
          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}
          <div className="form-group">
            <label>New Password:</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              placeholder="Enter new password"
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label>Confirm Password:</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm new password"
              disabled={isSubmitting}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="submit-btn" disabled={isSubmitting}>{isSubmitting ? 'Resetting...' : 'Reset Password'}</button>
          </div>
        </form>
      )}
    </div>
  );
}

export default ForgotPasswordForm;
