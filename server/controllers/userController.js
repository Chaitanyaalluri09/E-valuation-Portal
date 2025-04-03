const User = require('../models/User');
const bcrypt = require('bcrypt');

const userController = {
  // Get all users
  getUsers: async (req, res) => {
    try {
      const users = await User.find().select('-password');
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching users' });
    }
  },

  // Get current user
  getCurrentUser: async (req, res) => {
    try {
      const user = await User.findById(req.user.userId).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({
        username: user.username,
        email: user.email,
        role: user.role,
        subjects: user.subjects || []
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching user' });
    }
  },

  // Create new user
  createUser: async (req, res) => {
    try {
      const { username, email, password, role, subjects } = req.body;
      
      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = new User({
        username,
        email,
        password: hashedPassword,
        role,
        subjects: role === 'evaluator' ? subjects : undefined
      });

      await user.save();
      res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error creating user' });
    }
  },

  // Update user
  updateUser: async (req, res) => {
    try {
      const updates = { ...req.body };
      if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, 10);
      }

      const user = await User.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ message: 'User updated successfully', user });
    } catch (error) {
      res.status(500).json({ message: 'Error updating user' });
    }
  },

  // Delete user
  deleteUser: async (req, res) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting user' });
    }
  },

  // Get subjects
  getSubjects: async (req, res) => {
    try {
      const subjects = await User.distinct('subjects');
      res.json(subjects);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching subjects' });
    }
  }
};

module.exports = userController; 