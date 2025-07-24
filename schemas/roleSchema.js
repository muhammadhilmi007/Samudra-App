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
  level: {
    type: String,
    enum: ['pusat', 'cabang'],
    default: 'cabang',
    required: [true, "Role level is required!"]
  },
  branch_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
    required: function() {
      return this.level === 'cabang';
    },
    validate: {
      validator: function(value) {
        // If level is pusat, branch_id should be null
        if (this.level === 'pusat') {
          return !value;
        }
        // If level is cabang, branch_id is required
        return !!value;
      },
      message: 'Branch is required for cabang level roles and must be empty for pusat level roles'
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
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index untuk memastikan kombinasi unik berdasarkan level
roleSchema.index({ 
  name: 1, 
  level: 1,
  branch_id: 1, 
  division_id: 1, 
  position_id: 1 
}, { 
  unique: true,
  partialFilterExpression: { branch_id: { $exists: true } }
});

// Index untuk role pusat (tanpa branch_id)
roleSchema.index({ 
  name: 1, 
  level: 1,
  division_id: 1, 
  position_id: 1 
}, { 
  unique: true,
  partialFilterExpression: { level: 'pusat' }
});

// Virtual field untuk backward compatibility
roleSchema.virtual('isActiveStatus').get(function() {
  return this.status === 'active' && this.isActive;
});

// Pre-save middleware
roleSchema.pre('save', function(next) {
  // Clear branch_id if level is pusat
  if (this.level === 'pusat') {
    this.branch_id = null;
  }
  next();
});

// Instance methods
roleSchema.methods.hasChildren = async function() {
  const Role = mongoose.model('Role');
  const count = await Role.countDocuments({ parent_role_id: this._id });
  return count > 0;
};

roleSchema.methods.isUsedByUsers = async function() {
  const User = mongoose.model('User');
  const count = await User.countDocuments({ role_id: this._id });
  return count > 0;
};

// Static methods
roleSchema.statics.getRoleHierarchy = async function(parentId = null) {
  const roles = await this.find({ parent_role_id: parentId })
    .populate('branch_id')
    .populate('division_id')
    .populate('position_id')
    .sort({ level: 1, name: 1 });
  
  const rolesWithChildren = [];
  for (const role of roles) {
    const children = await this.getRoleHierarchy(role._id);
    rolesWithChildren.push({
      ...role.toObject(),
      children: children
    });
  }
  
  return rolesWithChildren;
};

module.exports = roleSchema;