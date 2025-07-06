const mongoose = require("mongoose");

const roleSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Role name is required!"]
  },
  description: {
    type: String,
    required: false
  },
  branch_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
    required: [true, "Branch is required!"]
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
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index untuk memastikan kombinasi unik
roleSchema.index({ name: 1, branch_id: 1, division_id: 1, position_id: 1 }, { unique: true });

module.exports = roleSchema;