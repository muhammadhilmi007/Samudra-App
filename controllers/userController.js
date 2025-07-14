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
          { name: { $regex: search, $options: "i" } },
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
    const currentUser = await User.findOne({ email: req.session.user.email });

    // For non-admin users, force the branch to be their own branch
    let branchId = req.body.branch_id;
    if (!req.session.user.email.includes("admin@")) {
      branchId = currentUser.branch_id;
    }

    // Find or create role based on branch, division, position
    let role = await Role.findOne({
      branch_id: branchId,
      division_id: req.body.division_id,
      position_id: req.body.position_id,
      isActive: true,
    });

    if (!role) {
      // Create a default role if not exists
      const branch = await Branch.findById(branchId);
      const division = await Division.findById(req.body.division_id);
      const position = await Position.findById(req.body.position_id);

      role = new Role({
        name: `${position.name} - ${division.name} - ${branch.name}`,
        description: `Default role for ${position.name} in ${division.name} at ${branch.name}`,
        branch_id: branchId,
        division_id: req.body.division_id,
        position_id: req.body.position_id,
        isActive: true,
      });
      await role.save();
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(req.body.password, 12);

    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      branch_id: branchId,
      division_id: req.body.division_id,
      position_id: req.body.position_id,
      role_id: role._id,
      isActive: req.body.isActive === "on",
    });

    await user.save();
    req.session.successMessage = "User created successfully!";
    res.redirect(
      process.env.BASE_URL + "settings/users/index/" + res.getLocale()
    );
  } catch (error) {
    console.error(error);

    let branchQuery = { isActive: true };
    if (!req.session.user.email.includes("admin@")) {
      const currentUser = await User.findOne({ email: req.session.user.email });
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
      errors: error.errors,
      input: req.body,
    });
  }
};

// Show edit form
const edit = async (req, res) => {
  try {
    const currentUser = await User.findOne({ email: req.session.user.email });

    // Check if user can edit this user
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

    // Update user fields
    user.name = req.body.name;
    user.email = req.body.email;

    // Update password if provided
    if (req.body.password && req.body.password.trim() !== "") {
      user.password = await bcrypt.hash(req.body.password, 12);
    }

    // For non-admin users, don't allow branch changes
    if (req.session.user.email.includes("admin@")) {
      user.branch_id = req.body.branch_id;
    }

    user.division_id = req.body.division_id;
    user.position_id = req.body.position_id;

    // If role_id is provided, use it; otherwise find/create role
    if (req.body.role_id) {
      user.role_id = req.body.role_id;
    } else {
      let role = await Role.findOne({
        branch_id: user.branch_id,
        division_id: req.body.division_id,
        position_id: req.body.position_id,
        isActive: true,
      });

      if (!role) {
        const branch = await Branch.findById(user.branch_id);
        const division = await Division.findById(req.body.division_id);
        const position = await Position.findById(req.body.position_id);

        role = new Role({
          name: `${position.name} - ${division.name} - ${branch.name}`,
          description: `Default role for ${position.name} in ${division.name} at ${branch.name}`,
          branch_id: user.branch_id,
          division_id: req.body.division_id,
          position_id: req.body.position_id,
          isActive: true,
        });
        await role.save();
      }
      user.role_id = role._id;
    }

    user.isActive = req.body.isActive === "on";

    await user.save();
    req.session.successMessage = "User updated successfully!";
    res.redirect(
      process.env.BASE_URL + "settings/users/index/" + res.getLocale()
    );
  } catch (error) {
    console.error(error);

    let branchQuery = { isActive: true };
    if (!req.session.user.email.includes("admin@")) {
      branchQuery._id = currentUser.branch_id;
    }

    const branches = await Branch.find(branchQuery).sort({ name: 1 });
    const divisions = await Division.find({ isActive: true }).sort({ name: 1 });
    const positions = await Position.find({ isActive: true }).sort({
      level: 1,
    });
    const roles = await Role.find({ isActive: true });

    res.render("../views/pages/settings/users/edit.ejs", {
      title: "Edit User",
      user: User,
      branches: branches,
      divisions: divisions,
      positions: positions,
      roles: roles,
      layout: "../views/layout/app.ejs",
      errors: error.errors,
      input: req.body,
    });
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
  index,
  create,
  store,
  edit,
  update,
  destroy,
  getRolesByFilters,
};
