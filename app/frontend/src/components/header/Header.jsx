import { Link, NavLink } from 'react-router-dom';
import React, { useState } from 'react';
import userIcon from '../../assets/images/userIcon.png';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

function Header({ onLoginClick, isLoggedIn, userEmail, onLogoutClick }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [localState, setLocalState] = React.useState({ isLoggedIn, userEmail });
  const { user } = useAuth();

  // Debug log to see authentication state
  console.log('Header render - Auth state:', { isLoggedIn, userEmail });
  
  // Use useEffect to log when props change
  React.useEffect(() => {
    console.log('Header useEffect - Auth state updated:', { isLoggedIn, userEmail });
    setLocalState({ isLoggedIn, userEmail });
  }, [isLoggedIn, userEmail]);
  
  // Listen for auth state changed events
  React.useEffect(() => {
    const handleAuthStateChanged = (event) => {
      console.log('Header: Auth state changed event received:', event.detail);
      if (event.detail.user) {
        setLocalState({ 
          isLoggedIn: true, 
          userEmail: event.detail.user.username || event.detail.user.email 
        });
      }
    };
    
    window.addEventListener('auth-state-changed', handleAuthStateChanged);
    
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthStateChanged);
    };
  }, []);

  return (
    <header className="header">
      <h1>
        <Link to="/home" className="title">
          <img src="logo.png" height="35" alt="Logo" /> Soict Stock
        </Link>
      </h1>
      <nav className="nav-header">
        <ul>
          <li tabIndex="0" onClick={() => console.log('Home clicked')}>
            <NavLink to="/home" className="navbar__link">Home</NavLink>
          </li>
          <li tabIndex="0" onClick={() => console.log('Tutorial clicked')}>
            <NavLink to="/tutorial" className="navbar__link">Tutorial</NavLink>
          </li>
          {(isLoggedIn || localState.isLoggedIn) && (
            <>
              <li tabIndex="0" onClick={() => console.log('Trade clicked')}>
                <NavLink to="/trade" className="navbar__link">Trade</NavLink>
              </li>
              <li tabIndex="0" onClick={() => console.log('Portfolio clicked')}>
                <NavLink to="/portfolio" className="navbar__link">Portfolio</NavLink>
              </li>
              {user?.role === 'admin' && (
                <li tabIndex="0" onClick={() => console.log('Admin clicked')}>
                  <NavLink to="/admin" className="navbar__link">Admin</NavLink>
                </li>
              )}
            </>
          )}
        </ul>
      </nav>

      <nav className="nav-profile">
        {(isLoggedIn || localState.isLoggedIn) ? (
          <div
            className="profile"
            onMouseEnter={() => setMenuOpen(true)}
            onMouseLeave={() => setMenuOpen(false)}
          >
            <div className="user-info">
              <span className="user-icon">
                <img
                  src={userIcon}
                  alt="User"
                  className="user-icon"
                  style={{ width: '24px', height: '24px', verticalAlign: 'middle' }}
                />
              </span>              <span className="user-email">{userEmail || localState.userEmail}</span>
            </div>
            <div className={`dropdown-menu ${menuOpen ? 'show' : ''}`}>
              <button className="logout-button" onClick={onLogoutClick}>Logout</button>
            </div>
          </div>
        ) : (
          <button className="login-btn" onClick={onLoginClick}>Login</button>
        )}
      </nav>
    </header>
  );
}

export default Header;
