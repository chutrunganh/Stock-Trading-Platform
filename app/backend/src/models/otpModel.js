// In-memory OTP store
const otpStore = {};
const MAX_OTPS = 1000;

class OTP {
  static async save(email, otp, otpExpiration) {
    // Clean up expired OTPs and limit store size
    OTP.cleanup();
    otpStore[email] = { otp, otp_expiration: otpExpiration };
  }

  static async findByEmail(email) {
    OTP.cleanup();
    const entry = otpStore[email];
    if (!entry) return null;
    // If expired, delete and return null
    if (Date.now() > entry.otp_expiration) {
      delete otpStore[email];
      return null;
    }
    return entry;
  }

  static async deleteByEmail(email) {
    delete otpStore[email];
  }

  // Remove expired OTPs and limit store size
  static cleanup() {
    const now = Date.now();
    // Remove expired
    for (const [email, entry] of Object.entries(otpStore)) {
      if (now > entry.otp_expiration) {
        delete otpStore[email];
      }
    }
    // Limit size
    const emails = Object.keys(otpStore);
    if (emails.length > MAX_OTPS) {
      // Remove oldest
      const sorted = emails.sort((a, b) => otpStore[a].otp_expiration - otpStore[b].otp_expiration);
      for (let i = 0; i < emails.length - MAX_OTPS; i++) {
        delete otpStore[sorted[i]];
      }
    }
  }
}

export default OTP;