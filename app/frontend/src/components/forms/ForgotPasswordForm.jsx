import React from 'react';
import './ForgotPasswordForm.css';

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

  // Password regex for validation
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,72}$/;

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);
    try {
      const response = await forgotPasswordSendOtp(email);
      setMessage(response.message || 'OTP has been sent to your email.');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);
    try {
      const response = await verifyOtp(email, otp);
      setMessage(response.message || 'OTP verified successfully.');
      setStep(3);
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validate password format
    if (!passwordRegex.test(newPassword)) {
      setError('Password must include uppercase, lowercase, numbers, symbols, and be 6-72 characters long.');
      return;
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await resetPassword(email, otp, newPassword);
      setMessage(response.message || 'Password successfully changed!');
      const loginAttempts = JSON.parse(localStorage.getItem('loginAttempts') || '{}');
      const emailKey = email.trim().toLowerCase();
      if (loginAttempts[emailKey]) {
        delete loginAttempts[emailKey];
        localStorage.setItem('loginAttempts', JSON.stringify(loginAttempts));
      }

      setTimeout(() => {
        onClose(); // Close the window after a successful password reset
      }, 2000); // Optional: Add a delay to let the user see the success message
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="forgot-password-form">
      <h2>Reset Password</h2>
      
      <div className="feature-not-implemented">
        <div className="construction-icon">🚧</div>
        <p>Oops! This feature hasn't been implemented yet.</p>
        <p>Please try again later.</p>
      </div>
      
      <div className="form-actions">
        <button 
          type="button" 
          className="cancel-btn" 
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default ForgotPasswordForm;
