// Utility to set authentication cookies (access and refresh tokens)
export function setAuthCookies(res, accessToken, refreshToken) {
  console.log('Setting auth cookies:', {
    accessTokenExists: !!accessToken,
    refreshTokenExists: !!refreshToken
  });
  
  // Parse JWT expiration times
  let accessExpiry;
  let refreshExpiry;
  
  try {
    // Decode tokens to get their actual expiration times
    const accessDecoded = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString());
    const refreshDecoded = JSON.parse(Buffer.from(refreshToken.split('.')[1], 'base64').toString());
    
    // Calculate remaining time from exp claim
    accessExpiry = (accessDecoded.exp * 1000) - Date.now();
    refreshExpiry = (refreshDecoded.exp * 1000) - Date.now();
    
    console.log('Token expiration times:', {
      accessTokenExp: new Date(accessDecoded.exp * 1000).toISOString(),
      refreshTokenExp: new Date(refreshDecoded.exp * 1000).toISOString(),
      accessExpiryMs: accessExpiry,
      refreshExpiryMs: refreshExpiry
    });
  } catch (error) {
    // Fallback to default values if token parsing fails
    console.warn('Could not parse token expiration times, using defaults');
    accessExpiry = 60 * 1000; // 1 minute
    refreshExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days
  }
  
  // Add a small buffer to cookie expiry (30 seconds) to ensure smooth token refresh
  const cookieBuffer = 30 * 1000; // 30 seconds

  // Return two cookies, one for the access token and one for the refresh token
  
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: accessExpiry + cookieBuffer, // JWT expiry + 30 seconds
    sameSite: 'strict',
  });
  
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: refreshExpiry + cookieBuffer, // JWT expiry + 30 seconds
    sameSite: 'strict',
  });
} 


/**
 * Why add 30 seconds
 * 
 * Let me explain the relationship between JWT token expiration and cookie expiration times:
 * 1. Cookie Time > JWT Time (e.g., Cookie: 15min, JWT: 1min):
 *  - The cookie will still exist in the browser but contains an expired JWT
 *  - This is actually OK and common because:
 *  - When the JWT expires (after 1min), the refresh mechanism kicks in
 *  - The refresh token cookie (which is still valid) is used to get a new access token
 *  -> The system continues working smoothly
 * 
 * 2. Cookie Time < JWT Time (e.g., Cookie: 1min, JWT: 15min):
 *  - This is problematic because:
 *  - The cookie disappears while the JWT is still technically valid
 *  - The client loses the token before it expires
 *  - Forces unnecessary re-authentication
 *  - Could cause unexpected session termination
 * 
 * Therefore, we add 30 seconds buffer to the cookie expiration time to ensure it not expired before the JWT it contains
 */