const Evaluation = require('../models/Evaluation');
const User = require('../models/User');
const { uploadToS3 } = require('../utils/s3');
const { sendEvaluationEmail } = require('../utils/emailService');

const evaluationController = {
  // Get all evaluations (admin only)
  getAllEvaluations: async (req, res) => {
    try {
      const evaluations = await Evaluation.find().sort({ createdAt: -1 });
      res.json(evaluations);
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      res.status(500).json({ message: 'Error fetching evaluations' });
    }
  },

  // Get evaluator's evaluations
  getEvaluatorEvaluations: async (req, res) => {
    try {
      const evaluations = await Evaluation.find({ evaluator: req.user.userId })
        .sort({ createdAt: -1 });
      res.json(evaluations);
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      res.status(500).json({ message: 'Error fetching evaluations' });
    }
  },

  // Create evaluation
  createEvaluation: async (req, res) => {
    try {
      // Check if files exist
      if (!req.files) {
        return res.status(400).json({
          message: 'No files were uploaded'
        });
      }

      // Validate required files
      if (!req.files.questionPaper || !req.files.files) {
        return res.status(400).json({
          message: 'Missing required files (question paper or answer papers)'
        });
      }

      // Parse form data
      let formData;
      try {
        formData = JSON.parse(req.body.formData);
      } catch (error) {
        return res.status(400).json({
          message: 'Invalid form data format',
          error: error.message
        });
      }

      const {
        regulation,
        year,
        branch,
        semester,
        subject,
        evaluator,
        numberOfStudents,
        endDate,
        registerNumbers
      } = formData;

      // Validate required fields
      if (!regulation || !year || !branch || !semester || !subject || !evaluator || !endDate || !registerNumbers) {
        return res.status(400).json({
          message: 'Missing required fields',
          receivedData: formData
        });
      }

      // Get evaluator details first
      const evaluatorUser = await User.findById(evaluator);
      const isFirstEvaluation = evaluatorUser.assignedPapers === 0;

      try {
        // Upload question paper to S3
        const questionPaperUrl = await uploadToS3(req.files.questionPaper[0], 'question-papers');

        // Upload student papers to S3 and create submissions array
        const studentSubmissions = await Promise.all(
          req.files.files.map(async (file, index) => {
            const answerPaperUrl = await uploadToS3(file, 'answer-papers');
            return {
              registerNumber: registerNumbers[index],
              answerPaperUrl,
              status: 'pending',
              marks: null
            };
          })
        );

        // Create evaluation
        const evaluation = new Evaluation({
          regulation,
          year,
          branch,
          semester,
          subject,
          evaluator,
          questionPaperUrl,
          endDate: new Date(endDate),
          studentSubmissions,
          status: 'Not Started'
        });

        await evaluation.save();

        // Send email before updating assigned papers count
        await sendEvaluationEmail(
          evaluatorUser,
          evaluation,
          isFirstEvaluation,
          isFirstEvaluation ? evaluatorUser.tempPassword : null
        );

        // Update evaluator's assigned papers count after sending email
        await User.findByIdAndUpdate(
          evaluator,
          { 
            $inc: { assignedPapers: studentSubmissions.length },
            $addToSet: { assignedEvaluations: evaluation._id }
          },
          { new: true }
        );

        res.status(201).json({
          message: 'Evaluation created successfully',
          evaluation
        });

      } catch (uploadError) {
        console.error('Error during file upload or database operation:', uploadError);
        return res.status(500).json({
          message: 'Error processing files or saving evaluation',
          error: uploadError.message
        });
      }

    } catch (error) {
      console.error('Error creating evaluation:', error);
      res.status(500).json({ message: 'Error creating evaluation' });
    }
  },

  // Get single evaluation
  getEvaluation: async (req, res) => {
    try {
      const evaluation = await Evaluation.findById(req.params.id);
      if (!evaluation) {
        return res.status(404).json({ message: 'Evaluation not found' });
      }
      res.json(evaluation);
    } catch (error) {
      console.error('Error fetching evaluation:', error);
      res.status(500).json({ message: 'Error fetching evaluation' });
    }
  },

  // Update evaluation
  updateEvaluation: async (req, res) => {
    try {
      const evaluation = await Evaluation.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!evaluation) {
        return res.status(404).json({ message: 'Evaluation not found' });
      }
      res.json(evaluation);
    } catch (error) {
      console.error('Error updating evaluation:', error);
      res.status(500).json({ message: 'Error updating evaluation' });
    }
  },

  // Delete evaluation
  deleteEvaluation: async (req, res) => {
    try {
      const evaluation = await Evaluation.findByIdAndDelete(req.params.id);
      if (!evaluation) {
        return res.status(404).json({ message: 'Evaluation not found' });
      }
      res.json({ message: 'Evaluation deleted successfully' });
    } catch (error) {
      console.error('Error deleting evaluation:', error);
      res.status(500).json({ message: 'Error deleting evaluation' });
    }
  }
};

module.exports = evaluationController; 