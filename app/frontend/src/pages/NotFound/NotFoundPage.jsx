import React from 'react';

export default function NotFoundPage() {
  return (
    <div style={{ textAlign: 'center', marginTop: 60 }}>
      <div style={{ fontSize: '5rem', marginBottom: 20, lineHeight: 1 }}>
      ⚠️
      </div>
      <h1 style={{ fontSize: '2.5rem', color: '#f0b90b' }}>404 - Page Not Found</h1>
      <p style={{ color: '#fff', fontSize: '1.2rem', marginTop: 20 }}>
        The page you are looking for does not exist or you do not have access.<br />
        <a href="/home" style={{ color: '#f0b90b', textDecoration: 'underline' }}>Return to Home</a>
      </p>
    </div>
  );
} 