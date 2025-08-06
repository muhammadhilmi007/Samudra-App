const mongoose = require("mongoose");
const { isEmail } = require("validator");
const validator = require("mongoose-unique-validator");

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required!"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
    },
    firstname: {
        type: String,
        required: [true, "First name is required!"],
        trim: true,
    },
    lastname: {
        type: String,
        required: false,
        trim: true,
    },
    email: {
      type: String,
      validate: [isEmail, "Enter a valid email address!"],
      required: [true, "Email address is required!"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
        type: String,
        required: false,
        unique: true,
        trim: true,
    },
    photoProfile: {
        type: String,
        required: false,
        default: null,
    },
    level: {
      type: String,
      enum: ['Pusat', 'Cabang'],
      default: 'Cabang',
      required: true,
    },
    password: {
      type: String,
      required: [true, "Password is required!"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: false,
      default: null,
      validate: {
        validator: function(v) {
          // If level is 'Cabang', branch_id is required
          if (this.level === 'Cabang' && !v) {
            return false;
          }
          // If level is 'Pusat', branch_id should be null
          if (this.level === 'Pusat' && v) {
            return false;
          }
          return true;
        },
        message: function(props) {
          if (this.level === 'Cabang') {
            return 'Branch is required for Cabang level users';
          }
          return 'Branch should not be set for Pusat level users';
        }
      }
    },
    division_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Division",
      required: [true, "Division is required!"],
    },
    position_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Position",
      required: [true, "Position is required!"],
    },
    role_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: [true, "Role is required!"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ branch_id: 1, division_id: 1, position_id: 1, level: 1 });

// Pre-save middleware to handle level-branch relationship
userSchema.pre('save', function(next) {
  if (this.level === 'Pusat') {
    this.branch_id = null;
  }
  
  // Migrate old status field to new level field
  if (this.status !== undefined && this.level === undefined) {
    this.level = this.status ? 'Pusat' : 'Cabang';
  }
  
  next();
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstname} ${this.lastname}`.trim();
});

userSchema.plugin(validator, { message: "Error, expected {PATH} to be unique. Value: {VALUE}" });

// Method to generate hash for password
userSchema.methods.generateHash = function(password) {
  const bcrypt = require('bcrypt');
  return bcrypt.hash(password, 10);
};

module.exports = userSchema;
