/**
 * App.jsx: Defines the main application component for the frontend.
 * Sets up routing, authentication context, and main layout structure.
 */
import { useState, useEffect } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';

// Components
import Header from './components/header/Header';
import AnnouncementBanner from './components/header/AnnouncementBanner';
import Modal from './components/Modal';
import Footer from './components/footer/Footer';
import RoleProtectedRoute from './components/RoleProtectedRoute';

// Pages
import Home from './pages/Home/Home';
import Trade from './pages/Trade/Trade';
import Portfolio from './pages/Portfolio/Portfolio';
import Tutorial from './pages/Tutorial/Tutorial';
import AdminPage from './pages/Admin/Admin';
import NotFoundPage from './pages/NotFound/NotFoundPage';

// Forms
import LoginForm from './components/forms/LoginForm';
import RegisterForm from './components/forms/RegisterForm';
import ForgotPasswordForm from './components/forms/ForgotPasswordForm';

// Auth Context
import { useAuth } from './context/AuthContext';
import { TradingSessionProvider } from './context/TradingSessionContext';

// Styles
import './styles/App.css';

function App() {
    // State for modals
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);    // Get auth context
    const { user, isAuthenticated, logout, login } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
      // Debug log for authentication state
    console.log('App render - Auth state:', { user, isAuthenticated });
      // Effect to respond to auth state changes
    useEffect(() => {
        console.log('App useEffect - Auth state changed:', { user, isAuthenticated });
        // Force update when auth state changes
        setForceUpdate(prev => prev + 1);
    }, [user, isAuthenticated]);
    
    // Listen for auth state changed events
    useEffect(() => {
        const handleAuthStateChanged = (event) => {
            console.log('App: Auth state changed event received:', event.detail);
            // Force rerender
            setForceUpdate(prev => prev + 1);
        };
        
        window.addEventListener('auth-state-changed', handleAuthStateChanged);
        
        return () => {
            window.removeEventListener('auth-state-changed', handleAuthStateChanged);
        };
    }, []);
      // Check for auth message from redirects or URL parameters
    useEffect(() => {
        // Check for auth message in location state
        if (location.state?.authMessage) {
            // Could show a notification here
            console.log(location.state.authMessage);
        }
          // Check for Google login success in URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('login') && urlParams.get('login') === 'success') {
            console.log('App detected Google login success from URL parameters');
            
            // Instead of showing the login modal, process the Google callback directly
            const token = urlParams.get('token');
            if (token) {
                handleGoogleAuth(token);
            }
        }

        // Add event listener for opening login modal after registration
        const openLoginHandler = () => {
            setShowLoginModal(true);
        };
        document.addEventListener('openLoginModal', openLoginHandler);

        // Cleanup
        return () => {
            document.removeEventListener('openLoginModal', openLoginHandler);
        };
    }, [location]);

    // Modal handlers
    const handleOpenLoginModal = () => {
        setShowLoginModal(true);
    };

    const handleOpenRegisterModal = () => {
        setShowLoginModal(false);
        setShowRegisterModal(true);
    };

    const handleOpenForgotPasswordModal = () => {
        setShowLoginModal(false);
        setShowForgotPasswordModal(true);
    };

    const handleCloseAllModals = () => {
        setShowLoginModal(false);
        setShowRegisterModal(false);
        setShowForgotPasswordModal(false);
    };    // Function to handle Google authentication without showing the login modal
    const handleGoogleAuth = async (token) => {
        try {
            console.log('App: Processing Google authentication with token');
            
            // Store token in localStorage
            localStorage.setItem('authToken', token);
            
            // Import API functions
            const { getUserProfile } = await import('./api/user');
            
            // Get user profile data
            const response = await getUserProfile();
            
            if (response && response.status === 200 && response.data && response.data.user) {
                // Clean up URL parameters
                window.history.replaceState({}, document.title, window.location.pathname);
                
                // Prepare login data
                const loginData = {
                    user: response.data.user,
                    token: token
                };
                
                // Use Auth context to log in
                await login(loginData);
                
                // Dispatch custom event to update UI components
                window.dispatchEvent(new CustomEvent('auth-state-changed', { 
                    detail: { user: response.data.user, isAuthenticated: true }
                }));
                
                // Force UI update
                setForceUpdate(prev => prev + 1);
            } else {
                console.error('Failed to get user profile from token');
            }
        } catch (err) {
            console.error("Google auth processing error:", err);
        }
    };

    // Define the onLogin function for regular login
    const handleLogin = async (userData) => {
        try {
            console.log("App: Login successful, userData received:", userData);
            // Use Auth context to log in (this updates the global state)
            await login(userData);
            // Close the login modal
            setShowLoginModal(false);
            // No need to force update, AuthContext will trigger re-render
        } catch (err) {
            console.error("Login error in App:", err);
        }
    };
    
    // Add a state variable to force re-render when auth state changes
    const [_forceUpdate, setForceUpdate] = useState(0);

    return (
        <TradingSessionProvider>
            <div className="App">                <Header 
                    onLoginClick={handleOpenLoginModal} 
                    isLoggedIn={isAuthenticated}
                    userEmail={user?.username || user?.email}
                    onLogoutClick={() => {
                        logout();
                        navigate('/home');
                    }}
                />
                <AnnouncementBanner />
                
                {/* Authentication Modals */}
                <Modal isOpen={showLoginModal} onClose={handleCloseAllModals}>
                    <LoginForm 
                        onLogin={handleLogin} // Pass the onLogin function here
                        onRegisterClick={handleOpenRegisterModal}
                        onForgotPasswordClick={handleOpenForgotPasswordModal}
                    />
                </Modal>
                
                <Modal isOpen={showRegisterModal} onClose={handleCloseAllModals}>
                    <RegisterForm onClose={handleCloseAllModals} />
                </Modal>
                
                <Modal isOpen={showForgotPasswordModal} onClose={handleCloseAllModals}>
                    <ForgotPasswordForm onClose={handleCloseAllModals} />
                </Modal>
                
                {/* Routes */}
                <main className="main-content">
                    <Routes>
                        {/* Public Routes (no requiredRole) */}
                        <Route path="/" element={<Home />} />
                        <Route path="/home" element={<Home />} />
                        <Route path="/tutorial" element={<Tutorial />} />

                        {/* Protected Routes (requires login) */}
                        <Route 
                            path="/trade" 
                            element={
                                <RoleProtectedRoute requiredRole="user">
                                    <Trade />
                                </RoleProtectedRoute>
                            } 
                        />
                        <Route 
                            path="/portfolio" 
                            element={
                                <RoleProtectedRoute requiredRole="user">
                                    <Portfolio />
                                </RoleProtectedRoute>
                            } 
                        />

                        {/* Admin Routes (requires admin role) */}
                        <Route 
                            path="/admin" 
                            element={
                                <RoleProtectedRoute requiredRole="admin">
                                    <AdminPage />
                                </RoleProtectedRoute>
                            } 
                        />
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </main>
                
                <Footer />  
            </div>
        </TradingSessionProvider>
    );
}

export default App;
