const express = require('express');
const router = express.Router();
const multer = require('multer');
const evaluationController = require('../controllers/evaluationController');
const { verifyToken, isAdmin, isEvaluator } = require('../middleware/auth');
const upload = require('../middleware/upload');

const storage = multer.memoryStorage();
const uploadMulter = multer({ storage });

const fileFields = [
  { name: 'questionPaper', maxCount: 1 },
  { name: 'files', maxCount: 100 }
];

router.post('/create', verifyToken, isAdmin, upload.fields(fileFields), evaluationController.createEvaluation);
router.get('/', verifyToken, isAdmin, evaluationController.getAllEvaluations);
router.get('/my-evaluations', verifyToken, isEvaluator, evaluationController.getEvaluatorEvaluations);
router.get('/:id', verifyToken, evaluationController.getEvaluation);
router.put('/:id', verifyToken, evaluationController.updateEvaluation);
router.delete('/:id', verifyToken, isAdmin, evaluationController.deleteEvaluation);

module.exports = router; 