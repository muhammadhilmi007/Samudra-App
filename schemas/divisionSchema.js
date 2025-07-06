const mongoose = require("mongoose");

const divisionSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Division name is required!"],
    unique: true
  },
  code: {
    type: String,
    required: [true, "Division code is required!"],
    unique: true
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

module.exports = divisionSchema;