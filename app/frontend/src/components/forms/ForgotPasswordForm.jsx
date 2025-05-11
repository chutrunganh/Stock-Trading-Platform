import React, { useState } from 'react';
import './ForgotPasswordForm.css';
import { requestPasswordReset, verifyLoginOtp, resetPassword } from '../../api/user';
import OtpForm from './OtpForm';
import { getPasswordRequirements } from '../../utils/passwordUtil';
import { Eye, EyeOffIcon } from "lucide-react";

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
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    maxLength: true,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSymbol: false,
    noUsername: true
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

 
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
    if (!Object.values(passwordRequirements).every(req => req)) {
      setError('Please meet all password requirements.');
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
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => {
                  setNewPassword(e.target.value);
                  setPasswordRequirements(getPasswordRequirements(e.target.value, email));
                }}
                required
                placeholder="Enter new password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
              >
                {showPassword ? <Eye/> : <EyeOffIcon />}
              </button>
            </div>
            <div className="password-requirements">
              <p className={passwordRequirements.length ? 'requirement-met' : 'requirement'}>
                &#x2022; At least 6 characters
              </p>
              <p className={passwordRequirements.maxLength ? 'requirement-met' : 'requirement'}>
                &#x2022; No more than 72 characters
              </p>
              <p className={passwordRequirements.hasUpper ? 'requirement-met' : 'requirement'}>
                &#x2022; At least one uppercase letter
              </p>
              <p className={passwordRequirements.hasLower ? 'requirement-met' : 'requirement'}>
                &#x2022; At least one lowercase letter
              </p>
              <p className={passwordRequirements.hasNumber ? 'requirement-met' : 'requirement'}>
                &#x2022; At least one number
              </p>
              <p className={passwordRequirements.hasSymbol ? 'requirement-met' : 'requirement'}>
                &#x2022; At least one symbol (@$!%*?&)
              </p>
              <p className={passwordRequirements.noUsername ? 'requirement-met' : 'requirement'}>
                &#x2022; Cannot contain any part of your email (3 or more characters)
              </p>
            </div>
          </div>
          <div className="form-group">
            <label>Confirm Password:</label>
            <div className="password-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm new password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isSubmitting}
              >
                {showConfirmPassword ? <Eye/> : <EyeOffIcon />}
              </button>
            </div>
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
