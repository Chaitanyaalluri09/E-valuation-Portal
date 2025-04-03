const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const Subject = require('../models/Subject');
const multer = require('multer');
const csv = require('csv-parse');
const fs = require('fs');

// Configure multer for file upload
const upload = multer({ dest: 'uploads/' });

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

// Add this new route - make sure to add it BEFORE the '/:id' route
router.delete('/', subjectController.deleteFilteredSubjects);

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

// Add this new route for CSV upload
router.post('/upload-csv', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const results = [];
  let addedCount = 0;

  try {
    fs.createReadStream(req.file.path)
      .pipe(csv.parse({ 
        columns: true, 
        trim: true,
        skipEmptyLines: true 
      }))
      .on('data', (data) => {
        // Clean and map the data
        const cleanedData = {
          regulation: data.regulation?.trim(),
          year: data.year?.trim(),
          branch: data.branch?.trim(),
          semester: data.semester?.trim(), // Changed from data.sem to data.semester
          subjectCode: data.subjectCode?.trim(),
          subjectName: data.subjectName?.trim()
        };
        results.push(cleanedData);
      })
      .on('end', async () => {
        try {
          // Insert all subjects
          const insertPromises = results.map(async (subject) => {
            try {
              // Validate data before creating
              if (!subject.semester) {
                console.warn(`Missing semester for subject ${subject.subjectCode}`);
                return null;
              }
              return await Subject.create(subject);
            } catch (err) {
              console.warn(`Error inserting subject ${subject.subjectCode}:`, err.message);
              return null;
            }
          });

          const inserted = await Promise.all(insertPromises);
          addedCount = inserted.filter(Boolean).length;

          // Clean up - delete uploaded file
          fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting file:', err);
          });

          res.json({ 
            message: 'CSV processed successfully', 
            addedCount,
            totalRecords: results.length,
            failedRecords: results.length - addedCount
          });
        } catch (error) {
          console.error('Error processing CSV data:', error);
          res.status(500).json({ 
            message: 'Error processing CSV data', 
            error: error.message 
          });
        }
      });
  } catch (error) {
    console.error('Error reading CSV:', error);
    res.status(500).json({ 
      message: 'Error reading CSV file', 
      error: error.message 
    });
  }
});

// Add this new route to get distinct subject names
router.get('/distinct/subjectName', async (req, res) => {
  try {
    const distinctSubjectNames = await Subject.distinct('subjectName');
    res.json(distinctSubjectNames);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching distinct subject names' });
  }
});

module.exports = router; 