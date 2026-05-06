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
  studentStatus: {
    type: String,
    enum: ["active", "inactive", "graduated", "withdrawn"],
    default: "active",
  },
  studentsStatus: {
    type: String,
    enum: ["active", "inactive", "graduated", "withdrawn"],
    default: undefined,
  },
  lastLogin: Date,
}, {
  timestamps: true,
});

function syncStudentStatus(user) {
  if (user.role !== "student") return;

  const status = user.studentStatus || user.studentsStatus || "active";
  user.studentStatus = status;
  user.studentsStatus = status;
}

userSchema.pre("validate", function (next) {
  syncStudentStatus(this);
  next();
});

userSchema.index(
  { role: 1 },
  {
    unique: true,
    partialFilterExpression: { role: "admin" },
    name: "one_admin_only",
  }
);

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
    studentId: this.studentId,
    employeeId: this.employeeId,
    studentStatus: this.studentStatus || this.studentsStatus,
    profileImage: this.profileImage,
    phone: this.phone,
    officeHours: this.officeHours,
  };
};

const User = mongoose.model("User", userSchema);

module.exports = User;
