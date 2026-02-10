const { sequelize } = require('../models');

async function migrateDatabase() {
  try {
    console.log('Running database migrations...');
    
    // Sync all models with database
    // alter: true will update tables to match models
    // force: true would drop and recreate tables (USE WITH CAUTION!)
    await sequelize.sync({ alter: true });
    
    console.log('✓ Database migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
}

migrateDatabase();
