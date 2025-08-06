require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Import schemas
const Branch = mongoose.model('Branch', require('../schemas/branchSchema'));
const Division = mongoose.model('Division', require('../schemas/divisionSchema'));
const Position = mongoose.model('Position', require('../schemas/positionSchema'));
const User = mongoose.model('User', require('../schemas/userSchema'));
const Employee = mongoose.model('Employee', require('../schemas/employeeSchema'));

const DB_HOST = process.env.DATABASE_HOST || 'localhost';
const DB_PORT = process.env.DATABASE_PORT || '27017';
const DB_NAME = process.env.DATABASE_NAME || 'samudrav1';

async function seedEmployees() {
  try {
    // Connect to MongoDB
    await mongoose.connect(`mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`);
    console.log('Connected to MongoDB');

    // Check if there are existing employees
    const employeeCount = await Employee.countDocuments();
    if (employeeCount > 0) {
      console.log(`Found ${employeeCount} existing employees. Skipping employee seeding.`);
      console.log('If you want to reseed employees, please delete existing employees first.');
      process.exit(0);
      return;
    }

    // Get existing data from database
    const branches = await Branch.find({ isActive: 'active' });
    const divisions = await Division.find({ isActive: true });
    const positions = await Position.find({ isActive: true });
    const users = await User.find({ isActive: true });

    if (!branches.length || !divisions.length || !positions.length || !users.length) {
      console.error('Required data (branches, divisions, positions, users) not found in database.');
      console.error('Please run initializeData.js first to seed the required data.');
      process.exit(1);
    }

    console.log('Creating employees...');

    // Create sample employees
    const employees = [];

    // Create directory for employee photos if it doesn't exist
    const uploadDir = path.join(__dirname, '../public/uploads/employees');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Helper function to get random item from array
    const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];
    
    // Helper function to generate random date within range
    const getRandomDate = (start, end) => {
      return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    };

    // Helper function to generate random Indonesian KTP number (16 digits)
    const generateRandomKTP = () => {
      let ktp = '';
      for (let i = 0; i < 16; i++) {
        ktp += Math.floor(Math.random() * 10);
      }
      return ktp;
    };

    // Helper function to generate random Indonesian phone number
    const generateRandomPhone = () => {
      return `08${Math.floor(Math.random() * 9) + 1}${Array(9).fill(0).map(() => Math.floor(Math.random() * 10)).join('')}`;
    };

    // Create employees for each user
    for (const user of users) {
      // Skip creating employee for user if they already have one
      const existingEmployee = await Employee.findOne({ userId: user._id });
      if (existingEmployee) continue;

      // Get position, division, and branch based on user's role
      const position = positions.find(p => p._id.toString() === user.position_id?.toString()) || getRandomItem(positions);
      const division = divisions.find(d => d._id.toString() === user.division_id?.toString()) || getRandomItem(divisions);
      
      // For branch, use user's branch or random branch (not null for employees)
      let branch = user.branch_id ? branches.find(b => b._id.toString() === user.branch_id.toString()) : null;
      if (!branch) {
        // For employees, we need a branch, so get a random non-pusat branch
        const branchCandidates = branches.filter(b => b.type === 'cabang');
        branch = branchCandidates.length ? getRandomItem(branchCandidates) : branches[0];
      }

      // Generate random dates
      const joinDate = getRandomDate(new Date(2018, 0, 1), new Date(2023, 0, 1));
      const birthYear = joinDate.getFullYear() - Math.floor(Math.random() * 30) - 20; // 20-50 years old at join date
      const birthdate = getRandomDate(new Date(birthYear, 0, 1), new Date(birthYear, 11, 31));

      // Generate random KTP and phone numbers
      const noKTP = generateRandomKTP();
      const noPhone = generateRandomPhone();
      const noPhoneEmergency = generateRandomPhone();

      // Create employee
      const employee = new Employee({
        userId: user._id,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        birthdate: birthdate,
        gender: Math.random() > 0.5 ? 'Male' : 'Female',
        maritalStatus: getRandomItem(['Single', 'Married', 'Divorced', 'Widowed']),
        address: {
          street: `Jl. ${getRandomItem(['Sudirman', 'Thamrin', 'Gatot Subroto', 'Asia Afrika', 'Diponegoro'])} No. ${Math.floor(Math.random() * 100) + 1}`,
          city: branch.address.city,
          district: branch.address.district,
          province: branch.address.province,
          postalCode: branch.address.postalCode,
          country: 'Indonesia'
        },
        contact: {
          noPhone: noPhone,
          noPhoneEmergency: noPhoneEmergency,
          noPhoneContact: Math.random() > 0.5 ? generateRandomPhone() : '',
          email: user.email
        },
        positionId: position._id,
        branchId: branch._id,
        divisionId: division._id,
        joinDate: joinDate,
        noKTP: noKTP,
        noSIM: Math.random() > 0.7 ? `${Math.floor(Math.random() * 900000000) + 100000000}` : '',
        isActive: true,
        status: 'Active',
        createdBy: users.find(u => u.username === 'mgrhrd')?._id || users[0]._id,
        // Generate employeeCode manually to ensure it's set
        employeeCode: `${branch.code}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0')}`
      });

      // Add employment history
      employee.employmentHistory.push({
        position: position._id,
        branch: branch._id,
        division: division._id,
        startDate: joinDate,
        reason: 'Initial employment',
        approvedBy: users.find(u => u.username === 'mgrhrd')?._id || users[0]._id
      });

      // Add sample documents
      if (Math.random() > 0.5) {
        employee.documents.push({
          type: 'KTP',
          number: noKTP,
          issuedDate: getRandomDate(new Date(birthYear + 17, 0, 1), joinDate),
          expiryDate: getRandomDate(new Date(), new Date(new Date().getFullYear() + 5, 0, 1)),
          uploadedAt: joinDate
        });
      }

      if (Math.random() > 0.7) {
        employee.documents.push({
          type: 'NPWP',
          number: `${Math.floor(Math.random() * 900000000) + 100000000}`,
          issuedDate: getRandomDate(new Date(birthYear + 18, 0, 1), joinDate),
          uploadedAt: joinDate
        });
      }

      // Add sample training records
      const trainingTypes = [
        { title: 'Orientasi Karyawan Baru', provider: 'Internal HR', duration: '2 days', isRequired: true },
        { title: 'Keselamatan Kerja', provider: 'K3 Indonesia', duration: '8 hours', isRequired: true },
        { title: 'Leadership Training', provider: 'Management Institute', duration: '3 days', isRequired: false },
        { title: 'Customer Service Excellence', provider: 'Service First', duration: '2 days', isRequired: false },
        { title: 'Microsoft Office', provider: 'Computer Training Center', duration: '5 days', isRequired: false },
        { title: 'Manajemen Gudang', provider: 'Logistics Academy', duration: '3 days', isRequired: false },
        { title: 'Penanganan Barang Berbahaya', provider: 'Safety First', duration: '1 day', isRequired: true },
        { title: 'Teknik Penjualan', provider: 'Sales Institute', duration: '2 days', isRequired: false }
      ];

      // Add 1-3 random training records
      const trainingCount = Math.floor(Math.random() * 3) + 1;
      const shuffledTrainings = [...trainingTypes].sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < trainingCount; i++) {
        if (i < shuffledTrainings.length) {
          const training = shuffledTrainings[i];
          const trainingDate = getRandomDate(joinDate, new Date());
          
          employee.trainingRecords.push({
            title: training.title,
            provider: training.provider,
            date: trainingDate,
            duration: training.duration,
            isRequired: training.isRequired,
            status: getRandomItem(['planned', 'ongoing', 'completed', 'expired'])
          });
        }
      }

      // Add creation log
      employee.logs.push({
        action: 'created',
        date: joinDate,
        description: 'Employee record created',
        changedBy: users.find(u => u.username === 'mgrhrd')?._id || users[0]._id
      });

      // Save employee
      await employee.save();
      employees.push(employee);

      console.log(`Created employee: ${employee.firstname} ${employee.lastname || ''} (${employee.employeeCode})`);
    }

    console.log(`Successfully created ${employees.length} employees.`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding employees:', error);
    process.exit(1);
  }
}

// Run the seeder
seedEmployees();