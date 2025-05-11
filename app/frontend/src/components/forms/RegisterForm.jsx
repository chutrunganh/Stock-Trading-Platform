import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './RegisterForm.css';
import { Eye, EyeOffIcon } from "lucide-react";
import {getPasswordRequirements } from '../../utils/passwordUtil';

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
  const [isRedirecting, setIsRedirecting] = useState(false);  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    maxLength: true,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSymbol: false,
    noUsername: true
  });  const updatePasswordRequirements = (password) => {
    setPasswordRequirements(getPasswordRequirements(password, username));
  };

  // Please note that this password policy needs to be check by BOTH frontend and backend
  // Only validate the password on the frontend may be bypassed by intercepting the request (with tools like Postman, Burp, etc.)
  // Only validate the password on the backend does not affect security concerns, but will waste server time to give a response to the client

  const validateForm = () => {
    let isValid = true;
       // Password validation using requirements state
    if (Object.values(passwordRequirements).every(req => req)) {
      setPasswordError('');
    } else {
      setPasswordError('Please meet all password requirements');
      isValid = false;
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

  const { register } = useAuth();

  const handleSubmit = async (e) => {
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
          value={username}          onChange={(e) => {
            const newUsername = e.target.value;
            setUsername(newUsername);
            // Update password requirements when username changes
            if (password) {
              updatePasswordRequirements(password);
            }
          }}
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
            onChange={(e) => {
              setPassword(e.target.value);
              updatePasswordRequirements(e.target.value);
            }}
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
          </p>          <p className={passwordRequirements.hasSymbol ? 'requirement-met' : 'requirement'}>
            &#x2022; At least one symbol (@$!%*?&)
          </p>          <p className={passwordRequirements.noUsername ? 'requirement-met' : 'requirement'}>
            &#x2022; Cannot contain any part of your username (3 or more characters)
          </p>
        </div>
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