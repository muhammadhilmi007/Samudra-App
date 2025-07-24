require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

// Import schemas
const Role = mongoose.model('Role', require('../schemas/roleSchema'));
const Branch = mongoose.model('Branch', require('../schemas/branchSchema'));

const DB_HOST = process.env.DATABASE_HOST || 'localhost';
const DB_PORT = process.env.DATABASE_PORT || '27017';
const DB_NAME = process.env.DATABASE_NAME || 'samudrav1';

async function migrateRoles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(`mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`);
    console.log('Connected to MongoDB');

    console.log('Starting role migration...');

    // Get all existing roles
    const existingRoles = await Role.find({});
    console.log(`Found ${existingRoles.length} existing roles`);

    // Get branches for reference
    const branches = await Branch.find({});
    const pusatBranch = branches.find(b => b.type === 'pusat');

    let migratedCount = 0;
    let errors = [];

    for (const role of existingRoles) {
      try {
        let updates = {};
        let needsUpdate = false;

        // Add level field if missing
        if (!role.level) {
          // Determine level based on existing data
          if (!role.branch_id || role.branch_id.equals(pusatBranch._id)) {
            updates.level = 'pusat';
            updates.branch_id = null; // Clear branch_id for pusat roles
          } else {
            updates.level = 'cabang';
          }
          needsUpdate = true;
        }

        // Add status field if missing
        if (!role.status) {
          updates.status = role.isActive ? 'active' : 'inactive';
          needsUpdate = true;
        }

        // Add parent_role_id field if missing (default to null)
        if (role.parent_role_id === undefined) {
          updates.parent_role_id = null;
          needsUpdate = true;
        }

        // Apply updates if needed
        if (needsUpdate) {
          await Role.updateOne(
            { _id: role._id },
            { $set: updates }
          );
          migratedCount++;
          console.log(`Migrated role: ${role.name} - Updates: ${JSON.stringify(updates)}`);
        }
      } catch (error) {
        errors.push({ role: role.name, error: error.message });
        console.error(`Error migrating role ${role.name}:`, error.message);
      }
    }

    // Fix any roles that have invalid branch_id for pusat level
    const invalidPusatRoles = await Role.find({ 
      level: 'pusat', 
      branch_id: { $ne: null } 
    });
    
    if (invalidPusatRoles.length > 0) {
      console.log(`\nFound ${invalidPusatRoles.length} pusat roles with branch_id, fixing...`);
      for (const role of invalidPusatRoles) {
        await Role.updateOne(
          { _id: role._id },
          { $set: { branch_id: null } }
        );
        console.log(`Fixed pusat role: ${role.name} - Removed branch_id`);
      }
    }

    // Summary
    console.log('\n=== MIGRATION SUMMARY ===');
    console.log(`Total roles processed: ${existingRoles.length}`);
    console.log(`Roles migrated: ${migratedCount}`);
    console.log(`Errors encountered: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\nErrors:');
      errors.forEach(e => console.log(`- ${e.role}: ${e.error}`));
    }

    // Verify migration
    const roleStats = await Role.aggregate([
      {
        $group: {
          _id: '$level',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\nRole distribution after migration:');
    roleStats.forEach(stat => {
      console.log(`${stat._id || 'undefined'}: ${stat.count} roles`);
    });

    // Check for roles without required fields
    const rolesWithoutLevel = await Role.countDocuments({ level: { $exists: false } });
    const rolesWithoutStatus = await Role.countDocuments({ status: { $exists: false } });
    
    if (rolesWithoutLevel > 0 || rolesWithoutStatus > 0) {
      console.log('\nWARNING: Some roles still missing required fields:');
      if (rolesWithoutLevel > 0) console.log(`- ${rolesWithoutLevel} roles without level`);
      if (rolesWithoutStatus > 0) console.log(`- ${rolesWithoutStatus} roles without status`);
    } else {
      console.log('\n✓ All roles have been successfully migrated!');
    }

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateRoles();