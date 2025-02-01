const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const Subject = require('../models/Subject');

// Get all subjects (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { regulation, year, branch, semester } = req.query;
    
    // Build filter object with only defined query parameters
    const filter = {};
    if (regulation) filter.regulation = regulation;
    if (year) filter.year = year;
    if (branch) filter.branch = branch;
    if (semester) filter.semester = semester;
    
    const subjects = await Subject.find(filter);
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subjects' });
  }
});

// Create a new subject
router.post('/', subjectController.createSubject);

// Delete a subject
router.delete('/:id', subjectController.deleteSubject);

// Add these new routes BEFORE any existing routes
router.get('/distinct/regulation', async (req, res) => {
  try {
    const distinctRegulations = await Subject.distinct('regulation');
    res.json(distinctRegulations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching distinct regulations' });
  }
});

router.get('/distinct/branch', async (req, res) => {
  try {
    const { regulation } = req.query;
    let filter = {};
    if (regulation) {
      filter.regulation = regulation;
    }
    const distinctBranches = await Subject.distinct('branch', filter);
    res.json(distinctBranches);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching distinct branches' });
  }
});

router.get('/filter', async (req, res) => {
  try {
    const { regulation, year, branch, semester } = req.query;
    
    const subjects = await Subject.find({
      regulation,
      year,
      branch,
      semester
    });
    
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching subjects',
      error: error.message 
    });
  }
});

module.exports = router; 