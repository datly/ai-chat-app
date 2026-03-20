const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    default: null // Null for anonymous users
  },
  email: {
    type: String,
    default: null
  },
  isAnonymous: {
    type: Boolean,
    default: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index already defined in schema with index:true
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);
