const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const groqService = require('../services/groqService');
const sessionMiddleware = require('../middleware/session');

// Apply session middleware to all routes
router.use(sessionMiddleware);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|webp|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

router.get('/history', async (req, res) => {
  try {
    const { conversationId } = req.query;
    
    // Get or create active conversation for user
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findOne({ 
        _id: conversationId, 
        userId: req.user._id 
      });
    }
    
    if (!conversation) {
      // Get user's most recent conversation
      conversation = await Conversation.findOne({ 
        userId: req.user._id,
        isActive: true
      }).sort({ lastMessageAt: -1 });
    }
    
    if (!conversation) {
      return res.json({
        messages: [],
        conversationId: null,
        conversationTitle: null
      });
    }
    
    const messages = await Message.find({ conversationId: conversation._id })
      .sort({ timestamp: 1 })
      .limit(100);
    
    console.log(`📚 Returning ${messages.length} messages for conversation ${conversation._id}`);
    
    res.json({
      messages,
      conversationId: conversation._id,
      conversationTitle: conversation.title
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

router.post('/send', upload.single('file'), [
  body('message').trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message, conversationId } = req.body;
    
    console.log('📨 Received message:', message);
    console.log('📨 Message type:', typeof message);
    console.log('📨 conversationId:', conversationId);
    
    if (!message && !req.file) {
      return res.status(400).json({ error: 'Message or file is required' });
    }

    // Get or create conversation
    let conversation;
    if (conversationId && conversationId !== 'null' && conversationId !== 'undefined') {
      conversation = await Conversation.findOne({ 
        _id: conversationId, 
        userId: req.user._id 
      });
      console.log('🔍 Found existing conversation:', conversation ? conversation._id : 'NOT FOUND');
    }
    
    if (!conversation) {
      // Try to reuse last active conversation
      conversation = await Conversation.findOne({
        userId: req.user._id,
        isActive: true
      }).sort({ lastMessageAt: -1 });
      
      if (!conversation) {
        console.log('✨ Creating new conversation');
        conversation = new Conversation({
          userId: req.user._id,
          title: 'New Conversation',
          lastMessageAt: new Date()
        });
        await conversation.save();
      } else {
        console.log('♻️  Reusing existing conversation:', conversation._id);
      }
    }

    const userMessage = new Message({
      conversationId: conversation._id,
      userId: req.user._id,
      role: 'user',
      content: message || '',
      timestamp: new Date(),
      fileUrl: req.file ? `/uploads/${req.file.filename}` : null,
      fileName: req.file ? req.file.originalname : null
    });

    await userMessage.save();

    // Update conversation title if this is the first message
    if (conversation.messageCount === 0 && message) {
      conversation.generateTitle(message);
    }
    conversation.messageCount += 1;
    conversation.lastMessage = message || (req.file ? `📎 ${req.file.originalname}` : '');
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Get recent conversation history for context
    const recentMessages = await Message.find({ conversationId: conversation._id })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();
    
    const conversationHistory = recentMessages.reverse();

    // Generate AI response using Groq
    let aiResponseContent;
    if (req.file) {
      aiResponseContent = `I've received your file "${req.file.originalname}". ` + 
                         await groqService.generateResponse(
                           message || 'Please analyze this file',
                           conversationHistory
                         );
    } else {
      aiResponseContent = await groqService.generateResponse(message, conversationHistory);
    }

    const aiMessage = new Message({
      conversationId: conversation._id,
      userId: req.user._id,
      role: 'assistant',
      content: aiResponseContent,
      timestamp: new Date()
    });

    await aiMessage.save();

    // Update conversation
    conversation.messageCount += 1;
    conversation.lastMessage = aiResponseContent.substring(0, 100) + (aiResponseContent.length > 100 ? '...' : '');
    conversation.lastMessageAt = new Date();
    await conversation.save();

    res.json({
      userMessage,
      aiResponse: aiMessage,
      conversationId: conversation._id
    });
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

router.delete('/history', async (req, res) => {
  try {
    await Message.deleteMany({});
    res.json({ message: 'Chat history cleared successfully' });
  } catch (error) {
    console.error('Error clearing chat history:', error);
    res.status(500).json({ error: 'Failed to clear chat history' });
  }
});

module.exports = router;
