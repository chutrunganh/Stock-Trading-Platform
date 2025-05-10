import React from 'react';
import './ForgotPasswordForm.css';

/**
 * ForgotPasswordForm component
 * Displays a message indicating the feature is not yet implemented
 */
function ForgotPasswordForm({ onClose }) {
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
