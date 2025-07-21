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
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/profiles/');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// File filter for images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
}).single('photoProfile');

// List all users
const index = async (req, res) => {
  try {
    const branches = await Branch.find().sort({ name: 1 });
    const divisions = await Division.find().sort({ name: 1 });
    const positions = await Position.find().sort({ name: 1 });

    // Get current user to check their access level
    const currentUser = await User.findOne({ email: req.session.user.email });
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 2;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    // Query for users - if not super admin, filter by branch
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
    if (!req.session.user.email.includes("admin@")) {
      query.branch_id = currentUser.branch_id;
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .populate("branch_id")
        .populate("division_id")
        .populate("position_id")
        .populate("role_id")
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

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
      currentUser: currentUser,
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

// Show Profile Page
const detail = (request, response, next) => {
  response.render("../views/pages/settings/users/profiles/profile_setting.ejs", {
    title: "Profile",
    name: "profile",
  });
};

// Show create form
const create = async (req, res) => {
  try {
    const currentUser = await User.findOne({ email: req.session.user.email });

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

    res.render("../views/pages/settings/users/create.ejs", {
      title: "Create User",
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
      username, firstname, lastname, email, password, phoneNumber,
      division_id, position_id, status
    } = req.body;

    let userBranchId = req.body.branch_id;
    const isPusat = status === 'on';

    if (isPusat) {
      const branchPusat = await Branch.findOne({ type: 'pusat' });
      if (branchPusat) {
        userBranchId = branchPusat._id;
      } else {
        // Handle case where 'pusat' branch is not found
        req.session.errorMessage = "Kantor Pusat branch not found!";
        return res.redirect(req.get('referer'));
      }
    } else {
      if (!userBranchId) {
        req.session.errorMessage = "Branch is required for non-pusat user!";
        return res.redirect(req.get('referer'));
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
      photoProfile: req.file ? 'uploads/profiles/' + req.file.filename : null,
      status: isPusat,
      branch_id: isPusat ? null : userBranchId,
      division_id,
      position_id,
      role_id: role._id,
      isActive: req.body.isActive === 'on',
    });

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
    res.redirect(req.get('referer'));
  }
};

// Show edit form
const edit = async (req, res) => {
  try {
    const currentUser = await User.findOne({ email: req.session.user.email });

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
      return res.redirect(res.locals.base + "settings/users/index/" + res.getLocale());
    }

    const {
      username, firstname, lastname, email, password, phoneNumber,
      division_id, position_id, status
    } = req.body;

    user.username = username;
    user.firstname = firstname;
    user.lastname = lastname;
    user.email = email;
    user.phoneNumber = phoneNumber;
    user.division_id = division_id;
    user.position_id = position_id;
    user.isActive = req.body.isActive === 'on';

    const isPusat = status === 'on';
    user.status = isPusat;

    if (isPusat) {
      user.branch_id = null;
    } else {
      if (!req.body.branch_id) {
        req.session.errorMessage = "Branch is required for non-pusat user!";
        return res.redirect(req.get('referer'));
      }
      user.branch_id = req.body.branch_id;
    }

    if (req.file) {
      // Delete old photo if it exists
      if (user.photoProfile) {
        const oldPath = path.join(__dirname, '..', 'public', user.photoProfile);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      user.photoProfile = 'uploads/profiles/' + req.file.filename;
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    // Find or create role
    let roleBranchId = user.branch_id;
    if (isPusat) {
      const branchPusat = await Branch.findOne({ type: 'pusat' });
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
    res.redirect(req.get('referer'));
  }
};

// Delete user
const destroy = async (req, res) => {
  try {
    const currentUser = await User.findOne({ email: req.session.user.email });

    // Prevent self-deletion
    if (req.params.id === currentUser._id.toString()) {
      req.session.errorMessage = "You cannot delete your own account!";
      return res.redirect(
        process.env.BASE_URL + "settings/users/index/" + res.getLocale()
      );
    }

    // Check if user can delete this user
    let deleteQuery = { _id: req.params.id };
    if (!req.session.user.email.includes("admin@")) {
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

// Get roles by branch, division, and position (AJAX endpoint)
const getRolesByFilters = async (req, res) => {
  try {
    const { branch_id, division_id, position_id } = req.query;

    const query = { isActive: true };
    if (branch_id) query.branch_id = branch_id;
    if (division_id) query.division_id = division_id;
    if (position_id) query.position_id = position_id;

    const roles = await Role.find(query)
      .populate("branch_id")
      .populate("division_id")
      .populate("position_id");

    res.json(roles);
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
};
