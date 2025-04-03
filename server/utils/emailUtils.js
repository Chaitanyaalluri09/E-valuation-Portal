const transporter = require('./emailTransporter');

const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Email Verification OTP',
    html: `
      <h1>Email Verification</h1>
      <p>Your OTP for email verification is: <strong>${otp}</strong></p>
      <p>This OTP will expire in 10 minutes.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = { sendOTPEmail, generateOTP }; 