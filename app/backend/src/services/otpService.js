import nodemailer from 'nodemailer';
import OTP from '../models/otpModel.js';
// In-memory store for OTPs
const otpStore = {};

/**
 * Generate and send OTP to the user's email.
 * @param {string} email - The user's email address.
 */

export const sendOtpService = async (email) => {
  try {
    if (!email) {
      throw new Error('Email is required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiration = Date.now() + 10 * 60 * 1000; // 10 minutes from now

    // Save OTP to the database
    await OTP.save(normalizedEmail, otp, otpExpiration);

    console.log('Generated OTP:', { email: normalizedEmail, otp, otpExpiration });

    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'destini.bernhard6@ethereal.email',
        pass: 'XhD1ZbQQR8DsrtAqd3',
      },
    });

    const mailOptions = {
      from: '"My App" <no-reply@myapp.com>',
      to: email,
      subject: 'Your Password Reset OTP',
      text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));

    return { message: 'OTP sent successfully', previewUrl: nodemailer.getTestMessageUrl(info) };
  } catch (error) {
    console.error('Error in sendOtpService:', error.message);
    throw new Error('Failed to send OTP. Please try again.');
  }
};
export const verifyOtpService = async (email, otp) => {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const otpData = await OTP.findByEmail(normalizedEmail);

    console.log('Verifying OTP:', { email: normalizedEmail, otp, otpData });

    if (!otpData) {
      throw new Error('OTP not found or expired');
    }

    const { otp: storedOtp, otp_expiration: otpExpiration } = otpData;

    if (storedOtp !== otp || Date.now() > otpExpiration) {
      throw new Error('Invalid or expired OTP');
    }

    // Do not delete the OTP here; it will be deleted after the password is reset
    return { message: 'OTP verified successfully' };
  } catch (error) {
    console.error('Error in verifyOtpService:', error.message);
    throw new Error(error.message || 'Failed to verify OTP');
  }
};