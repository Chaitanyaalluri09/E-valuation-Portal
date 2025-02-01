const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Subject = require('../models/Subject');
const bcrypt = require('bcryptjs');

// Get distinct subjects
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await Subject.find().distinct('subjectName');
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subjects' });
  }
});

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}, '-password'); // Exclude password from response
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Create new user
router.post('/create', async (req, res) => {
  try {
    const { username, email, password, role, subjects, assignedPapers } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const userData = {
      username,
      email,
      password: hashedPassword,
      role
    };

    // Add evaluator-specific fields if role is evaluator
    if (role === 'evaluator') {
      userData.subjects = subjects;
      userData.assignedPapers = assignedPapers;
    }

    const user = new User(userData);
    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user' });
  }
});

// Update user
router.put('/:id', async (req, res) => {
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
router.delete('/:id', async (req, res) => {
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