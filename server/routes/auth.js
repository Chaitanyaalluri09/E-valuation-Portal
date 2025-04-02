// server/routes/auth.js
const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const transporter = require('../utils/emailTransporter');

router.post('/login', async (req, res) => {
  try {
    const { email, password, userType } = req.body;
    
    const user = await User.findOne({ email, role: userType });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      token,
      user: {
        id: user._id,
        role: user.role,
        isFirstLogin: user.isFirstLogin
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in' });
  }
});

router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword, userId } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.isFirstLogin = false;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error changing password' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email, userType } = req.body;
    const user = await User.findOne({ email, role: userType });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to user document
    user.resetPasswordOTP = otp;
    user.resetPasswordExpiry = otpExpiry;
    await user.save();

    // Send OTP via email
    const emailText = `
      Your password reset OTP is: ${otp}
      This OTP will expire in 10 minutes.
      
      If you didn't request this password reset, please ignore this email.
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset OTP',
      text: emailText
    });

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending OTP' });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, userType } = req.body;
    const user = await User.findOne({ 
      email,
      role: userType,
      resetPasswordOTP: otp,
      resetPasswordExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying OTP' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword, userType } = req.body;
    const user = await User.findOne({ 
      email,
      role: userType,
      resetPasswordOTP: otp,
      resetPasswordExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Hash new password and update user
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password' });
  }
});

module.exports = router;