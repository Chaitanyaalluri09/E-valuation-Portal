const PaperSchema = require('../models/PaperSchema');

const paperSchemaController = {
  createSchema: async (req, res) => {
    try {
      const schema = new PaperSchema(req.body);
      await schema.save();
      res.status(201).json(schema);
    } catch (error) {
      res.status(500).json({ message: 'Error creating schema', error: error.message });
    }
  },

  getAllSchemas: async (req, res) => {
    try {
      const schemas = await PaperSchema.find().sort({ createdAt: -1 });
      res.json(schemas);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching schemas', error: error.message });
    }
  },

  getSchema: async (req, res) => {
    try {
      const schema = await PaperSchema.findById(req.params.id);
      if (!schema) {
        return res.status(404).json({ message: 'Schema not found' });
      }
      res.json(schema);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching schema', error: error.message });
    }
  },

  updateSchema: async (req, res) => {
    try {
      const schema = await PaperSchema.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!schema) {
        return res.status(404).json({ message: 'Schema not found' });
      }
      res.json(schema);
    } catch (error) {
      res.status(500).json({ message: 'Error updating schema', error: error.message });
    }
  },

  deleteSchema: async (req, res) => {
    try {
      const schema = await PaperSchema.findByIdAndDelete(req.params.id);
      if (!schema) {
        return res.status(404).json({ message: 'Schema not found' });
      }
      res.json({ message: 'Schema deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting schema', error: error.message });
    }
  }
};

module.exports = paperSchemaController; 