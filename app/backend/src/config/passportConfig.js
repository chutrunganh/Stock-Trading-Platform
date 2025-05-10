/**
 * @file passportConfig.js
 * @description Configuration for Passport dependencies, which is a NodeJS package that provides authentication with SSO (Single Sign-On). In
 * our case, we use Google SSO authentication. The user can login with their Google account and the system will 
 * create a new user in the database (or merge with existing user if the email is already used).
 * 
 * This file will read configuration from the .env file, including:
 * - GOOGLE_CLIENT_ID: The client ID for Google OAuth 2.0.
 * - GOOGLE_CLIENT_SECRET: The client secret for Google OAuth 2.0.
 * - GOOGLE_CALLBACK_URL: The callback URL for Google OAuth 2.0.
 * - GOOGLE_SCOPE: The scope of access requested from Google, including profile and email information.
 * - GOOGLE_PROMPT: The prompt behavior for Google sign-in, such as 'select_account' to force account selection.
 */
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' }); // Adjust based on relative depth
import { getUserByIdService, findOrCreateGoogleUserService  } from '../services/userCRUDService.js';


// Configure Google OAuth 2.0 strategy
const configurePassport = () => {
  // Construct the full callback URL based on environment
  const callbackURL = new URL(process.env.GOOGLE_CALLBACK_URL, process.env.BE_URL).toString();
  console.log('Google OAuth callback URL:', callbackURL);
  
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: callbackURL,
        scope: ['profile', 'email']
      },      async (accessToken, refreshToken, profile, done) => {
        try {
          // Extract user information from Google profile
          const email = profile.emails[0].value;
          // Use email prefix as username (part before the @)
          const username = email.split('@')[0];
          
          const userData = {
            google_id: profile.id,
            email: email,
            username: username
          };

          // Find or create user based on Google ID
          const user = await findOrCreateGoogleUserService(userData);
          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );

  // Serialize user into the session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from the session
  passport.deserializeUser(async (id, done) => {
    try {
      // Use your existing service to find user by ID
      const user = await getUserByIdService(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  return passport;
};

export default configurePassport;