const mongoose = require("mongoose");
const Role = mongoose.model("Role", require("../schemas/roleSchema"));
const Branch = mongoose.model("Branch", require("../schemas/branchSchema"));
const Division = mongoose.model("Division", require("../schemas/divisionSchema"));
const Position = mongoose.model("Position", require("../schemas/positionSchema"));
const Permission = mongoose.model("Permission", require("../schemas/permissionSchema"));
const RolePermission = mongoose.model("RolePermission", require("../schemas/rolePermissionSchema"));
const Module = mongoose.model("Module", require("../schemas/moduleSchema"));
const User = mongoose.model("User", require("../schemas/userSchema"));

// List all roles with enhanced filtering and user data
const index = async (req, res) => {
  try {
    const currentUser = await User.findById(req.session.user._id);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const filterLevel = req.query.level || "all";
    const filterTemplate = req.query.template || "all";
    const filterBranch = req.query.branch || "all";

    // Build query
    let query = {};
    
    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    // Template filter
    if (filterTemplate !== "all") {
      query.isTemplate = filterTemplate === "true";
    }

    // Level & Branch filter based on user permissions
    if (currentUser.level === "Cabang") {
      // Cabang users can only see roles in their branch
      query.branch_id = currentUser.branch_id;
    } else {
      // Pusat users can filter by level
      if (filterLevel !== "all") {
        if (filterLevel === "pusat") {
          const pusatBranch = await Branch.findOne({ type: "pusat" });
          query.branch_id = pusatBranch ? pusatBranch._id : null;
        } else if (filterLevel === "cabang") {
          const pusatBranch = await Branch.findOne({ type: "pusat" });
          query.branch_id = { $ne: pusatBranch?._id };
        }
      }
      
      // Branch specific filter
      if (filterBranch !== "all" && filterBranch) {
        query.branch_id = filterBranch;
      }
    }

    // Get data with populate
    const [roles, total] = await Promise.all([
      Role.find(query)
        .populate("branch_id")
        .populate("division_id")
        .populate("position_id")
        .populate("parent_role_id", "name")
        .populate("users_id", "firstname lastname email level")
        .sort({ isTemplate: -1, name: 1 })
        .skip(skip)
        .limit(limit),
      Role.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    // Get filter options - exclude pusat branch from dropdown
    const branches = await Branch.find({ isActive: "active", type: { $ne: 'pusat' } }).sort({ name: 1 });
    const divisions = await Division.find({ isActive: true }).sort({ name: 1 });
    const positions = await Position.find({ isActive: true }).sort({ level: 1, name: 1 });
    
    // Get parent roles for hierarchy
    const parentRoles = await Role.find({ 
      isActive: true, 
      isTemplate: false
    }).select("name").sort({ name: 1 });

    // Get users for assignment in modal
    let userQuery = { isActive: true };
    if (currentUser.level === "Cabang") {
      userQuery.$or = [
        { branch_id: currentUser.branch_id },
        { level: 'Pusat' }
      ];
    }
    
    const users = await User.find(userQuery)
      .select("firstname lastname email level branch_id")
      .populate('branch_id', 'name')
      .sort({ level: -1, firstname: 1 });

    // Get success/error messages from session
    const successMessage = req.session.successMessage;
    const errorMessage = req.session.errorMessage;
    delete req.session.successMessage;
    delete req.session.errorMessage;

    res.render("../views/pages/settings/roles/index.ejs", {
      title: "Roles Management",
      roles,
      branches,
      divisions,
      positions,
      parentRoles,
      users, // Pass users data for modals
      layout: "../views/layout/app.ejs",
      name: "roles",
      currentPage: page,
      totalPages,
      limit,
      total,
      search,
      filters: {
        level: filterLevel,
        template: filterTemplate,
        branch: filterBranch
      },
      userPermissions: req.userPermissions,
      successMessage,
      errorMessage
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load roles!";
    res.redirect(res.locals.base + "dashboard/analytics/" + res.getLocale());
  }
};

// Create role from template with level handling
const createFromTemplate = async (req, res) => {
  try {
    const { template_id, name, role_level, branch_id, division_id, position_id, users_id } = req.body;
    
    // Get template
    const template = await Role.findById(template_id);
    if (!template || !template.isTemplate) {
      req.session.errorMessage = "Invalid template!";
      return res.redirect(res.locals.base + "settings/roles/index/" + res.getLocale());
    }

    // Validate level and branch requirement
    let finalBranchId = null;
    
    if (role_level === 'pusat') {
      // For Pusat role, find the pusat branch
      const pusatBranch = await Branch.findOne({ type: 'pusat' });
      if (pusatBranch) {
        finalBranchId = pusatBranch._id;
      }
    } else if (role_level === 'cabang') {
      // For Cabang role, branch_id is required
      if (!branch_id) {
        req.session.errorMessage = "Branch is required for Cabang level role!";
        return res.redirect(res.locals.base + "settings/roles/index/" + res.getLocale());
      }
      finalBranchId = branch_id;
    } else {
      req.session.errorMessage = "Please select role level (Pusat or Cabang)!";
      return res.redirect(res.locals.base + "settings/roles/index/" + res.getLocale());
    }

    // If assigning to a specific user, validate level compatibility
    if (users_id) {
      const targetUser = await User.findById(users_id);
      if (targetUser) {
        // Check if user level matches role level
        if (targetUser.level === 'Pusat' && role_level === 'cabang') {
          req.session.errorMessage = "Cannot assign Cabang role to Pusat user!";
          return res.redirect(res.locals.base + "settings/roles/index/" + res.getLocale());
        }
        if (targetUser.level === 'Cabang' && role_level === 'pusat') {
          req.session.errorMessage = "Cannot assign Pusat role to Cabang user!";
          return res.redirect(res.locals.base + "settings/roles/index/" + res.getLocale());
        }
      }
    }

    // Create new role from template
    const newRole = new Role({
      name,
      description: template.description,
      branch_id: finalBranchId,
      division_id: division_id || template.division_id,
      position_id: position_id || template.position_id,
      users_id: users_id || null,
      parent_role_id: template.parent_role_id,
      isTemplate: false,
      isActive: true
    });

    await newRole.save();

    // Copy permissions from template
    const templatePermissions = await RolePermission.find({ role_id: template._id });
    const newPermissions = templatePermissions.map(tp => ({
      role_id: newRole._id,
      permission_id: tp.permission_id,
      allowed: tp.allowed
    }));
    
    if (newPermissions.length > 0) {
      await RolePermission.insertMany(newPermissions);
    }

    req.session.successMessage = `${role_level === 'pusat' ? 'Pusat' : 'Cabang'} role created from template successfully!`;
    res.redirect(res.locals.base + "settings/roles/index/" + res.getLocale());
  } catch (error) {
    console.error(error);
    req.session.errorMessage = error.message || "Failed to create role from template!";
    res.redirect(res.locals.base + "settings/roles/index/" + res.getLocale());
  }
};

// Bulk assign role to multiple users
const bulkAssign = async (req, res) => {
  try {
    const { role_id, user_ids } = req.body;
    
    if (!role_id || !user_ids || !Array.isArray(user_ids)) {
      req.session.errorMessage = "Invalid request data!";
      return res.redirect(res.locals.base + "settings/roles/index/" + res.getLocale());
    }

    const role = await Role.findById(role_id);
    if (!role) {
      req.session.errorMessage = "Role not found!";
      return res.redirect(res.locals.base + "settings/roles/index/" + res.getLocale());
    }

    // Update users
    const updateResult = await User.updateMany(
      { _id: { $in: user_ids } },
      { $set: { role_id: role._id } }
    );

    req.session.successMessage = `Role assigned to ${updateResult.modifiedCount} users successfully!`;
    res.redirect(res.locals.base + "settings/roles/index/" + res.getLocale());
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to assign role to users!";
    res.redirect(res.locals.base + "settings/roles/index/" + res.getLocale());
  }
};

// Get role hierarchy data for ApexTree visualization
const getHierarchy = async (req, res) => {
  try {
    const roles = await Role.find({ isActive: true, isTemplate: false })
      .populate("branch_id", "name")
      .populate("division_id", "name")
      .populate("position_id", "name level")
      .populate("parent_role_id", "name")
      .populate("users_id", "firstname lastname photoProfile");

    // Helper function to build nested tree structure
    const buildTree = (parentId = null) => {
      return roles
        .filter(role => {
          const roleParentId = role.parent_role_id?._id?.toString() || null;
          return roleParentId === parentId;
        })
        .map(role => {
          const children = buildTree(role._id.toString());
          
          // Generate colors based on position level
          const getNodeColor = (level) => {
            const colors = {
              1: '#e74c3c',   // CEO level - red
              2: '#3498db',   // Manager level - blue
              3: '#2ecc71',   // Branch head - green
              4: '#f39c12',   // Department head - orange
              5: '#9b59b6',   // Supervisor - purple
              default: '#95a5a6' // Others - gray
            };
            return colors[level] || colors.default;
          };

          const nodeColor = getNodeColor(role.position_id?.level || 99);
          const assignedUser = role.users_id ? 
            `${role.users_id.firstname} ${role.users_id.lastname}` : 
            'Unassigned';
          
          // Get user photo profile or use default avatar
          const userPhotoURL = role.users_id?.photoProfile ? 
            `/${role.users_id.photoProfile}` : 
            `https://i.pravatar.cc/300?img=${Math.floor(Math.random() * 70) + 1}`;

          return {
            id: role._id.toString(),
            data: {
              imageURL: userPhotoURL,
              name: role.name,
              branch: role.branch_id?.name || 'Pusat',
              division: role.division_id?.name || '-',
              position: role.position_id?.name || '-',
              assignedUser: assignedUser
            },
            options: {
              nodeBGColor: nodeColor,
              nodeBGColorHover: nodeColor
            },
            children: children.length > 0 ? children : undefined
          };
        });
    };

    // Build the tree starting from root nodes (no parent)
    const treeData = buildTree();

    // If no root nodes found, create a default structure
    if (treeData.length === 0 && roles.length > 0) {
      // Find the role with the highest position level as root
      const rootRole = roles.reduce((prev, current) => {
        const prevLevel = prev.position_id?.level || 99;
        const currentLevel = current.position_id?.level || 99;
        return currentLevel < prevLevel ? current : prev;
      });

      const nodeColor = '#e74c3c';
      const assignedUser = rootRole.users_id ? 
        `${rootRole.users_id.firstname} ${rootRole.users_id.lastname}` : 
        'Unassigned';
      
      // Get user photo profile or use default avatar
      const userPhotoURL = rootRole.users_id?.photoProfile ? 
        `/${rootRole.users_id.photoProfile}` : 
        `https://i.pravatar.cc/300?img=${Math.floor(Math.random() * 70) + 1}`;

      treeData.push({
        id: rootRole._id.toString(),
        data: {
          imageURL: userPhotoURL,
          name: rootRole.name,
          branch: rootRole.branch_id?.name || 'Pusat',
          division: rootRole.division_id?.name || '-',
          position: rootRole.position_id?.name || '-',
          assignedUser: assignedUser
        },
        options: {
          nodeBGColor: nodeColor,
          nodeBGColorHover: nodeColor
        },
        children: buildTree(rootRole._id.toString())
      });
    }

    res.json({
      success: true,
      treeData: treeData.length > 0 ? treeData[0] : null // Return the first root node
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Failed to load hierarchy data" });
  }
};

// Store new role (enhanced with level handling)
const store = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      role_level, // New field for level selection
      branch_id, 
      division_id, 
      position_id, 
      parent_role_id,
      users_id,
      isTemplate,
      isActive 
    } = req.body;

    // Validate level and branch requirement
    let finalBranchId = null;
    
    if (role_level === 'pusat') {
      // For Pusat role, find the pusat branch
      const pusatBranch = await Branch.findOne({ type: 'pusat' });
      if (pusatBranch) {
        finalBranchId = pusatBranch._id;
      }
    } else if (role_level === 'cabang') {
      // For Cabang role, branch_id is required
      if (!branch_id) {
        req.session.errorMessage = "Branch is required for Cabang level role!";
        return res.redirect(req.get("referer"));
      }
      finalBranchId = branch_id;
    } else {
      req.session.errorMessage = "Please select role level (Pusat or Cabang)!";
      return res.redirect(req.get("referer"));
    }

    // If assigning to a specific user, validate level compatibility
    if (users_id) {
      const targetUser = await User.findById(users_id);
      if (targetUser) {
        // Check if user level matches role level
        if (targetUser.level === 'Pusat' && role_level === 'cabang') {
          req.session.errorMessage = "Cannot assign Cabang role to Pusat user!";
          return res.redirect(req.get("referer"));
        }
        if (targetUser.level === 'Cabang' && role_level === 'pusat') {
          req.session.errorMessage = "Cannot assign Pusat role to Cabang user!";
          return res.redirect(req.get("referer"));
        }
        
        // For cabang user, ensure the branch matches
        if (targetUser.level === 'Cabang' && targetUser.branch_id) {
          if (targetUser.branch_id.toString() !== finalBranchId.toString()) {
            req.session.errorMessage = "User's branch does not match the role's branch!";
            return res.redirect(req.get("referer"));
          }
        }
      }
    }

    // Validate parent role hierarchy
    if (parent_role_id) {
      const parentRole = await Role.findById(parent_role_id).populate('branch_id');
      if (parentRole) {
        // Check hierarchy: Cabang role cannot be parent of Pusat role
        const parentIsPusat = !parentRole.branch_id || parentRole.branch_id.type === 'pusat';
        if (role_level === 'pusat' && !parentIsPusat) {
          req.session.errorMessage = "Cabang role cannot be parent of Pusat role!";
          return res.redirect(req.get("referer"));
        }
      }
    }

    const role = new Role({
      name,
      description,
      branch_id: finalBranchId,
      division_id,
      position_id,
      parent_role_id: parent_role_id || null,
      users_id: users_id || null,
      isTemplate: isTemplate === "on",
      isActive: isActive === "on"
    });

    await role.save();
    
    req.session.successMessage = `${role_level === 'pusat' ? 'Pusat' : 'Cabang'} role created successfully!`;
    res.redirect(res.locals.base + "settings/roles/index/" + res.getLocale());
  } catch (error) {
    console.error("Error creating role:", error);
    req.session.errorMessage = error.message || "Failed to create role!";
    res.redirect(req.get("referer"));
  }
};

// Update role (enhanced with level handling)
const update = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      req.session.errorMessage = "Role not found!";
      return res.redirect(res.locals.base + "settings/roles/index/" + res.getLocale());
    }

    const {
      name,
      description,
      role_level, // New field for level selection
      branch_id,
      division_id,
      position_id,
      parent_role_id,
      users_id,
      isTemplate,
      isActive
    } = req.body;

    // Validate level and branch requirement
    let finalBranchId = null;
    
    if (role_level === 'pusat') {
      // For Pusat role, find the pusat branch
      const pusatBranch = await Branch.findOne({ type: 'pusat' });
      if (pusatBranch) {
        finalBranchId = pusatBranch._id;
      }
    } else if (role_level === 'cabang') {
      // For Cabang role, branch_id is required
      if (!branch_id) {
        req.session.errorMessage = "Branch is required for Cabang level role!";
        return res.redirect(req.get("referer"));
      }
      finalBranchId = branch_id;
    } else {
      req.session.errorMessage = "Please select role level (Pusat or Cabang)!";
      return res.redirect(req.get("referer"));
    }

    // If assigning to a specific user, validate level compatibility
    if (users_id) {
      const targetUser = await User.findById(users_id);
      if (targetUser) {
        // Check if user level matches role level
        if (targetUser.level === 'Pusat' && role_level === 'cabang') {
          req.session.errorMessage = "Cannot assign Cabang role to Pusat user!";
          return res.redirect(req.get("referer"));
        }
        if (targetUser.level === 'Cabang' && role_level === 'pusat') {
          req.session.errorMessage = "Cannot assign Pusat role to Cabang user!";
          return res.redirect(req.get("referer"));
        }
        
        // For cabang user, ensure the branch matches
        if (targetUser.level === 'Cabang' && targetUser.branch_id) {
          if (targetUser.branch_id.toString() !== finalBranchId.toString()) {
            req.session.errorMessage = "User's branch does not match the role's branch!";
            return res.redirect(req.get("referer"));
          }
        }
      }
    }

    // Check if changing level will affect existing users
    const existingUsers = await User.countDocuments({ role_id: role._id });
    if (existingUsers > 0) {
      const oldLevel = (!role.branch_id || (await Branch.findById(role.branch_id)).type === 'pusat') ? 'pusat' : 'cabang';
      if (oldLevel !== role_level) {
        req.session.errorMessage = `Cannot change role level. ${existingUsers} user(s) are using this role. Please reassign them first.`;
        return res.redirect(req.get("referer"));
      }
    }

    // Validate parent role hierarchy
    if (parent_role_id && parent_role_id !== role._id.toString()) {
      const parentRole = await Role.findById(parent_role_id).populate('branch_id');
      if (parentRole) {
        // Check hierarchy: Cabang role cannot be parent of Pusat role
        const parentIsPusat = !parentRole.branch_id || parentRole.branch_id.type === 'pusat';
        if (role_level === 'pusat' && !parentIsPusat) {
          req.session.errorMessage = "Cabang role cannot be parent of Pusat role!";
          return res.redirect(req.get("referer"));
        }
      }
    }

    // Update fields
    role.name = name;
    role.description = description;
    role.branch_id = finalBranchId;
    role.division_id = division_id;
    role.position_id = position_id;
    role.parent_role_id = parent_role_id || null;
    role.users_id = users_id || null;
    role.isTemplate = isTemplate === "on";
    role.isActive = isActive === "on";

    await role.save();
    
    req.session.successMessage = `${role_level === 'pusat' ? 'Pusat' : 'Cabang'} role updated successfully!`;
    res.redirect(res.locals.base + "settings/roles/index/" + res.getLocale());
  } catch (error) {
    console.error(error);
    req.session.errorMessage = error.message || "Failed to update role!";
    res.redirect(req.get("referer"));
  }
};

