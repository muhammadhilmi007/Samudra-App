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

// Helper functions for generating random data
function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomKTP() {
  // Format KTP: 16 digits
  let ktp = '32';
  for (let i = 0; i < 14; i++) {
    ktp += Math.floor(Math.random() * 10);
  }
  return ktp;
}

function generateRandomSIM() {
  // Format SIM: 12 digits
  let sim = '';
  for (let i = 0; i < 12; i++) {
    sim += Math.floor(Math.random() * 10);
  }
  return sim;
}

function generateRandomNPWP() {
  // Format NPWP: XX.XXX.XXX.X-XXX.XXX
  const part1 = String(getRandomInt(0, 99)).padStart(2, '0');
  const part2 = String(getRandomInt(0, 999)).padStart(3, '0');
  const part3 = String(getRandomInt(0, 999)).padStart(3, '0');
  const part4 = String(getRandomInt(0, 9));
  const part5 = String(getRandomInt(0, 999)).padStart(3, '0');
  const part6 = String(getRandomInt(0, 999)).padStart(3, '0');
  
  return `${part1}.${part2}.${part3}.${part4}-${part5}.${part6}`;
}

function generateRandomPhoneNumber() {
  // Format: 08XXXXXXXXXX (Indonesian mobile number)
  // The regex pattern requires: ^(\+62|62|0)8[1-9][0-9]{6,9}$
  // So the digit after '8' must be 1-9, not 0
  let phone = '08';
  // Add a random digit between 1-9 (not 0) after the prefix
  phone += getRandomInt(1, 9);
  // Add 8-9 more random digits
  const remainingDigits = getRandomInt(8, 9);
  for (let i = 0; i < remainingDigits; i++) {
    phone += Math.floor(Math.random() * 10);
  }
  return phone;
}

function generateRandomEmail(firstname, lastname) {
  const domains = ['samudra.com', 'samudra.co.id', 'samudralogistics.com'];
  const domain = getRandomElement(domains);
  return `${firstname.toLowerCase()}.${lastname.toLowerCase()}@${domain}`;
}

