const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ["admin", "student", "professor", "parent", "staff"],
    required: true,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  // Role-specific fields
  studentId: {
    type: String,
    unique: true,
    sparse: true, // Only for students
  },
  employeeId: {
    type: String,
    unique: true,
    sparse: true, // For professors and staff
  },
  department: {
    type: String,
    trim: true,
  },
  // For parent role - link to student
  linkedStudentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  // Profile fields
  phone: String,
  officeHours: { type: String, trim: true, default: "" },
  address: String,
  dateOfBirth: Date,
  profileImage: String,
  // Status
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: Date,
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get public profile (exclude sensitive data)
userSchema.methods.getPublicProfile = function () {
  return {
    id: this._id,
    email: this.email,
    firstName: this.firstName,
    lastName: this.lastName,
    role: this.role,
    department: this.department,
    profileImage: this.profileImage,
    phone: this.phone,
    officeHours: this.officeHours,
  };
};

const User = mongoose.model("User", userSchema);

module.exports = User;