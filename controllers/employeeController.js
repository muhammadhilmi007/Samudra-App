const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Employee = mongoose.model("Employee", require("../schemas/employeeSchema"));
const User = mongoose.model("User", require("../schemas/userSchema"));
const Branch = mongoose.model("Branch", require("../schemas/branchSchema"));
const Division = mongoose.model("Division", require("../schemas/divisionSchema"));
const Position = mongoose.model("Position", require("../schemas/positionSchema"));
const Role = mongoose.model("Role", require("../schemas/roleSchema"));

// Helper function to sync photo profile between User and Employee
const syncPhotoProfile = async (user, employee, newPhotoPath = null) => {
  try {
    // Priority: newPhotoPath > user.photoProfile > employee.fotoProfile
    let finalPhotoPath = null;
    
    if (newPhotoPath) {
      // New photo uploaded - update both user and employee
      finalPhotoPath = newPhotoPath;
      user.photoProfile = newPhotoPath;
      employee.fotoProfile = newPhotoPath;
    } else if (user.photoProfile) {
      // User already has photo - use it for employee
      finalPhotoPath = user.photoProfile;
      employee.fotoProfile = user.photoProfile;
    } else if (employee.fotoProfile) {
      // Employee has photo but user doesn't - sync to user
      finalPhotoPath = employee.fotoProfile;
      user.photoProfile = employee.fotoProfile;
    }
    
    return finalPhotoPath;
  } catch (error) {
    console.error('Photo sync error:', error);
    return null;
  }
};

// Helper function to get display photo path
const getDisplayPhotoPath = (user, employee) => {
  // Priority: user.photoProfile > employee.fotoProfile
  return user?.photoProfile || employee?.fotoProfile || null;
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadDir = path.join(__dirname, "../public/uploads/employees/");
    
    // Create subdirectories based on file type
    if (file.fieldname === "fotoProfile") {
      uploadDir = path.join(uploadDir, "profiles/");
    } else if (file.fieldname === "fotoKTP") {
      uploadDir = path.join(uploadDir, "ktp/");
    } else if (file.fieldname === "fotoIdentitas") {
      uploadDir = path.join(uploadDir, "identitas/");
    } else if (file.fieldname.startsWith("document")) {
      uploadDir = path.join(uploadDir, "documents/");
    }
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only JPEG, JPG, PNG, and PDF files are allowed"));
    }
  },
}).fields([
  { name: "fotoProfile", maxCount: 1 },
  { name: "fotoKTP", maxCount: 1 },
  { name: "fotoIdentitas", maxCount: 1 },
  { name: "documents", maxCount: 10 },
]);

