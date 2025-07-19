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

    // Clear existing data (optional - comment out if you want to preserve data)
    console.log('Clearing existing data...');
    // await Branch.deleteMany({});
    // await Division.deleteMany({});
    // await Position.deleteMany({});
    // await Module.deleteMany({});
    // await Permission.deleteMany({});
    // await Role.deleteMany({});
    // await RolePermission.deleteMany({});
    await User.deleteMany({});

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

    // Create Roles
    console.log('Creating roles...');
    const roles = [];
    const hashedPassword = await bcrypt.hash('password123', 12);

    // 1. Direktur Utama Role (Pusat)
    const direktorRole = await Role.create({
      name: 'Direktur Utama',
      description: 'Chief Executive Officer - Full System Access',
      branch_id: pusatBranch._id,
      division_id: divisions.find(d => d.code === 'DIR')._id,
      position_id: positions.find(p => p.code === 'CEO')._id
    });

    // Give all permissions to Direktur Utama
    const direktorPermissions = createdPermissions.map(permission => ({
      role_id: direktorRole._id,
      permission_id: permission._id,
      allowed: true
    }));
    await RolePermission.insertMany(direktorPermissions);

    // 2. Manager Operasional (Pusat)
    const mgrOperasionalRole = await Role.create({
      name: 'Manager Operasional',
      description: 'Operational Manager - Pusat',
      branch_id: pusatBranch._id,
      division_id: divisions.find(d => d.code === 'OPS')._id,
      position_id: positions.find(p => p.code === 'MGR')._id
    });

    // Give operational-related permissions
    const opsModules = ['dashboard', 'products', 'inventory', 'purchasing', 'reports'];
    const mgrOpsPermissions = createdPermissions
      .filter(p => opsModules.includes(p.module_code))
      .map(permission => ({
        role_id: mgrOperasionalRole._id,
        permission_id: permission._id,
        allowed: true
      }));
    await RolePermission.insertMany(mgrOpsPermissions);

    // 3. Manager Pemasaran (Pusat)
    const mgrPemasaranRole = await Role.create({
      name: 'Manager Pemasaran',
      description: 'Marketing Manager - Pusat',
      branch_id: pusatBranch._id,
      division_id: divisions.find(d => d.code === 'MKT')._id,
      position_id: positions.find(p => p.code === 'MGR')._id
    });

    // Give marketing-related permissions
    const mktModules = ['dashboard', 'products', 'sales', 'reports'];
    const mgrMktPermissions = createdPermissions
      .filter(p => mktModules.includes(p.module_code))
      .map(permission => ({
        role_id: mgrPemasaranRole._id,
        permission_id: permission._id,
        allowed: true
      }));
    await RolePermission.insertMany(mgrMktPermissions);

    // 4. Manager Keuangan (Pusat)
    const mgrKeuanganRole = await Role.create({
      name: 'Manager Keuangan',
      description: 'Finance Manager - Pusat',
      branch_id: pusatBranch._id,
      division_id: divisions.find(d => d.code === 'FIN')._id,
      position_id: positions.find(p => p.code === 'MGR')._id
    });

    // Give finance-related permissions
    const finModules = ['dashboard', 'finance', 'reports', 'sales', 'purchasing'];
    const mgrFinPermissions = createdPermissions
      .filter(p => finModules.includes(p.module_code))
      .map(permission => ({
        role_id: mgrKeuanganRole._id,
        permission_id: permission._id,
        allowed: true
      }));
    await RolePermission.insertMany(mgrFinPermissions);

    // 5. Manager Administrasi (Pusat)
    const mgrAdministrasiRole = await Role.create({
      name: 'Manager Administrasi',
      description: 'Administration Manager - Pusat',
      branch_id: pusatBranch._id,
      division_id: divisions.find(d => d.code === 'ADM')._id,
      position_id: positions.find(p => p.code === 'MGR')._id
    });

    // Give admin-related permissions
    const admModules = ['dashboard', 'users', 'branches', 'reports'];
    const mgrAdmPermissions = createdPermissions
      .filter(p => admModules.includes(p.module_code) && p.action === 'read')
      .map(permission => ({
        role_id: mgrAdministrasiRole._id,
        permission_id: permission._id,
        allowed: true
      }));
    await RolePermission.insertMany(mgrAdmPermissions);

    // 6. Manager HRD (Pusat)
    const mgrHRDRole = await Role.create({
      name: 'Manager HRD',
      description: 'Human Resources Manager - Pusat',
      branch_id: pusatBranch._id,
      division_id: divisions.find(d => d.code === 'HRD')._id,
      position_id: positions.find(p => p.code === 'MGR')._id
    });

    // Give HR-related permissions
    const hrdModules = ['dashboard', 'hr', 'users', 'reports'];
    const mgrHRDPermissions = createdPermissions
      .filter(p => hrdModules.includes(p.module_code))
      .map(permission => ({
        role_id: mgrHRDRole._id,
        permission_id: permission._id,
        allowed: true
      }));
    await RolePermission.insertMany(mgrHRDPermissions);

    // 7. Kepala Cabang Role (for each branch)
    const jakartaBranch = branches.find(b => b.code === 'JKT-01');
    const kepalaCabangRole = await Role.create({
      name: 'Kepala Cabang Jakarta',
      description: 'Branch Manager for Jakarta',
      branch_id: jakartaBranch._id,
      division_id: divisions.find(d => d.code === 'OPS')._id,
      position_id: positions.find(p => p.code === 'KCB')._id
    });

    // Give branch-level permissions
    const branchModules = ['dashboard', 'products', 'sales', 'inventory', 'reports'];
    const kcbPermissions = createdPermissions
      .filter(p => branchModules.includes(p.module_code))
      .map(permission => ({
        role_id: kepalaCabangRole._id,
        permission_id: permission._id,
        allowed: true
      }));
    await RolePermission.insertMany(kcbPermissions);

    // Create Users
    console.log('Creating users...');

    await User.insertMany([
      {
        username: 'direktur',
        firstname: 'Direktur',
        lastname: 'Utama',
        email: 'direktur@samudra.com',
        password: hashedPassword,
        branch: pusatBranch._id,
        division: divisions.find(d => d.code === 'DIR')._id,
        position: positions.find(p => p.code === 'CEO')._id,
        role: direktorRole._id
      },
      {
        username: 'mgr.ops',
        firstname: 'Manager',
        lastname: 'Operasional',
        email: 'mgr.operasional@samudra.com',
        password: hashedPassword,
        branch: pusatBranch._id,
        division: divisions.find(d => d.code === 'OPS')._id,
        position: positions.find(p => p.code === 'MGR')._id,
        role: mgrOperasionalRole._id
      },
      {
        username: 'mgr.mkt',
        firstname: 'Manager',
        lastname: 'Pemasaran',
        email: 'mgr.pemasaran@samudra.com',
        password: hashedPassword,
        branch: pusatBranch._id,
        division: divisions.find(d => d.code === 'MKT')._id,
        position: positions.find(p => p.code === 'MGR')._id,
        role: mgrPemasaranRole._id
      },
      {
        username: 'mgr.fin',
        firstname: 'Manager',
        lastname: 'Keuangan',
        email: 'mgr.keuangan@samudra.com',
        password: hashedPassword,
        branch: pusatBranch._id,
        division: divisions.find(d => d.code === 'FIN')._id,
        position: positions.find(p => p.code === 'MGR')._id,
        role: mgrKeuanganRole._id
      },
      {
        username: 'mgr.adm',
        firstname: 'Manager',
        lastname: 'Administrasi',
        email: 'mgr.administrasi@samudra.com',
        password: hashedPassword,
        branch: pusatBranch._id,
        division: divisions.find(d => d.code === 'ADM')._id,
        position: positions.find(p => p.code === 'MGR')._id,
        role: mgrAdministrasiRole._id
      },
      {
        username: 'mgr.hrd',
        firstname: 'Manager',
        lastname: 'HRD',
        email: 'mgr.hrd@samudra.com',
        password: hashedPassword,
        branch: pusatBranch._id,
        division: divisions.find(d => d.code === 'HRD')._id,
        position: positions.find(p => p.code === 'MGR')._id,
        role: mgrHRDRole._id
      },
      {
        username: 'kcb.jkt',
        firstname: 'Kepala',
        lastname: 'Cabang Jakarta',
        email: 'kcb.jakarta@samudra.com',
        password: hashedPassword,
        branch: jakartaBranch._id,
        division: divisions.find(d => d.code === 'OPS')._id,
        position: positions.find(p => p.code === 'KCB')._id,
        role: kepalaCabangRole._id
      }
    ]);

    // Manager Operasional
    await User.create({
      name: 'Manager Operasional',
      email: 'mgr.operasional@samudra.com',
      password: hashedPassword,
      branch_id: pusatBranch._id,
      division_id: divisions.find(d => d.code === 'OPS')._id,
      position_id: positions.find(p => p.code === 'MGR')._id,
      role_id: mgrOperasionalRole._id
    });

    // Manager Pemasaran
    await User.create({
      name: 'Manager Pemasaran',
      email: 'mgr.pemasaran@samudra.com',
      password: hashedPassword,
      branch_id: pusatBranch._id,
      division_id: divisions.find(d => d.code === 'MKT')._id,
      position_id: positions.find(p => p.code === 'MGR')._id,
      role_id: mgrPemasaranRole._id
    });

    // Manager Keuangan
    await User.create({
      name: 'Manager Keuangan',
      email: 'mgr.keuangan@samudra.com',
      password: hashedPassword,
      branch_id: pusatBranch._id,
      division_id: divisions.find(d => d.code === 'FIN')._id,
      position_id: positions.find(p => p.code === 'MGR')._id,
      role_id: mgrKeuanganRole._id
    });

    // Manager Administrasi
    await User.create({
      name: 'Manager Administrasi',
      email: 'mgr.administrasi@samudra.com',
      password: hashedPassword,
      branch_id: pusatBranch._id,
      division_id: divisions.find(d => d.code === 'ADM')._id,
      position_id: positions.find(p => p.code === 'MGR')._id,
      role_id: mgrAdministrasiRole._id
    });

    // Manager HRD
    await User.create({
      name: 'Manager HRD',
      email: 'mgr.hrd@samudra.com',
      password: hashedPassword,
      branch_id: pusatBranch._id,
      division_id: divisions.find(d => d.code === 'HRD')._id,
      position_id: positions.find(p => p.code === 'MGR')._id,
      role_id: mgrHRDRole._id
    });

    // Kepala Cabang Jakarta
    await User.create({
      name: 'Kepala Cabang Jakarta',
      email: 'kcb.jakarta@samudra.com',
      password: hashedPassword,
      branch_id: jakartaBranch._id,
      division_id: divisions.find(d => d.code === 'OPS')._id,
      position_id: positions.find(p => p.code === 'KCB')._id,
      role_id: kepalaCabangRole._id
    });

    console.log('Database seeded successfully!');
    console.log('\n=== LOGIN CREDENTIALS ===');
    console.log('\nDirektur Level:');
    console.log('1. Direktur Utama - email: direktur@samudra.com, password: password123');
    console.log('\nManager Level (Pusat):');
    console.log('2. Manager Operasional - email: mgr.operasional@samudra.com, password: password123');
    console.log('3. Manager Pemasaran - email: mgr.pemasaran@samudra.com, password: password123');
    console.log('4. Manager Keuangan - email: mgr.keuangan@samudra.com, password: password123');
    console.log('5. Manager Administrasi - email: mgr.administrasi@samudra.com, password: password123');
    console.log('6. Manager HRD - email: mgr.hrd@samudra.com, password: password123');
    console.log('\nCabang Level:');
    console.log('7. Kepala Cabang Jakarta - email: kcb.jakarta@samudra.com, password: password123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeder
seedDatabase();