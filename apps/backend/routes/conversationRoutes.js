const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const sessionMiddleware = require('../middleware/session');

// Apply session middleware
router.use(sessionMiddleware);

// Get all conversations for current user
router.get('/', async (req, res) => {
  try {
    const conversations = await Conversation.find({ userId: req.user._id })
      .sort({ lastMessageAt: -1 })
      .limit(50);
    
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Create new conversation
router.post('/', async (req, res) => {
  try {
    const { title } = req.body;
    
    const conversation = new Conversation({
      userId: req.user._id,
      title: title || 'New Conversation',
      lastMessageAt: new Date()
    });
    
    await conversation.save();
    res.json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Delete conversation
router.delete('/:id', async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    // Delete all messages in conversation
    await Message.deleteMany({ conversationId: conversation._id });
    
    // Delete conversation
    await conversation.deleteOne();
    
    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// Update conversation title
router.patch('/:id', async (req, res) => {
  try {
    const { title } = req.body;
    
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    conversation.title = title;
    await conversation.save();
    
    res.json(conversation);
  } catch (error) {
    console.error('Error updating conversation:', error);
    res.status(500).json({ error: 'Failed to update conversation' });
  }
});

module.exports = router;
