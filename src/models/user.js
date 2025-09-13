import mongoose from 'mongoose';
import PasswordUtils from '../utils/password-utils.js';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required']
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
}, { 
  timestamps: true 
});


// Hash password before saving
UserSchema.pre('save', async function(next) {
  // Only hash the password if it's been modified (or is new)
  if (!this.isModified('passwordHash')) return next();
  
  try {
    this.passwordHash = await PasswordUtils.hashPassword(this.passwordHash);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for login (future use)
UserSchema.methods.comparePassword = function(candidatePassword) {
  return PasswordUtils.comparePassword(candidatePassword, this.passwordHash);
};

const User = mongoose.model('User', UserSchema);

export default User;
