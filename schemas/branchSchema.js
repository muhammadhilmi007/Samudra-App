const mongoose = require("mongoose");

const branchSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Branch name is required!"],
    unique: true
  },
  code: {
    type: String,
    required: [true, "Branch code is required!"],
    unique: true
  },
  address: {
    type: String,
    required: false
  },
  phone: {
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

module.exports = branchSchema;