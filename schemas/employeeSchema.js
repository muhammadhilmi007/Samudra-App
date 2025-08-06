const mongoose = require("mongoose");

const documentSchema = mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, "Document type is required!"],
      enum: ["KTP", "SIM", "NPWP", "BPJS", "KK", "Other"],
    },
    number: {
      type: String,
      required: [true, "Document number is required!"],
    },
    issuedDate: Date,
    expiryDate: Date,
    fileUrl: String,
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const employmentHistorySchema = mongoose.Schema(
  {
    position: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Position",
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
    },
    division: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Division",
    },
    startDate: Date,
    endDate: Date,
    reason: String, // Reason for change
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { _id: false }
);

const trainingRecordSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    provider: String,
    date: Date,
    duration: String, // e.g., "2 days", "8 hours"
    certificateUrl: String,
    isRequired: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["planned", "ongoing", "completed", "expired"],
      default: "planned",
    },
  },
  { _id: false }
);

const logSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        "created",
        "updated",
        "promoted",
        "mutated",
        "resigned",
        "terminated",
        "document_uploaded",
        "training_completed",
      ],
    },
    date: { type: Date, default: Date.now },
    description: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { _id: false }
);

const employeeSchema = new mongoose.Schema(
  {
    employeeCode: {
      type: String,
      required: [true, "Employee code is required!"],
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    username: {
      type: String,
      required: [true, "Username is required!"],
    },
    firstname: {
      type: String,
      required: [true, "First name is required!"],
    },
    lastname: String,
    birthdate: {
      type: Date,
      required: [true, "Birth date is required!"],
    },
    gender: {
      type: String,
      enum: ["Male", "Female"],
      required: [true, "Gender is required!"],
    },
    maritalStatus: {
      type: String,
      enum: ["Single", "Married", "Divorced", "Widowed"],
      default: "Single",
    },
    address: {
      street: String,
      city: String,
      district: String,
      province: String,
      postalCode: String,
      country: { type: String, default: "Indonesia" },
    },
    contact: {
      noPhone: {
        type: String,
        required: [true, "Phone number is required!"],
        validate: {
          validator: function(v) {
            // Validate Indonesian phone format
            return /^(\+62|62|0)8[1-9][0-9]{6,9}$/.test(v);
          },
          message: "Invalid WhatsApp number format!",
        },
      },
      noPhoneEmergency: {
        type: String,
        required: [true, "Emergency phone is required!"],
      },
      noPhoneContact: String,
      email: {
        type: String,
        required: [true, "Email is required!"],
        lowercase: true,
      },
    },
    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    positionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Position",
      required: [true, "Position is required!"],
      index: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      index: true,
    },
    divisionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Division",
    },
    joinDate: {
      type: Date,
      required: [true, "Join date is required!"],
    },
    resignDate: Date,
    mutationDate: Date,
    noKTP: {
      type: String,
      required: [true, "KTP number is required!"],
      unique: true,
      validate: {
        validator: function(v) {
          // Validate Indonesian KTP format (16 digits)
          return /^\d{16}$/.test(v);
        },
        message: "KTP number must be 16 digits!",
      },
    },
    noSIM: String,
    fotoKTP: String,
    fotoIdentitas: String,
    fotoProfile: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Resigned", "Mutated", "Terminated"],
      default: "Active",
    },
    documents: [documentSchema],
    employmentHistory: [employmentHistorySchema],
    trainingRecords: [trainingRecordSchema],
    logs: [logSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
employeeSchema.index({ employeeCode: 1, branchId: 1, positionId: 1 });
employeeSchema.index({ "contact.noPhone": 1 });
employeeSchema.index({ noKTP: 1 });
employeeSchema.index({ status: 1, isActive: 1 });

// Virtual for full name
employeeSchema.virtual("fullName").get(function () {
  return `${this.firstname} ${this.lastname || ""}`.trim();
});

// Virtual for age
employeeSchema.virtual("age").get(function () {
  if (!this.birthdate) return null;
  const today = new Date();
  const birthDate = new Date(this.birthdate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Middleware to auto-generate employee code
employeeSchema.pre("save", async function (next) {
  console.log('Pre-save middleware triggered:', {
    hasEmployeeCode: !!this.employeeCode,
    isNew: this.isNew,
    branchId: this.branchId
  });
  
  if (!this.employeeCode && this.isNew) {
    try {
      // Get branch code
      const Branch = mongoose.model("Branch");
      const branch = await Branch.findById(this.branchId);
      console.log('Branch found:', branch ? { _id: branch._id, code: branch.code, name: branch.name } : 'null');
      
      const branchCode = branch ? branch.code : "HQ";
      
      // Get current year
      const year = new Date().getFullYear();
      
      // Count employees in the same branch and year
      const count = await this.constructor.countDocuments({
        employeeCode: new RegExp(`^${branchCode}-${year}-`),
      });
      
      console.log('Employee count for code generation:', count);
      
      // Generate code: BRANCHCODE-YYYY-XXXX
      this.employeeCode = `${branchCode}-${year}-${String(count + 1).padStart(4, "0")}`;
      console.log('Generated employee code:', this.employeeCode);
    } catch (error) {
      console.error('Error in pre-save middleware:', error);
      return next(error);
    }
  }
  next();
});

// Method to check document expiry
employeeSchema.methods.getExpiringDocuments = function (daysAhead = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  
  return this.documents.filter(doc => {
    if (!doc.expiryDate) return false;
    const expiryDate = new Date(doc.expiryDate);
    return expiryDate <= futureDate && expiryDate >= new Date();
  });
};

// Method to check required training
employeeSchema.methods.getPendingTraining = function () {
  return this.trainingRecords.filter(
    training => training.isRequired && training.status !== "completed"
  );
};

// Method to add employment history
employeeSchema.methods.addEmploymentHistory = function (data) {
  this.employmentHistory.push({
    position: this.positionId,
    branch: this.branchId,
    division: this.divisionId,
    startDate: data.startDate || this.joinDate,
    endDate: data.endDate || new Date(),
    reason: data.reason,
    approvedBy: data.approvedBy,
  });
};

module.exports = employeeSchema;