const Evaluation = require('../models/Evaluation');
const User = require('../models/User');
const { uploadToS3, deleteFromS3 } = require('../utils/s3');
const { sendEvaluationEmail } = require('../utils/emailService');
const PaperSchema = require('../models/PaperSchema');

const evaluationController = {
  // Get all evaluations (admin only)
  getAllEvaluations: async (req, res) => {
    try {
      const evaluations = await Evaluation.find()
        .populate('evaluator', 'username')
        .sort({ createdAt: -1 });
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
        subjectCode,
        evaluator,
        numberOfStudents,
        endDate,
        registerNumbers,
        paperSchema
      } = formData;

      // Validate required fields
      if (!regulation || !year || !branch || !semester || !subject || !subjectCode || !evaluator || !endDate || !registerNumbers || !paperSchema) {
        return res.status(400).json({
          message: 'Missing required fields',
          receivedData: formData
        });
      }

      // Validate paper schema exists
      const schemaExists = await PaperSchema.findById(paperSchema);
      if (!schemaExists) {
        return res.status(400).json({
          message: 'Invalid paper schema'
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
              status: 'Not Started',
              questionMarks: [],
              totalMarks: null
            };
          })
        );

        // Create evaluation with paper schema
        const evaluation = new Evaluation({
          regulation,
          year,
          branch,
          semester,
          subject,
          subjectCode,
          evaluator,
          paperSchema,
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

        // Update evaluator's assigned papers count and add evaluation reference
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
      res.status(500).json({
        message: 'Error during file upload or database operation',
        error: error.message
      });
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
      // Find the evaluation first
      const evaluation = await Evaluation.findById(req.params.id);
      if (!evaluation) {
        return res.status(404).json({ message: 'Evaluation not found' });
      }

      // Delete question paper from S3
      try {
        await deleteFromS3(evaluation.questionPaperUrl);
      } catch (error) {
        console.error('Error deleting question paper from S3:', error);
      }

      // Delete all answer papers from S3
      for (const submission of evaluation.studentSubmissions) {
        try {
          await deleteFromS3(submission.answerPaperUrl);
        } catch (error) {
          console.error('Error deleting answer paper from S3:', error);
        }
      }

      // Update evaluator's assigned papers count and remove evaluation reference
      await User.findByIdAndUpdate(
        evaluation.evaluator,
        {
          $inc: { assignedPapers: -evaluation.studentSubmissions.length },
          $pull: { assignedEvaluations: evaluation._id }
        }
      );

      // Delete the evaluation from database
      await Evaluation.findByIdAndDelete(req.params.id);

      res.json({ message: 'Evaluation deleted successfully' });
    } catch (error) {
      console.error('Error deleting evaluation:', error);
      res.status(500).json({ message: 'Error deleting evaluation' });
    }
  },

  updateSubmissionStatus: async (req, res) => {
    try {
      const { evaluationId, submissionId } = req.params;
      const { status, questionMarks, totalMarks } = req.body;

      // Validate the input data
      if (!status || !Array.isArray(questionMarks) || totalMarks === undefined) {
        return res.status(400).json({
          message: 'Invalid input data. Required fields: status, questionMarks array, and totalMarks'
        });
      }

      const evaluation = await Evaluation.findById(evaluationId);
      
      if (!evaluation) {
        return res.status(404).json({ message: 'Evaluation not found' });
      }

      // Find and update the specific submission
      const submission = evaluation.studentSubmissions.id(submissionId);
      if (!submission) {
        return res.status(404).json({ message: 'Submission not found' });
      }

      // Update submission details
      submission.status = status;
      submission.questionMarks = questionMarks;
      submission.totalMarks = totalMarks;

      // Check if all submissions are completed to update evaluation status
      const allCompleted = evaluation.studentSubmissions.every(sub => sub.status === 'Completed');
      if (allCompleted) {
        evaluation.status = 'Completed';
      } else if (evaluation.status === 'Not Started') {
        evaluation.status = 'In Progress';
      }

      await evaluation.save();

      res.status(200).json({ 
        message: 'Submission status updated successfully', 
        submission,
        evaluationStatus: evaluation.status 
      });
    } catch (error) {
      console.error('Error updating submission status:', error);
      res.status(500).json({ 
        message: 'Error updating submission status', 
        error: error.message 
      });
    }
  },

  // Update or save progress for a submission
  saveSubmissionProgress: async (req, res) => {
    try {
      const { evaluationId, submissionId } = req.params;
      const { status, questionMarks } = req.body;

      const evaluation = await Evaluation.findById(evaluationId);
      
      if (!evaluation) {
        return res.status(404).json({ message: 'Evaluation not found' });
      }

      // Find and update the specific submission
      const submission = evaluation.studentSubmissions.id(submissionId);
      if (!submission) {
        return res.status(404).json({ message: 'Submission not found' });
      }

      // Update submission details
      submission.status = status;
      submission.questionMarks = questionMarks;
      submission.lastModified = new Date();

      // Update evaluation status if it's still "Not Started"
      if (evaluation.status === 'Not Started') {
        evaluation.status = 'In Progress';
      }

      await evaluation.save();

      res.status(200).json({ 
        message: 'Progress saved successfully', 
        submission,
        evaluationStatus: evaluation.status 
      });
    } catch (error) {
      console.error('Error saving progress:', error);
      res.status(500).json({ 
        message: 'Error saving progress', 
        error: error.message 
      });
    }
  }
};

module.exports = evaluationController; 