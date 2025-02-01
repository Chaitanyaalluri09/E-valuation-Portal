const Subject = require('../models/Subject');

const subjectController = {
  // Get all subjects with optional filtering
  getSubjects: async (req, res) => {
    try {
      const { regulation, year, branch, semester } = req.query;
      
      // Build filter object based on provided query parameters
      const filter = {};
      if (regulation) filter.regulation = regulation;
      if (year) filter.year = year;
      if (branch) filter.branch = branch;
      if (semester) filter.semester = semester;

      const subjects = await Subject.find(filter).sort({ subjectCode: 1 });
      res.json(subjects);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      res.status(500).json({ message: 'Error fetching subjects', error: error.message });
    }
  },

  // Create a new subject
  createSubject: async (req, res) => {
    try {
      const { regulation, year, branch, semester, subjectCode, subjectName } = req.body;

      // Create new subject without checking for duplicates
      const subject = new Subject({
        regulation,
        year,
        branch,
        semester,
        subjectCode,
        subjectName
      });

      await subject.save();
      res.status(201).json(subject);
    } catch (error) {
      console.error('Error creating subject:', error);
      res.status(500).json({ message: 'Error creating subject', error: error.message });
    }
  },

  // Delete a subject
  deleteSubject: async (req, res) => {
    try {
      const { id } = req.params;
      const subject = await Subject.findByIdAndDelete(id);
      
      if (!subject) {
        return res.status(404).json({ message: 'Subject not found' });
      }

      res.json({ message: 'Subject deleted successfully' });
    } catch (error) {
      console.error('Error deleting subject:', error);
      res.status(500).json({ message: 'Error deleting subject', error: error.message });
    }
  }
};

module.exports = subjectController; 