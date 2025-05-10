import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './RegisterForm.css';
import { Eye, EyeOff, EyeOffIcon } from "lucide-react";

/**
 * RegisterForm component
 * Handles new user registration
 */
function RegisterForm({ onClose }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);

  const validateForm = () => {
    let isValid = true;
    
    // Password validation
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      isValid = false;
    } else {
      setPasswordError('');
    }
    
    // Confirm password validation
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    } else {
      setConfirmPasswordError('');
    }
    
    return isValid;
  };

  const { register } = useAuth();  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError('');
      try {
      await register({ username, email, password });
      setSuccessMessage('Registration successful!');
      setError('');
      setIsRedirecting(true);
      
      // Wait for 2 seconds to show the success message, then close register modal and open login
      setTimeout(() => {
        onClose();
        // After the register modal is closed, open the login modal
        document.dispatchEvent(new CustomEvent('openLoginModal'));
      }, 2000);
    } catch (err) {
      setSuccessMessage('');
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="register-form" onSubmit={handleSubmit}>      <h2>Create Account</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="success-message">
          {successMessage}
          {isRedirecting && (
            <div className="redirect-container">
              <div className="spinner"></div>
              <p>Redirecting to login...</p>
            </div>
          )}
        </div>
      )}
      <div className="form-group">
        <label htmlFor="username">Username:</label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          placeholder="Choose a username"
          disabled={isSubmitting}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="Enter your email"
          disabled={isSubmitting}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="password">Password:</label>
        <div className="password-wrapper">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Create a password"
            disabled={isSubmitting}
            className={passwordError ? 'error' : ''}
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
        {passwordError && <p className="error-message">{passwordError}</p>}
      </div>
      
      <div className="form-group">
        <label htmlFor="confirmPassword">Confirm Password:</label>
        <div className="password-wrapper">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Confirm your password"
            disabled={isSubmitting}
            className={confirmPasswordError ? 'error' : ''}
          />
          <button 
            type="button"
            className="toggle-password"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={isSubmitting}
          >
  
          </button>
        </div>
        {confirmPasswordError && <p className="error-message">{confirmPasswordError}</p>}
      </div>
      
      <div className="form-actions">
        <button 
          type="button" 
          className="cancel-btn" 
          onClick={onClose}
          disabled={isSubmitting || isRedirecting}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="submit-btn"
          disabled={isSubmitting || isRedirecting}
        >
          {isSubmitting ? 'Registering...' : 'Register'}
        </button>
      </div>
    </form>
  );
}

export default RegisterForm;