const express = require('express');
const router = express.Router();
const { 
  getSettings, 
  updateSettings, 
  getAttendanceMapping, 
  getSalaryMapping 
} = require('../controllers/settings.controller');
const { authenticateAdmin, requireSuperAdmin } = require('../middleware/auth');

// All settings routes require authentication
router.use(authenticateAdmin);

// Get all general settings (super admin only)
router.get('/', requireSuperAdmin, getSettings);

// Update general settings (super admin only)
router.put('/', requireSuperAdmin, updateSettings);

// Get attendance column mapping (accessible to all admins)
router.get('/attendance', getAttendanceMapping);

// Get salary column mapping (accessible to all admins)
router.get('/salary', getSalaryMapping);

module.exports = router;
