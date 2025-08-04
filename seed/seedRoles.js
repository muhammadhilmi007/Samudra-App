require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

// Import schemas
const Role = mongoose.model('Role', require('../schemas/roleSchema'));
const User = mongoose.model('User', require('../schemas/userSchema'));
const Branch = mongoose.model('Branch', require('../schemas/branchSchema'));
const Division = mongoose.model('Division', require('../schemas/divisionSchema'));
const Position = mongoose.model('Position', require('../schemas/positionSchema'));

const DB_HOST = process.env.DATABASE_HOST || 'localhost';
const DB_PORT = process.env.DATABASE_PORT || '27017';
const DB_NAME = process.env.DATABASE_NAME || 'samudrav1';

// Function to create comprehensive test hierarchy data
async function createTestHierarchyData() {
  console.log('\nCreating test hierarchy data for visualization...');
  
  try {
    // Get required references
    const pusatBranch = await Branch.findOne({ type: 'pusat' });
    const cabangBranches = await Branch.find({ type: 'cabang' }).limit(3);
    
    // Get divisions
    const divisions = await Division.find({}).limit(5);
    const directorDivision = divisions.find(d => d.code === 'DIR') || divisions[0];
    const hrDivision = divisions.find(d => d.code === 'HR') || divisions[1];
    const financeDivision = divisions.find(d => d.code === 'FIN') || divisions[2];
    const operationsDivision = divisions.find(d => d.code === 'OPS') || divisions[3];
    const itDivision = divisions.find(d => d.code === 'IT') || divisions[4];
    
    // Get positions
    const positions = await Position.find({}).sort({ level: 1 });
    const ceoPosition = positions.find(p => p.level === 1) || positions[0];
    const directorPosition = positions.find(p => p.level === 2) || positions[1];
    const managerPosition = positions.find(p => p.level === 3) || positions[2];
    const supervisorPosition = positions.find(p => p.level === 4) || positions[3];
    const staffPosition = positions.find(p => p.level === 5) || positions[4];
    
    // Get some users for assignment
    const users = await User.find({ isActive: true }).limit(15);
    
    // Define comprehensive hierarchy structure
    const hierarchyRoles = [
      // Level 1: CEO/President Director
      {
        name: 'President Director',
        description: 'Chief Executive Officer - Top level management',
        branch_id: pusatBranch?._id,
        division_id: directorDivision?._id,
        position_id: ceoPosition?._id,
        users_id: users[0]?._id || null,
        parent_role_id: null,
        isTemplate: false,
        isActive: true,
        level: 1
      },
      
      // Level 2: Directors reporting to CEO
      {
        name: 'Director of Operations',
        description: 'Operations Director - Oversees all operational activities',
        branch_id: pusatBranch?._id,
        division_id: operationsDivision?._id,
        position_id: directorPosition?._id,
        users_id: users[1]?._id || null,
        parent_role_id: null, // Will be set after CEO is created
        isTemplate: false,
        isActive: true,
        level: 2
      },
      {
        name: 'Director of Finance',
        description: 'Finance Director - Manages financial operations',
        branch_id: pusatBranch?._id,
        division_id: financeDivision?._id,
        position_id: directorPosition?._id,
        users_id: users[2]?._id || null,
        parent_role_id: null,
        isTemplate: false,
        isActive: true,
        level: 2
      },
      {
        name: 'Director of Human Resources',
        description: 'HR Director - Manages human resources',
        branch_id: pusatBranch?._id,
        division_id: hrDivision?._id,
        position_id: directorPosition?._id,
        users_id: users[3]?._id || null,
        parent_role_id: null,
        isTemplate: false,
        isActive: true,
        level: 2
      },
      {
        name: 'Director of Technology',
        description: 'IT Director - Manages technology infrastructure',
        branch_id: pusatBranch?._id,
        division_id: itDivision?._id,
        position_id: directorPosition?._id,
        users_id: users[4]?._id || null,
        parent_role_id: null,
        isTemplate: false,
        isActive: true,
        level: 2
      },
      
      // Level 3: Managers reporting to Directors
      {
        name: 'Operations Manager - Jakarta',
        description: 'Regional Operations Manager for Jakarta',
        branch_id: cabangBranches[0]?._id || pusatBranch?._id,
        division_id: operationsDivision?._id,
        position_id: managerPosition?._id,
        users_id: users[5]?._id || null,
        parent_role_id: null,
        isTemplate: false,
        isActive: true,
        level: 3
      },
      {
        name: 'Operations Manager - Surabaya',
        description: 'Regional Operations Manager for Surabaya',
        branch_id: cabangBranches[1]?._id || pusatBranch?._id,
        division_id: operationsDivision?._id,
        position_id: managerPosition?._id,
        users_id: users[6]?._id || null,
        parent_role_id: null,
        isTemplate: false,
        isActive: true,
        level: 3
      },
      {
        name: 'Finance Manager',
        description: 'Finance Manager - Handles financial operations',
        branch_id: pusatBranch?._id,
        division_id: financeDivision?._id,
        position_id: managerPosition?._id,
        users_id: users[7]?._id || null,
        parent_role_id: null,
        isTemplate: false,
        isActive: true,
        level: 3
      },
      {
        name: 'HR Manager',
        description: 'Human Resources Manager',
        branch_id: pusatBranch?._id,
        division_id: hrDivision?._id,
        position_id: managerPosition?._id,
        users_id: users[8]?._id || null,
        parent_role_id: null,
        isTemplate: false,
        isActive: true,
        level: 3
      },
      {
        name: 'IT Manager',
        description: 'Information Technology Manager',
        branch_id: pusatBranch?._id,
        division_id: itDivision?._id,
        position_id: managerPosition?._id,
        users_id: users[9]?._id || null,
        parent_role_id: null,
        isTemplate: false,
        isActive: true,
        level: 3
      },
      
      // Level 4: Supervisors reporting to Managers
      {
        name: 'Operations Supervisor - Jakarta North',
        description: 'Operations Supervisor for North Jakarta area',
        branch_id: cabangBranches[0]?._id || pusatBranch?._id,
        division_id: operationsDivision?._id,
        position_id: supervisorPosition?._id,
        users_id: users[10]?._id || null,
        parent_role_id: null,
        isTemplate: false,
        isActive: true,
        level: 4
      },
      {
        name: 'Operations Supervisor - Jakarta South',
        description: 'Operations Supervisor for South Jakarta area',
        branch_id: cabangBranches[0]?._id || pusatBranch?._id,
        division_id: operationsDivision?._id,
        position_id: supervisorPosition?._id,
        users_id: users[11]?._id || null,
        parent_role_id: null,
        isTemplate: false,
        isActive: true,
        level: 4
      },
      {
        name: 'Finance Supervisor',
        description: 'Finance Supervisor - Assists Finance Manager',
        branch_id: pusatBranch?._id,
        division_id: financeDivision?._id,
        position_id: supervisorPosition?._id,
        users_id: users[12]?._id || null,
        parent_role_id: null,
        isTemplate: false,
        isActive: true,
        level: 4
      },
      {
        name: 'IT Support Supervisor',
        description: 'IT Support Supervisor',
        branch_id: pusatBranch?._id,
        division_id: itDivision?._id,
        position_id: supervisorPosition?._id,
        users_id: users[13]?._id || null,
        parent_role_id: null,
        isTemplate: false,
        isActive: true,
        level: 4
      },
      
      // Level 5: Staff reporting to Supervisors
      {
        name: 'Operations Staff - Field Team A',
        description: 'Field operations staff member',
        branch_id: cabangBranches[0]?._id || pusatBranch?._id,
        division_id: operationsDivision?._id,
        position_id: staffPosition?._id,
        users_id: users[14]?._id || null,
        parent_role_id: null,
        isTemplate: false,
        isActive: true,
        level: 5
      },
      {
        name: 'Finance Staff - Accounting',
        description: 'Accounting staff member',
        branch_id: pusatBranch?._id,
        division_id: financeDivision?._id,
        position_id: staffPosition?._id,
        users_id: null,
        parent_role_id: null,
        isTemplate: false,
        isActive: true,
        level: 5
      },
      {
        name: 'IT Support Staff',
        description: 'IT support staff member',
        branch_id: pusatBranch?._id,
        division_id: itDivision?._id,
        position_id: staffPosition?._id,
        users_id: null,
        parent_role_id: null,
        isTemplate: false,
        isActive: true,
        level: 5
      }
    ];
    
    // Create roles and establish hierarchy
    const createdRoles = {};
    
    // First pass: Create all roles
    for (const roleData of hierarchyRoles) {
      const existingRole = await Role.findOne({ 
        name: roleData.name,
        isTemplate: false
      });
      
      if (!existingRole) {
        try {
          const newRole = new Role(roleData);
          await newRole.save();
          createdRoles[roleData.name] = newRole;
          console.log(`✓ Created role: ${roleData.name}`);
        } catch (error) {
          console.log(`✗ Failed to create role ${roleData.name}: ${error.message}`);
        }
      } else {
        createdRoles[roleData.name] = existingRole;
        console.log(`- Role already exists: ${roleData.name}`);
      }
    }
    
    // Second pass: Establish parent-child relationships
    console.log('\nEstablishing hierarchy relationships...');
    
    // Set CEO as parent for all Directors
    const ceoRole = createdRoles['President Director'];
    if (ceoRole) {
      const directorRoles = [
        'Director of Operations',
        'Director of Finance', 
        'Director of Human Resources',
        'Director of Technology'
      ];
      
      for (const directorName of directorRoles) {
        const directorRole = createdRoles[directorName];
        if (directorRole && !directorRole.parent_role_id) {
          directorRole.parent_role_id = ceoRole._id;
          await directorRole.save();
          console.log(`✓ Set ${ceoRole.name} as parent of ${directorRole.name}`);
        }
      }
    }
    
    // Set Directors as parents for their respective Managers
    const hierarchyMap = {
      'Director of Operations': [
        'Operations Manager - Jakarta',
        'Operations Manager - Surabaya'
      ],
      'Director of Finance': ['Finance Manager'],
      'Director of Human Resources': ['HR Manager'],
      'Director of Technology': ['IT Manager']
    };
    
    for (const [parentName, childNames] of Object.entries(hierarchyMap)) {
      const parentRole = createdRoles[parentName];
      if (parentRole) {
        for (const childName of childNames) {
          const childRole = createdRoles[childName];
          if (childRole && !childRole.parent_role_id) {
            childRole.parent_role_id = parentRole._id;
            await childRole.save();
            console.log(`✓ Set ${parentRole.name} as parent of ${childRole.name}`);
          }
        }
      }
    }
    
    // Set Managers as parents for their Supervisors
    const managerHierarchy = {
      'Operations Manager - Jakarta': [
        'Operations Supervisor - Jakarta North',
        'Operations Supervisor - Jakarta South'
      ],
      'Finance Manager': ['Finance Supervisor'],
      'IT Manager': ['IT Support Supervisor']
    };
    
    for (const [parentName, childNames] of Object.entries(managerHierarchy)) {
      const parentRole = createdRoles[parentName];
      if (parentRole) {
        for (const childName of childNames) {
          const childRole = createdRoles[childName];
          if (childRole && !childRole.parent_role_id) {
            childRole.parent_role_id = parentRole._id;
            await childRole.save();
            console.log(`✓ Set ${parentRole.name} as parent of ${childRole.name}`);
          }
        }
      }
    }
    
    // Set Supervisors as parents for their Staff
    const supervisorHierarchy = {
      'Operations Supervisor - Jakarta North': ['Operations Staff - Field Team A'],
      'Finance Supervisor': ['Finance Staff - Accounting'],
      'IT Support Supervisor': ['IT Support Staff']
    };
    
    for (const [parentName, childNames] of Object.entries(supervisorHierarchy)) {
      const parentRole = createdRoles[parentName];
      if (parentRole) {
        for (const childName of childNames) {
          const childRole = createdRoles[childName];
          if (childRole && !childRole.parent_role_id) {
            childRole.parent_role_id = parentRole._id;
            await childRole.save();
            console.log(`✓ Set ${parentRole.name} as parent of ${childRole.name}`);
          }
        }
      }
    }
    
    console.log('\n✅ Test hierarchy data creation completed!');
    console.log(`Created/Updated ${Object.keys(createdRoles).length} roles with proper hierarchy`);
    
  } catch (error) {
    console.error('❌ Error creating test hierarchy data:', error);
  }
}