async function seedRandomEmployees(count = 20) {
  try {
    // Connect to MongoDB
    await mongoose.connect(`mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`);
    console.log('Connected to MongoDB');

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

    console.log(`Creating ${count} random employees...`);

    // Create directory for employee photos if it doesn't exist
    const uploadDir = path.join(__dirname, '../public/uploads/employees');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Create directory for certificates if it doesn't exist
    const certificateDir = path.join(__dirname, '../public/uploads/certificates');
    if (!fs.existsSync(certificateDir)) {
      fs.mkdirSync(certificateDir, { recursive: true });
    }

    // Sample data for random generation
    const maleFirstnames = ['Budi', 'Ahmad', 'Dedi', 'Eko', 'Fajar', 'Gunawan', 'Hadi', 'Irwan', 'Joko', 'Kurniawan', 'Lukman', 'Muhammad', 'Nanda', 'Oki', 'Purnomo', 'Rudi', 'Santoso', 'Tono', 'Umar', 'Wahyu'];
    
    const femaleFirstnames = ['Ani', 'Bintang', 'Citra', 'Dewi', 'Endang', 'Fitri', 'Gita', 'Hana', 'Indah', 'Juwita', 'Kartika', 'Lina', 'Maya', 'Nita', 'Oktavia', 'Putri', 'Ratna', 'Siti', 'Tari', 'Utami'];
    
    const lastnames = ['Agustina', 'Budiman', 'Cahyono', 'Darma', 'Effendi', 'Firmansyah', 'Gunawan', 'Hartono', 'Irawan', 'Jaya', 'Kusuma', 'Lestari', 'Mulyadi', 'Nugroho', 'Pratama', 'Ramadhan', 'Saputra', 'Thamrin', 'Utomo', 'Wijaya', 'Yuliana', 'Zulkarnain'];
    
    const cities = [
      { city: 'Jakarta', district: 'Jakarta Pusat', province: 'DKI Jakarta', postalCode: '10110' },
      { city: 'Jakarta', district: 'Jakarta Selatan', province: 'DKI Jakarta', postalCode: '12190' },
      { city: 'Jakarta', district: 'Jakarta Timur', province: 'DKI Jakarta', postalCode: '13210' },
      { city: 'Jakarta', district: 'Jakarta Barat', province: 'DKI Jakarta', postalCode: '11220' },
      { city: 'Jakarta', district: 'Jakarta Utara', province: 'DKI Jakarta', postalCode: '14240' },
      { city: 'Surabaya', district: 'Genteng', province: 'Jawa Timur', postalCode: '60275' },
      { city: 'Surabaya', district: 'Tegalsari', province: 'Jawa Timur', postalCode: '60264' },
      { city: 'Bandung', district: 'Bandung Wetan', province: 'Jawa Barat', postalCode: '40111' },
      { city: 'Bandung', district: 'Coblong', province: 'Jawa Barat', postalCode: '40132' },
      { city: 'Medan', district: 'Medan Kota', province: 'Sumatera Utara', postalCode: '20212' },
      { city: 'Makassar', district: 'Makassar', province: 'Sulawesi Selatan', postalCode: '90111' },
      { city: 'Semarang', district: 'Semarang Tengah', province: 'Jawa Tengah', postalCode: '50138' }
    ];
    
    const streets = ['Jl. Merdeka', 'Jl. Sudirman', 'Jl. Thamrin', 'Jl. Gatot Subroto', 'Jl. Asia Afrika', 'Jl. Diponegoro', 'Jl. Ahmad Yani', 'Jl. Pahlawan', 'Jl. Veteran', 'Jl. Pemuda'];
    
    const trainingTitles = [
      { title: 'Manajemen Gudang', provider: 'Logistics Academy', duration: '5 days', isRequired: true },
      { title: 'Keselamatan Kerja', provider: 'K3 Indonesia', duration: '2 days', isRequired: true },
      { title: 'Sistem Inventory', provider: 'Supply Chain Institute', duration: '3 days', isRequired: false },
      { title: 'Akuntansi Dasar', provider: 'Finance Academy', duration: '5 days', isRequired: true },
      { title: 'Customer Service', provider: 'Service First', duration: '3 days', isRequired: false },
      { title: 'Manajemen Kas', provider: 'Finance Institute', duration: '2 days', isRequired: true },
      { title: 'Teknik Penjualan', provider: 'Sales Institute', duration: '5 days', isRequired: true },
      { title: 'Negosiasi Bisnis', provider: 'Business School', duration: '3 days', isRequired: false },
      { title: 'Digital Marketing', provider: 'Marketing Academy', duration: '4 days', isRequired: false },
      { title: 'Manajemen Administrasi', provider: 'Admin Academy', duration: '5 days', isRequired: true },
      { title: 'Microsoft Office', provider: 'Computer Training Center', duration: '5 days', isRequired: true },
      { title: 'Manajemen Arsip', provider: 'Document Management Institute', duration: '3 days', isRequired: false },
      { title: 'Defensive Driving', provider: 'Safety Driving Institute', duration: '3 days', isRequired: true },
      { title: 'Penanganan Barang', provider: 'Safety First', duration: '2 days', isRequired: true },
      { title: 'Perawatan Kendaraan', provider: 'Automotive Training Center', duration: '2 days', isRequired: false }
    ];
    
    const documentTypes = ['KTP', 'SIM', 'NPWP', 'BPJS', 'KK', 'Other'];
    
    // Create employees
    for (let i = 0; i < count; i++) {
      // Determine gender and select appropriate firstname
      const gender = Math.random() > 0.5 ? 'Male' : 'Female';
      const firstname = gender === 'Male' 
        ? getRandomElement(maleFirstnames) 
        : getRandomElement(femaleFirstnames);
      const lastname = getRandomElement(lastnames);
      
      // Generate random dates
      const now = new Date();
      const birthYear = now.getFullYear() - getRandomInt(20, 55);
      const birthdate = getRandomDate(
        new Date(birthYear, 0, 1),
        new Date(birthYear, 11, 31)
      );
      
      const joinYear = now.getFullYear() - getRandomInt(0, 10);
      const joinDate = getRandomDate(
        new Date(joinYear, 0, 1),
        new Date(joinYear, 11, 31)
      );
      
      // Generate random address
      const location = getRandomElement(cities);
      const street = `${getRandomElement(streets)} No. ${getRandomInt(1, 200)}`;
      
      // Generate contact information
      const email = generateRandomEmail(firstname, lastname);
      const phone = generateRandomPhoneNumber();
      const emergencyPhone = generateRandomPhoneNumber();
      
      // Select random branch, division, position
      const branch = getRandomElement(branches);
      const division = getRandomElement(divisions);
      const position = getRandomElement(positions);
      
      // Generate marital status
      const maritalStatus = getRandomElement(['Single', 'Married', 'Divorced', 'Widowed']);
      
      // Generate KTP and other IDs
      const noKTP = generateRandomKTP();
      const noSIM = Math.random() > 0.3 ? generateRandomSIM() : '';
      
      // Create a user for this employee if it doesn't exist
      const username = `${firstname.toLowerCase()}.${lastname.toLowerCase()}`;
      let user = await User.findOne({ username });
      
      if (!user) {
        // Find HRD manager to be the creator
        const hrdManager = users.find(u => u.username === 'mgrhrd') || users[0];
        
        // Determine user level based on branch type
        const userLevel = branch.type === 'pusat' ? 'Pusat' : 'Cabang';
        
        // Create user with conditional branch_id based on level
        user = await User.create({
          username: username,
          firstname: firstname,
          lastname: lastname,
          email: email,
          password: await mongoose.model('User').schema.methods.generateHash('P@ssw0rd!'),
          phoneNumber: phone,
          level: userLevel,
          // Set branch_id to null for Pusat level users
          branch_id: userLevel === 'Pusat' ? null : branch._id,
          division_id: division._id,
          position_id: position._id,
          role_id: users.find(u => 
            u.division_id?.toString() === division._id.toString() && 
            u.position_id?.toString() === position._id.toString()
          )?.role_id || users[0].role_id,
          isActive: true,
          createdAt: joinDate
        });
        
        console.log(`Created user: ${username}`);
      }

      // Check if employee already exists
      const existingEmployee = await Employee.findOne({ userId: user._id });
      if (existingEmployee) {
        console.log(`Employee already exists for ${firstname} ${lastname}, skipping...`);
        continue;
      }

      // Create employee
      const employee = new Employee({
        userId: user._id,
        username: user.username,
        firstname: firstname,
        lastname: lastname,
        birthdate: birthdate,
        gender: gender,
        maritalStatus: maritalStatus,
        address: {
          street: street,
          city: location.city,
          district: location.district,
          province: location.province,
          postalCode: location.postalCode,
          country: 'Indonesia'
        },
        contact: {
          noPhone: phone,
          noPhoneEmergency: emergencyPhone,
          email: email
        },
        positionId: position._id,
        branchId: branch._id,
        divisionId: division._id,
        joinDate: joinDate,
        noKTP: noKTP,
        noSIM: noSIM,
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

      // Add random documents (2-4 documents)
      const numDocuments = getRandomInt(2, 4);
      const selectedDocTypes = [];
      
      // Always add KTP
      selectedDocTypes.push('KTP');
      
      // Add other random document types
      while (selectedDocTypes.length < numDocuments) {
        const docType = getRandomElement(documentTypes.filter(dt => dt !== 'KTP'));
        if (!selectedDocTypes.includes(docType)) {
          selectedDocTypes.push(docType);
        }
      }
      
      for (const docType of selectedDocTypes) {
        const issuedDate = getRandomDate(
          new Date(joinDate.getFullYear() - 5, 0, 1),
          joinDate
        );
        
        let expiryDate = null;
        if (docType === 'KTP' || docType === 'SIM') {
          expiryDate = new Date(issuedDate);
          expiryDate.setFullYear(expiryDate.getFullYear() + 5);
        }
        
        let docNumber = '';
        switch (docType) {
          case 'KTP':
            docNumber = noKTP;
            break;
          case 'SIM':
            docNumber = noSIM || generateRandomSIM();
            break;
          case 'NPWP':
            docNumber = generateRandomNPWP();
            break;
          case 'BPJS':
            docNumber = '0001' + Math.floor(Math.random() * 10000000000);
            break;
          default:
            docNumber = String(Math.floor(Math.random() * 1000000000));
        }
        
        employee.documents.push({
          type: docType,
          number: docNumber,
          issuedDate: issuedDate,
          expiryDate: expiryDate,
          uploadedAt: joinDate
        });
      }

      // Add random training records (1-5 trainings)
      const numTrainings = getRandomInt(1, 5);
      const selectedTrainings = [];
      
      // Select random trainings without duplicates
      while (selectedTrainings.length < numTrainings) {
        const training = getRandomElement(trainingTitles);
        if (!selectedTrainings.find(t => t.title === training.title)) {
          selectedTrainings.push(training);
        }
      }
      
      for (const training of selectedTrainings) {
        const trainingDate = getRandomDate(
          new Date(joinDate.getTime()),
          new Date()
        );
        
        // Determine training status based on date
        let status;
        const today = new Date();
        const daysDiff = Math.floor((today - trainingDate) / (1000 * 60 * 60 * 24));
        
        if (trainingDate > today) {
          status = 'planned';
        } else if (daysDiff > 365 && Math.random() > 0.7) {
          status = 'expired';
        } else if (daysDiff < 30 && Math.random() > 0.5) {
          status = 'ongoing';
        } else {
          status = 'completed';
        }
        
        employee.trainingRecords.push({
          title: training.title,
          provider: training.provider,
          date: trainingDate,
          duration: training.duration,
          isRequired: training.isRequired,
          status: status
        });

        // Add training completion log if completed
        if (status === 'completed') {
          employee.logs.push({
            action: 'training_completed',
            date: trainingDate,
            description: `Completed training: ${training.title}`,
            changedBy: users.find(u => u.username === 'mgrhrd')?._id || users[0]._id
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
      console.log(`Created employee: ${employee.firstname} ${employee.lastname || ''} (${employee.employeeCode})`);
    }

    console.log('Random employees created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding random employees:', error);
    process.exit(1);
  }
}

// Run the seeder with 20 random employees
seedRandomEmployees(20);