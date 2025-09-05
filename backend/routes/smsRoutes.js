const express = require('express');
const router = express.Router();
const { 
  upload, 
  uploadAttendanceExcel, 
  uploadSalaryExcel, 
  getQueueStatus, 
  getFailedSMS, 
  retryFailedSMS,
  getDailySummary,
  resetSystemData,
  getSystemStats,
  exportAttendanceData,
  getAttendanceData,
  exportSalaryData,
  getSalaryData
} = require('../controllers/smsController');
const { authenticateAdmin, authenticateSuperAdmin } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateAdmin);

// Upload routes
router.post('/upload/attendance', upload.single('excel'), uploadAttendanceExcel);
router.post('/upload/salary', upload.single('excel'), uploadSalaryExcel);

// Queue management routes
router.get('/queue/status', getQueueStatus);
router.get('/failed', getFailedSMS);
router.post('/retry/:id', retryFailedSMS);

// Attendance data routes
router.get('/attendance/data', getAttendanceData);
router.get('/attendance/export', exportAttendanceData);

// Salary data routes
router.get('/salary/data', getSalaryData);
router.get('/salary/export', exportSalaryData);

// Performance and logging routes
router.get('/logs/daily-summary', getDailySummary);

// System management routes (Super Admin only)
router.post('/system/reset', authenticateSuperAdmin, resetSystemData);
router.get('/system/stats', authenticateSuperAdmin, getSystemStats);

module.exports = router;
