const express = require('express');
const router = express.Router();
const { 
  loginAdmin, 
  logoutAdmin, 
  addAdmin, 
  deleteAdmin, 
  updatePassword, 
  checkSession,
  getAllAdmins,
  getSystemStats,
  resetSystem
} = require('../controllers/admin.controller');


const { authenticateAdmin, requireSuperAdmin } = require('../middleware/auth');

// Public routes
router.post('/login', loginAdmin);

// Protected routes (require authentication)
router.use(authenticateAdmin);

router.post('/logout', logoutAdmin);
router.get('/session', checkSession);
router.put('/update-password', updatePassword);

// Super admin only routes
router.post('/add', requireSuperAdmin, addAdmin);
router.delete('/delete/:id', requireSuperAdmin, deleteAdmin);
router.get('/all', requireSuperAdmin, getAllAdmins);
router.get('/system-stats', requireSuperAdmin, getSystemStats);
router.post('/reset-system', requireSuperAdmin, resetSystem);

module.exports = router;
