import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile, sendLoginOtp, loginUser } from '../../api/user';
import './LoginForm.css';
import OtpForm from './OtpForm.jsx';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

// Add this at the top, after other imports
const SITE_KEY = import.meta.env.VITE_SITE_KEY;

/**
 * Note on FingerprintJS Implementation:
 * We are using the open-source version of FingerprintJS for basic device fingerprinting.
 * This provides a visitorId which is a fingerprint hash with some limitations:
 * - Lower accuracy (40-60%)
 * - May change after a few weeks
 * - Possible collisions between similar devices
 * - Can be spoofed as it's client-side
 * 
 * The confidence score from FingerprintJS helps determine the reliability of the fingerprint.
 * Score ranges from 0 to 1, where higher values indicate more reliable identification.
 */

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
  const [fpPromise, setFpPromise] = useState(null);
  const [visitorId, setVisitorId] = useState(null);
  const [fingerprintConfidence, setFingerprintConfidence] = useState(null);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [warning, setWarning] = useState('');

  console.log('Turnstile SITE_KEY:', SITE_KEY);

  // Initialize FingerprintJS with debug mode in development
  useEffect(() => {
    setFpPromise(
      FingerprintJS.load({
        debug: import.meta.env.MODE === 'development',
      })
    );
  }, []);

  // Function to get fingerprint with confidence check
  const getFingerprint = async () => {
    if (!fpPromise) return null;
    
    try {
      const fp = await fpPromise;
      const result = await fp.get();
      
      // Store both the visitorId and confidence score
      setVisitorId(result.visitorId);
      setFingerprintConfidence(result.confidence);

      // Log components in development mode
      if (import.meta.env.MODE === 'development') {
        console.log('Fingerprint components:', FingerprintJS.componentsToDebugString(result.components));
      }

      return {
        visitorId: result.visitorId,
        confidence: result.confidence
      };
    } catch (error) {
      console.error('Error getting fingerprint:', error);
      return null;
    }
  };

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

    if (import.meta.env.MODE === 'production' && !turnstileToken) {
      setError('Please complete the CAPTCHA verification first');
      setIsLoading(false);
      return;
    }

    try {
      // Get fingerprint with confidence check
      const fingerprintResult = await getFingerprint();
      
      // Always send the fingerprint data if available, even if confidence is low
      // The backend will decide what to do with it based on its own threshold
      const response = await loginUser({ 
        identifier, 
        password, 
        turnstileToken,
        visitorId: fingerprintResult ? fingerprintResult.visitorId : null,
        fingerprintConfidence: fingerprintResult && fingerprintResult.confidence ? fingerprintResult.confidence.score : null
      });

      // If we get a token back, it means 2FA was skipped (remembered device)
      if (response.data.token) {
        console.log('Login successful - 2FA skipped (device remembered):', {
          tokenReceived: !!response.data.token,
          tokenLength: response.data.token?.length,
          userReceived: !!response.data.user
        });
        
        // If there's a warning, show it to the user
        if (response.data.warning) {
          // Show warning but still proceed with login
          console.warn('Device fingerprint warning:', response.data.warning);
          setWarning(response.data.warning);
        }
        // Call onLogin with the full user/token object (this will call AuthContext.login)
        onLogin({ user: response.data.user, token: response.data.token });
        return;
      }

      // Only proceed to OTP step if backend says so
      if (response?.data?.step === 'otp') {
        console.log('OTP verification required - proceeding to OTP step');
        setOtpPreviewUrl(response.data.previewUrl || '');
        setStep(2);
        // Do NOT call onLogin or login here!
      } else {
        console.error('Unexpected server response:', response.data);
        setError('Unexpected response from server.');
      }
    } catch (err) {
      handleLoginError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginError = (err) => {
    if (err.response?.data?.error?.includes('timeout-or-duplicate')) {
      setError('CAPTCHA expired or already used. Please complete the CAPTCHA again.');
    } else if (err.response?.data?.message) {
      setError(err.response.data.message);
    } else {
      setError('Login failed. Please try again.');
    }
  };

  // Handler for OTP form submission
  const handleOtpSubmit = async ({ identifier, otp }) => {
    setError('');
    setIsLoading(true);
    try {
      const result = await loginUser({ 
        identifier, 
        password, 
        turnstileToken, 
        otp,
        visitorId,
        rememberDevice,
        fingerprintConfidence: fingerprintConfidence ? fingerprintConfidence.score : null
      });
      
      // If there's a warning, show it to the user
      if (result.data && result.data.warning) {
        // Show warning but still proceed with login
        console.warn('Device fingerprint warning:', result.data.warning);
        setWarning(result.data.warning);
      }
      
      // Check if we have user and token in the response
      if (result.data && result.data.user && result.data.token) {
        console.log('OTP verification successful - Login completed:', {
          tokenReceived: !!result.data.token,
          tokenLength: result.data.token?.length,
          userReceived: !!result.data.user
        });
        
        onLogin({ 
          user: result.data.user, 
          token: result.data.token 
        });
      } else {
        console.error('Invalid server response:', result);
        setError('Invalid server response. Missing user or token data.');
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setError(err.response?.data?.message || err.message || 'Invalid OTP. Please try again.');
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
        {warning && <p className="warning-message" style={{ color: '#f0b90b' }}>{warning}</p>}

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
        warning={warning}
        onResend={handleResendOtp}
        rememberDevice={rememberDevice}
        onRememberDeviceChange={(e) => setRememberDevice(e.target.checked)}
      />
    )
  );
}

export default LoginForm;
