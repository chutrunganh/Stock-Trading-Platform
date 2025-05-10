import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile, sendLoginOtp, verifyLoginOtp } from '../../api/user';
import './LoginForm.css';

function LoginForm({ onLogin, onRegisterClick, onForgotPasswordClick }) {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [cooldownTimer, setCooldownTimer] = useState(0);

  // Load login attempts from localStorage on component mount
  useEffect(() => {
    const checkLoginAttempts = () => {
      const loginAttempts = JSON.parse(localStorage.getItem('loginAttempts') || '{}');
      const currentIdentifier = identifier.trim().toLowerCase();

      if (currentIdentifier && loginAttempts[currentIdentifier]) {
        const { count, timestamp } = loginAttempts[currentIdentifier];
        const elapsedTime = Date.now() - timestamp;

        // If we're in cooldown period (less than 1 minute since last attempt) and attempts >= 5
        if (count >= 5 && elapsedTime < 60000) {
          const remainingTime = Math.ceil((60000 - elapsedTime) / 1000);
          setCooldownTimer(remainingTime);

          // Start the cooldown timer
          const interval = setInterval(() => {
            setCooldownTimer(prevTime => {
              if (prevTime <= 1) {
                clearInterval(interval);
                return 0;
              }
              return prevTime - 1;
            });
          }, 1000);

          return () => clearInterval(interval);
        }

        // If attempts >= 10, redirect to forgot password
        if (count >= 10) {
          onForgotPasswordClick();
        }
      }
    };

    checkLoginAttempts();
  }, [identifier, onForgotPasswordClick]);

  useEffect(() => {
    const handleGoogleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);

      if (urlParams.has('login') && urlParams.get('login') === 'success') {
        const token = urlParams.get('token');
    setIsLoading(true);
    try {
          localStorage.setItem('authToken', token);
          const data = await getUserProfile();

          if (data.status === 200 && data.data && data.data.user) {
            window.history.replaceState({}, document.title, window.location.pathname);

            const loginData = {
              user: data.data.user,
              token: token
  };

            onLogin(loginData);
      } else {
            setError('Failed to get user profile');
      }
    } catch (err) {
          setError('Google login failed. Please try again.');
          console.error('Google login error:', err);
    } finally {
      setIsLoading(false);
    }
      }
  };

    handleGoogleCallback();
  }, [onLogin]);

  // Function to track failed login attempts
  const trackFailedLoginAttempt = () => {
    const currentIdentifier = identifier.trim().toLowerCase();
    if (!currentIdentifier) return;

    // Get existing attempts from localStorage
    const loginAttempts = JSON.parse(localStorage.getItem('loginAttempts') || '{}');

    // Update attempts for this identifier
    if (!loginAttempts[currentIdentifier]) {
      loginAttempts[currentIdentifier] = { count: 1, timestamp: Date.now() };
    } else {
      loginAttempts[currentIdentifier].count += 1;
      loginAttempts[currentIdentifier].timestamp = Date.now();
    }

    // Check if we've reached 10 attempts - redirect to forgot password
    if (loginAttempts[currentIdentifier].count >= 10) {
      onForgotPasswordClick();
    }
    // Check if we've reached 5 attempts - start cooldown
    else if (loginAttempts[currentIdentifier].count >= 5) {
      setCooldownTimer(60);

      // Start the cooldown timer
      const interval = setInterval(() => {
        setCooldownTimer(prevTime => {
          if (prevTime <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    // Save updated attempts back to localStorage
    localStorage.setItem('loginAttempts', JSON.stringify(loginAttempts));
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Check if we're in cooldown period
    if (cooldownTimer > 0) {
      setError(`Too many failed attempts. Please try again in ${cooldownTimer} seconds.`);
      setIsLoading(false);
      return;
    }

    if (!identifier || !password) {
      setError('Please enter both username/email and password');
      setIsLoading(false);
      return;
    }
    // Password regex validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,72}$/;
    if (!passwordRegex.test(password)) {
      setError('Password must include uppercase, lowercase, numbers, symbols, and be 6-72 characters long.');
      setIsLoading(false);
      return;
    }

    try {
      // Send login credentials to get OTP
      await sendLoginOtp({ identifier, password });
      setIsOtpSent(true);

      // On success, reset failed attempts for this identifier
      const loginAttempts = JSON.parse(localStorage.getItem('loginAttempts') || '{}');
      if (loginAttempts[identifier.trim().toLowerCase()]) {
        delete loginAttempts[identifier.trim().toLowerCase()];
        localStorage.setItem('loginAttempts', JSON.stringify(loginAttempts));
      }
    } catch (err) {
      // Track failed login attempt
      trackFailedLoginAttempt();

      setError(err.response?.data?.message || 'Please check your credentials.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!otp) {
      setError('Please enter the OTP sent to your email');
      setIsLoading(false);
      return;
    }

    try {
      // Verify OTP and complete login
      const response = await verifyLoginOtp({ identifier, otp });

      if (response && response.data && response.data.user && response.data.token) {
        // Store token and update auth state
        localStorage.setItem('authToken', response.data.token);

        // Call the onLogin callback with user data
        onLogin({
          user: response.data.user,
          token: response.data.token
        });

        // On success, reset failed attempts for this identifier
        const loginAttempts = JSON.parse(localStorage.getItem('loginAttempts') || '{}');
        if (loginAttempts[identifier.trim().toLowerCase()]) {
          delete loginAttempts[identifier.trim().toLowerCase()];
          localStorage.setItem('loginAttempts', JSON.stringify(loginAttempts));
        }
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
      console.error('OTP verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    window.location.href = 'http://localhost:3000/auth/google';
  };

  return (
    <form className="login-form" onSubmit={isOtpSent ? handleVerifyOtp : handleSendOtp}>
      <h2>Login</h2>
      {error && <p className="error-message">{error}</p>}
      {cooldownTimer > 0 && (
        <p className="cooldown-message">
          Too many failed attempts. Please try again in {cooldownTimer} seconds.
        </p>
      )}

      {!isOtpSent ? (
        // Step 1: Display username/password form
        <>
          <div className="form-group">
            <label>Email or Username:</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              placeholder="Enter your email or username"
              disabled={isLoading || cooldownTimer > 0}
            />
      </div>
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              disabled={isLoading || cooldownTimer > 0}
            />
          </div>
          <button
            type="submit"
            className="submit-button"
            disabled={isLoading || cooldownTimer > 0}
          >
            {isLoading ? 'Sending OTP...' : 'Login'}
          </button>
          <button
            type="button"
            className="google-login-button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            {isLoading ? 'Connecting...' : 'Login with Google'}
          </button>
        </>
      ) : (
        // Step 2: Display OTP verification form
        <>
          <p className="otp-message">An OTP has been sent to your email. Please enter it below to complete login.</p>
          <div className="form-group">
            <label>OTP:</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              placeholder="Enter the OTP from your email"
              disabled={isLoading}
            />
          </div>
          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </button>
          <button
            type="button"
            className="back-button"
            onClick={() => setIsOtpSent(false)}
            disabled={isLoading}
          >
            Back to Login
          </button>
        </>
      )}

      <div className="form-footer">
        <a href="#" onClick={(e) => { e.preventDefault(); onRegisterClick(); }}>
          Create New Account
        </a>
        <a href="#" onClick={(e) => { e.preventDefault(); onForgotPasswordClick(); }}>
          Forgot Password?
        </a>
      </div>
    </form>
  );
}

export default LoginForm;