async function migrateRoles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(`mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`);
    console.log('Connected to MongoDB');

    // 1. Add new fields to existing roles if not exists
    console.log('Checking and updating existing roles...');
    
    const roles = await Role.find({});
    console.log(`Found ${roles.length} existing roles`);

    for (const role of roles) {
      let updated = false;
      
      // Add users_id field if not exists
      if (role.users_id === undefined) {
        role.users_id = null;
        updated = true;
      }
      
      // Add parent_role_id field if not exists
      if (role.parent_role_id === undefined) {
        role.parent_role_id = null;
        updated = true;
      }
      
      // Add isTemplate field if not exists
      if (role.isTemplate === undefined) {
        role.isTemplate = false;
        updated = true;
      }
      
      if (updated) {
        await role.save();
        console.log(`Updated role: ${role.name}`);
      }
    }

    // 2. Create role templates if not exists
    console.log('\nCreating role templates...');
    
    const pusatBranch = await Branch.findOne({ type: 'pusat' });
    const directorDivision = await Division.findOne({ code: 'DIR' });
    const ceoPosition = await Position.findOne({ code: 'CEO' });
    const mgrPosition = await Position.findOne({ code: 'MGR' });
    const stfPosition = await Position.findOne({ code: 'STF' });

    const templates = [
      {
        name: 'Super Admin Template',
        description: 'Template for Super Admin role with full system access',
        branch_id: pusatBranch?._id || null,
        division_id: directorDivision?._id,
        position_id: ceoPosition?._id,
        isTemplate: true,
        isActive: true
      },
      {
        name: 'Direktur Template',
        description: 'Template for Director level roles',
        branch_id: pusatBranch?._id || null,
        division_id: directorDivision?._id,
        position_id: ceoPosition?._id,
        isTemplate: true,
        isActive: true
      },
      {
        name: 'Admin Cabang Template',
        description: 'Template for Branch Admin roles',
        branch_id: null, // Will be set when creating actual role
        division_id: directorDivision?._id,
        position_id: mgrPosition?._id,
        isTemplate: true,
        isActive: true
      },
      {
        name: 'Staff Template',
        description: 'Template for Staff level roles',
        branch_id: null, // Will be set when creating actual role
        division_id: directorDivision?._id,
        position_id: stfPosition?._id,
        isTemplate: true,
        isActive: true
      }
    ];

    for (const template of templates) {
      // Check if template already exists
      const exists = await Role.findOne({ 
        name: template.name, 
        isTemplate: true 
      });
      
      if (!exists && template.division_id && template.position_id) {
        try {
          const newTemplate = new Role(template);
          await newTemplate.save();
          console.log(`Created template: ${template.name}`);
        } catch (error) {
          console.log(`Skipping template ${template.name}: ${error.message}`);
        }
      } else {
        console.log(`Template already exists or missing dependencies: ${template.name}`);
      }
    }

    // 3. Set up role hierarchy for existing roles
    console.log('\nSetting up role hierarchy...');
    
    // Find Direktur Utama role to set as parent for manager roles
    const direktorRole = await Role.findOne({ 
      name: 'Direktur Utama',
      isTemplate: false
    });
    
    if (direktorRole) {
      // Set Direktur Utama as parent for all Manager roles
      const managerRoles = await Role.find({ 
        name: { $regex: /^Manager/i },
        parent_role_id: null
      });
      
      for (const managerRole of managerRoles) {
        managerRole.parent_role_id = direktorRole._id;
        await managerRole.save();
        console.log(`Set ${direktorRole.name} as parent of ${managerRole.name}`);
      }
    }

    // Create test hierarchy data for visualization testing
    await createTestHierarchyData();

    console.log('\nMigration completed successfully!');
    console.log('\nSummary:');
    console.log(`- Total roles: ${await Role.countDocuments()}`);
    console.log(`- Template roles: ${await Role.countDocuments({ isTemplate: true })}`);
    console.log(`- Active roles: ${await Role.countDocuments({ isActive: true })}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateRoles();