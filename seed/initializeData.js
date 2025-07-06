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
const User = mongoose.model('User', require('../schemas/userSchema'));

const DB_HOST = process.env.DATABASE_HOST || 'localhost';
const DB_PORT = process.env.DATABASE_PORT || '27017';
const DB_NAME = process.env.DATABASE_NAME || 'samudra_app';

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(`mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`);
    console.log('Connected to MongoDB');

    // Clear existing data (optional - comment out if you want to preserve data)
    console.log('Clearing existing data...');
    await Branch.deleteMany({});
    await Division.deleteMany({});
    await Position.deleteMany({});
    await Module.deleteMany({});
    await Permission.deleteMany({});
    await Role.deleteMany({});
    await RolePermission.deleteMany({});
    await User.deleteMany({});

    // Create Branches
    console.log('Creating branches...');
    const branches = await Branch.insertMany([
      { name: 'Jakarta Pusat', code: 'JKT-01', address: 'Jl. Sudirman No. 1', phone: '021-1234567' },
      { name: 'Bandung', code: 'BDG-01', address: 'Jl. Asia Afrika No. 10', phone: '022-1234567' },
      { name: 'Surabaya', code: 'SBY-01', address: 'Jl. Tunjungan No. 5', phone: '031-1234567' }
    ]);

    // Create Divisions
    console.log('Creating divisions...');
    const divisions = await Division.insertMany([
      { name: 'Human Resources', code: 'HR', description: 'Human Resources Management' },
      { name: 'Finance', code: 'FIN', description: 'Financial Management' },
      { name: 'Operations', code: 'OPS', description: 'Operational Management' },
      { name: 'Sales', code: 'SLS', description: 'Sales and Marketing' },
      { name: 'Administration', code: 'ADM', description: 'Administrative Affairs' },
      { name: 'IT', code: 'IT', description: 'Information Technology' }
    ]);

    // Create Positions
    console.log('Creating positions...');
    const positions = await Position.insertMany([
      { name: 'Director', code: 'DIR', level: 1 },
      { name: 'Manager', code: 'MGR', level: 2 },
      { name: 'Supervisor', code: 'SPV', level: 3 },
      { name: 'Staff', code: 'STF', level: 4 },
      { name: 'Junior Staff', code: 'JST', level: 5 }
    ]);

    // Create Modules
    console.log('Creating modules...');
    const modules = await Module.insertMany([
      { name: 'Dashboard', code: 'dashboard', icon: 'bx bx-home', order: 1, route: '/dashboard' },
      { name: 'Products', code: 'products', icon: 'bx bx-box', order: 2, route: '/products' },
      { name: 'Sales', code: 'sales', icon: 'bx bx-cart', order: 3, route: '/sales' },
      { name: 'Purchasing', code: 'purchasing', icon: 'bx bx-shopping-bag', order: 4, route: '/purchasing' },
      { name: 'Inventory', code: 'inventory', icon: 'bx bx-package', order: 5, route: '/inventory' },
      { name: 'Finance', code: 'finance', icon: 'bx bx-dollar', order: 6, route: '/finance' },
      { name: 'Human Resources', code: 'hr', icon: 'bx bx-group', order: 7, route: '/hr' },
      { name: 'Reports', code: 'reports', icon: 'bx bx-bar-chart', order: 8, route: '/reports' },
      { name: 'Settings', code: 'settings', icon: 'bx bx-cog', order: 9, route: '/settings' },
      
      // Admin modules
      { name: 'Branches', code: 'branches', icon: 'bx bx-building', order: 10, route: '/admin/branches', parent_id: null },
      { name: 'Divisions', code: 'divisions', icon: 'bx bx-sitemap', order: 11, route: '/admin/divisions' },
      { name: 'Positions', code: 'positions', icon: 'bx bx-user-pin', order: 12, route: '/admin/positions' },
      { name: 'Users', code: 'users', icon: 'bx bx-user', order: 13, route: '/admin/users' },
      { name: 'Roles', code: 'roles', icon: 'bx bx-shield', order: 14, route: '/admin/roles' },
      { name: 'Modules', code: 'modules', icon: 'bx bx-grid-alt', order: 15, route: '/admin/modules' }
    ]);

    // Create Permissions for each module
    console.log('Creating permissions...');
    const actions = ['create', 'read', 'update', 'delete'];
    const permissions = [];

    for (const module of modules) {
      for (const action of actions) {
        permissions.push({
          module_name: module.name,
          module_code: module.code,
          action: action,
          description: `${action.charAt(0).toUpperCase() + action.slice(1)} ${module.name}`
        });
      }
    }

    // Add special permissions
    permissions.push(
      { module_name: 'Reports', module_code: 'reports', action: 'export', description: 'Export Reports' },
      { module_name: 'Products', module_code: 'products', action: 'import', description: 'Import Products' },
      { module_name: 'Sales', module_code: 'sales', action: 'approve', description: 'Approve Sales Orders' },
      { module_name: 'Purchasing', module_code: 'purchasing', action: 'approve', description: 'Approve Purchase Orders' }
    );

    const createdPermissions = await Permission.insertMany(permissions);

    // Create Roles
    console.log('Creating roles...');
    const roles = [];

    // Create Super Admin role for each branch
    for (const branch of branches) {
      const adminRole = await Role.create({
        name: `Super Admin - ${branch.name}`,
        description: `Super Administrator for ${branch.name}`,
        branch_id: branch._id,
        division_id: divisions.find(d => d.code === 'IT')._id,
        position_id: positions.find(p => p.code === 'DIR')._id
      });
      roles.push(adminRole);

      // Give all permissions to Super Admin
      const rolePermissions = createdPermissions.map(permission => ({
        role_id: adminRole._id,
        permission_id: permission._id,
        allowed: true
      }));
      await RolePermission.insertMany(rolePermissions);
    }

    // Create specific roles for Jakarta branch
    const jakartaBranch = branches.find(b => b.code === 'JKT-01');
    
    // Sales Staff Role
    const salesStaffRole = await Role.create({
      name: 'Sales Staff - Jakarta',
      description: 'Sales Staff for Jakarta Branch',
      branch_id: jakartaBranch._id,
      division_id: divisions.find(d => d.code === 'SLS')._id,
      position_id: positions.find(p => p.code === 'STF')._id
    });

    // Give limited permissions to Sales Staff
    const salesPermissions = createdPermissions.filter(p => 
      ['dashboard', 'products', 'sales'].includes(p.module_code) && 
      ['read', 'create', 'update'].includes(p.action)
    );
    
    for (const permission of salesPermissions) {
      await RolePermission.create({
        role_id: salesStaffRole._id,
        permission_id: permission._id,
        allowed: true
      });
    }

    // Finance Manager Role
    const financeManagerRole = await Role.create({
      name: 'Finance Manager - Jakarta',
      description: 'Finance Manager for Jakarta Branch',
      branch_id: jakartaBranch._id,
      division_id: divisions.find(d => d.code === 'FIN')._id,
      position_id: positions.find(p => p.code === 'MGR')._id
    });

    // Give finance-related permissions
    const financePermissions = createdPermissions.filter(p => 
      ['dashboard', 'finance', 'reports', 'purchasing', 'sales'].includes(p.module_code)
    );
    
    for (const permission of financePermissions) {
      await RolePermission.create({
        role_id: financeManagerRole._id,
        permission_id: permission._id,
        allowed: true
      });
    }

    // Create Users
    console.log('Creating users...');
    const hashedPassword = await bcrypt.hash('password123', 12);

    // Super Admin User
    const superAdminRole = roles[0]; // First role is super admin for Jakarta
    await User.create({
      name: 'Super Admin',
      email: 'admin@samudra.com',
      password: hashedPassword,
      branch_id: jakartaBranch._id,
      division_id: divisions.find(d => d.code === 'IT')._id,
      position_id: positions.find(p => p.code === 'DIR')._id,
      role_id: superAdminRole._id
    });

    // Sales Staff User
    await User.create({
      name: 'John Doe',
      email: 'john.doe@samudra.com',
      password: hashedPassword,
      branch_id: jakartaBranch._id,
      division_id: divisions.find(d => d.code === 'SLS')._id,
      position_id: positions.find(p => p.code === 'STF')._id,
      role_id: salesStaffRole._id
    });

    // Finance Manager User
    await User.create({
      name: 'Jane Smith',
      email: 'jane.smith@samudra.com',
      password: hashedPassword,
      branch_id: jakartaBranch._id,
      division_id: divisions.find(d => d.code === 'FIN')._id,
      position_id: positions.find(p => p.code === 'MGR')._id,
      role_id: financeManagerRole._id
    });

    console.log('Database seeded successfully!');
    console.log('\nDefault users created:');
    console.log('1. Super Admin - email: admin@samudra.com, password: password123');
    console.log('2. Sales Staff - email: john.doe@samudra.com, password: password123');
    console.log('3. Finance Manager - email: jane.smith@samudra.com, password: password123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeder
seedDatabase();