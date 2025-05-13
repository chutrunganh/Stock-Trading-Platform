// Utility to set authentication cookies (access and refresh tokens)
export function setAuthCookies(res, accessToken, refreshToken) {
  console.log('Setting auth cookies:', {
    accessTokenExists: !!accessToken,
    refreshTokenExists: !!refreshToken
  });
  
  // Convert environment variable to milliseconds or use 1 minute default
  const accessExpiry = process.env.JWT_ACCESS_EXPIRES_IN ? 
    parseInt(process.env.JWT_ACCESS_EXPIRES_IN) * 60 * 1000 : // If set in minutes
    60 * 1000; // Default 1 minute
    
  const refreshExpiry = process.env.JWT_REFRESH_EXPIRES_IN ?
    parseInt(process.env.JWT_REFRESH_EXPIRES_IN) * 24 * 60 * 60 * 1000 : // If set in days
    7 * 24 * 60 * 60 * 1000; // Default 7 days
  
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: accessExpiry,
    sameSite: 'strict',
  });
  
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: refreshExpiry,
    sameSite: 'strict',
  });
} 