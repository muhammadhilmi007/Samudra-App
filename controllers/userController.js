const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
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
const Role = mongoose.model("Role", require("../schemas/roleSchema"));
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");
const csv = require("csv-writer");

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../public/uploads/profiles/");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "profile-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only JPEG, JPG, and PNG files are allowed"));
    }
  },
}).single("photoProfile");

// List all users with pagination
const index = async (req, res) => {
  try {
    console.log("query user", req.session.user);
    const currentUser = await User.findOne({ _id: req.session.user._id });
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 2;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const branch = req.query.branch || "";   // <-- Ambil branch dari query
    const status = req.query.status || "";   // <-- Ambil status dari query

    // Query for users - if not super admin, filter by branch
    console.log("query", req.query);
    let query = {};
    if (search) {
      query = {
        $or: [
          { username: { $regex: search, $options: "i" } },
          { firstname: { $regex: search, $options: "i" } },
          { lastname: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { branch: { $regex: search, $options: "i" } },
          { division: { $regex: search, $options: "i" } },
          { position: { $regex: search, $options: "i" } },
          { role: { $regex: search, $options: "i" } },
          { isActive: search === "active" ? true : false },
        ],
      };
    }

    // Filter branch dari query
    if (branch) {
      query.branch_id = branch;
    }

    // Filter status dari query
    if (status) {
      query.isActive = status === "active";
    }

    // Filter by branch for non-pusat users
    if (currentUser.status === false && req.userBranchType !== "pusat") {
      query.branch_id = currentUser.branch_id;
    }
    console.log("query", query);

    const [users, total] = await Promise.all([
      User.find(query)
        .populate("branch_id", "name")
        .populate("division_id", "name")
        .populate("position_id", "name")
        .populate("role_id", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    const branches = await Branch.find({ isActive: "active" }).sort({ name: 1 });
    const divisions = await Division.find({ isActive: true }).sort({ name: 1 });
    const positions = await Position.find({ isActive: true }).sort({ name: 1 });

    res.render("../views/pages/settings/users/index.ejs", {
      title: "View Users",
      users: users,
      layout: "../views/layout/app.ejs",
      name: "users",
      currentPage: page,
      totalPages,
      limit,
      total,
      search,
      branch,
      status,
      branches: branches,
      divisions: divisions,
      positions: positions,
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load users!";
    res.redirect(res.locals.base + "dashboard/analytics/" + res.getLocale());
  }
};

// Detail - Show user details
const detail = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId)
      .populate("branch_id", "name")
      .populate("division_id", "name")
      .populate("position_id", "name")
      .populate("role_id", "name");

    if (!user) {
      req.session.errorMessage = "User not found";
      return res.redirect(
        res.locals.base + "settings/users/index/" + res.getLocale()
      );
    }

    res.render("../views/pages/settings/users/detail", {
      title: "User Details",
      name: "users",
      user,
      layout: "../views/layout/app.ejs",
    });
  } catch (error) {
    console.error("User detail error:", error);
    req.session.errorMessage = "Failed to load user details";
    res.redirect(res.locals.base + "settings/users/index/" + res.getLocale());
  }
};

// Show create form
const create = async (req, res) => {
  try {
    const currentUser = await User.findOne({ _id: req.session.user._id });
    
    // Get data for dropdowns
    let branchQuery = { isActive: "active" };
    if (currentUser.status === false && req.userBranchType !== "pusat") {
      branchQuery._id = currentUser.branch_id;
    }

    const branches = await Branch.find(branchQuery, "name").sort({ name: 1 });
    const divisions = await Division.find({ isActive: true }, "name").sort({ name: 1 });
    const positions = await Position.find({ isActive: true }, "name").sort({
      level: 1,
    });

    res.render("../views/pages/settings/users/index.ejs", {
      title: "Create User",
      name: "users",
      branches: branches,
      divisions: divisions,
      positions: positions,
      layout: "../views/layout/app.ejs",
      errors: null,
      input: {},
      successMessage: req.session.successMessage || null,
      errorMessage: req.session.errorMessage || null,
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load form data!";
    res.redirect(
      process.env.BASE_URL + "settings/users/index/" + res.getLocale()
    );
  }
};

// Store new user
const store = async (req, res) => {
  try {
    const {
      username,
      firstname,
      lastname,
      email,
      password,
      phoneNumber,
      branch_id,
      division_id,
      position_id,
      status,
      isActive,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: email },
        { username: username },
      ]
    })

    if (existingUser) {
      req.session.errorMessage = "User with this email or username already exists!";
      return res.redirect(
        process.env.BASE_URL + "settings/users/index/" + res.getLocale()
      );
    }

    // Determine branch_id based on status
    let userBranchId = branch_id;
    const isPusat = status === "on" || status === true;

    if (isPusat) {
      const branchPusat = await Branch.findOne({ type: "pusat" });
      if (branchPusat) {
        userBranchId = branchPusat._id;
      } else {
        // Handle case where 'pusat' branch is not found
        req.session.errorMessage = "Kantor Pusat branch not found!";
        return res.redirect(req.get("referer"));
      }
    } else {
      if (!userBranchId) {
        req.session.errorMessage = "Branch is required for non-pusat user!";
        return res.redirect(req.get("referer"));
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let role = await Role.findOne({
      branch_id: userBranchId,
      division_id: division_id,
      position_id: position_id,
      isActive: true,
    });

    if (!role) {
      const branch = await Branch.findById(userBranchId);
      const division = await Division.findById(division_id);
      const position = await Position.findById(position_id);

      role = new Role({
        name: `${position.name} - ${division.name} - ${branch.name}`,
        description: `Default role for ${position.name} in ${division.name} at ${branch.name}`,
        branch_id: userBranchId,
        division_id: division_id,
        position_id: position_id,
        isActive: true,
      });
      await role.save();
    }

    const user = new User({
      username,
      firstname,
      lastname,
      email,
      password: hashedPassword,
      phoneNumber,
      photoProfile: req.file ? "uploads/profiles/" + req.file.filename : null,
      status: isPusat,
      branch_id: isPusat ? null : userBranchId,
      division_id,
      position_id,
      role_id: role._id,
      isActive: isActive === "on" || isActive === true,
    });

    if (req.file) {
      console.log('Image uploaded successfully:', req.file.filename);
    } else {
      console.log('No image was uploaded.');
    }

    await user.save();
    req.session.successMessage = "User created successfully!";
    res.redirect(res.locals.base + "settings/users/index/" + res.getLocale());
  } catch (error) {
    console.error(error);
    // If validation fails, delete uploaded file
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    req.session.errorMessage = error.message || "Failed to create user!";
    res.redirect(req.get("referer"));
  }
};

// Show edit form
const edit = async (req, res) => {
  try {
    const currentUser = await User.findOne({ _id: req.session.user._id });

    // Check if user can update this user
    let userQuery = { _id: req.params.id };
    if (!req.session.user.email.includes("admin@")) {
      userQuery.branch_id = currentUser.branch_id;
    }

    const user = await User.findOne(userQuery);
    if (!user) {
      req.session.errorMessage = "User not found or access denied!";
      return res.redirect(
        process.env.BASE_URL + "settings/users/index/" + res.getLocale()
      );
    }

    // Get data for dropdowns
    let branchQuery = { isActive: true };
    if (!req.session.user.email.includes("admin@")) {
      branchQuery._id = currentUser.branch_id;
    }

    const branches = await Branch.find(branchQuery).sort({ name: 1 });
    const divisions = await Division.find({ isActive: true }).sort({ name: 1 });
    const positions = await Position.find({ isActive: true }).sort({
      level: 1,
    });
    const roles = await Role.find({
      branch_id: user.branch_id,
      isActive: true,
    })
      .populate("division_id")
      .populate("position_id");

    res.render("../views/pages/settings/users/edit.ejs", {
      title: "Edit User",
      user: user,
      branches: branches,
      divisions: divisions,
      positions: positions,
      roles: roles,
      layout: "../views/layout/app.ejs",
      errors: null,
      input: {},
      successMessage: req.session.successMessage || null,
      errorMessage: req.session.errorMessage || null,
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load user!";
    res.redirect(
      process.env.BASE_URL + "settings/users/index/" + res.getLocale()
    );
  }
};

// Update user
const update = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      req.session.errorMessage = "User not found!";
      return res.redirect(
        res.locals.base + "settings/users/index/" + res.getLocale()
      );
    }

    const {
      username,
      firstname,
      lastname,
      email,
      password,
      phoneNumber,
      division_id,
      position_id,
      branch_id,
      status,
      isActive,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: email },
        { username: username },
      ],
      _id: { $ne: user._id }
    })

    if (existingUser) {
      req.session.errorMessage = "User with this email or username already exists!";
      return res.redirect(
        process.env.BASE_URL + "settings/users/index/" + res.getLocale()
      );
    }

    user.username = username;
    user.firstname = firstname;
    user.lastname = lastname;
    user.email = email;
    user.phoneNumber = phoneNumber;
    user.division_id = division_id;
    user.position_id = position_id;
    user.isActive = isActive === "on";

    const isPusat = status === "on";
    user.status = isPusat;

    if (isPusat) {
      user.branch_id = null;
    } else {
      if (!branch_id) {
        req.session.errorMessage = "Branch is required for non-pusat user!";
        return res.redirect(req.get("referer"));
      }
      user.branch_id = branch_id;
    }

    if (req.file) {
      // Delete old photo if it exists
      if (user.photoProfile) {
        const oldPath = path.join(__dirname, "..", "public", user.photoProfile);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      user.photoProfile = "uploads/profiles/" + req.file.filename;
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    // Find or create role
    let roleBranchId = user.branch_id;
    if (isPusat) {
      const branchPusat = await Branch.findOne({ type: "pusat" });
      roleBranchId = branchPusat ? branchPusat._id : null;
    }

    let role = await Role.findOne({
      branch_id: roleBranchId,
      division_id: division_id,
      position_id: position_id,
      isActive: true,
    });

    if (!role && roleBranchId) {
      const branch = await Branch.findById(roleBranchId);
      const division = await Division.findById(division_id);
      const position = await Position.findById(position_id);

      role = new Role({
        name: `${position.name} - ${division.name} - ${branch.name}`,
        description: `Default role for ${position.name} in ${division.name} at ${branch.name}`,
        branch_id: roleBranchId,
        division_id: division_id,
        position_id: position_id,
        isActive: true,
      });
      await role.save();
    }
    if (role) {
      user.role_id = role._id;
    }

    await user.save();
    req.session.successMessage = "User updated successfully!";
    res.redirect(res.locals.base + "settings/users/index/" + res.getLocale());
  } catch (error) {
    console.error(error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    req.session.errorMessage = error.message || "Failed to update user!";
    res.redirect(req.get("referer"));
  }
};

// Delete user
const destroy = async (req, res) => {
  try {
    const currentUser = await User.findOne({ _id: req.session.user._id });

    // Prevent self-deletion
    if (req.params.id === currentUser._id.toString()) {
      req.session.errorMessage = "You cannot delete your own account!";
      return res.redirect(
        process.env.BASE_URL + "settings/users/index/" + res.getLocale()
      );
    }

    // Check if user can delete this user
    let deleteQuery = { _id: req.params.id };
    if (currentUser.status === false && req.userBranchType !== "pusat") {
      deleteQuery.branch_id = currentUser.branch_id;
    }

    const result = await User.findOneAndDelete(deleteQuery);

    if (!result) {
      req.session.errorMessage = "User not found or access denied!";
      return res.redirect(
        process.env.BASE_URL + "settings/users/index/" + res.getLocale()
      );
    }

    req.session.successMessage = "User deleted successfully!";
    res.redirect(
      process.env.BASE_URL + "settings/users/index/" + res.getLocale()
    );
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to delete user!";
    res.redirect(
      process.env.BASE_URL + "settings/users/index/" + res.getLocale()
    );
  }
};

// Export to Excel
const exportExcel = async (req, res) => {
  try {
    // Build query based on user permissions
    const currentUser = await User.findById(req.session.user._id).lean();
    let query = {};

    const branch = req.query.branch || "all";
    const status = req.query.status || "all";

    if (!currentUser.status) {
      query.branch_id = currentUser.branch_id;
    } else {
      // Kalau pusat:
      if (branch !== "all") {
        if (branch === "pusat") {
          query.branch_id = null; // khusus user pusat
        } else {
          query.branch_id = new mongoose.Types.ObjectId(branch); // user cabang tertentu
        }
      }
    }

    // Filter Status jika ada
    if (status && status !== "all") {
      query.isActive = status === "active";
    }

    const users = await User.find(query)
      .populate("branch_id", "name")
      .populate("division_id", "name")
      .populate("position_id", "name")
      .populate("role_id", "name")
      .sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Users");

    // Define columns
    worksheet.columns = [
      { header: "Username", key: "username", width: 20 },
      { header: "Full Name", key: "fullName", width: 30 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phoneNumber", width: 20 },
      { header: "Status", key: "status", width: 15 },
      { header: "Level", key: "level", width: 25 },
      { header: "Division", key: "division", width: 25 },
      { header: "Position", key: "position", width: 25 },
      { header: "Role", key: "role", width: 30 },
      { header: "Active", key: "isActive", width: 10 },
      { header: "Last Login", key: "lastLogin", width: 20 },
      { header: "Created At", key: "createdAt", width: 20 },
    ];

    // Add rows
    users.forEach((user) => {
      worksheet.addRow({
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber || "-",
        status: user.status ? "Pusat" : "Cabang",
        level: user.branch_id ? user.branch_id.name : "Kantor Pusat",
        division: user.division_id ? user.division_id.name : "-",
        position: user.position_id ? user.position_id.name : "-",
        role: user.role_id ? user.role_id.name : "-",
        isActive: user.isActive ? "Yes" : "No",
        lastLogin: user.lastLogin ? user.lastLogin.toLocaleString() : "Never",
        createdAt: user.createdAt.toLocaleString(),
      });
    });

    // Style the header
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      cell.font.color = { argb: "FFFFFFFF" };
    });

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=users-${Date.now()}.xlsx`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Export Excel error:", error);
    req.session.errorMessage = "Failed to export users";
    res.redirect(res.locals.base + "settings/users/index/" + res.getLocale());
  }
};

// Export to CSV
const exportCSV = async (req, res) => {
  try {
    // Build query based on user permissions
    const currentUser = await User.findById(req.session.user._id).lean();
    let query = {};

    const branch = req.query.branch || "all";
    const status = req.query.status || "all";

    if (!currentUser.status) {
      query.branch_id = currentUser.branch_id;
    } else {
      // Kalau pusat:
      if (branch !== "all") {
        if (branch === "pusat") {
          query.branch_id = null; // khusus user pusat
        } else {
          query.branch_id = new mongoose.Types.ObjectId(branch); // user cabang tertentu
        }
      }
    }

    // Filter Status jika ada
    if (status && status !== "all") {
      query.isActive = status === "active";
    }

    const users = await User.find(query)
      .populate("branch_id", "name")
      .populate("division_id", "name")
      .populate("position_id", "name")
      .populate("role_id", "name")
      .sort({ createdAt: -1 });

    // Prepare data for CSV
    const records = users.map((user) => ({
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber || "-",
      status: user.status ? "Pusat" : "Cabang",
      level: user.branch_id ? user.branch_id.name : "Kantor Pusat",
      division: user.division_id ? user.division_id.name : "-",
      position: user.position_id ? user.position_id.name : "-",
      role: user.role_id ? user.role_id.name : "-",
      isActive: user.isActive ? "Yes" : "No",
      lastLogin: user.lastLogin ? user.lastLogin.toISOString() : "Never",
      createdAt: user.createdAt.toISOString(),
    }));

    // Set response headers
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=users-${Date.now()}.csv`
    );

    // Create CSV string
    const csvHeader = [
      "Username",
      "Full Name",
      "Email",
      "Phone",
      "Status",
      "Level",
      "Division",
      "Position",
      "Role",
      "Active",
      "Last Login",
      "Created At",
    ].join(",");

    const csvContent = records
      .map((record) =>
        [
          record.username,
          record.fullName,
          record.email,
          record.phoneNumber,
          record.status,
          record.level,
          record.division,
          record.position,
          record.role,
          record.isActive,
          record.lastLogin,
          record.createdAt,
        ].join(",")
      )
      .join("\n");

    res.send(csvHeader + "\n" + csvContent);
  } catch (error) {
    console.error("Export CSV error:", error);
    req.session.errorMessage = "Failed to export users";
    res.redirect(res.locals.base + "settings/users/index/" + res.getLocale());
  }
};

// Get roles by branch, division, and position (AJAX endpoint)
const getRolesByFilters = async (req, res) => {
  try {
    const { branch_id, division_id, position_id } = req.query;

    if (!branch_id && !division_id && !position_id) {
      return res.json({ success: false, message: "No filters provided" });
    }

    const query = { isActive: true };
    if (branch_id) query.branch_id = branch_id;
    if (division_id) query.division_id = division_id;
    if (position_id) query.position_id = position_id;

    const roles = await Role.find(query)
      .populate("branch_id")
      .populate("division_id")
      .populate("position_id");

    if (!roles) {
      return res.json({ success: false, message: "No roles found" });
    }

    return res.json({ success: true, data: roles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load roles" });
  }
};

module.exports = {
  upload,
  index,
  create,
  store,
  edit,
  update,
  destroy,
  getRolesByFilters,
  detail,
  exportExcel,
  exportCSV,
};
