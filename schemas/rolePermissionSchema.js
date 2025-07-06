const mongoose = require("mongoose");

const rolePermissionSchema = mongoose.Schema({
  role_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
    required: [true, "Role is required!"]
  },
  permission_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Permission",
    required: [true, "Permission is required!"]
  },
  allowed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index untuk memastikan kombinasi unik
rolePermissionSchema.index({ role_id: 1, permission_id: 1 }, { unique: true });

module.exports = rolePermissionSchema;