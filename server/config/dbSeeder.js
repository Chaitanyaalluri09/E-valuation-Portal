// server/config/dbSeeder.js
const { createInitialAdmin } = require('../controllers/authController');

const seedDatabase = async () => {
  try {
    await createInitialAdmin();
  } catch (error) {
    console.error('Seeding error:', error);
  }
};

module.exports = seedDatabase;