// Delete role (with cascade protection)
const destroy = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      req.session.errorMessage = "Role not found!";
      return res.redirect(res.locals.base + "settings/roles/index/" + res.getLocale());
    }

    // Check if role is used by any user
    const userCount = await User.countDocuments({ role_id: role._id });
    if (userCount > 0) {
      req.session.errorMessage = `Cannot delete role. ${userCount} user(s) are using this role.`;
      return res.redirect(res.locals.base + "settings/roles/index/" + res.getLocale());
    }

    // Check if role has child roles
    const childCount = await Role.countDocuments({ parent_role_id: role._id });
    if (childCount > 0) {
      req.session.errorMessage = `Cannot delete role. ${childCount} child role(s) depend on this role.`;
      return res.redirect(res.locals.base + "settings/roles/index/" + res.getLocale());
    }

    // Delete related permissions
    await RolePermission.deleteMany({ role_id: role._id });

    // Delete the role
    await Role.findByIdAndDelete(req.params.id);

    req.session.successMessage = "Role deleted successfully!";
    res.redirect(res.locals.base + "settings/roles/index/" + res.getLocale());
  } catch (error) {
    console.error(error);
    req.session.errorMessage = error.message || "Failed to delete role!";
    res.redirect(res.locals.base + "settings/roles/index/" + res.getLocale());
  }
};

