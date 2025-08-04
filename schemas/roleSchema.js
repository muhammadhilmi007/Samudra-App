const mongoose = require("mongoose");

const roleSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Role name is required!"],
    trim: true
  },
  description: {
    type: String,
    required: false
  },
  users_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
    default: null
  },
  branch_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
    required: false,
    validate: {
      validator: async function(value) {
        // Jika ada users_id, cek level user
        if (this.users_id) {
          const User = mongoose.model('User');
          const user = await User.findById(this.users_id);
          
          // Jika user level Cabang, branch_id wajib diisi
          if (user && user.level === 'Cabang' && !value) {
            return false;
          }
          
          // Jika user level Pusat, branch_id boleh null
          if (user && user.level === 'Pusat') {
            return true;
          }
        }
        return true;
      },
      message: "Branch is required for Cabang level roles!"
    }
  },
  division_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Division",
    required: [true, "Division is required!"]
  },
  position_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Position",
    required: [true, "Position is required!"]
  },
  parent_role_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
    required: false,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isTemplate: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index untuk memastikan kombinasi unik
roleSchema.index({ 
  name: 1, 
  branch_id: 1, 
  division_id: 1, 
  position_id: 1 
}, { 
  unique: true 
});

// Index untuk performa query
roleSchema.index({ users_id: 1 });
roleSchema.index({ parent_role_id: 1 });
roleSchema.index({ isTemplate: 1 });

// Virtual untuk mendapatkan level role berdasarkan user
roleSchema.virtual('level').get(async function() {
  if (this.users_id) {
    const User = mongoose.model('User');
    const user = await User.findById(this.users_id).lean();
    return user ? user.level : null;
  }
  
  // Jika tidak ada users_id, cek dari branch
  if (!this.branch_id) {
    return 'Pusat';
  }
  
  const Branch = mongoose.model('Branch');
  const branch = await Branch.findById(this.branch_id).lean();
  return branch && branch.type === 'pusat' ? 'Pusat' : 'Cabang';
});

// Method untuk mendapatkan child roles
roleSchema.methods.getChildRoles = async function() {
  return await this.constructor.find({ parent_role_id: this._id });
};

// Method untuk mendapatkan inherited permissions
roleSchema.methods.getInheritedPermissions = async function() {
  const RolePermission = mongoose.model('RolePermission');
  const permissions = [];
  
  // Get own permissions
  const ownPermissions = await RolePermission.find({ 
    role_id: this._id, 
    allowed: true 
  }).populate('permission_id');
  
  permissions.push(...ownPermissions);
  
  // Get parent permissions if exists
  if (this.parent_role_id) {
    const parentRole = await this.constructor.findById(this.parent_role_id);
    if (parentRole) {
      const parentPermissions = await parentRole.getInheritedPermissions();
      permissions.push(...parentPermissions);
    }
  }
  
  // Remove duplicates
  const uniquePermissions = permissions.filter((permission, index, self) =>
    index === self.findIndex((p) => 
      p.permission_id._id.toString() === permission.permission_id._id.toString()
    )
  );
  
  return uniquePermissions;
};

// Pre-save middleware untuk validasi hierarchy
roleSchema.pre('save', async function(next) {
  if (this.parent_role_id) {
    // Prevent circular reference
    if (this.parent_role_id.equals(this._id)) {
      return next(new Error('Role cannot be its own parent'));
    }
    
    // Check if parent exists
    const parentRole = await this.constructor.findById(this.parent_role_id);
    if (!parentRole) {
      return next(new Error('Parent role not found'));
    }
    
    // Validate hierarchy: Cabang role cannot be parent of Pusat role
    if (this.users_id && parentRole.users_id) {
      const User = mongoose.model('User');
      const [user, parentUser] = await Promise.all([
        User.findById(this.users_id),
        User.findById(parentRole.users_id)
      ]);
      
      if (user && parentUser) {
        if (user.level === 'Pusat' && parentUser.level === 'Cabang') {
          return next(new Error('Cabang role cannot be parent of Pusat role'));
        }
      }
    }
  }
  
  next();
});

// Pre-delete middleware untuk cascade protection
roleSchema.pre('findOneAndDelete', async function(next) {
  const role = await this.model.findOne(this.getQuery());
  
  if (role) {
    // Check if role is used by any user
    const User = mongoose.model('User');
    const userCount = await User.countDocuments({ role_id: role._id });
    
    if (userCount > 0) {
      return next(new Error(`Cannot delete role. ${userCount} user(s) are using this role.`));
    }
    
    // Check if role has child roles
    const childCount = await this.model.countDocuments({ parent_role_id: role._id });
    
    if (childCount > 0) {
      return next(new Error(`Cannot delete role. ${childCount} child role(s) depend on this role.`));
    }
    
    // Delete related role permissions
    const RolePermission = mongoose.model('RolePermission');
    await RolePermission.deleteMany({ role_id: role._id });
  }
  
  next();
});

module.exports = roleSchema;