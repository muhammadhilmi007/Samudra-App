const mongoose = require("mongoose");

const positionSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Position name is required!"],
    unique: true
  },
  code: {
    type: String,
    required: [true, "Position code is required!"],
    unique: true
  },
  level: {
    type: Number,
    required: [true, "Position level is required!"],
    min: 1
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

module.exports = positionSchema;