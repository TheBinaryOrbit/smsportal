const jwt = require('jsonwebtoken');
const Admin = require('../models/admin.model');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Middleware to check admin session
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.cookies.session_key;
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No session token found' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if admin still exists and is active
    const admin = await Admin.findById(decoded.id);
    if (!admin || !admin.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid session or admin deactivated' 
      });
    }

    req.admin = {
      id: admin._id,
      username: admin.username,
      role: admin.role
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid session token' 
    });
  }
};

// Middleware to check if admin is super-admin
const requireSuperAdmin = (req, res, next) => {
  if (req.admin.role !== 'super-admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Super admin access required' 
    });
  }
  next();
};

// Combined middleware for super admin authentication
const authenticateSuperAdmin = async (req, res, next) => {
  try {
    await authenticateAdmin(req, res, () => {
      requireSuperAdmin(req, res, next);
    });
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication failed' 
    });
  }
};

module.exports = {
  authenticateAdmin,
  requireSuperAdmin,
  authenticateSuperAdmin,
  JWT_SECRET
};