// Show create form with user data
const create = async (req, res) => {
  try {
    const currentUser = await User.findById(req.session.user._id);
    
    // Get branches based on user level (exclude pusat branch for dropdown)
    let branchQuery = { isActive: "active", type: { $ne: 'pusat' } };
    if (currentUser.level === "Cabang") {
      branchQuery._id = currentUser.branch_id;
    }
    
    const branches = await Branch.find(branchQuery).sort({ name: 1 });
    const divisions = await Division.find({ isActive: true }).sort({ name: 1 });
    const positions = await Position.find({ isActive: true }).sort({ level: 1, name: 1 });
    const templates = await Role.find({ isTemplate: true, isActive: true }).sort({ name: 1 });
    
    // Get potential parent roles
    const parentRoles = await Role.find({ 
      isActive: true, 
      isTemplate: false 
    }).select("name").sort({ name: 1 });
    
    // Get users for assignment
    let userQuery = { isActive: true };
    if (currentUser.level === "Cabang") {
      userQuery.$or = [
        { branch_id: currentUser.branch_id },
        { level: 'Pusat' }
      ];
    }
    
    const users = await User.find(userQuery)
      .select("firstname lastname email level branch_id")
      .populate('branch_id', 'name')
      .sort({ level: -1, firstname: 1 }); // Sort by level first (Pusat first), then name

    res.render("../views/pages/settings/roles/index", {
      title: "Role Management",
      mode: "create",
      branches,
      divisions,
      positions,
      templates,
      parentRoles,
      users,
      layout: "../views/layout/app.ejs",
      name: "roles",
      successMessage: req.session.successMessage || null,
      errorMessage: req.session.errorMessage || null
    });
    
    // Clear messages
    delete req.session.successMessage;
    delete req.session.errorMessage;
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load form data!";
    res.redirect(res.locals.base + "settings/roles/index/" + res.getLocale());
  }
};

