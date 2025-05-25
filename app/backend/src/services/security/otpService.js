import nodemailer from 'nodemailer';
import OTP from '../../models/otpModel.js';
import otpGenerator from 'otp-generator';

let cachedTestAccount = null;

async function getEtherealTransporter() {
  if (!cachedTestAccount) {
    cachedTestAccount = await nodemailer.createTestAccount();
  }
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: cachedTestAccount.user,
      pass: cachedTestAccount.pass,
    },
  });
}

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
    // Generate 8-character alphanumeric OTP using crypto
    const otp = otpGenerator.generate(8, {
      upperCaseAlphabets: true,
      lowerCaseAlphabets: true,
      digits: true,
      specialChars: false
    });
    const otpExpiration = Date.now() + 1 * 60 * 1000; // 1 minute from now

    // Save OTP to the database (in-memory)
    await OTP.save(normalizedEmail, otp, otpExpiration);

    console.log('Generated OTP:', { email: normalizedEmail, otp, otpExpiration });

    const transporter = await getEtherealTransporter();

    const mailOptions = {
      from: '"Soict Stock" <no-reply@soictstock.com>',
      to: email,
      subject: 'Soict Stock - Two-Factor Authentication (OTP) Verification',
      text: `Dear user,\n\nYour One-Time Password (OTP) for secure login to Soict Stock is: ${otp}\n\nThis OTP is valid for 1 minute.\n\nIf you did not request this, please ignore this email.\n\nThank you,\nSoict Stock Security Team`,
      html: `
        <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 24px; border-radius: 8px; max-width: 480px; margin: auto; color: #222;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #f0b90b; margin: 0;">Soict Stock</h2>
          </div>
          <h3 style="color: #222;">Two-Factor Authentication (OTP) Verification</h3>
          <p>Dear user,</p>
          <p>To complete your secure login to <b>Soict Stock</b>, please use the following One-Time Password (OTP):</p>
          <div style="font-size: 2rem; font-weight: bold; letter-spacing: 2px; color: #f0b90b; background: #222; padding: 12px 0; border-radius: 6px; text-align: center; margin: 16px 0;">${otp}</div>
          <p style="margin: 0 0 8px 0;">This OTP is valid for <b>1 minute</b>.</p>
          <p style="color: #888; font-size: 13px; margin: 0 0 16px 0;">If you did not request this OTP, please ignore this email or contact our support team immediately.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <div style="font-size: 13px; color: #888; text-align: center;">
            Thank you for choosing Soict Stock.<br />
            <span style="color: #f0b90b;">Soict Stock Security Team</span>
          </div>
        </div>
      `
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
    console.log('Verifying OTP:', { email: normalizedEmail, receivedOtp: otp, otpData });
    if (!otpData) {
      console.error('OTP not found for email:', normalizedEmail);
      throw new Error('OTP not found or expired. Please request a new OTP.');
    }
    const { otp: storedOtp, otp_expiration: otpExpiration } = otpData;
    if (storedOtp !== otp) {
      console.error('Incorrect OTP:', { receivedOtp: otp, storedOtp });
      throw new Error('Incorrect OTP. Please check and try again.');
    }
    if (Date.now() > otpExpiration) {
      console.error('OTP expired:', { now: Date.now(), otpExpiration });
      throw new Error('OTP has expired. Please request a new OTP.');
    }
    // Do not delete the OTP here; it will be deleted after the password is reset
    return { message: 'OTP verified successfully' };
  } catch (error) {
    console.error('Error in verifyOtpService:', error.message);
    throw new Error(error.message || 'Failed to verify OTP');
  }
};
