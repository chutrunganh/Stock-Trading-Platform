/**
 * App.jsx: Defines the main application component for the frontend.
 * Sets up routing, authentication context, and main layout structure.
 */
import { useState, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

// Components
import Header from './components/header/Header';
import Modal from './components/Modal';
import Footer from './components/footer/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home/Home';
import Trade from './pages/Trade';
import Portfolio from './pages/Portfolio';
import Tutorial from './pages/Tutorial';

// Forms
import LoginForm from './components/forms/LoginForm';
import RegisterForm from './components/forms/RegisterForm';
import ForgotPasswordForm from './components/forms/ForgotPasswordForm';

// Auth Context
import { useAuth } from './context/AuthContext';

// Styles
import './styles/App.css';

function App() {
    // State for modals
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

    // Get auth context
    const { user, isAuthenticated, logout, login } = useAuth();
    const location = useLocation();    // Check for auth message from redirects
    useEffect(() => {
        if (location.state?.authMessage) {
            // Could show a notification here
            console.log(location.state.authMessage);
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
    };    // Define the onLogin function
    const handleLogin = (userData) => {
        if (userData.user && userData.token) {
            // If we receive the {user, token} format (from Google login)
            login(userData); // AuthContext's login will handle setting the user
        } else {
            // If we receive just the user data
            login({ user: userData }); // Wrap it in the expected format
        }
        setShowLoginModal(false); // Close the login modal
    };

    return (
        <div className="App">
            <Header 
                onLoginClick={handleOpenLoginModal} 
                isLoggedIn={isAuthenticated}
                userEmail={user?.username || user?.email}
                onLogoutClick={logout}
            />
            
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
                    <Route path="/" element={<Home />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/trade" element={<Trade />} />
                    <Route 
                        path="/portfolio" 
                        element={
                            <ProtectedRoute>
                                <Portfolio />
                            </ProtectedRoute>
                        } 
                    />
                    <Route path="/tutorial" element={<Tutorial />} />
                </Routes>
            </main>
            
            <Footer />  
        </div>
    );
}

export default App;