// Show edit form with user data
const edit = async (req, res) => {
  try {
    const currentUser = await User.findById(req.session.user._id);
    const role = await Role.findById(req.params.id)
      .populate("users_id", "firstname lastname email level branch_id")
      .populate("branch_id")
      .populate("division_id")
      .populate("position_id")
      .populate("parent_role_id", "name");
      
    if (!role) {
      req.session.errorMessage = "Role not found!";
      return res.redirect(res.locals.base + "settings/roles/index/" + res.getLocale());
    }

    // Get branches based on user level (exclude pusat branch for dropdown)
    let branchQuery = { isActive: "active", type: { $ne: 'pusat' } };
    if (currentUser.level === "Cabang") {
      branchQuery._id = currentUser.branch_id;
    }
    
    const branches = await Branch.find(branchQuery).sort({ name: 1 });
    const divisions = await Division.find({ isActive: true }).sort({ name: 1 });
    const positions = await Position.find({ isActive: true }).sort({ level: 1, name: 1 });
    
    // Get potential parent roles (excluding current role)
    const parentRoles = await Role.find({ 
      isActive: true, 
      isTemplate: false,
      _id: { $ne: role._id }
    }).select("name").sort({ name: 1 });
    
    // Get users for assignment
    let userQuery = { isActive: true };
    if (currentUser.level === "Cabang") {
      userQuery.$or = [
        { branch_id: currentUser.branch_id },
        { level: 'Pusat' }
      ];
    }
    
    const users = await User.find(userQuery)
      .select("firstname lastname email level branch_id")
      .populate('branch_id', 'name')
      .sort({ level: -1, firstname: 1 });

    res.render("../views/pages/settings/roles/edit", {
      title: "Edit Role",
      role,
      branches,
      divisions,
      positions,
      parentRoles,
      users,
      layout: "../views/layout/app.ejs",
      name: "roles",
      successMessage: req.session.successMessage || null,
      errorMessage: req.session.errorMessage || null
    });
    
    // Clear messages
    delete req.session.successMessage;
    delete req.session.errorMessage;
  } catch (error) {
    console.error("Error loading edit form:", error);
    req.session.errorMessage = "Failed to load role!";
    res.redirect(res.locals.base + "settings/roles/index/" + res.getLocale());
  }
};

