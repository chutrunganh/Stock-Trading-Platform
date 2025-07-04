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
 * 
 * 
 * We return the access token and refresh token in cookies to the client. (Although it is more recommended to store the refresh token in localStorage)
 */



// Utility to set authentication cookies (access and refresh tokens)
export function setAuthCookies(res, accessToken, refreshToken) {
  console.log('Setting auth cookies:', {
    accessTokenExists: !!accessToken,
    refreshTokenExists: !!refreshToken,
    type: 'session cookies - will expire when browser closes'
  });

  if (accessToken) {
    // Clear and set new access token cookie
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    // Parse JWT expiration time for logging
    try {
      const accessDecoded = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString());
      console.log('Setting new access token cookie with expiration time:', {
        accessTokenExp: new Date(accessDecoded.exp * 1000).toISOString(),
        operation: 'Cleared old access token cookie and setting new one'
      });
    } catch (error) {
      console.warn('Could not parse access token expiration time');
    }

    // Set new access token cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: false, // Session cookie - expires when browser closes
      sameSite: 'strict',
    });
  }

  if (refreshToken) {
    // Clear and set new refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    // Parse JWT expiration time for logging
    try {
      const refreshDecoded = JSON.parse(Buffer.from(refreshToken.split('.')[1], 'base64').toString());
      console.log('Setting new refresh token cookie with expiration time:', {
        refreshTokenExp: new Date(refreshDecoded.exp * 1000).toISOString(),
        operation: 'Cleared old refresh token cookie and setting new one'
      });
    } catch (error) {
      console.warn('Could not parse refresh token expiration time');
    }

    // Set new refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: false, // Session cookie - expires when browser closes
      sameSite: 'strict',
    });
  }
}
