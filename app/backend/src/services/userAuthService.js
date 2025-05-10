// Create JWT token with user info, login timestamp, and secret key from environment variables
const token = jwt.sign(
  {
    ...userForToken,
    login_at: Date.now()
  },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
); 