// Show permissions form (keep existing function)
const permissions = async (req, res) => {
  try {
    console.log("Permissions form for role id:", req.params.id);

    const role = await Role.findById(req.params.id)
      .populate("branch_id")
      .populate("division_id")
      .populate("position_id");

    if (!role) {
      req.session.errorMessage = "Role not found!";
      return res.redirect(
        process.env.BASE_URL + "settings/roles/index/" + res.getLocale()
      );
    }

    // Get all modules with their permissions
    const modules = await Module.find({ isActive: true, parent_id: null }).sort(
      { order: 1 }
    );
    console.log("Modules found:", modules.length);

    const allPermissions = await Permission.find({ isActive: true });
    console.log("All permissions found:", allPermissions.length);

    // Get current role permissions
    const rolePermissions = await RolePermission.find({ role_id: role._id });
    console.log("Role permissions found:", rolePermissions.length);

    const currentPermissions = {};
    rolePermissions.forEach((rp) => {
      currentPermissions[rp.permission_id.toString()] = rp.allowed;
    });

    // Get inherited permissions if role has parent
    let inheritedPermissions = {};
    if (role.parent_role_id) {
      const parentPermissions = await role.getInheritedPermissions();
      parentPermissions.forEach((pp) => {
        if (pp.permission_id) {
          inheritedPermissions[pp.permission_id._id.toString()] = true;
        }
      });
    }

    // Organize permissions by module
    const modulePermissions = {};
    for (const module of modules) {
      modulePermissions[module.code] = {
        module: module,
        permissions: allPermissions.filter(
          (p) => p.module_code === module.code
        ),
      };
    }
    console.log("Module permissions keys:", Object.keys(modulePermissions));

    res.render("../views/pages/settings/roles/permissions", {
      title: "Role Permissions",
      role: role,
      modulePermissions: modulePermissions,
      currentPermissions: currentPermissions,
      inheritedPermissions: inheritedPermissions,
      layout: "../views/layout/app.ejs",
      name: "roles",
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load permissions!";
    res.redirect(
      process.env.BASE_URL + "settings/roles/index/" + res.getLocale()
    );
  }
};

// Update permissions (keep existing function)
const updatePermissions = async (req, res) => {
  try {
    const roleId = req.params.id;
    console.log("Updating permissions for role:", roleId);

    // Delete all existing permissions for this role
    const deleteResult = await RolePermission.deleteMany({ role_id: roleId });
    console.log("Deleted role permissions:", deleteResult.deletedCount);

    // Add new permissions
    const permissions = req.body.permissions || [];
    console.log("New permissions to add:", permissions);

    for (const permissionId of permissions) {
      const created = await RolePermission.create({
        role_id: roleId,
        permission_id: permissionId,
        allowed: true,
      });
      console.log("Created RolePermission:", created._id);
    }

    req.session.successMessage = "Permissions updated successfully!";
    res.redirect(
      process.env.BASE_URL +
        "settings/roles/edit/" +
        roleId +
        "/permissions/" +
        res.getLocale()
    );
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to update permissions!";
    res.redirect(
      process.env.BASE_URL + "settings/roles/index/" + res.getLocale()
    );
  }
};

// Export all functions
module.exports = {
  index,
  create,
  store,
  edit,
  update,
  destroy,
  permissions,
  updatePermissions,
  createFromTemplate,
  bulkAssign,
  getHierarchy
};