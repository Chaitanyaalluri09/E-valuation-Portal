const express = require('express');
const router = express.Router();
const multer = require('multer');
const evaluationController = require('../controllers/evaluationController');
const { verifyToken, isAdmin, isEvaluator } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { getSignedUrl } = require('../utils/s3');

const storage = multer.memoryStorage();
const uploadMulter = multer({ storage });

const fileFields = [
  { name: 'questionPaper', maxCount: 1 },
  { name: 'files', maxCount: 100 }
];

// Define routes in order of specificity (most specific first)
router.post('/create', verifyToken, isAdmin, upload.fields(fileFields), evaluationController.createEvaluation);
router.get('/file-url', verifyToken, async (req, res) => {
  try {
    const { key } = req.query;
    if (!key) {
      return res.status(400).json({ message: 'File key is required' });
    }

    const signedUrl = await getSignedUrl(key);
    res.json({ url: signedUrl });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    res.status(500).json({ message: 'Error generating file URL' });
  }
});
router.get('/my-evaluations', verifyToken, isEvaluator, evaluationController.getEvaluatorEvaluations);
router.get('/', verifyToken, isAdmin, evaluationController.getAllEvaluations);

// Routes with parameters should come after specific routes
router.get('/:id', verifyToken, evaluationController.getEvaluation);
router.put('/:id', verifyToken, evaluationController.updateEvaluation);
router.delete('/:id', verifyToken, isAdmin, evaluationController.deleteEvaluation);
router.patch('/:evaluationId/submissions/:submissionId', evaluationController.updateSubmissionStatus);

module.exports = router; 