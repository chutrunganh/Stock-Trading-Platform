import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile, sendLoginOtp, verifyLoginOtp, loginUser } from '../../api/user';
import './LoginForm.css';
import OtpForm from './OtpForm.jsx';

// Add this at the top, after other imports
const SITE_KEY = import.meta.env.VITE_SITE_KEY;

function LoginForm({ onLogin, onRegisterClick, onForgotPasswordClick }) {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileWidgetRef = useRef(null);
  const [step, setStep] = useState(1); // 1: credentials, 2: OTP
  const [otpPreviewUrl, setOtpPreviewUrl] = useState('');

  console.log('Turnstile SITE_KEY:', SITE_KEY);

  // Dynamically load Turnstile script and render widget
  useEffect(() => {
    let script;

    function renderTurnstile() {
      if (window.turnstile && turnstileWidgetRef.current && SITE_KEY) {
        // Always clear before rendering
        turnstileWidgetRef.current.innerHTML = '';
        window.turnstile.render(turnstileWidgetRef.current, {
          sitekey: SITE_KEY,
          size: 'flexible',
          theme: 'light',
          callback: (token) => {
            setTurnstileToken(token);
          },
          'error-callback': () => setTurnstileToken(''),
          'expired-callback': () => setTurnstileToken(''),
        });
      }
    }

    if (!document.getElementById('cf-turnstile-script')) {
      script = document.createElement('script');
      script.id = 'cf-turnstile-script';
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      script.onload = renderTurnstile;
      document.body.appendChild(script);
    } else {
      renderTurnstile();
    }

    return () => {
      if (turnstileWidgetRef.current) {
        turnstileWidgetRef.current.innerHTML = '';
      }
    };
  }, []);

  useEffect(() => {
    const handleGoogleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      
      // Check if we're returning from Google authentication
      const isGoogleLoginFlow = sessionStorage.getItem('googleLoginInProgress') === 'true';
      
      // Handle success case
      if (urlParams.has('login') && urlParams.get('login') === 'success') {
        const token = urlParams.get('token');
        setIsLoading(true);
        try {
          console.log('Google login successful, processing token...');
          
          // Clear the Google login flag
          sessionStorage.removeItem('googleLoginInProgress');
          
          // Store token in localStorage
          localStorage.setItem('authToken', token);
          
          // Get user profile
          const data = await getUserProfile();
          
          if (data.status === 200 && data.data && data.data.user) {
            console.log('User profile fetched successfully');
            
            // Clean up URL parameters to avoid issues with browser history
            window.history.replaceState({}, document.title, window.location.pathname);

            // Prepare login data
            const loginData = {
              user: data.data.user,
              token: token
            };
              // Use the auth context's login method directly instead of just calling onLogin
            // This ensures the auth context is properly updated
            await login(loginData);
            
            // Force the header to update immediately by dispatching the custom event directly
            window.dispatchEvent(new CustomEvent('auth-state-changed', { 
              detail: { user: data.data.user, isAuthenticated: true }
            }));
            
            // Then call onLogin to close the modal and update UI
            setTimeout(() => {
              onLogin(loginData);
            }, 100);
          } else {
            console.error('Failed to get user profile:', data);
            setError('Failed to get user profile. Please try again.');
          }
        } catch (err) {
          setError('Google login failed. Please try again.');
          console.error('Google login error:', err);
        } finally {
          setIsLoading(false);
        }
      }
      // Handle error case
      else if (urlParams.has('error')) {
        const errorMsg = urlParams.get('error');
        console.error('Google login error from URL:', errorMsg);
        setError(decodeURIComponent(errorMsg) || 'Google login failed. Please try again.');
        
        // Clean up URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    handleGoogleCallback();
  }, [onLogin]);

 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    if (!identifier || !password) {
      setError('Please enter both username/email and password');
      setIsLoading(false);
      return;
    }
    if (!turnstileToken) {
      setError('Please complete the CAPTCHA verification first');
      setIsLoading(false);
      return;
    }
    try {
      // Step 1: Validate credentials (but do not log in yet)
      const response = await loginUser({ identifier, password, turnstileToken });
      // Only proceed to OTP step if backend says so
      if (response && response.data && response.data.step === 'otp') {
        setOtpPreviewUrl(response.data.previewUrl || '');
        setStep(2); // Move to OTP step
      } else {
        setError('Unexpected response from server.');
      }
    } catch (err) {
      if (err.response?.data?.error?.includes('timeout-or-duplicate')) {
        setError('CAPTCHA expired or already used. Please complete the CAPTCHA again.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for OTP form submission
  const handleOtpSubmit = async ({ identifier, otp }) => {
    setError('');
    setIsLoading(true);
    try {
      const result = await loginUser({ identifier, password, turnstileToken, otp });
      // Complete login
      onLogin(result.data);
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler to resend OTP
  const handleResendOtp = async () => {
    setError('');
    setIsLoading(true);
    try {
      const response = await sendLoginOtp(identifier);
      console.log('Resend OTP response:', response); // Debug the response structure
      
      // Extract the previewUrl from the correct location in the response
      // Backend structure: { status, message, data: { previewUrl } }
      if (response && response.data && response.data.previewUrl) {
        setOtpPreviewUrl(response.data.previewUrl);
        console.log('Updated OTP Preview URL:', response.data.previewUrl);
      } else {
        console.warn('OTP response missing previewUrl:', response);
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    try {
      setIsLoading(true);
      console.log('Redirecting to Google login...');
      
      // Use correct URL path for Google authentication
      window.location.href = '/api/auth/google';
      
      // Add visual feedback that we're redirecting
      setError('');
      const googleRedirectTimeout = setTimeout(() => {
        // If we're still on this page after 5 seconds, show an error
        setError('Google login is taking longer than expected. Please try again.');
        setIsLoading(false);
      }, 5000);
      
      // Clear timeout if component unmounts
      return () => clearTimeout(googleRedirectTimeout);
    } catch (err) {
      console.error('Failed to redirect to Google login:', err);
      setError('Failed to start Google login. Please try again.');
      setIsLoading(false);
    }
  };

  
  return (
    step === 1 ? (
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Login</h2>
        {error && <p className="error-message">{error}</p>}

        <div className="form-group">
          <label>Email or Username:</label>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            placeholder="Enter your email or username"
            disabled={isLoading}
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
            disabled={isLoading}
          />
        </div>

        <div style={{ display: 'block', flexFlow: 'row' }}>
          {!SITE_KEY && (
            <div style={{ color: 'red', fontWeight: 'bold' }}>
              Warning: Turnstile SITE_KEY is missing or invalid! Check your .env and restart the dev server.
            </div>
          )}
          <div className="turnstile-container" ref={turnstileWidgetRef}></div>
        </div>

        <button type="submit" className="submit-button" disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Login'}
        </button>
        <button
          type="button"
          className="google-login-button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          {isLoading ? 'Connecting...' : 'Login with Google'}
        </button>
        <div className="form-footer">
          <a href="#" onClick={(e) => { e.preventDefault(); onRegisterClick(); }}>
            Create New Account
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); onForgotPasswordClick(); }}>
            Forgot Password?
          </a>
        </div>
      </form>
    ) : (
      <OtpForm
        onSubmit={handleOtpSubmit}
        identifier={identifier}
        previewUrl={otpPreviewUrl}
        isLoading={isLoading}
        error={error}
        onResend={handleResendOtp}
      />
    )
  );
}

export default LoginForm;
