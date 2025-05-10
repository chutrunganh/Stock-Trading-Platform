import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: '../../../../.env' })

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Verifies a Cloudflare Turnstile token using the siteverify API.
 * @param {string} token - The token from the client (cf-turnstile-response).
 * @param {string} remoteip - (Optional) The user's IP address.
 * @returns {Promise<object>} The verification result from Cloudflare.
 */
export async function verifyTurnstileToken(token, remoteip) {
  if (!TURNSTILE_SECRET_KEY) {
    throw new Error('TURNSTILE_SECRET_KEY is not set in environment variables');
  }
  if (!token) {
    throw new Error('No Turnstile token provided');
  }
  try {
    const payload = {
      secret: TURNSTILE_SECRET_KEY,
      response: token,
    };
    if (remoteip) payload.remoteip = remoteip;
    const response = await axios.post(VERIFY_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  } catch (error) {
    return {
      success: false,
      error: error.message,
      details: error.response?.data || null,
    };
  }
} 