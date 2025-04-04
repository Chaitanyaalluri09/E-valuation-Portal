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

// Update the CSV upload route
router.post('/upload-csv', upload.single('file'), async (req, res) => {
  // Check if file exists
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  // Check file type
  if (!req.file.originalname.endsWith('.csv')) {
    // Clean up - delete uploaded file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting file:', err);
    });
    return res.status(400).json({ message: 'Only CSV files are allowed' });
  }

  const results = [];
  let addedCount = 0;
  let totalRows = 0;

  try {
    const parseCSV = new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv.parse({ 
          columns: true, 
          trim: true,
          skipEmptyLines: true,
          columns: ['regulation', 'year', 'branch', 'semester', 'subjectCode', 'subjectName']
        }))
        .on('data', (data) => {
          totalRows++;
          // Skip if any of the values match the header names
          if (data.regulation.toLowerCase() === 'regulation' ||
              data.year.toLowerCase() === 'year' ||
              data.branch.toLowerCase() === 'branch' ||
              data.semester.toLowerCase() === 'semester' ||
              data.subjectCode.toLowerCase() === 'subjectcode' ||
              data.subjectName.toLowerCase() === 'subjectname') {
            return;
          }

          // Validate each row before adding to results
          if (data.regulation && data.year && data.branch && 
              data.semester && data.subjectCode && data.subjectName) {
            const cleanedData = {
              regulation: data.regulation.trim(),
              year: data.year.trim(),
              branch: data.branch.trim(),
              semester: data.semester.trim(),
              subjectCode: data.subjectCode.trim(),
              subjectName: data.subjectName.trim()
            };
            results.push(cleanedData);
          }
        })
        .on('error', (error) => reject(error))
        .on('end', () => resolve());
    });

    await parseCSV;

    if (results.length === 0) {
      throw new Error('No valid data found in CSV file');
    }

    // Insert all subjects
    const insertPromises = results.map(async (subject) => {
      try {
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
      // Don't count header row in failed records
      failedRecords: results.length - addedCount
    });

  } catch (error) {
    // Clean up - delete uploaded file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting file:', err);
    });

    console.error('Error processing CSV:', error);
    res.status(400).json({ 
      message: error.message || 'Error processing CSV file'
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