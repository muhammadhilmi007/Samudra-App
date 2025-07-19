const mongoose = require("mongoose");
const Employee = mongoose.model(
  "Employee",
  require("../schemas/employeeSchema")
);
const User = mongoose.model("User", require("../schemas/userSchema"));
const Branch = mongoose.model("Branch", require("../schemas/branchSchema"));
const Division = mongoose.model(
  "Division",
  require("../schemas/divisionSchema")
);
const Position = mongoose.model(
  "Position",
  require("../schemas/positionSchema")
);

// List all employees
const index = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const branch = req.query.branch || "";
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
        ],
      };
    }

    // Branch filter - check user permissions
    if (req.userBranch && req.userBranchType !== "pusat") {
      query.branchId = req.userBranch._id;
    } else if (branch) {
      query.branchId = branch;
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    const [employees, total] = await Promise.all([
      Employee.find(query)
        .populate("userId", "name email")
        .populate("branchId", "name code")
        .populate("positionId", "name code")
        .populate("supervisor", "firstname lastname")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Employee.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Get branches for filter (only if user is from pusat)
    let branches = [];
    if (!req.userBranch || req.userBranchType === "pusat") {
      branches = await Branch.find({ isActive: "active" }).sort({ name: 1 });
    }

    res.render("../views/pages/administrasi/employees/index.ejs", {
      title: "Employees",
      employees,
      branches,
      name: "employees",
      search,
      currentPage: page,
      limit,
      total,
      totalPages,
      selectedBranch: branch,
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
    // Get data for dropdowns
    let branchQuery = { isActive: "active" };
    if (req.userBranch && req.userBranchType !== "pusat") {
      branchQuery._id = req.userBranch._id;
    }

    const [branches, divisions, positions, employees] = await Promise.all([
      Branch.find(branchQuery).sort({ name: 1 }),
      Division.find({ isActive: true }).sort({ name: 1 }),
      Position.find({ isActive: true }).sort({ name: 1 }),
      Employee.find({ isActive: true }, "employeeCode firstname lastname").sort(
        { firstname: 1 }
      ),
    ]);

    res.render("../views/pages/administrasi/employees/create.ejs", {
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
    res.redirect(
      res.locals.base + "administrasi/employees/index/" + res.getLocale()
    );
  }
};

// Store new employee
const store = async (req, res) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      throw new Error("User with this email already exists!");
    }

    // Create user first
    const hashedPassword = await bcrypt.hash(req.body.password, 12);
    const user = new User({
      name: `${req.body.firstname} ${req.body.lastname || ""}`.trim(),
      email: req.body.email,
      password: hashedPassword,
      branch_id: req.body.branchId,
      division_id: req.body.divisionId,
      position_id: req.body.positionId,
      isActive: req.body.isActive === "on",
    });
    await user.save();

    // Create employee
    const employee = new Employee({
      userId: user._id,
      username: req.body.username,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
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
        noPhone: req.body.noPhone,
        noPhoneEmergency: req.body.noPhoneEmergency,
        noPhoneContact: req.body.noPhoneContact,
        email: req.body.email,
      },
      supervisor: req.body.supervisor || null,
      positionId: req.body.positionId,
      branchId: req.body.branchId,
      joinDate: req.body.joinDate,
      noKTP: req.body.noKTP,
      noSIM: req.body.noSIM,
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

    await employee.save();
    req.session.successMessage = "Employee created successfully!";
    res.redirect(
      res.locals.base + "administrasi/employees/index/" + res.getLocale()
    );
  } catch (error) {
    console.error(error);
    req.session.errorMessage = error.message || "Failed to create employee!";
    res.redirect(
      res.locals.base + "administrasi/employees/create/" + res.getLocale()
    );
  }
};

// Show employee detail
const detail = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate("userId", "name email")
      .populate("branchId", "name code")
      .populate("positionId", "name code")
      .populate("supervisor", "firstname lastname")
      .populate("logs.changedBy", "name");

    if (!employee) {
      req.session.errorMessage = "Employee not found!";
      return res.redirect(
        res.locals.base + "administrasi/employees/index/" + res.getLocale()
      );
    }

    res.render("../views/pages/administrasi/employees/detail.ejs", {
      title: "Employee Detail",
      employee,
      name: "employees",
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load employee!";
    res.redirect(
      res.locals.base + "administrasi/employees/index/" + res.getLocale()
    );
  }
};

// Mutate employee to another branch
const mutate = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found!" });
    }

    // Record current position in history
    employee.employmentHistory.push({
      position: employee.positionId,
      branch: employee.branchId,
      division: employee.divisionId,
      startDate: employee.joinDate,
      endDate: new Date(),
      reason: req.body.reason || "Mutation",
    });

    // Update employee
    employee.branchId = req.body.branchId;
    employee.positionId = req.body.positionId || employee.positionId;
    employee.mutationDate = new Date();

    // Update user branch
    await User.findByIdAndUpdate(employee.userId, {
      branch_id: req.body.branchId,
      position_id: req.body.positionId || employee.positionId,
    });

    // Add log
    employee.logs.push({
      action: "mutated",
      description: `Mutated to branch ${req.body.branchName}`,
      changedBy: req.session.user ? req.session.user._id : null,
    });

    await employee.save();
    res.json({ success: true, message: "Employee mutated successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to mutate employee!" });
  }
};

// Resign employee
const resign = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found!" });
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
      changedBy: req.session.user ? req.session.user._id : null,
    });

    await employee.save();
    res.json({ success: true, message: "Employee resignation processed!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to process resignation!" });
  }
};

module.exports = {
  index,
  create,
  store,
  detail,
  mutate,
  resign,
};