// List all employees with pagination and filters
const index = async (req, res) => {
  try {
    console.log("Index Employee: ", req.query);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const branch = req.query.branch || "";
    const position = req.query.position || "";
    const status = req.query.status || "";

    let query = {};

    // Search filter
    if (search) {
      query = {
        $or: [
          { employeeCode: { $regex: search, $options: "i" } },
          { firstname: { $regex: search, $options: "i" } },
          { lastname: { $regex: search, $options: "i" } },
          { username: { $regex: search, $options: "i" } },
          { "contact.email": { $regex: search, $options: "i" } },
          { "contact.noPhone": { $regex: search, $options: "i" } },
        ],
      };
    }

    // Branch filter - check user permissions
    const currentUser = await User.findById(req.session.user._id).populate('branch_id');
    if (currentUser.level === "Cabang") {
      query.branchId = currentUser.branch_id._id;
    } else if (branch) {
      query.branchId = branch;
    }

    // Position filter
    if (position) {
      query.positionId = position;
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    const [employees, total] = await Promise.all([
      Employee.find(query)
        .populate("userId", "username email photoProfile")
        .populate("branchId", "name code")
        .populate("positionId", "name code")
        .populate("divisionId", "name code")
        .populate("supervisor", "firstname lastname employeeCode")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Employee.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Add displayPhotoPath to each employee
    const employeesWithPhoto = employees.map(employee => {
      const employeeObj = employee.toObject();
      employeeObj.displayPhotoPath = getDisplayPhotoPath(employee.userId, employee);
      return employeeObj;
    });

    // Get filter data
    let branchQuery = { isActive: "active" };
    if (currentUser.level === "Cabang") {
      branchQuery._id = currentUser.branch_id._id;
    }

    const [branches, positions] = await Promise.all([
      Branch.find(branchQuery).sort({ name: 1 }),
      Position.find({ isActive: true }).sort({ name: 1 }),
    ]);

    // Get employee statistics
    const stats = await Employee.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const statistics = {
      total: 0,
      active: 0,
      inactive: 0,
      resigned: 0,
      mutated: 0,
    };

    stats.forEach((stat) => {
      statistics[stat._id.toLowerCase()] = stat.count;
      statistics.total += stat.count;
    });

    console.log("Statistics Employee: ", statistics);

    res.render("../views/pages/hrd/employees/index.ejs", {
      title: "Employees",
      employees: employeesWithPhoto,
      branches,
      positions,
      statistics,
      name: "employees",
      search,
      currentPage: page,
      startPage: 1,
      limit,
      total,
      totalPages,
      selectedBranch: branch,
      selectedPosition: position,
      selectedStatus: status,
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load employees!";
    res.redirect(res.locals.base + "dashboard/analytics/" + res.getLocale());
  }
};

// Show create form
const create = async (req, res) => {
  try {
    // Get current user
    const currentUser = await User.findById(req.session.user._id).populate('branch_id');
    
    // Get data for dropdowns
    let branchQuery = { isActive: "active" };
    if (currentUser.level === "Cabang") {
      branchQuery._id = currentUser.branch_id._id;
    }

    const [branches, divisions, positions, employees] = await Promise.all([
      Branch.find(branchQuery).sort({ name: 1 }),
      Division.find({ isActive: true }).sort({ name: 1 }),
      Position.find({ isActive: true }).sort({ name: 1 }),
      Employee.find({ isActive: true }, "employeeCode firstname lastname").sort({ firstname: 1 }),
    ]);

    res.render("../views/pages/hrd/employees/create.ejs", {
      title: "Create Employee",
      branches,
      divisions,
      positions,
      employees, // For supervisor selection
      name: "employees",
      errors: null,
      input: {},
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load form data!";
    res.redirect(res.locals.base + "hrd/employees/index/" + res.getLocale());
  }
};

// Store new employee
const store = async (req, res) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: req.body.email },
        { username: req.body.username }
      ]
    });
    
    if (existingUser) {
      throw new Error("User with this email or username already exists!");
    }

    // Check if KTP already exists
    const existingKTP = await Employee.findOne({ noKTP: req.body.noKTP });
    if (existingKTP) {
      throw new Error("Employee with this KTP number already exists!");
    }

    // Create user first
    const hashedPassword = await bcrypt.hash(req.body.password || "Password123!", 12);
    
    // Find or create role based on position and branch
    let role = await Role.findOne({
      branch_id: req.body.branchId || null,
      division_id: req.body.divisionId,
      position_id: req.body.positionId,
      isActive: true,
    });

    if (!role) {
      const branch = req.body.branchId ? await Branch.findById(req.body.branchId) : null;
      const division = await Division.findById(req.body.divisionId);
      const position = await Position.findById(req.body.positionId);
      
      role = new Role({
        name: `${position.name} - ${division.name} - ${branch ? branch.name : "Pusat"}`,
        description: `Default role for ${position.name}`,
        branch_id: req.body.branchId || null,
        division_id: req.body.divisionId,
        position_id: req.body.positionId,
        isActive: true,
      });
      await role.save();
    }

    const user = new User({
      username: req.body.username,
      firstname: req.body.firstname,
      lastname: req.body.lastname || "",
      email: req.body.email,
      password: hashedPassword,
      phoneNumber: req.body.noPhone,
      level: req.body.branchId ? "Cabang" : "Pusat",
      branch_id: req.body.branchId || null,
      division_id: req.body.divisionId,
      position_id: req.body.positionId,
      role_id: role._id,
      isActive: req.body.isActive === "on",
    });

    await user.save();

    console.log("User created successfully!", user);

    // Preprocess phone number to ensure it matches Indonesian WhatsApp format
    const formatPhoneNumber = (phone) => {
      if (!phone) return phone;
      // Remove any spaces, dashes, or other characters
      let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
      
      // If starts with +62, keep as is
      if (cleanPhone.startsWith('+62')) {
        return cleanPhone;
      }
      // If starts with 62, add +
      if (cleanPhone.startsWith('62')) {
        return '+' + cleanPhone;
      }
      // If starts with 0, replace with +62
      if (cleanPhone.startsWith('0')) {
        return '+62' + cleanPhone.substring(1);
      }
      // If starts with 8, add +62
      if (cleanPhone.startsWith('8')) {
        return '+62' + cleanPhone;
      }
      return cleanPhone;
    };

    const formattedPhone = formatPhoneNumber(req.body.noPhone);
    const formattedEmergencyPhone = formatPhoneNumber(req.body.noPhoneEmergency);
    const formattedContactPhone = req.body.noPhoneContact ? formatPhoneNumber(req.body.noPhoneContact) : null;

    // Create employee
    const employee = new Employee({
      userId: user._id,
      username: req.body.username,
      firstname: req.body.firstname,
      lastname: req.body.lastname || "",
      birthdate: req.body.birthdate,
      gender: req.body.gender,
      maritalStatus: req.body.maritalStatus,
      address: {
        street: req.body.street,
        city: req.body.city,
        district: req.body.district,
        province: req.body.province,
        postalCode: req.body.postalCode,
      },
      contact: {
        noPhone: formattedPhone,
        noPhoneEmergency: formattedEmergencyPhone,
        noPhoneContact: formattedContactPhone,
        email: req.body.email,
      },
      supervisor: req.body.supervisor || null,
      positionId: req.body.positionId,
      branchId: req.body.branchId || null,
      divisionId: req.body.divisionId,
      joinDate: req.body.joinDate,
      noKTP: req.body.noKTP,
      noSIM: req.body.noSIM || "",
      isActive: req.body.isActive === "on",
      status: "Active",
      createdBy: req.session.user ? req.session.user._id : null,
      logs: [
        {
          action: "created",
          description: "Employee record created",
          changedBy: req.session.user ? req.session.user._id : null,
        },
      ],
    });

    // Handle file uploads
    let newPhotoPath = null;
    if (req.files) {
      if (req.files.fotoProfile) {
        newPhotoPath = "uploads/employees/profiles/" + req.files.fotoProfile[0].filename;
      }
      if (req.files.fotoKTP) {
        employee.fotoKTP = "uploads/employees/ktp/" + req.files.fotoKTP[0].filename;
      }
      if (req.files.fotoIdentitas) {
        employee.fotoIdentitas = "uploads/employees/identitas/" + req.files.fotoIdentitas[0].filename;
      }
    }

    // Sync photo profile between user and employee
    await syncPhotoProfile(user, employee, newPhotoPath);
    
    // Manual employee code generation as fallback
    if (!employee.employeeCode) {
      try {
        // Get branch code
        const branch = await Branch.findById(employee.branchId);
        const branchCode = branch ? branch.code : "HQ";
        
        // Get current year
        const year = new Date().getFullYear();
        
        // Count employees in the same branch and year
        const count = await Employee.countDocuments({
          employeeCode: new RegExp(`^${branchCode}-${year}-`),
        });
        
        // Generate code: BRANCHCODE-YYYY-XXXX
        employee.employeeCode = `${branchCode}-${year}-${String(count + 1).padStart(4, "0")}`;
        console.log('Manually generated employee code:', employee.employeeCode);
      } catch (error) {
        console.error('Error generating employee code manually:', error);
        // Use fallback code
        employee.employeeCode = `EMP-${Date.now()}`;
      }
    }
    
    // Debug employee data before saving
    console.log('Employee data before save:', {
      employeeCode: employee.employeeCode,
      branchId: employee.branchId,
      noPhone: employee.contact.noPhone,
      noPhoneEmergency: employee.contact.noPhoneEmergency,
      noKTP: employee.noKTP,
      birthdate: employee.birthdate,
      gender: employee.gender,
      joinDate: employee.joinDate
    });
    
    // Validate required fields before saving
    if (!employee.contact.noPhoneEmergency) {
      throw new Error('Emergency phone number is required!');
    }
    if (!employee.noKTP) {
      throw new Error('KTP number is required!');
    }
    if (!employee.birthdate) {
      throw new Error('Birth date is required!');
    }
    if (!employee.gender) {
      throw new Error('Gender is required!');
    }
    if (!employee.joinDate) {
      throw new Error('Join date is required!');
    }
    
    // Save both user and employee with synced photo
    await Promise.all([user.save(), employee.save()]);

    req.session.successMessage = "Employee created successfully!";
    res.redirect(res.locals.base + "hrd/employees/index/" + res.getLocale());
  } catch (error) {
    console.error(error);
    
    // Clean up uploaded files if error
    if (req.files) {
      Object.values(req.files).forEach(files => {
        files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      });
    }
    
    req.session.errorMessage = error.message || "Failed to create employee!";
    res.redirect(res.locals.base + "hrd/employees/create/" + res.getLocale());
  }
};

// Show employee detail with tabs
const detail = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate("userId", "username email isActive lastLogin photoProfile")
      .populate("branchId", "name code")
      .populate("positionId", "name code level")
      .populate("divisionId", "name code")
      .populate("supervisor", "firstname lastname employeeCode")
      .populate("employmentHistory.position", "name code")
      .populate("employmentHistory.branch", "name code")
      .populate("employmentHistory.division", "name code")
      .populate("employmentHistory.approvedBy", "firstname lastname")
      .populate("logs.changedBy", "firstname lastname");

    if (!employee) {
      req.session.errorMessage = "Employee not found!";
      return res.redirect(res.locals.base + "hrd/employees/index/" + res.getLocale());
    }

    // Add displayPhotoPath to each employee
    const employeeWithPhoto = employee.toObject();
    employeeWithPhoto.displayPhotoPath = getDisplayPhotoPath(employee.userId, employee);

    // Get expiring documents
    const expiringDocuments = employee.getExpiringDocuments(30);
    const pendingTraining = employee.getPendingTraining();
    
    // Get synchronized display photo path
    const displayPhotoPath = getDisplayPhotoPath(employee.userId, employee);

    res.render("../views/pages/hrd/employees/detail.ejs", {
      title: "Employee Detail",
      employee: employeeWithPhoto,
      displayPhotoPath,
      expiringDocuments,
      pendingTraining,
      name: "employees",
      activeTab: req.query.tab || "profile",
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load employee!";
    res.redirect(res.locals.base + "hrd/employees/index/" + res.getLocale());
  }   
};

// Show edit form
const edit = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate("userId", "username email photoProfile")
      .populate("branchId")
      .populate("positionId")
      .populate("divisionId");

    if (!employee) {
      req.session.errorMessage = "Employee not found!";
      return res.redirect(res.locals.base + "hrd/employees/index/" + res.getLocale());
    }

    // Add displayPhotoPath to each employee
    const employeeWithPhoto = employee.toObject();
    employeeWithPhoto.displayPhotoPath = getDisplayPhotoPath(employee.userId, employee);

    // Get current user
    const currentUser = await User.findById(req.session.user._id).populate('branch_id');
    
    // Get data for dropdowns
    let branchQuery = { isActive: "active" };
    if (currentUser.level === "Cabang") {
      branchQuery._id = currentUser.branch_id._id;
    }

    const [branches, divisions, positions, employees] = await Promise.all([
      Branch.find(branchQuery).sort({ name: 1 }),
      Division.find({ isActive: true }).sort({ name: 1 }),
      Position.find({ isActive: true }).sort({ name: 1 }),
      Employee.find({ isActive: true, _id: { $ne: employee._id } }, "employeeCode firstname lastname").sort({ firstname: 1 }),
    ]);
    
    // Get synchronized display photo path
    const displayPhotoPath = getDisplayPhotoPath(employee.userId, employee);

    res.render("../views/pages/hrd/employees/edit.ejs", {
      title: "Edit Employee",
      employee: employeeWithPhoto,
      displayPhotoPath,
      branches,
      divisions,
      positions,
      employees, // For supervisor selection
      name: "employees",
      errors: null,
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load employee!";
    res.redirect(res.locals.base + "hrd/employees/index/" + res.getLocale());
  }
};

// Update employee
const update = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      req.session.errorMessage = "Employee not found!";
      return res.redirect(res.locals.base + "hrd/employees/index/" + res.getLocale());
    }

    // Check for position/branch changes
    const positionChanged = employee.positionId.toString() !== req.body.positionId;
    const branchChanged = (employee.branchId?.toString() || "") !== (req.body.branchId || "");

    // If position or branch changed, add to employment history
    if (positionChanged || branchChanged) {
      employee.addEmploymentHistory({
        reason: req.body.changeReason || "Position/Branch update",
        approvedBy: req.session.user._id,
      });
    }

    // Update employee fields
    employee.firstname = req.body.firstname;
    employee.lastname = req.body.lastname || "";
    employee.birthdate = req.body.birthdate;
    employee.gender = req.body.gender;
    employee.maritalStatus = req.body.maritalStatus;
    employee.address = {
      street: req.body.street,
      city: req.body.city,
      district: req.body.district,
      province: req.body.province,
      postalCode: req.body.postalCode,
    };
    employee.contact = {
      noPhone: req.body.noPhone,
      noPhoneEmergency: req.body.noPhoneEmergency,
      noPhoneContact: req.body.noPhoneContact,
      email: req.body.email,
    };
    employee.supervisor = req.body.supervisor || null;
    employee.positionId = req.body.positionId;
    employee.branchId = req.body.branchId || null;
    employee.divisionId = req.body.divisionId;
    employee.noKTP = req.body.noKTP;
    employee.noSIM = req.body.noSIM || "";
    employee.isActive = req.body.isActive === "on";
    employee.updatedBy = req.session.user._id;

    // Get user for photo sync
    const user = await User.findById(employee.userId);
    
    // Handle file uploads
    let newPhotoPath = null;
    if (req.files) {
      if (req.files.fotoProfile) {
        // Delete old files from both user and employee paths
        if (employee.fotoProfile && fs.existsSync(path.join(__dirname, "../public", employee.fotoProfile))) {
          fs.unlinkSync(path.join(__dirname, "../public", employee.fotoProfile));
        }
        if (user.photoProfile && fs.existsSync(path.join(__dirname, "../public", user.photoProfile))) {
          fs.unlinkSync(path.join(__dirname, "../public", user.photoProfile));
        }
        newPhotoPath = "uploads/employees/profiles/" + req.files.fotoProfile[0].filename;
      }
      if (req.files.fotoKTP) {
        // Delete old file
        if (employee.fotoKTP && fs.existsSync(path.join(__dirname, "../public", employee.fotoKTP))) {
          fs.unlinkSync(path.join(__dirname, "../public", employee.fotoKTP));
        }
        employee.fotoKTP = "uploads/employees/ktp/" + req.files.fotoKTP[0].filename;
      }
      if (req.files.fotoIdentitas) {
        // Delete old file
        if (employee.fotoIdentitas && fs.existsSync(path.join(__dirname, "../public", employee.fotoIdentitas))) {
          fs.unlinkSync(path.join(__dirname, "../public", employee.fotoIdentitas));
        }
        employee.fotoIdentitas = "uploads/employees/identitas/" + req.files.fotoIdentitas[0].filename;
      }
    }
    
    // Sync photo profile between user and employee
    await syncPhotoProfile(user, employee, newPhotoPath);

    // Add log
    employee.logs.push({
      action: "updated",
      description: "Employee information updated",
      changedBy: req.session.user._id,
    });

    // Update user info with synced photo
    user.firstname = req.body.firstname;
    user.lastname = req.body.lastname || "";
    user.email = req.body.email;
    user.phoneNumber = req.body.noPhone;
    user.branch_id = req.body.branchId || null;
    user.division_id = req.body.divisionId;
    user.position_id = req.body.positionId;
    user.isActive = req.body.isActive === "on";

    // Save both user and employee with synced data
    await Promise.all([user.save(), employee.save()]);

    req.session.successMessage = "Employee updated successfully!";
    res.redirect(res.locals.base + "hrd/employees/detail/" + employee._id + "/" + res.getLocale());
  } catch (error) {
    console.error(error);
    
    // Clean up uploaded files if error
    if (req.files) {
      Object.values(req.files).forEach(files => {
        files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      });
    }
    
    req.session.errorMessage = error.message || "Failed to update employee!";
    res.redirect(res.locals.base + "hrd/employees/edit/" + req.params.id + "/" + res.getLocale());
  }
};

