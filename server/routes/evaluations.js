const express = require('express');
const router = express.Router();
const multer = require('multer');
const evaluationController = require('../controllers/evaluationController');

const storage = multer.memoryStorage();
const upload = multer({ storage });

const fileFields = [
  { name: 'questionPaper', maxCount: 1 },
  { name: 'files', maxCount: 50 }
];

router.post('/create', 
  upload.fields(fileFields),
  evaluationController.createEvaluation
);

router.get('/', evaluationController.getAllEvaluations);
router.delete('/:id', evaluationController.deleteEvaluation);

module.exports = router; 