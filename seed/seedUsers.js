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
const DB_NAME = process.env.DATABASE_NAME || 'samudrav1';

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(`mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`);
    console.log('Connected to MongoDB');

    // Clear existing data by dropping collections
    console.log('Clearing existing data by dropping collections...');
    const collections = [User, RolePermission, Role, Permission, Module, Position, Division, Branch];
    for (const collection of collections) {
        try {
            await collection.collection.drop();
            console.log(`Dropped ${collection.modelName} collection.`);
        } catch (error) {
            if (error.code === 26) {
                console.log(`${collection.modelName} collection did not exist, skipping drop.`);
            } else {
                throw error;
            }
        }
    }

    // Create Branches (including Pusat)
    console.log('Creating branches...');
    const branches = await Branch.insertMany([
      { name: 'Kantor Pusat', code: 'PUSAT', type: 'pusat', address: 'Jl. Sudirman No. 1', phone: '021-1234567' },
      { name: 'Jakarta', code: 'JKT-01', type: 'cabang', address: 'Jl. Asia Afrika No. 1', phone: '021-7654321' },
      { name: 'Bandung', code: 'BDG-01', type: 'cabang', address: 'Jl. Asia Afrika No. 10', phone: '022-1234567' },
      { name: 'Surabaya', code: 'SBY-01', type: 'cabang', address: 'Jl. Tunjungan No. 5', phone: '031-1234567' }
    ]);

    const pusatBranch = branches.find(b => b.type === 'pusat');

    // Create Divisions
    console.log('Creating divisions...');
    const divisions = await Division.insertMany([
      { name: 'Direktur', code: 'DIR', description: 'Board of Directors' },
      { name: 'Operasional', code: 'OPS', description: 'Operational Management' },
      { name: 'Pemasaran', code: 'MKT', description: 'Marketing and Sales' },
      { name: 'Keuangan', code: 'FIN', description: 'Financial Management' },
      { name: 'Administrasi', code: 'ADM', description: 'Administrative Affairs' },
      { name: 'HRD', code: 'HRD', description: 'Human Resources Development' },
      { name: 'IT', code: 'IT', description: 'Information Technology' }
    ]);

    // Create Positions
    console.log('Creating positions...');
    const positions = await Position.insertMany([
      { name: 'Direktur Utama', code: 'CEO', level: 1 },
      { name: 'Manager', code: 'MGR', level: 2 },
      { name: 'Kepala Cabang', code: 'KCB', level: 3 },
      { name: 'Kepala Gudang', code: 'KGD', level: 4 },
      { name: 'Kepala Administrasi', code: 'KAD', level: 4 },
      { name: 'Checker', code: 'CHK', level: 5 },
      { name: 'Penjualan', code: 'PJL', level: 5 },
      { name: 'Kasir', code: 'KSR', level: 5 },
      { name: 'Debt Collector', code: 'DCL', level: 5 },
      { name: 'Kuli', code: 'KLI', level: 6 },
      { name: 'Kenek', code: 'KNK', level: 6 },
      { name: 'Supir', code: 'SPR', level: 6 },
      { name: 'Staff', code: 'STF', level: 5 }
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
      { name: 'Branches', code: 'branches', icon: 'bx bx-building', order: 10, route: '/admin/branches' },
      { name: 'Divisions', code: 'divisions', icon: 'bx bx-sitemap', order: 11, route: '/admin/divisions' },
      { name: 'Positions', code: 'positions', icon: 'bx bx-user-pin', order: 12, route: '/admin/positions' },
      { name: 'Users', code: 'users', icon: 'bx bx-user', order: 13, route: '/admin/users' },
      { name: 'Roles', code: 'roles', icon: 'bx bx-shield', order: 14, route: '/admin/roles' },
      { name: 'Modules', code: 'modules', icon: 'bx bx-grid-alt', order: 15, route: '/settings/modules' }
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

    // Hash a generic password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create a Super Admin Role
    console.log('Creating super admin role...');
    const superAdminRole = await Role.create({
      name: 'Super Administrator',
      description: 'Has all permissions across all branches',
      branch_id: pusatBranch._id, // Tied to pusat for context, but isSuperAdmin grants global access
      division_id: divisions.find(d => d.code === 'IT')._id,
      position_id: positions.find(p => p.code === 'CEO')._id,
      isSuperAdmin: true,
      isActive: true
    });

    // Assign all permissions to Super Admin role
    const allPermissions = await Permission.find({});
    const rolePermissionsSuperAdmin = allPermissions.map(p => ({
      role_id: superAdminRole._id,
      permission_id: p._id
    }));
    await RolePermission.insertMany(rolePermissionsSuperAdmin);

    // Create other specific roles
    console.log('Creating specific roles...');
    const jakartaBranch = branches.find(b => b.code === 'JKT-01');

    const direkturRole = await Role.create({ name: 'Direktur Utama', branch_id: pusatBranch._id, division_id: divisions.find(d => d.code === 'DIR')._id, position_id: positions.find(p => p.code === 'CEO')._id });
    const mgrOperasionalRole = await Role.create({ name: 'Manager Operasional', branch_id: pusatBranch._id, division_id: divisions.find(d => d.code === 'OPS')._id, position_id: positions.find(p => p.code === 'MGR')._id });
    const mgrPemasaranRole = await Role.create({ name: 'Manager Pemasaran', branch_id: pusatBranch._id, division_id: divisions.find(d => d.code === 'MKT')._id, position_id: positions.find(p => p.code === 'MGR')._id });
    const mgrKeuanganRole = await Role.create({ name: 'Manager Keuangan', branch_id: pusatBranch._id, division_id: divisions.find(d => d.code === 'FIN')._id, position_id: positions.find(p => p.code === 'MGR')._id });
    const mgrAdministrasiRole = await Role.create({ name: 'Manager Administrasi', branch_id: pusatBranch._id, division_id: divisions.find(d => d.code === 'ADM')._id, position_id: positions.find(p => p.code === 'MGR')._id });
    const mgrHRDRole = await Role.create({ name: 'Manager HRD', branch_id: pusatBranch._id, division_id: divisions.find(d => d.code === 'HRD')._id, position_id: positions.find(p => p.code === 'MGR')._id });
    const kepalaCabangRole = await Role.create({ name: 'Kepala Cabang', branch_id: jakartaBranch._id, division_id: divisions.find(d => d.code === 'OPS')._id, position_id: positions.find(p => p.code === 'KCB')._id });



    // Create Users
    console.log('Creating users...');
    const usersToCreate = [
      {
        username: 'admin',
        firstname: 'Super',
        lastname: 'Admin',
        email: 'admin@samudra.com',
        password: hashedPassword,
        phoneNumber: '081200000001',
        photoProfile: null,
        status: true, // Pusat
        branch_id: null,
        division_id: divisions.find(d => d.code === 'IT')._id,
        position_id: positions.find(p => p.code === 'CEO')._id,
        role_id: superAdminRole._id,
        isActive: true
      },
      {
        username: 'dir.utama',
        firstname: 'Direktur',
        lastname: 'Utama',
        email: 'direktur@samudra.com',
        password: hashedPassword,
        phoneNumber: '081200000002',
        photoProfile: null,
        status: true, // Pusat
        branch_id: null,
        division_id: divisions.find(d => d.code === 'DIR')._id,
        position_id: positions.find(p => p.code === 'CEO')._id,
        role_id: direkturRole._id,
        isActive: true
      },
      {
        username: 'mgr.ops',
        firstname: 'Manager',
        lastname: 'Operasional',
        email: 'mgr.operasional@samudra.com',
        password: hashedPassword,
        phoneNumber: '081200000003',
        photoProfile: null,
        status: true, // Pusat
        branch_id: null,
        division_id: divisions.find(d => d.code === 'OPS')._id,
        position_id: positions.find(p => p.code === 'MGR')._id,
        role_id: mgrOperasionalRole._id,
        isActive: true
      },
      {
        username: 'mgr.mkt',
        firstname: 'Manager',
        lastname: 'Pemasaran',
        email: 'mgr.pemasaran@samudra.com',
        password: hashedPassword,
        phoneNumber: '081200000004',
        photoProfile: null,
        status: true, // Pusat
        branch_id: null,
        division_id: divisions.find(d => d.code === 'MKT')._id,
        position_id: positions.find(p => p.code === 'MGR')._id,
        role_id: mgrPemasaranRole._id,
        isActive: true
      },
      {
        username: 'mgr.fin',
        firstname: 'Manager',
        lastname: 'Keuangan',
        email: 'mgr.keuangan@samudra.com',
        password: hashedPassword,
        phoneNumber: '081200000005',
        photoProfile: null,
        status: true, // Pusat
        branch_id: null,
        division_id: divisions.find(d => d.code === 'FIN')._id,
        position_id: positions.find(p => p.code === 'MGR')._id,
        role_id: mgrKeuanganRole._id,
        isActive: true
      },
      {
        username: 'mgr.adm',
        firstname: 'Manager',
        lastname: 'Administrasi',
        email: 'mgr.administrasi@samudra.com',
        password: hashedPassword,
        phoneNumber: '081200000006',
        photoProfile: null,
        status: true, // Pusat
        branch_id: null,
        division_id: divisions.find(d => d.code === 'ADM')._id,
        position_id: positions.find(p => p.code === 'MGR')._id,
        role_id: mgrAdministrasiRole._id,
        isActive: true
      },
      {
        username: 'mgr.hrd',
        firstname: 'Manager',
        lastname: 'HRD',
        email: 'mgr.hrd@samudra.com',
        password: hashedPassword,
        phoneNumber: '081200000007',
        photoProfile: null,
        status: true, // Pusat
        branch_id: null,
        division_id: divisions.find(d => d.code === 'HRD')._id,
        position_id: positions.find(p => p.code === 'MGR')._id,
        role_id: mgrHRDRole._id,
        isActive: true
      },
      {
        username: 'kcb.jkt',
        firstname: 'Kepala',
        lastname: 'Cabang Jakarta',
        email: 'kcb.jakarta@samudra.com',
        password: hashedPassword,
        phoneNumber: '081300000001',
        photoProfile: null,
        status: false, // Cabang
        branch_id: jakartaBranch._id,
        division_id: divisions.find(d => d.code === 'OPS')._id,
        position_id: positions.find(p => p.code === 'KCB')._id,
        role_id: kepalaCabangRole._id,
        isActive: true
      }
    ];

    await User.insertMany(usersToCreate);

    console.log('Database seeded successfully!');
    console.log('\n=== LOGIN CREDENTIALS ===');
    console.log('Password for all users: password123');
    console.log('\nSuper Admin:');
    console.log('- User: admin, Email: admin@samudra.com');
    console.log('\nDirektur Level (Pusat):');
    console.log('- User: dir.utama, Email: direktur@samudra.com');
    console.log('\nManager Level (Pusat):');
    console.log('- User: mgr.ops, Email: mgr.operasional@samudra.com');
    console.log('- User: mgr.mkt, Email: mgr.pemasaran@samudra.com');
    console.log('- User: mgr.fin, Email: mgr.keuangan@samudra.com');
    console.log('- User: mgr.adm, Email: mgr.administrasi@samudra.com');
    console.log('- User: mgr.hrd, Email: mgr.hrd@samudra.com');
    console.log('\nCabang Level:');
    console.log('- User: kcb.jkt, Email: kcb.jakarta@samudra.com');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeder
seedDatabase();