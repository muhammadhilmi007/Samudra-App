const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");

// Models
const User = mongoose.model("User", require("../schemas/userSchema"));
const Branch = mongoose.model("Branch", require("../schemas/branchSchema"));
const Role = mongoose.model("Role", require("../schemas/roleSchema"));

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
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) cb(null, true);
    else cb(new Error("Only JPEG, JPG, and PNG files are allowed"));
  },
}).single("photoProfile");

// List all users with pagination
const index = async (req, res) => {
  try {
    console.log("query user", req.session.user);
    const currentUser = await User.findOne({ _id: req.session.user._id });
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const branch = req.query.branch || "";
    const isActive = req.query.isActive || "";
    const level = req.query.level || "";
    const userType = req.query.userType || "";

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
          { userType: { $regex: search, $options: "i" } },
          { role: { $regex: search, $options: "i" } },
          { isActive: search === "active" ? true : false },
          { level: search === "Pusat" ? true : false },
        ],
      };
    }

    // Filters
    if (level) query.level = level;
    if (branch) query.branch_id = branch;
    if (userType) query.userType = userType;
    if (isActive !== "") query.isActive = isActive === "true";

    // Filter by branch for non-pusat users
    if (currentUser.level === "Cabang" && req.userBranchType !== "Pusat") {
      query.branch_id = currentUser.branch_id;
    }
    console.log("query", query);

    const [users, total] = await Promise.all([
      User.find(query)
        .populate("branch_id", "name")
        .populate("role_id", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    const branches = await Branch.find({ isActive: "active" }).sort({
      name: 1,
    });

    // Get success/error messages from session
    const successMessage = req.session.successMessage;
    const errorMessage = req.session.errorMessage;
    delete req.session.successMessage;
    delete req.session.errorMessage;

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
      isActive,
      userType,
      level,
      filters: { level, branch, userType, isActive },
      branches: branches,
      userPermissions: req.userPermissions,
      successMessage,
      errorMessage,
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
      .populate("role_id", "name");

    if (!user) {
      req.session.errorMessage = "User not found";
      return res.redirect(
        res.locals.base + "settings/users/index/" + res.getLocale()
      );
    }

    res.render("../views/pages/settings/users/detail.ejs", {
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
    const branches = await Branch.find(branchQuery, "name").sort({ name: 1 });

    // Get data for dropdowns
    let branchQuery = { isActive: "active" };
    if (currentUser.level === "Cabang" && req.userBranchType !== "Pusat") {
      branchQuery._id = currentUser.branch_id;
    }

    res.render("../views/pages/settings/users/index.ejs", {
      title: "Create User",
      name: "users",
      branches: branches,
      layout: "../views/layout/app.ejs",
      errors: null,
      input: {},
      userPermissions: req.userPermissions,
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
      userType,
      level,
      isActive,
    } = req.body;

    // Cek duplikasi user
    const existingUser = await User.findOne({
      $or: [{ email: email }, { username: username }],
    });

    if (existingUser) {
      req.session.errorMessage =
        "User with this email or username already exists!";
      return res.redirect(
        process.env.BASE_URL + "settings/users/index/" + res.getLocale()
      );
    }

    // Tentukan branch_id sesuai level
    const userBranchId = level === "Pusat" ? null : branch_id;

    if (level !== "Pusat" && !userBranchId) {
      req.session.errorMessage = "Branch is required for non-pusat user!";

      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      } else {
        req.session.errorMessage = "Failed to delete file!";
      }

      return res.redirect(req.get("referer"));
    }

    // Cari atau buat role
    let role = await Role.findOne({
      branch_id: userBranchId,
      userType: userType,
      isActive: true,
    });

    if (!role) {
      const branch = userBranchId
        ? await Branch.findById(userBranchId)
        : await Branch.findOne({ type: "pusat" });

      role = new Role({
        name: `${userType} - ${
          branch ? branch.name : "Pusat"
        }`,
        description: `Default role for ${userType} at ${
          branch ? branch.name : "Pusat"
        }`,
        branch_id: userBranchId,
        userType: userType,
        isActive: true,
      });
      await role.save();
    }

    // Buat user baru
    const user = new User({
      username,
      firstname,
      lastname,
      email,
      password,
      phoneNumber,
      photoProfile: req.file ? "uploads/profiles/" + req.file.filename : null,
      level, // <-- disimpan string, bukan boolean
      branch_id: userBranchId, // <-- null jika pusat
      userType: userType,
      role_id: role._id,
      isActive: isActive === "on" || isActive === true,
    });

    if (req.file) {
      console.log("Image uploaded successfully:", req.file.filename);
    }

    await user.save();
    req.session.successMessage = "User created successfully!";
    res.redirect(res.locals.base + "settings/users/index/" + res.getLocale());
  } catch (error) {
    console.error(error);
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
    const currentUser = await User.findById(req.session.user._id);

    // Query user yang akan diedit
    let userQuery = { _id: req.params.id };
    if (currentUser.level !== "Pusat") {
      userQuery.branch_id = currentUser.branch_id; // Cabang hanya bisa akses user di cabangnya
    }

    const user = await User.findOne(userQuery)
      .populate("branch_id", "name")

    if (!user) {
      req.session.errorMessage = "User not found or access denied!";
      return res.redirect(
        res.locals.base + "settings/users/index/" + res.getLocale()
      );
    }

    // Query branch list
    let branchQuery = { isActive: "active" };
    if (currentUser.level !== "Pusat") {
      branchQuery._id = currentUser.branch_id;
    }

    const branches = await Branch.find(branchQuery).select("name type");

    res.render("../views/pages/settings/users/index.ejs", {
      title: "Edit User",
      layout: "../views/layout/app.ejs",
      name: "users",
      user,
      branches,
      errors: {},
      userPermissions: req.userPermissions,
      successMessage: req.session.successMessage || null,
      errorMessage: req.session.errorMessage || null,
    });
  } catch (error) {
    console.error("User edit form error:", error);
    req.session.errorMessage = "Failed to load edit form";
    res.redirect(res.locals.base + "settings/users/index/" + res.getLocale());
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
      userType,
      branch_id,
      level,
      isActive,
    } = req.body;

    // Check if user already exists (exclude current)
    const existingUser = await User.findOne({
      $or: [{ email: email }, { username: username }],
      _id: { $ne: user._id },
    });

    if (existingUser) {
      req.session.errorMessage =
        "User with this email or username already exists!";
      return res.redirect(
        process.env.BASE_URL +
          "settings/users/edit/" +
          user._id +
          "/" +
          res.getLocale()
      );
    }

    // Update basic fields
    user.username = username;
    user.firstname = firstname;
    user.lastname = lastname;
    user.email = email;
    user.phoneNumber = phoneNumber;
    user.userType = userType;
    user.isActive = isActive === "on" || isActive === true;

    // Level & Branch (string-based like version 1)
    user.level = level;
    if (level === "Pusat") {
      user.branch_id = null;
    } else {
      if (!branch_id) {
        req.session.errorMessage = "Branch is required for non-pusat user!";
        return res.redirect(req.get("referer"));
      }
      user.branch_id = branch_id;
    }

    // Update password jika diisi
    if (password) {
      user.password = password; // auto hash via pre-save
    }

    // Handle photo
    if (req.file) {
      // Delete old photo if exists
      if (user.photoProfile) {
        const oldPath = path.join(__dirname, "..", "public", user.photoProfile);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      user.photoProfile = "uploads/profiles/" + req.file.filename;
    }

    // Find or create role (active only)
    let roleBranchId = level === "Pusat" ? null : branch_id;
    if (level === "Pusat") {
      const branchPusat = await Branch.findOne({ type: "pusat" });
      roleBranchId = branchPusat ? branchPusat._id : null;
    }

    let role = await Role.findOne({
      branch_id: roleBranchId,
      userType: userType,
      isActive: true,
    });

    if (!role) {
      const branch = roleBranchId
        ? await Branch.findById(roleBranchId)
        : await Branch.findOne({ type: "pusat" });
      const userType = userType;

      role = new Role({
        name: `${userType} - ${
          branch ? branch.name : "Pusat"
        }`,
        description: `Default role for ${userType} in ${
          branch.name
        } at ${branch ? branch.name : "Pusat"}`,
        branch_id: roleBranchId,
        userType: userType,
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
    const userId = req.params.id;
    
    // Prevent self-deletion
    if (req.session.user && req.session.user._id === userId) {
      req.session.errorMessage = 'You cannot delete your own account';
      return res.redirect(res.locals.base + 'settings/users/index/' + res.getLocale());
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      req.session.errorMessage = 'User not found';
      return res.redirect(res.locals.base + 'settings/users/index/' + res.getLocale());
    }

    // Delete photo if exists
    if (user.photoProfile) {
      const photoPath = path.join(__dirname, '..', 'public', user.photoProfile);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    // Delete user
    await User.findByIdAndDelete(userId);

    req.session.successMessage = 'User deleted successfully';
    res.redirect(res.locals.base + 'settings/users/index/' + res.getLocale());
  } catch (error) {
    console.error('User delete error:', error);
    req.session.errorMessage = 'Failed to delete user';
    res.redirect(res.locals.base + 'settings/users/index/' + res.getLocale());
  }
};

// Export to Excel
const exportExcel = async (req, res) => {
  try {
    // Build query based on user permissions
    const currentUser = await User.findById(req.session.user._id).lean();
    let query = {};

    // Get filter parameters from query (sent by frontend)
    const filterBranch = req.query.filterBranch || "all";
    const filterLevel = req.query.filterLevel || "all";
    const filterUserType = req.query.filterUserType || "all";
    const filterStatus = req.query.filterStatus || "all";

    // Branch filtering
    if (currentUser.level === "Pusat") {
      // Pusat users can see all branches or filter by specific branch
      if (filterBranch !== "all") {
        if (filterBranch === "pusat") {
          query.branch_id = null; // khusus user pusat
        } else {
          query.branch_id = new mongoose.Types.ObjectId(filterBranch); // user cabang tertentu
        }
      }
    } else {
      // Cabang users can only see their own branch
      query.branch_id = currentUser.branch_id;
    }

    // User Type filtering
    if (filterUserType && filterUserType !== "all") {
      query.userType = filterUserType;
    }

    // Level filtering
    if (filterLevel && filterLevel !== "all") {
      // Fix level filter logic to match frontend select options
      query.level = filterLevel;
    }

    // Status filtering
    if (filterStatus && filterStatus !== "all") {
      query.isActive = filterStatus === "true";
    }

    const users = await User.find(query)
      .populate("branch_id", "name")
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
      { header: "Level", key: "level", width: 15 },
      { header: "Branch", key: "branch", width: 25 },
      { header: "User Type", key: "userType", width: 20 },
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
        level: user.level || "-",
        branch: user.branch_id ? user.branch_id.name : "Kantor Pusat",
        userType: user.userType || "-",
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

    // Get filter parameters from query (sent by frontend)
    const filterBranch = req.query.filterBranch || "all";
    const filterLevel = req.query.filterLevel || "all";
    const filterStatus = req.query.filterStatus || "all";
    const filterUserType = req.query.filterUserType || "all";


    // Branch filtering
    if (currentUser.level === "Pusat") {
      // Pusat users can see all branches or filter by specific branch
      if (filterBranch !== "all") {
        if (filterBranch === "pusat") {
          query.branch_id = null; // khusus user pusat
        } else {
          query.branch_id = new mongoose.Types.ObjectId(filterBranch); // user cabang tertentu
        }
      }
    } else {
      // Cabang users can only see their own branch
      query.branch_id = currentUser.branch_id;
    }

    // User Type filtering
    if (filterUserType && filterUserType !== "all") {
      query.userType = filterUserType;
    }

    // Level filtering
    if (filterLevel && filterLevel !== "all") {
      // Fix level filter logic to match frontend select options
      query.level = filterLevel;
    }

    // Status filtering
    if (filterStatus && filterStatus !== "all") {
      query.isActive = filterStatus === "true";
    }

    const users = await User.find(query)
      .populate("branch_id", "name")
      .populate("role_id", "name")
      .sort({ createdAt: -1 });

    // Prepare data for CSV
    const records = users.map((user) => ({
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber || "-",
      level: user.level || "-",
      branch: user.branch_id ? user.branch_id.name : "Kantor Pusat",
      userType: user.userType || "-",
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
      "Level",
      "Branch",
      "User Type",
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
          record.level,
          record.branch,
          record.userType,
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
    const { branch_id, userType, level } = req.query;

    // Cek filter kosong
    if (!branch_id && !userType && !level) {
      return res.json({ success: false, message: "No filters provided" });
    }

    // Add userType filter
    if (userType) {
      query.userType = userType;
    }

    // Add level filter
    if (level) {
      query.level = level;
    }

    // Build query
    const query = { isActive: true };

    if (level === "Pusat") {
      // Jika level pusat, cari branch pusat
      const pusatBranch = await Branch.findOne({ type: "pusat" });
      if (pusatBranch) {
        query.branch_id = pusatBranch._id;
      }
    } else if (branch_id) {
      query.branch_id = branch_id;
    } 

    // Cari role sesuai filter
    const roles = await Role.find(query)
      .populate("branch_id", "name")
      .populate("userType", "name");

    if (!roles || roles.length === 0) {
      return res.json({ success: false, message: "No roles found" });
    }

    // Response lebih ringan (hanya data penting)
    return res.json({
      success: true,
      roles: roles.map((role) => ({
        _id: role._id,
        name: role.name,
        description: role.description,
      })),
    });
  } catch (error) {
    console.error("Get roles error:", error);
    res.status(500).json({ success: false, message: "Failed to load roles" });
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