// Delete
const destroy = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ error: "Employee not found!" });
    }

    // Delete employee
    await Employee.findByIdAndDelete(req.params.id);

    req.session.successMessage = "Employee deleted successfully!";
    res.redirect(res.locals.base + "hrd/employees/index/" + res.getLocale());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete employee!" });
  }
};

// Mutate employee to another branch/position
const mutate = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found!" });
    }

    // Record current position in history
    employee.addEmploymentHistory({
      reason: req.body.reason || "Mutation",
      approvedBy: req.session.user._id,
    });

    // Update employee
    employee.branchId = req.body.branchId;
    employee.positionId = req.body.positionId || employee.positionId;
    employee.divisionId = req.body.divisionId || employee.divisionId;
    employee.mutationDate = new Date();
    employee.status = "Mutated";

    // Update user branch
    await User.findByIdAndUpdate(employee.userId, {
      branch_id: req.body.branchId,
      position_id: req.body.positionId || employee.positionId,
      division_id: req.body.divisionId || employee.divisionId,
    });

    // Add log
    employee.logs.push({
      action: "mutated",
      description: `Mutated to branch ${req.body.branchName}`,
      changedBy: req.session.user._id,
    });

    await employee.save();

    res.json({ success: true, message: "Employee mutated successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to mutate employee!" });
  }
};

