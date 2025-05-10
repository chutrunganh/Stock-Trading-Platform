import React, { useState } from 'react';
import LoginForm from '../components/forms/LoginForm';
import axios from 'axios';

const LoginPage = () => {
  const [loginData, setLoginData] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle login form submit
  const handleLogin = async ({ identifier, password, turnstileToken }) => {
    setLoading(true);
    setLoginError('');
    try {
      // Authenticate username/password
      const res = await axios.post('/api/login', { identifier, password, turnstileToken });
      // Set auth state, store token, redirect, etc.
      if (res.data && res.data.data && res.data.data.token) {
        localStorage.setItem('authToken', res.data.data.token);
        // Optionally set user info in context or redirect
        // window.location.href = '/dashboard';
      }
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div>
      <LoginForm onLogin={handleLogin} />
    </div>
  );
};

export default LoginPage; 