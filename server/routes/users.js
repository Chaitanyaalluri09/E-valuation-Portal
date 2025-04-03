const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Subject = require('../models/Subject');
const bcrypt = require('bcryptjs');
const { verifyToken, isAdmin } = require('../middleware/auth');
const userController = require('../controllers/userController');
const { sendOTPEmail, generateOTP } = require('../utils/emailUtils');

// Non-admin routes first
// Get current user route
router.get('/me', verifyToken, userController.getCurrentUser);

// Update own profile (for evaluators)
router.put('/update-profile', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { username, email, password, subjects } = req.body;
    
    // Check if username or email is already taken by another user
    if (username || email) {
      const existingUser = await User.findOne({
        _id: { $ne: userId },
        $or: [
          { username: username },
          { email: email }
        ]
      });
      
      if (existingUser) {
        return res.status(400).json({ 
          message: 'Username or email already in use by another account' 
        });
      }
    }

    // Prepare update data
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (subjects) updateData.subjects = subjects;
    
    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        username: updatedUser.username,
        email: updatedUser.email,
        subjects: updatedUser.subjects || []
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Update password
router.put('/update-password', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Error updating password' });
  }
});

// Email update routes
router.post('/request-email-update', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { newEmail } = req.body;

    // Check if email is already in use
    const existingUser = await User.findOne({
      _id: { $ne: userId },
      email: newEmail
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'Email already in use by another account'
      });
    }

    // Generate and save OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await User.findByIdAndUpdate(userId, {
      emailUpdateOTP: otp,
      emailUpdateExpiry: otpExpiry,
      pendingEmail: newEmail
    });

    // Send OTP email
    await sendOTPEmail(newEmail, otp);

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error in email update request:', error);
    res.status(500).json({ message: 'Error processing email update request' });
  }
});

router.put('/verify-email-update', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { otp } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.emailUpdateOTP || !user.emailUpdateExpiry || !user.pendingEmail) {
      return res.status(400).json({ message: 'No email update request found' });
    }

    if (Date.now() > user.emailUpdateExpiry) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    if (user.emailUpdateOTP !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Update email
    user.email = user.pendingEmail;
    user.emailUpdateOTP = undefined;
    user.emailUpdateExpiry = undefined;
    user.pendingEmail = undefined;
    await user.save();

    res.json({ 
      message: 'Email updated successfully',
      email: user.email
    });
  } catch (error) {
    console.error('Error in email verification:', error);
    res.status(500).json({ message: 'Error verifying email update' });
  }
});

// Get distinct subjects
router.get('/subjects', verifyToken, async (req, res) => {
  try {
    const subjects = await Subject.find().distinct('subjectName');
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subjects' });
  }
});

// Admin-only routes - Place these AFTER all non-admin routes
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

router.post('/create', verifyToken, isAdmin, async (req, res) => {
  try {
    const { username, email, password, role, subjects, assignedPapers } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    let userData = {
      username,
      email,
      role
    };

    // Handle password differently for admin and evaluator
    if (role === 'admin') {
      // For admin, directly hash the password
      userData.password = await bcrypt.hash(password, 10);
      userData.isFirstLogin = false;
    } else {
      // For evaluator, store both hashed password and temporary password
      userData.password = await bcrypt.hash(password, 10);
      userData.tempPassword = password; // Store original password as tempPassword
      userData.isFirstLogin = true;
      userData.subjects = subjects;
      userData.assignedPapers = assignedPapers;
    }

    const user = new User(userData);
    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
});

router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { username, email, password, role, subjects, assignedPapers } = req.body;
    const updateData = { username, email, role };
    
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (role === 'evaluator') {
      updateData.subjects = subjects;
      updateData.assignedPapers = assignedPapers;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id, 
      updateData,
      { new: true }
    );
    
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user' });
  }
});

router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user' });
  }
});

module.exports = router; 