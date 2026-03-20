const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

/**
 * Middleware to handle anonymous user sessions
 * Creates or retrieves user based on sessionId from cookie/header
 */
const sessionMiddleware = async (req, res, next) => {
  try {
    // Get sessionId from cookie or header
    let sessionId = req.cookies?.sessionId || req.headers['x-session-id'];

    // If no sessionId, create new anonymous user
    if (!sessionId) {
      sessionId = uuidv4();
      
      const newUser = new User({
        sessionId,
        isAnonymous: true,
        lastActiveAt: new Date()
      });
      
      await newUser.save();
      
      // Set cookie
      res.cookie('sessionId', sessionId, {
        httpOnly: true,
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
        sameSite: 'lax'
      });
      
      req.user = newUser;
      req.sessionId = sessionId;
    } else {
      // Find existing user by sessionId
      let user = await User.findOne({ sessionId });
      
      if (!user) {
        // Session exists but user not found, create new user
        user = new User({
          sessionId,
          isAnonymous: true,
          lastActiveAt: new Date()
        });
        await user.save();
      } else {
        // Update last active time
        user.lastActiveAt = new Date();
        await user.save();
      }
      
      req.user = user;
      req.sessionId = sessionId;
    }
    
    next();
  } catch (error) {
    console.error('Session middleware error:', error);
    next(error);
  }
};

module.exports = sessionMiddleware;
