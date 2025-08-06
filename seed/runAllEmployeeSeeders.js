require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const { exec } = require('child_process');
const path = require('path');

const DB_HOST = process.env.DATABASE_HOST || 'localhost';
const DB_PORT = process.env.DATABASE_PORT || '27017';
const DB_NAME = process.env.DATABASE_NAME || 'samudrav1';

async function checkDatabaseConnection() {
  try {
    await mongoose.connect(`mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`);
    console.log('Connected to MongoDB');
    await mongoose.connection.close();
    return true;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    return false;
  }
}

function runSeeder(seederPath) {
  return new Promise((resolve, reject) => {
    const fullPath = path.resolve(__dirname, seederPath);
    console.log(`Running seeder: ${seederPath}`);
    
    const childProcess = exec(`node "${fullPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing ${seederPath}:`, error);
        return reject(error);
      }
      
      if (stderr) {
        console.error(`${seederPath} stderr:`, stderr);
      }
      
      console.log(`${seederPath} stdout:`, stdout);
      resolve();
    });
    
    // Pipe output to console in real-time
    childProcess.stdout.pipe(process.stdout);
    childProcess.stderr.pipe(process.stderr);
  });
}

async function runAllEmployeeSeeders() {
  try {
    // Check database connection
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      console.error('Cannot proceed without database connection.');
      process.exit(1);
    }
    
    console.log('Starting employee seeding process...');
    console.log('This will run all employee seeders in sequence.');
    console.log('------------------------------------------------------');
    
    // Run existing employee seeder (basic seeder)
    console.log('\n1. Running basic employee seeder...');
    await runSeeder('./seedEmployees.js');
    
    // Run sample employees seeder
    console.log('\n2. Creating sample employees with predefined data...');
    await runSeeder('./seedSampleEmployees.js');
    
    // Run random employees seeder
    console.log('\n3. Creating random employees...');
    await runSeeder('./seedRandomEmployees.js');
    
    console.log('\n------------------------------------------------------');
    console.log('All employee seeders completed successfully!');
    console.log('You can now log in with any of the created users:');
    console.log('Username: firstname.lastname (lowercase)');
    console.log('Password: P@ssw0rd!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error in seeding process:', error);
    process.exit(1);
  }
}

// Check if this script is being run directly
if (require.main === module) {
  runAllEmployeeSeeders();
}

module.exports = { runAllEmployeeSeeders };