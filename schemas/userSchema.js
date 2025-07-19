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
    email: {
      type: String,
      validate: [isEmail, "Enter a valid email address!"],
      required: [true, "Email address is required!"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required!"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    firstname: {
      type: String,
      required: [true, "First name is required!"],
      trim: true,
    },
    lastname: {
      type: String,
      required: [true, "Last name is required!"],
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required!"],
      trim: true,
      validate: {
        validator: function (v) {
          return /^[0-9+\-\s()]+$/.test(v);
        },
        message: "Please enter a valid phone number!",
      },
    },
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: false,
      default: null,
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

// Virtual for full name
userSchema.virtual("fullname").get(function () {
  return `${this.firstname} ${this.lastname}`;
});

// Ensure virtual fields are included in JSON
userSchema.set("toJSON", { virtuals: true });

userSchema.plugin(validator, { message: "{PATH} already exists!" });

module.exports = userSchema;
