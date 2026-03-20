const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    default: 'New Conversation'
  },
  lastMessage: {
    type: String,
    default: ''
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  messageCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

conversationSchema.index({ userId: 1, lastMessageAt: -1 });
conversationSchema.index({ createdAt: -1 });

// Auto-generate title from first user message
conversationSchema.methods.generateTitle = function(firstMessage) {
  if (firstMessage && firstMessage.length > 0) {
    this.title = firstMessage.substring(0, 50) + (firstMessage.length > 50 ? '...' : '');
  }
};

module.exports = mongoose.model('Conversation', conversationSchema);
