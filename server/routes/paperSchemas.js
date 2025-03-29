const express = require('express');
const router = express.Router();
const paperSchemaController = require('../controllers/paperSchemaController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.post('/', verifyToken, isAdmin, paperSchemaController.createSchema);
router.get('/', verifyToken, paperSchemaController.getAllSchemas);
router.get('/:id', verifyToken, paperSchemaController.getSchema);
router.put('/:id', verifyToken, isAdmin, paperSchemaController.updateSchema);
router.delete('/:id', verifyToken, isAdmin, paperSchemaController.deleteSchema);

module.exports = router; 