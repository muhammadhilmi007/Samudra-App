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

async function seedSampleEmployees() {
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

    console.log('Creating sample employees with detailed data...');

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

    // Sample employee data
    const sampleEmployees = [
      {
        firstname: 'Budi',
        lastname: 'Santoso',
        gender: 'Male',
        birthdate: new Date(1985, 5, 15),
        maritalStatus: 'Married',
        noKTP: '3275061506850009',
        noSIM: '850615123456',
        address: {
          street: 'Jl. Merdeka No. 123',
          city: 'Jakarta',
          district: 'Jakarta Pusat',
          province: 'DKI Jakarta',
          postalCode: '10110',
          country: 'Indonesia'
        },
        contact: {
          noPhone: '081234567890',
          noPhoneEmergency: '081234567891',
          noPhoneContact: '081234567892',
          email: 'budi.santoso@samudra.com'
        },
        branch: 'JKT-01',
        division: 'OPS',
        position: 'KGD',
        joinDate: new Date(2020, 1, 1),
        documents: [
          {
            type: 'KTP',
            number: '3275061506850009',
            issuedDate: new Date(2018, 5, 15),
            expiryDate: new Date(2023, 5, 15)
          },
          {
            type: 'SIM',
            number: '850615123456',
            issuedDate: new Date(2019, 3, 10),
            expiryDate: new Date(2024, 3, 10)
          },
          {
            type: 'NPWP',
            number: '09.876.543.2-123.000',
            issuedDate: new Date(2010, 7, 20)
          }
        ],
        trainingRecords: [
          {
            title: 'Manajemen Gudang Tingkat Lanjut',
            provider: 'Logistics Academy',
            date: new Date(2021, 3, 15),
            duration: '5 days',
            isRequired: true,
            status: 'completed'
          },
          {
            title: 'Keselamatan Kerja di Gudang',
            provider: 'K3 Indonesia',
            date: new Date(2020, 6, 10),
            duration: '2 days',
            isRequired: true,
            status: 'completed'
          },
          {
            title: 'Sistem Inventory Modern',
            provider: 'Supply Chain Institute',
            date: new Date(2022, 1, 5),
            duration: '3 days',
            isRequired: false,
            status: 'completed'
          }
        ]
      },
      {
        firstname: 'Siti',
        lastname: 'Rahayu',
        gender: 'Female',
        birthdate: new Date(1990, 8, 20),
        maritalStatus: 'Single',
        noKTP: '3275062009900008',
        address: {
          street: 'Jl. Sudirman No. 45',
          city: 'Jakarta',
          district: 'Jakarta Selatan',
          province: 'DKI Jakarta',
          postalCode: '12190',
          country: 'Indonesia'
        },
        contact: {
          noPhone: '081345678901',
          noPhoneEmergency: '081345678902',
          email: 'siti.rahayu@samudra.com'
        },
        branch: 'JKT-01',
        division: 'FIN',
        position: 'KSR',
        joinDate: new Date(2021, 3, 15),
        documents: [
          {
            type: 'KTP',
            number: '3275062009900008',
            issuedDate: new Date(2019, 8, 20),
            expiryDate: new Date(2024, 8, 20)
          },
          {
            type: 'NPWP',
            number: '09.123.456.7-123.000',
            issuedDate: new Date(2015, 5, 10)
          }
        ],
        trainingRecords: [
          {
            title: 'Akuntansi Dasar',
            provider: 'Finance Academy',
            date: new Date(2021, 5, 10),
            duration: '5 days',
            isRequired: true,
            status: 'completed'
          },
          {
            title: 'Customer Service Excellence',
            provider: 'Service First',
            date: new Date(2022, 2, 15),
            duration: '3 days',
            isRequired: false,
            status: 'completed'
          },
          {
            title: 'Manajemen Kas',
            provider: 'Finance Institute',
            date: new Date(2023, 1, 20),
            duration: '2 days',
            isRequired: true,
            status: 'ongoing'
          }
        ]
      },
      {
        firstname: 'Ahmad',
        lastname: 'Hidayat',
        gender: 'Male',
        birthdate: new Date(1988, 11, 10),
        maritalStatus: 'Married',
        noKTP: '3275061012880007',
        noSIM: '881210987654',
        address: {
          street: 'Jl. Asia Afrika No. 78',
          city: 'Bandung',
          district: 'Bandung Wetan',
          province: 'Jawa Barat',
          postalCode: '40111',
          country: 'Indonesia'
        },
        contact: {
          noPhone: '081456789012',
          noPhoneEmergency: '081456789013',
          noPhoneContact: '081456789014',
          email: 'ahmad.hidayat@samudra.com'
        },
        branch: 'BDG-01',
        division: 'MKT',
        position: 'PJL',
        joinDate: new Date(2019, 7, 1),
        documents: [
          {
            type: 'KTP',
            number: '3275061012880007',
            issuedDate: new Date(2017, 11, 10),
            expiryDate: new Date(2022, 11, 10)
          },
          {
            type: 'SIM',
            number: '881210987654',
            issuedDate: new Date(2018, 5, 15),
            expiryDate: new Date(2023, 5, 15)
          },
          {
            type: 'NPWP',
            number: '08.765.432.1-123.000',
            issuedDate: new Date(2012, 3, 20)
          },
          {
            type: 'BPJS',
            number: '0001234567890',
            issuedDate: new Date(2019, 8, 1)
          }
        ],
        trainingRecords: [
          {
            title: 'Teknik Penjualan Efektif',
            provider: 'Sales Institute',
            date: new Date(2019, 9, 15),
            duration: '5 days',
            isRequired: true,
            status: 'completed'
          },
          {
            title: 'Negosiasi Bisnis',
            provider: 'Business School',
            date: new Date(2020, 2, 10),
            duration: '3 days',
            isRequired: false,
            status: 'completed'
          },
          {
            title: 'Digital Marketing',
            provider: 'Marketing Academy',
            date: new Date(2021, 6, 5),
            duration: '4 days',
            isRequired: false,
            status: 'completed'
          },
          {
            title: 'Customer Relationship Management',
            provider: 'CRM Institute',
            date: new Date(2023, 3, 15),
            duration: '3 days',
            isRequired: true,
            status: 'planned'
          }
        ]
      },
      {
        firstname: 'Dewi',
        lastname: 'Anggraini',
        gender: 'Female',
        birthdate: new Date(1992, 2, 25),
        maritalStatus: 'Married',
        noKTP: '3275062503920006',
        address: {
          street: 'Jl. Tunjungan No. 25',
          city: 'Surabaya',
          district: 'Genteng',
          province: 'Jawa Timur',
          postalCode: '60275',
          country: 'Indonesia'
        },
        contact: {
          noPhone: '081567890123',
          noPhoneEmergency: '081567890124',
          email: 'dewi.anggraini@samudra.com'
        },
        branch: 'SBY-01',
        division: 'ADM',
        position: 'KAD',
        joinDate: new Date(2018, 5, 1),
        documents: [
          {
            type: 'KTP',
            number: '3275062503920006',
            issuedDate: new Date(2020, 2, 25),
            expiryDate: new Date(2025, 2, 25)
          },
          {
            type: 'NPWP',
            number: '08.123.456.7-123.000',
            issuedDate: new Date(2016, 4, 10)
          },
          {
            type: 'BPJS',
            number: '0001234567891',
            issuedDate: new Date(2018, 6, 1)
          }
        ],
        trainingRecords: [
          {
            title: 'Manajemen Administrasi',
            provider: 'Admin Academy',
            date: new Date(2018, 7, 15),
            duration: '5 days',
            isRequired: true,
            status: 'completed'
          },
          {
            title: 'Microsoft Office Advanced',
            provider: 'Computer Training Center',
            date: new Date(2019, 3, 10),
            duration: '5 days',
            isRequired: true,
            status: 'completed'
          },
          {
            title: 'Manajemen Arsip Digital',
            provider: 'Document Management Institute',
            date: new Date(2020, 8, 5),
            duration: '3 days',
            isRequired: false,
            status: 'completed'
          },
          {
            title: 'Leadership for Administrators',
            provider: 'Management Institute',
            date: new Date(2022, 5, 15),
            duration: '4 days',
            isRequired: false,
            status: 'completed'
          }
        ]
      },
      {
        firstname: 'Rudi',
        lastname: 'Hartono',
        gender: 'Male',
        birthdate: new Date(1987, 6, 30),
        maritalStatus: 'Divorced',
        noKTP: '3275063007870005',
        noSIM: '870730654321',
        address: {
          street: 'Jl. Diponegoro No. 56',
          city: 'Surabaya',
          district: 'Tegalsari',
          province: 'Jawa Timur',
          postalCode: '60264',
          country: 'Indonesia'
        },
        contact: {
          noPhone: '081678901234',
          noPhoneEmergency: '081678901235',
          email: 'rudi.hartono@samudra.com'
        },
        branch: 'SBY-01',
        division: 'OPS',
        position: 'SPR',
        joinDate: new Date(2017, 3, 15),
        documents: [
          {
            type: 'KTP',
            number: '3275063007870005',
            issuedDate: new Date(2016, 6, 30),
            expiryDate: new Date(2021, 6, 30)
          },
          {
            type: 'SIM',
            number: '870730654321',
            issuedDate: new Date(2019, 2, 15),
            expiryDate: new Date(2024, 2, 15)
          },
          {
            type: 'BPJS',
            number: '0001234567892',
            issuedDate: new Date(2017, 4, 1)
          }
        ],
        trainingRecords: [
          {
            title: 'Defensive Driving',
            provider: 'Safety Driving Institute',
            date: new Date(2017, 5, 10),
            duration: '3 days',
            isRequired: true,
            status: 'completed'
          },
          {
            title: 'Penanganan Barang Berbahaya',
            provider: 'Safety First',
            date: new Date(2018, 2, 15),
            duration: '2 days',
            isRequired: true,
            status: 'completed'
          },
          {
            title: 'Perawatan Kendaraan',
            provider: 'Automotive Training Center',
            date: new Date(2019, 7, 5),
            duration: '2 days',
            isRequired: false,
            status: 'completed'
          },
          {
            title: 'Keselamatan Berkendara Lanjutan',
            provider: 'Road Safety Institute',
            date: new Date(2021, 4, 20),
            duration: '3 days',
            isRequired: true,
            status: 'expired'
          },
          {
            title: 'Pembaruan Keselamatan Berkendara',
            provider: 'Road Safety Institute',
            date: new Date(2023, 6, 15),
            duration: '2 days',
            isRequired: true,
            status: 'planned'
          }
        ]
      }
    ];

    // Create employees
    for (const sampleData of sampleEmployees) {
      // Find branch, division, position
      const branch = branches.find(b => b.code === sampleData.branch);
      const division = divisions.find(d => d.code === sampleData.division);
      const position = positions.find(p => p.code === sampleData.position);
      
      if (!branch || !division || !position) {
        console.error(`Could not find branch, division, or position for ${sampleData.firstname} ${sampleData.lastname}`);
        continue;
      }

      // Create a user for this employee if it doesn't exist
      let user = await User.findOne({ email: sampleData.contact.email });
      
      if (!user) {
        // Find HRD manager to be the creator
        const hrdManager = users.find(u => u.username === 'mgrhrd');
        
        // Create username from firstname and lastname
        const username = `${sampleData.firstname.toLowerCase()}.${sampleData.lastname.toLowerCase()}`;
        
        // Create user
        user = await User.create({
          username: username,
          firstname: sampleData.firstname,
          lastname: sampleData.lastname,
          email: sampleData.contact.email,
          password: await mongoose.model('User').schema.methods.generateHash('P@ssw0rd!'),
          phoneNumber: sampleData.contact.noPhone,
          level: branch.type === 'pusat' ? 'Pusat' : 'Cabang',
          branch_id: branch._id,
          division_id: division._id,
          position_id: position._id,
          role_id: users.find(u => 
            u.division_id?.toString() === division._id.toString() && 
            u.position_id?.toString() === position._id.toString()
          )?.role_id || users[0].role_id,
          isActive: true,
          createdAt: sampleData.joinDate
        });
        
        console.log(`Created user: ${username}`);
      }

      // Check if employee already exists
      const existingEmployee = await Employee.findOne({ userId: user._id });
      if (existingEmployee) {
        console.log(`Employee already exists for ${sampleData.firstname} ${sampleData.lastname}, skipping...`);
        continue;
      }

      // Create employee
      const employee = new Employee({
        userId: user._id,
        username: user.username,
        firstname: sampleData.firstname,
        lastname: sampleData.lastname,
        birthdate: sampleData.birthdate,
        gender: sampleData.gender,
        maritalStatus: sampleData.maritalStatus,
        address: sampleData.address,
        contact: sampleData.contact,
        positionId: position._id,
        branchId: branch._id,
        divisionId: division._id,
        joinDate: sampleData.joinDate,
        noKTP: sampleData.noKTP,
        noSIM: sampleData.noSIM || '',
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
        startDate: sampleData.joinDate,
        reason: 'Initial employment',
        approvedBy: users.find(u => u.username === 'mgrhrd')?._id || users[0]._id
      });

      // Add documents
      if (sampleData.documents && sampleData.documents.length) {
        for (const doc of sampleData.documents) {
          employee.documents.push({
            type: doc.type,
            number: doc.number,
            issuedDate: doc.issuedDate,
            expiryDate: doc.expiryDate,
            uploadedAt: sampleData.joinDate
          });
        }
      }

      // Add training records
      if (sampleData.trainingRecords && sampleData.trainingRecords.length) {
        for (const training of sampleData.trainingRecords) {
          employee.trainingRecords.push({
            title: training.title,
            provider: training.provider,
            date: training.date,
            duration: training.duration,
            isRequired: training.isRequired,
            status: training.status
          });

          // Add training completion log if completed
          if (training.status === 'completed') {
            employee.logs.push({
              action: 'training_completed',
              date: training.date,
              description: `Completed training: ${training.title}`,
              changedBy: users.find(u => u.username === 'mgrhrd')?._id || users[0]._id
            });
          }
        }
      }

      // Add creation log
      employee.logs.push({
        action: 'created',
        date: sampleData.joinDate,
        description: 'Employee record created',
        changedBy: users.find(u => u.username === 'mgrhrd')?._id || users[0]._id
      });

      // Save employee
      await employee.save();
      console.log(`Created employee: ${employee.firstname} ${employee.lastname || ''} (${employee.employeeCode})`);
    }

    console.log('Sample employees created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding sample employees:', error);
    process.exit(1);
  }
}

// Run the seeder
seedSampleEmployees();