// Process resignation
const resign = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found!" });
    }

    // Update employment history
    const lastHistory = employee.employmentHistory[employee.employmentHistory.length - 1];
    if (lastHistory && !lastHistory.endDate) {
      lastHistory.endDate = req.body.resignDate || new Date();
    }

    employee.resignDate = req.body.resignDate || new Date();
    employee.status = "Resigned";
    employee.isActive = false;

    // Deactivate user account
    await User.findByIdAndUpdate(employee.userId, { isActive: false });

    // Add log
    employee.logs.push({
      action: "resigned",
      description: req.body.reason || "Employee resigned",
      changedBy: req.session.user._id,
    });

    await employee.save();

    res.json({ success: true, message: "Employee resignation processed!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to process resignation!" });
  }
};

// Upload document
const uploadDocument = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found!" });
    }

    if (!req.files || !req.files.documents) {
      return res.status(400).json({ error: "No document uploaded!" });
    }

    const document = req.files.documents[0];
    const newDocument = {
      type: req.body.documentType,
      number: req.body.documentNumber,
      issuedDate: req.body.issuedDate,
      expiryDate: req.body.expiryDate,
      fileUrl: "uploads/employees/documents/" + document.filename,
    };

    employee.documents.push(newDocument);

    // Add log
    employee.logs.push({
      action: "document_uploaded",
      description: `${req.body.documentType} document uploaded`,
      changedBy: req.session.user._id,
    });

    await employee.save();

    res.json({ success: true, message: "Document uploaded successfully!" });
  } catch (error) {
    console.error(error);
    
    // Clean up uploaded file if error
    if (req.files && req.files.documents) {
      req.files.documents.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({ error: "Failed to upload document!" });
  }
};

