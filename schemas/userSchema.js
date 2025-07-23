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
    status: { // true = Pusat, false = Cabang
        type: Boolean,
        default: false,
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
          // If status is false (Cabang), branch_id is required
          if (!this.status && !v) {
            return false;
          }
          // If status is true (Pusat), branch_id should be null
          if (this.status && v) {
            return false;
          }
          return true;
        },
        message: function(props) {
          if (!this.status && !props.value) {
            return "Branch is required for non-headquarters users";
          }
          if (this.status && props.value) {
            return "Headquarters users should not have a branch";
          }
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
userSchema.index({ branch_id: 1, division_id: 1, position_id: 1 });

// Pre-save hook to handle branch_id based on status
userSchema.pre('save', function(next) {
  if (this.status === true) {
    this.branch_id = null;
  }
  next();
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstname} ${this.lastname}`.trim();
});

userSchema.plugin(validator, { message: "Error, expected {PATH} to be unique. Value: {VALUE}" });

module.exports = userSchema;
