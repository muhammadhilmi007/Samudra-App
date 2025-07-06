const mongoose = require("mongoose");

const permissionSchema = mongoose.Schema({
  module_name: {
    type: String,
    required: [true, "Module name is required!"]
  },
  module_code: {
    type: String,
    required: [true, "Module code is required!"]
  },
  action: {
    type: String,
    required: [true, "Action is required!"],
    enum: ['create', 'read', 'update', 'delete', 'export', 'import', 'approve', 'reject']
  },
  description: {
    type: String,
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index untuk memastikan kombinasi unik
permissionSchema.index({ module_code: 1, action: 1 }, { unique: true });

module.exports = permissionSchema;