// Delete document
const deleteDocument = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found!" });
    }

    const document = employee.documents.id(req.params.documentId);
    if (!document) {
      return res.status(404).json({ error: "Document not found!" });
    }

    // Delete file
    if (document.fileUrl && fs.existsSync(path.join(__dirname, "../public", document.fileUrl))) {
      fs.unlinkSync(path.join(__dirname, "../public", document.fileUrl));
    }

    // Remove document from array
    document.remove();
    await employee.save();

    res.json({ success: true, message: "Document deleted successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete document!" });
  }
};

// Add training record
const addTraining = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found!" });
    }

    const training = {
      title: req.body.title,
      provider: req.body.provider,
      date: req.body.date,
      duration: req.body.duration,
      isRequired: req.body.isRequired === "on",
      status: req.body.status,
    };

    // Handle certificate upload
    if (req.files && req.files.certificate) {
      training.certificateUrl = "uploads/employees/documents/" + req.files.certificate[0].filename;
    }

    employee.trainingRecords.push(training);

    // Add log
    employee.logs.push({
      action: "training_completed",
      description: `Training "${req.body.title}" added`,
      changedBy: req.session.user._id,
    });

    await employee.save();

    res.json({ success: true, message: "Training record added successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add training record!" });
  }
};

// Update training record
const updateTraining = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found!" });
    }

    const training = employee.trainingRecords.id(req.params.trainingId);
    if (!training) {
      return res.status(404).json({ error: "Training record not found!" });
    }

    training.title = req.body.title;
    training.provider = req.body.provider;
    training.date = req.body.date;
    training.duration = req.body.duration;
    training.isRequired = req.body.isRequired === "on";
    training.status = req.body.status;

    // Handle certificate upload
    if (req.files && req.files.certificate) {
      // Delete old certificate
      if (training.certificateUrl && fs.existsSync(path.join(__dirname, "../public", training.certificateUrl))) {
        fs.unlinkSync(path.join(__dirname, "../public", training.certificateUrl));
      }
      training.certificateUrl = "uploads/employees/documents/" + req.files.certificate[0].filename;
    }

    await employee.save();

    res.json({ success: true, message: "Training record updated successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update training record!" });
  }
};

