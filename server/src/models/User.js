const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
    },
    username: {
      type: String,
      unique: true,
      sparse: true, // Allows null/undefined values to bypass unique constraint
      trim: true,
      minlength: [3, 'Username must be at least 3 characters long'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    googleId: {
      type: String,
      default: null,
    },
    passwordHash: {
      type: String,
      required: [true, 'Please provide a password'],
      select: false, // Don't return password by default in queries
    },
    wins: {
      type: Number,
      default: 0,
    },
    losses: {
      type: Number,
      default: 0,
    },
    rank: {
      type: String,
      enum: {
        values: ['Bronze', 'Silver', 'Gold'],
        message: 'Rank must be either: Bronze, Silver, or Gold',
      },
      default: 'Bronze',
    },
    coins: {
      type: Number,
      default: 0,
    },
    passwordSet: {
      type: Boolean,
      default: false,
    },
    lastDailyBonusAt: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexing
// unique: true on email automatically creates an index for it
userSchema.index({ wins: -1, losses: 1 }); // Leaderboard index

const bcrypt = require('bcryptjs');

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('passwordHash')) return next();

  // Hash the password with cost of 12
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

// Instance method to check password
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
