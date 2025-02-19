const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Subject = require('../models/Subject');
const bcrypt = require('bcryptjs');
const { verifyToken, isAdmin } = require('../middleware/auth');
const userController = require('../controllers/userController');

// Get distinct subjects
router.get('/subjects', verifyToken, async (req, res) => {
  try {
    const subjects = await Subject.find().distinct('subjectName');
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subjects' });
  }
});

// Get all users
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-password'); // Exclude password from response
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Create new user
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

// Update user
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

// Delete user
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

// Get current user route
router.get('/me', verifyToken, userController.getCurrentUser);

module.exports = router; 