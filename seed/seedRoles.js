require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Import schemas
const Branch = mongoose.model('Branch', require('../schemas/branchSchema'));
const Division = mongoose.model('Division', require('../schemas/divisionSchema'));
const Position = mongoose.model('Position', require('../schemas/positionSchema'));
const Module = mongoose.model('Module', require('../schemas/moduleSchema'));
const Permission = mongoose.model('Permission', require('../schemas/permissionSchema'));
const Role = mongoose.model('Role', require('../schemas/roleSchema'));
const RolePermission = mongoose.model('RolePermission', require('../schemas/rolePermissionSchema'));

const DB_HOST = process.env.DATABASE_HOST || 'localhost';
const DB_PORT = process.env.DATABASE_PORT || '27017';
const DB_NAME = process.env.DATABASE_NAME || 'samudrav1';

async function seedRoles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(`mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`);
    console.log('Connected to MongoDB');

    // Get existing data
    const branches = await Branch.find();
    const divisions = await Division.find();
    const positions = await Position.find();
    const permissions = await Permission.find();

    if (branches.length === 0 || divisions.length === 0 || positions.length === 0) {
      console.log('Required data not found. Please run the main seeder first.');
      process.exit(1);
    }

    const pusatBranch = branches.find(b => b.type === 'pusat');
    const jakartaBranch = branches.find(b => b.code === 'JKT-01');
    const bandungBranch = branches.find(b => b.code === 'BDG-01');
    const surabayaBranch = branches.find(b => b.code === 'SBY-01');

    console.log('Creating/updating roles with level support...');

    // Role templates
    const roleTemplates = [
      // Pusat Roles
      {
        name: 'Admin Pusat',
        description: 'System Administrator with full access',
        level: 'pusat',
        branch_id: null,
        division_id: divisions.find(d => d.code === 'IT')._id,
        position_id: positions.find(p => p.code === 'MGR')._id,
        status: 'active',
        permissionLevel: 'all'
      },
      {
        name: 'Direktur Operasional',
        description: 'Operational Director - Pusat',
        level: 'pusat',
        branch_id: null,
        division_id: divisions.find(d => d.code === 'OPS')._id,
        position_id: positions.find(p => p.code === 'CEO')._id,
        status: 'active',
        permissionLevel: 'operational'
      },
      {
        name: 'Manager Finance Pusat',
        description: 'Finance Manager - Central Office',
        level: 'pusat',
        branch_id: null,
        division_id: divisions.find(d => d.code === 'FIN')._id,
        position_id: positions.find(p => p.code === 'MGR')._id,
        status: 'active',
        permissionLevel: 'finance'
      },
      {
        name: 'Manager HRD Pusat',
        description: 'Human Resources Manager - Central Office',
        level: 'pusat',
        branch_id: null,
        division_id: divisions.find(d => d.code === 'HRD')._id,
        position_id: positions.find(p => p.code === 'MGR')._id,
        status: 'active',
        permissionLevel: 'hr'
      },
      // Cabang Roles - Jakarta
      {
        name: 'Admin Cabang Jakarta',
        description: 'Branch Administrator - Jakarta',
        level: 'cabang',
        branch_id: jakartaBranch._id,
        division_id: divisions.find(d => d.code === 'ADM')._id,
        position_id: positions.find(p => p.code === 'KCB')._id,
        status: 'active',
        permissionLevel: 'branch_admin'
      },
      {
        name: 'Staff Operasional Jakarta',
        description: 'Operational Staff - Jakarta Branch',
        level: 'cabang',
        branch_id: jakartaBranch._id,
        division_id: divisions.find(d => d.code === 'OPS')._id,
        position_id: positions.find(p => p.code === 'STF')._id,
        status: 'active',
        permissionLevel: 'operational_staff'
      },
      {
        name: 'Kasir Jakarta',
        description: 'Cashier - Jakarta Branch',
        level: 'cabang',
        branch_id: jakartaBranch._id,
        division_id: divisions.find(d => d.code === 'FIN')._id,
        position_id: positions.find(p => p.code === 'KSR')._id,
        status: 'active',
        permissionLevel: 'cashier'
      },
      // Cabang Roles - Bandung
      {
        name: 'Admin Cabang Bandung',
        description: 'Branch Administrator - Bandung',
        level: 'cabang',
        branch_id: bandungBranch._id,
        division_id: divisions.find(d => d.code === 'ADM')._id,
        position_id: positions.find(p => p.code === 'KCB')._id,
        status: 'active',
        permissionLevel: 'branch_admin'
      },
      {
        name: 'Staff Penjualan Bandung',
        description: 'Sales Staff - Bandung Branch',
        level: 'cabang',
        branch_id: bandungBranch._id,
        division_id: divisions.find(d => d.code === 'MKT')._id,
        position_id: positions.find(p => p.code === 'PJL')._id,
        status: 'active',
        permissionLevel: 'sales_staff'
      },
      // Template Roles (Inactive by default)
      {
        name: 'Template: Manager Cabang',
        description: 'Template for Branch Manager role',
        level: 'cabang',
        branch_id: jakartaBranch._id, // Default to Jakarta, will be changed when used
        division_id: divisions.find(d => d.code === 'OPS')._id,
        position_id: positions.find(p => p.code === 'MGR')._id,
        status: 'inactive',
        permissionLevel: 'branch_manager'
      },
      {
        name: 'Template: Staff Finance Cabang',
        description: 'Template for Branch Finance Staff',
        level: 'cabang',
        branch_id: jakartaBranch._id,
        division_id: divisions.find(d => d.code === 'FIN')._id,
        position_id: positions.find(p => p.code === 'STF')._id,
        status: 'inactive',
        permissionLevel: 'finance_staff'
      }
    ];

    // Permission sets
    const permissionSets = {
      all: () => permissions.map(p => p._id), // All permissions
      operational: () => permissions.filter(p => 
        ['dashboard', 'products', 'inventory', 'purchasing', 'reports', 'sales'].includes(p.module_code)
      ).map(p => p._id),
      finance: () => permissions.filter(p => 
        ['dashboard', 'finance', 'reports', 'sales', 'purchasing'].includes(p.module_code)
      ).map(p => p._id),
      hr: () => permissions.filter(p => 
        ['dashboard', 'hr', 'reports', 'users'].includes(p.module_code)
      ).map(p => p._id),
      branch_admin: () => permissions.filter(p => 
        ['dashboard', 'products', 'sales', 'inventory', 'reports'].includes(p.module_code) &&
        ['read', 'create', 'update'].includes(p.action)
      ).map(p => p._id),
      branch_manager: () => permissions.filter(p => 
        ['dashboard', 'products', 'sales', 'inventory', 'finance', 'reports'].includes(p.module_code)
      ).map(p => p._id),
      operational_staff: () => permissions.filter(p => 
        ['dashboard', 'products', 'inventory'].includes(p.module_code) &&
        ['read', 'create', 'update'].includes(p.action)
      ).map(p => p._id),
      sales_staff: () => permissions.filter(p => 
        ['dashboard', 'products', 'sales'].includes(p.module_code) &&
        ['read', 'create'].includes(p.action)
      ).map(p => p._id),
      cashier: () => permissions.filter(p => 
        ['dashboard', 'sales', 'finance'].includes(p.module_code) &&
        ['read', 'create'].includes(p.action)
      ).map(p => p._id),
      finance_staff: () => permissions.filter(p => 
        ['dashboard', 'finance', 'reports'].includes(p.module_code) &&
        ['read', 'create', 'update'].includes(p.action)
      ).map(p => p._id)
    };

    // Create/update roles
    for (const roleData of roleTemplates) {
      try {
        // Check if role already exists
        let role = await Role.findOne({
          name: roleData.name,
          level: roleData.level,
          branch_id: roleData.branch_id
        });

        if (role) {
          console.log(`Role "${roleData.name}" already exists, updating...`);
          // Update existing role with new fields
          role.level = roleData.level;
          role.status = roleData.status;
          role.description = roleData.description;
          await role.save();
        } else {
          console.log(`Creating new role: ${roleData.name}`);
          role = new Role({
            name: roleData.name,
            description: roleData.description,
            level: roleData.level,
            branch_id: roleData.branch_id,
            division_id: roleData.division_id,
            position_id: roleData.position_id,
            status: roleData.status,
            isActive: roleData.status === 'active'
          });
          await role.save();
        }

        // Update permissions only if role is active
        if (roleData.status === 'active' && permissionSets[roleData.permissionLevel]) {
          // Check if permissions already exist
          const existingPermissionCount = await RolePermission.countDocuments({ role_id: role._id });
          
          if (existingPermissionCount === 0) {
            console.log(`Setting up permissions for role: ${role.name}`);
            const rolePermissions = permissionSets[roleData.permissionLevel]().map(permissionId => ({
              role_id: role._id,
              permission_id: permissionId,
              allowed: true
            }));
            
            if (rolePermissions.length > 0) {
              await RolePermission.insertMany(rolePermissions);
              console.log(`Added ${rolePermissions.length} permissions to role: ${role.name}`);
            }
          } else {
            console.log(`Permissions already exist for role: ${role.name} (${existingPermissionCount} permissions)`);
          }
        }
      } catch (error) {
        console.error(`Error processing role ${roleData.name}:`, error.message);
      }
    }

    // Create role hierarchy examples (parent-child relationships)
    console.log('\nSetting up role hierarchies...');
    
    const adminPusat = await Role.findOne({ name: 'Admin Pusat' });
    const adminCabangJkt = await Role.findOne({ name: 'Admin Cabang Jakarta' });
    const staffOpsJkt = await Role.findOne({ name: 'Staff Operasional Jakarta' });

    if (adminPusat && adminCabangJkt && !adminCabangJkt.parent_role_id) {
      adminCabangJkt.parent_role_id = adminPusat._id;
      await adminCabangJkt.save();
      console.log('Set Admin Pusat as parent of Admin Cabang Jakarta');
    }

    if (adminCabangJkt && staffOpsJkt && !staffOpsJkt.parent_role_id) {
      staffOpsJkt.parent_role_id = adminCabangJkt._id;
      await staffOpsJkt.save();
      console.log('Set Admin Cabang Jakarta as parent of Staff Operasional Jakarta');
    }

    // Summary
    const roleCount = await Role.countDocuments();
    const activeRoleCount = await Role.countDocuments({ status: 'active', isActive: true });
    const pusatRoleCount = await Role.countDocuments({ level: 'pusat' });
    const cabangRoleCount = await Role.countDocuments({ level: 'cabang' });

    console.log('\n=== ROLE SEEDING COMPLETE ===');
    console.log(`Total roles in database: ${roleCount}`);
    console.log(`Active roles: ${activeRoleCount}`);
    console.log(`Pusat roles: ${pusatRoleCount}`);
    console.log(`Cabang roles: ${cabangRoleCount}`);
    console.log('\nDefault roles have been created with appropriate permissions.');
    console.log('Template roles are created as inactive and can be activated when needed.');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding roles:', error);
    process.exit(1);
  }
}

// Run the seeder
seedRoles();