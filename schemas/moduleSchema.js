const mongoose = require("mongoose");

const moduleSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Module name is required!"]
  },
  code: {
    type: String,
    required: [true, "Module code is required!"],
    unique: true
  },
  description: {
    type: String,
    required: false
  },
  icon: {
    type: String,
    required: false,
    default: 'bx bx-grid-alt'
  },
  order: {
    type: Number,
    default: 0
  },
  parent_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Module",
    default: null
  },
  route: {
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

module.exports = moduleSchema;