// Delete training record
const deleteTraining = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found!" });
    }

    const training = employee.trainingRecords.id(req.params.trainingId);
    if (!training) {
      return res.status(404).json({ error: "Training record not found!" });
    }

    // Delete certificate file
    if (training.certificateUrl && fs.existsSync(path.join(__dirname, "../public", training.certificateUrl))) {
      fs.unlinkSync(path.join(__dirname, "../public", training.certificateUrl));
    }

    // Remove training from array
    training.remove();
    await employee.save();

    res.json({ success: true, message: "Training record deleted successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete training record!" });
  }
};

// Get employee statistics for dashboard
const dashboard = async (req, res) => {
  try {
    const currentUser = await User.findById(req.session.user._id).populate('branch_id');
    
    let query = {};
    if (currentUser.level === "Cabang") {
      query.branchId = currentUser.branch_id._id;
    }

    // Get statistics
    const [
      totalEmployees,
      activeEmployees,
      newEmployeesThisMonth,
      resignedThisMonth,
      expiringDocuments,
      pendingTrainings,
      employeesByBranch,
      employeesByPosition,
    ] = await Promise.all([
      Employee.countDocuments(query),
      Employee.countDocuments({ ...query, status: "Active", isActive: true }),
      Employee.countDocuments({
        ...query,
        joinDate: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      }),
      Employee.countDocuments({
        ...query,
        resignDate: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      }),
      Employee.aggregate([
        { $match: query },
        { $unwind: "$documents" },
        {
          $match: {
            "documents.expiryDate": {
              $gte: new Date(),
              $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          },
        },
        { $count: "total" },
      ]),
      Employee.aggregate([
        { $match: query },
        { $unwind: "$trainingRecords" },
        {
          $match: {
            "trainingRecords.isRequired": true,
            "trainingRecords.status": { $ne: "completed" },
          },
        },
        { $count: "total" },
      ]),
      Employee.aggregate([
        { $match: { ...query, isActive: true } },
        {
          $group: {
            _id: "$branchId",
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "branches",
            localField: "_id",
            foreignField: "_id",
            as: "branch",
          },
        },
        { $unwind: "$branch" },
        {
          $project: {
            name: "$branch.name",
            count: 1,
          },
        },
      ]),
      Employee.aggregate([
        { $match: { ...query, isActive: true } },
        {
          $group: {
            _id: "$positionId",
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "positions",
            localField: "_id",
            foreignField: "_id",
            as: "position",
          },
        },
        { $unwind: "$position" },
        {
          $project: {
            name: "$position.name",
            count: 1,
          },
        },
      ]),
    ]);

    res.render("../views/pages/hrd/employees/dashboard.ejs", {
      title: "Employee Dashboard",
      name: "employees",
      statistics: {
        total: totalEmployees,
        active: activeEmployees,
        newThisMonth: newEmployeesThisMonth,
        resignedThisMonth: resignedThisMonth,
        expiringDocuments: expiringDocuments[0]?.total || 0,
        pendingTrainings: pendingTrainings[0]?.total || 0,
      },
      charts: {
        byBranch: employeesByBranch,
        byPosition: employeesByPosition,
      },
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load dashboard!";
    res.redirect(res.locals.base + "dashboard/analytics/" + res.getLocale());
  }
};

module.exports = {
  upload,
  index,
  create,
  store,
  detail,
  edit,
  destroy,
  update,
  mutate,
  resign,
  uploadDocument,
  deleteDocument,
  addTraining,
  updateTraining,
  deleteTraining,
  dashboard,
};