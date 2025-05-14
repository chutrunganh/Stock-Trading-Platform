/**
 * Cookie Management Process:
 * 1. When new tokens are generated (login/refresh):
 *    - Old cookies are cleared first
 *    - New cookies are set with new tokens
 * 2. Session cookies:
 *    - No explicit expiry time (expires: false)
 *    - Automatically removed when browser closes
 * 3. Security features:
 *    - httpOnly: true (prevents JavaScript access)
 *    - secure: true in production (requires HTTPS)
 *    - sameSite: 'strict' (prevents CSRF)
 */



// Utility to set authentication cookies (access and refresh tokens)
export function setAuthCookies(res, accessToken, refreshToken) {
  console.log('Setting auth cookies:', {
    accessTokenExists: !!accessToken,
    refreshTokenExists: !!refreshToken,
    type: 'session cookies - will expire when browser closes'
  });

  // First clear any existing cookies
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  
  // Parse JWT expiration times for logging purposes
  try {
    // Decode tokens to get their actual expiration times
    const accessDecoded = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString());
    const refreshDecoded = JSON.parse(Buffer.from(refreshToken.split('.')[1], 'base64').toString());
    
    console.log('Setting new cookies with token expiration times:', {
      accessTokenExp: new Date(accessDecoded.exp * 1000).toISOString(),
      refreshTokenExp: new Date(refreshDecoded.exp * 1000).toISOString(),
      operation: 'Cleared old cookies and setting new ones'
    });
  } catch (error) {
    console.warn('Could not parse token expiration times');
  }
  
  // Set new cookies
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: false, // Session cookie - expires when browser closes
    sameSite: 'strict',
  });
  
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: false, // Session cookie - expires when browser closes
    sameSite: 'strict',
  });
}



/**
 *
 * Let me explain the relationship between JWT token expiration and cookie expiration times:
 * 1. Cookie Time > JWT Time (e.g., Cookie: 15min, JWT: 1min):
 *  - The cookie will still exist in the browser but contains an expired JWT
 *  - This is actually OK and common because:
 *  - When the JWT expires (after 1min), the refresh mechanism kicks in
 *  - The refresh token cookie (which is still valid) is used to get a new access token
 *  -> The system continues working smoothly
 * 
 */