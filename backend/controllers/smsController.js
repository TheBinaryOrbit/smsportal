const multer = require('multer');
const XLSX = require('xlsx');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

// Models for storing data
const FailedSMS = require('../models/FailedSMS');
const SMSQueue = require('../models/SMSQueue');

const readSettingsFile = require('./settings.controller').readSettingsFile;
const logger = require('../utils/logger');

// Demo mode configuration
const isDemoMode = process.env.SMS_DEMO_MODE === 'true';
const enableLogging = process.env.ENABLE_PERFORMANCE_LOGGING === 'true';

// Demo SMS API function (for testing)
const sendDemoSMS = async (phoneNumber, templateId, variables) => {
  // Simulate API call delay
  const delay = Math.random() * 500 + 100; // 100-600ms delay
  await new Promise(resolve => setTimeout(resolve, delay));
  
  // Simulate 95% success rate for demo
  const isSuccess = Math.random() < 0.95;
  
  if (isSuccess) {
    return {
      success: true,
      data: {
        return: true,
        message: 'SMS sent successfully (DEMO)',
        request_id: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sms: [{
          message: `Template ${templateId} with variables: ${variables}`,
          status: 'Success',
          mobile: phoneNumber
        }]
      }
    };
  } else {
    return {
      success: false,
      error: 'Demo SMS failure (simulated for testing)'
    };
  }
};

// Helper function to format time (extract HH:MM from time strings)
const formatTime = (timeString) => {
  if (!timeString) return '';
  
  // Extract time in format HH:MM from strings like "07:15:27" or "07:16:27(SE)()"
  const timeMatch = timeString.toString().match(/(\d{2}):(\d{2})/);
  if (timeMatch) {
    return `${timeMatch[1]}:${timeMatch[2]}`;
  }
  return timeString.toString().substring(0, 5); // Fallback to first 5 characters
};

// Helper function to format work duration
const formatWorkDuration = (durationString) => {
  if (!durationString) return '';
  
  // Extract duration and add "घंटे" if not present
  const duration = durationString.toString();
  if (duration.includes('घंटे')) {
    return duration;
  }
  return `${duration}-घंटे`;
};

// Helper function to calculate work duration from in-time and out-time
const calculateWorkDuration = (inTimeStr, outTimeStr) => {
  if (!inTimeStr || !outTimeStr) return '08:00';
  
  try {
    // Parse time strings (assuming format like "09:00", "17:30", "07:15:27", etc.)
    const parseTime = (timeStr) => {
      const timeMatch = timeStr.toString().match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        return {
          hours: parseInt(timeMatch[1]),
          minutes: parseInt(timeMatch[2])
        };
      }
      return { hours: 0, minutes: 0 };
    };
    
    const inTime = parseTime(inTimeStr);
    const outTime = parseTime(outTimeStr);
    
    // Convert to minutes for easier calculation
    const inTimeMinutes = inTime.hours * 60 + inTime.minutes;
    let outTimeMinutes = outTime.hours * 60 + outTime.minutes;
    
    // Handle next day scenario (if out time is earlier than in time)
    if (outTimeMinutes < inTimeMinutes) {
      outTimeMinutes += 24 * 60; // Add 24 hours
    }
    
    // Calculate difference in minutes
    const diffMinutes = outTimeMinutes - inTimeMinutes;
    
    // Convert back to hours and minutes
    const workHours = Math.floor(diffMinutes / 60);
    const workMinutes = diffMinutes % 60;
    
    // Format as HH:MM
    return `${workHours.toString().padStart(2, '0')}:${workMinutes.toString().padStart(2, '0')}`;
    
  } catch (error) {
    console.error('Error calculating work duration:', error);
    return '08:00'; // Default fallback
  }
};

// Simple SMS processing without Redis queue
const processDirectSMS = async (type, data, isRetry = false) => {
  const startTime = Date.now();
  
  try {
    let result;
    
    if (type === 'attendance') {
      console.log(data);
      // Create the enhanced attendance message format
      const nameWithId = `${data.name}-${data.employeeId}`;
      const inTime = formatTime(data.inTime);
      const outTime = formatTime(data.outTime);
      const workTime = `${inTime}-${outTime}`;
      const workDuration = formatWorkDuration(data.workDuration);
      
      const variables = `${nameWithId}|${workTime}|${workDuration}`;
      
      // Use demo or real API based on configuration
      result = isDemoMode ? 
        await sendDemoSMS(data.phone, '197287', variables) :
        await sendSMS(data.phone, '197287', variables);
    } else if (type === 'salary') {
      const variables = `${data.name}|${data.amount}`;
      // Use demo or real API based on configuration
      result = isDemoMode ? 
        await sendDemoSMS(data.phone, '195560', variables) :
        await sendSMS(data.phone, '195560', variables);
    }
    
    const processingTime = Date.now() - startTime;
    
    if (result.success) {
      if (isRetry) {
        // If it's a retry, create a completed SMSQueue entry and remove from failed collection
        await SMSQueue.create({
          type: type,
          name: data.name,
          phone: data.phone,
          data: type === 'attendance' ? 
            { 
              employeeId: data.employeeId,
              inTime: data.inTime,
              outTime: data.outTime,
              workDuration: data.workDuration
            } : 
            { amount: data.amount },
          status: 'completed',
          completedAt: new Date(),
          response: result.data,
          createdAt: new Date()
        });
        
        // Clean up the specific failed SMSQueue entry that this retry was for
        if (data.originalSMSQueueData && data.originalSMSQueueData.parentSMSQueueId) {
          await SMSQueue.findByIdAndDelete(data.originalSMSQueueData.parentSMSQueueId);
          console.log(`Deleted specific failed SMSQueue entry: ${data.originalSMSQueueData.parentSMSQueueId}`);
        }
        
        // Remove from failed collection (success)
        await FailedSMS.findByIdAndDelete(data.queueId);
        console.log(`SMS retry successful for ${data.phone} - moved to completed queue, deleted specific failed SMSQueue entry, and removed from failed collection`);
      } else {
        // Regular processing - update SMSQueue
        await SMSQueue.findByIdAndUpdate(data.queueId, {
          status: 'completed',
          completedAt: new Date(),
          response: result.data
        });
      }
      
      // Log successful SMS operation
      if (enableLogging) {
        await logger.logSMSOperation({
          status: 'success',
          type: type,
          phone: data.phone,
          name: data.name,
          processingTime: processingTime,
          isRetry: isRetry,
          isDemoMode: isDemoMode,
          response: result.data
        });
        
        await logger.logPerformance({
          operation: 'sms_send',
          processingTime: processingTime,
          status: 'success',
          type: type,
          isRetry: isRetry,
          isDemoMode: isDemoMode
        });
      }
      
      console.log(`SMS sent successfully to ${data.phone} for ${type} (${processingTime}ms)`);
    } else {
      throw new Error(result.error);
    }
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`SMS failed for ${data.phone}:`, error.message);
    
    if (isRetry) {
      // If retry failed, update the existing failed record
      await FailedSMS.findByIdAndUpdate(data.queueId, {
        error: error.message,
        finalFailureAt: new Date(),
        retryCount: { $inc: 1 } // Increment retry count
      });
    } else {
      // Regular processing failure
      await SMSQueue.findByIdAndUpdate(data.queueId, {
        status: 'failed',
        failedAt: new Date(),
        error: error.message
      });
      
      // Save to failed SMS collection with parent SMSQueue reference
      await FailedSMS.create({
        type: type,
        name: data.name,
        phone: data.phone,
        data: type === 'attendance' ? 
          { 
            employeeId: data.employeeId,
            inTime: data.inTime,
            outTime: data.outTime,
            workDuration: data.workDuration
          } : 
          { amount: data.amount },
        error: error.message,
        finalFailureAt: new Date(),
        retryCount: 0,
        parentSMSQueueId: data.queueId // Store reference to the failed SMSQueue entry
      });
    }
    
    // Log failed SMS operation
    if (enableLogging) {
      await logger.logSMSOperation({
        status: 'failed',
        type: type,
        phone: data.phone,
        name: data.name,
        processingTime: processingTime,
        isRetry: isRetry,
        isDemoMode: isDemoMode,
        error: error.message
      });
      
      await logger.logPerformance({
        operation: 'sms_send',
        processingTime: processingTime,
        status: 'failed',
        type: type,
        isRetry: isRetry,
        isDemoMode: isDemoMode,
        error: error.message
      });
      
      await logger.logError({
        operation: 'sms_send',
        type: type,
        phone: data.phone,
        name: data.name,
        error: error.message,
        isRetry: isRetry,
        isDemoMode: isDemoMode
      });
    }
  }
};



// SMS API function
const sendSMS = async (phoneNumber, templateId, variables) => {
  try {
    console.log(phoneNumber , templateId, variables)
    const apiUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.WALLET_API_URL}&route=dlt&sender_id=SHUSON&message=${templateId}&variables_values=${variables}&flash=0&numbers=${phoneNumber}`;
    
    const response = await axios.get(apiUrl);

    console.log('SMS API Response:', response.data);
    
    if (response.data && response.data.return === true) {
      return { success: true, data: response.data };
    } else {
      throw new Error(response.data?.message || 'SMS sending failed');
    }
  } catch (error) {
    console.error('SMS API Error:', error.message);
    return { success: false, error: error.message };
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Function to read Excel file
const readExcelFile = (filePath, columnMapping) => {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Get range of data
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    const extractedData = [];
    
    // Skip header row (start from row 1, which is index 1)
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      const extractedRow = {};
      let hasData = false;
      
      // Extract data based on column mapping
      for (const [field, column] of Object.entries(columnMapping)) {
        const cellAddress = column + (row + 1); // Excel rows are 1-indexed
        const cell = worksheet[cellAddress];
        
        if (cell && cell.v !== undefined && cell.v !== null && cell.v !== '') {
          extractedRow[field] = cell.v;
          hasData = true;
        }
      }
      
      // Only include rows that have at least some data
      if (hasData) {
        extractedData.push(extractedRow);
      }
    }
    
    return extractedData;
  } catch (error) {
    throw new Error(`Error reading Excel file: ${error.message}`);
  }
};

// Upload and process attendance Excel
const uploadAttendanceExcel = async (req, res) => {
  const batchStartTime = Date.now();
  const batchId = `attendance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    console.log(`Starting attendance batch processing: ${batchId}`);
    console.log(`Demo mode: ${isDemoMode ? 'ENABLED' : 'DISABLED'}`);
    console.log(`Logging: ${enableLogging ? 'ENABLED' : 'DISABLED'}`);

    const settings = readSettingsFile();
    
    // Column mapping from settings - Simplified attendance format (work duration calculated)
    const columnMapping = {
      name: settings.ATTENDANCE_NAME_COLUMN || 'F',
      phone: settings.ATTENDANCE_PHONE_COLUMN || 'B',
      employeeId: settings.ATTENDANCE_EMPLOYEE_ID_COLUMN || 'D',
      inTime: settings.ATTENDANCE_IN_TIME_COLUMN || 'I',
      outTime: settings.ATTENDANCE_OUT_TIME_COLUMN || 'J'
    };
    
    // Read and extract data from Excel
    const extractedData = readExcelFile(req.file.path, columnMapping);
    
    if (extractedData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid data found in Excel file'
      });
    }
    
    // Validate and process data
    const processedData = [];
    const errors = [];
    
    for (let i = 0; i < extractedData.length; i++) {
      const row = extractedData[i];
      
      // Validate required fields - Updated for new format
      if (!row.name || !row.phone || !row.employeeId) {
        errors.push(`Row ${i + 2}: Missing required fields (name, phone, employeeId)`);
        continue;
      }
      
      // Validate phone number (basic validation)
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(row.phone.toString())) {
        errors.push(`Row ${i + 2}: Invalid phone number format`);
        continue;
      }
      
      // Validate that in-time and out-time are present for work duration calculation
      if (!row.inTime || !row.outTime) {
        errors.push(`Row ${i + 2}: Missing in-time or out-time`);
        continue;
      }

      console.log(row);
      
      // Calculate work duration from in-time and out-time
      const calculatedWorkDuration = calculateWorkDuration(row.inTime, row.outTime);
      
      processedData.push({
        name: row.name.toString().trim(),
        phone: row.phone.toString().trim(),
        employeeId: row.employeeId.toString().trim(),
        inTime: row.inTime.toString().trim(),
        outTime: row.outTime.toString().trim(),
        workDuration: calculatedWorkDuration
      });
    }
    
    // Create queue entries and add to SMS queue
    const queueEntries = [];
    const smsProcessingPromises = [];
    
    for (const data of processedData) {
      // Create queue entry in database
      const queueEntry = await SMSQueue.create({
        type: 'attendance',
        name: data.name,
        phone: data.phone,
        data: {
          employeeId: data.employeeId,
          inTime: data.inTime,
          outTime: data.outTime,
          workDuration: data.workDuration
        },
        status: 'pending',
        createdAt: new Date()
      });
      
      queueEntries.push(queueEntry);
      
      // Process SMS directly (no queue) - don't await, let them run in parallel
      smsProcessingPromises.push(
        processDirectSMS('attendance', {
          queueId: queueEntry._id,
          name: data.name,
          phone: data.phone,
          employeeId: data.employeeId,
          inTime: data.inTime,
          outTime: data.outTime,
          workDuration: data.workDuration
        })
      );
    }
    
    // Wait for all SMS processing to complete (for accurate timing)
    if (isDemoMode || enableLogging) {
      await Promise.allSettled(smsProcessingPromises);
    }
    
    const batchProcessingTime = Date.now() - batchStartTime;
    
    // Log batch processing details
    if (enableLogging) {
      await logger.logBatchProcessing({
        batchId: batchId,
        operation: 'attendance_upload',
        fileName: req.file.originalname,
        fileSize: req.file.size,
        totalRows: extractedData.length,
        processedRows: processedData.length,
        queuedForSMS: queueEntries.length,
        errorCount: errors.length,
        errors: errors,
        batchProcessingTime: batchProcessingTime,
        isDemoMode: isDemoMode,
        avgProcessingTimePerSMS: batchProcessingTime / processedData.length
      });
    }
    
    console.log(`Completed attendance batch processing: ${batchId}`);
    console.log(`Total processing time: ${batchProcessingTime}ms`);
    console.log(`Average time per SMS: ${(batchProcessingTime / processedData.length).toFixed(2)}ms`);
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    res.json({
      success: true,
      message: `Attendance data processed successfully ${isDemoMode ? '(DEMO MODE)' : ''}`,
      data: {
        batchId: batchId,
        totalRows: extractedData.length,
        processedRows: processedData.length,
        queuedForSMS: queueEntries.length,
        errors: errors,
        batchProcessingTime: batchProcessingTime,
        isDemoMode: isDemoMode
      }
    });
    
  } catch (error) {
    const batchProcessingTime = Date.now() - batchStartTime;
    console.error('Upload attendance error:', error);
    
    // Log the error
    if (enableLogging) {
      await logger.logError({
        operation: 'attendance_upload',
        batchId: batchId,
        error: error.message,
        fileName: req.file?.originalname,
        batchProcessingTime: batchProcessingTime
      });
    }
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process attendance file',
      batchId: batchId
    });
  }
};

// Upload and process salary Excel
const uploadSalaryExcel = async (req, res) => {
  const batchStartTime = Date.now();
  const batchId = `salary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    console.log(`Starting salary batch processing: ${batchId}`);
    console.log(`Demo mode: ${isDemoMode ? 'ENABLED' : 'DISABLED'}`);
    console.log(`Logging: ${enableLogging ? 'ENABLED' : 'DISABLED'}`);

    const settings = readSettingsFile();
    
    // Column mapping from settings
    const columnMapping = {
      name: settings.SALARY_NAME_COLUMN || 'A',
      phone: settings.SALARY_PHONE_COLUMN || 'B',
      amount: settings.SALARY_AMOUNT_COLUMN || 'C'
    };
    
    // Read and extract data from Excel
    const extractedData = readExcelFile(req.file.path, columnMapping);
    
    if (extractedData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid data found in Excel file'
      });
    }
    
    // Validate and process data
    const processedData = [];
    const errors = [];
    
    for (let i = 0; i < extractedData.length; i++) {
      const row = extractedData[i];
      
      // Validate required fields
      if (!row.name || !row.phone || !row.amount) {
        errors.push(`Row ${i + 2}: Missing required fields`);
        continue;
      }
      
      // Validate phone number
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(row.phone.toString())) {
        errors.push(`Row ${i + 2}: Invalid phone number format`);
        continue;
      }
      
      // Validate amount (should be numeric)
      if (isNaN(row.amount) || parseFloat(row.amount) <= 0) {
        errors.push(`Row ${i + 2}: Invalid amount format`);
        continue;
      }
      
      processedData.push({
        name: row.name.toString().trim(),
        phone: row.phone.toString().trim(),
        amount: parseFloat(row.amount).toFixed(2)
      });
    }
    
    // Create queue entries and add to SMS queue
    const queueEntries = [];
    const smsProcessingPromises = [];
    
    for (const data of processedData) {
      // Create queue entry in database
      const queueEntry = await SMSQueue.create({
        type: 'salary',
        name: data.name,
        phone: data.phone,
        data: {
          amount: data.amount
        },
        status: 'pending',
        createdAt: new Date()
      });
      
      queueEntries.push(queueEntry);
      
      // Process SMS directly (no queue) - don't await, let them run in parallel
      smsProcessingPromises.push(
        processDirectSMS('salary', {
          queueId: queueEntry._id,
          name: data.name,
          phone: data.phone,
          amount: data.amount
        })
      );
    }
    
    // Wait for all SMS processing to complete (for accurate timing)
    if (isDemoMode || enableLogging) {
      await Promise.allSettled(smsProcessingPromises);
    }
    
    const batchProcessingTime = Date.now() - batchStartTime;
    
    // Log batch processing details
    if (enableLogging) {
      await logger.logBatchProcessing({
        batchId: batchId,
        operation: 'salary_upload',
        fileName: req.file.originalname,
        fileSize: req.file.size,
        totalRows: extractedData.length,
        processedRows: processedData.length,
        queuedForSMS: queueEntries.length,
        errorCount: errors.length,
        errors: errors,
        batchProcessingTime: batchProcessingTime,
        isDemoMode: isDemoMode,
        avgProcessingTimePerSMS: batchProcessingTime / processedData.length
      });
    }
    
    console.log(`Completed salary batch processing: ${batchId}`);
    console.log(`Total processing time: ${batchProcessingTime}ms`);
    console.log(`Average time per SMS: ${(batchProcessingTime / processedData.length).toFixed(2)}ms`);
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    res.json({
      success: true,
      message: `Salary data processed successfully ${isDemoMode ? '(DEMO MODE)' : ''}`,
      data: {
        batchId: batchId,
        totalRows: extractedData.length,
        processedRows: processedData.length,
        queuedForSMS: queueEntries.length,
        errors: errors,
        batchProcessingTime: batchProcessingTime,
        isDemoMode: isDemoMode
      }
    });
    
  } catch (error) {
    const batchProcessingTime = Date.now() - batchStartTime;
    console.error('Upload salary error:', error);
    
    // Log the error
    if (enableLogging) {
      await logger.logError({
        operation: 'salary_upload',
        batchId: batchId,
        error: error.message,
        fileName: req.file?.originalname,
        batchProcessingTime: batchProcessingTime
      });
    }
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process salary file',
      batchId: batchId
    });
  }
};

// Get queue status
const getQueueStatus = async (req, res) => {
  try {
    const { type } = req.query;
    
    let query = {};
    if (type && ['attendance', 'salary'].includes(type)) {
      query.type = type;
    }
    
    const queueStats = await SMSQueue.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const stats = {
      pending: 0,
      completed: 0,
      failed: 0,
      total: 0
    };
    
    queueStats.forEach(stat => {
      stats[stat._id] = stat.count;
      stats.total += stat.count;
    });
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Get queue status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch queue status'
    });
  }
};

// Get failed SMS records
const getFailedSMS = async (req, res) => {
  try {
    const { type, page = 1, limit = 10 } = req.query;
    
    let query = {};
    if (type && ['attendance', 'salary'].includes(type)) {
      query.type = type;
    }
    
    const failedSMS = await FailedSMS.find(query)
      .sort({ finalFailureAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await FailedSMS.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        records: failedSMS,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Get failed SMS error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch failed SMS records'
    });
  }
};

// Retry failed SMS
const retryFailedSMS = async (req, res) => {
  try {
    const { id } = req.params;
    
    const failedRecord = await FailedSMS.findById(id);
    if (!failedRecord) {
      return res.status(404).json({
        success: false,
        message: 'Failed SMS record not found'
      });
    }
    
    // Update the failed record to pending status for retry
    await FailedSMS.findByIdAndUpdate(id, {
      status: 'retrying',
      retryAt: new Date(),
      error: null // Clear previous error
    });
    
    // Process SMS directly (no queue) - use the failed record ID as queue ID
    const processResult = await processDirectSMS(failedRecord.type, {
      queueId: id, // Use the failed record ID itself
      name: failedRecord.name,
      phone: failedRecord.phone,
      originalSMSQueueData: failedRecord, // Pass the failed record for cleanup
      ...(failedRecord.type === 'attendance' ? 
        { date: failedRecord.data.date, status: failedRecord.data.status } :
        { amount: failedRecord.data.amount })
    }, true); // isRetry = true
    
    res.json({
      success: true,
      message: 'SMS retry initiated successfully'
    });
    
  } catch (error) {
    console.error('Retry failed SMS error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retry SMS'
    });
  }
};

// Get daily performance summary
const getDailySummary = async (req, res) => {
  try {
    const { date } = req.query; // Optional date parameter, defaults to today
    
    const summary = await logger.generateDailySummary(date);
    
    res.json({
      success: true,
      data: summary
    });
    
  } catch (error) {
    console.error('Get daily summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate daily summary'
    });
  }
};


// System reset function - Clear SMS data
const resetSystemData = async (req, res) => {
  try {
    const { confirmReset, resetType = 'sms_data' } = req.body;
    
    if (!confirmReset) {
      return res.status(400).json({
        success: false,
        message: 'Reset confirmation required'
      });
    }

    let deletedCount = 0;
    let clearedItems = [];

    if (resetType === 'sms_data' || resetType === 'all') {
      // Clear SMS Queue data
      const queueResult = await SMSQueue.deleteMany({});
      deletedCount += queueResult.deletedCount;
      clearedItems.push(`SMS Queue: ${queueResult.deletedCount} records`);

      // Clear Failed SMS data
      const failedResult = await FailedSMS.deleteMany({});
      deletedCount += failedResult.deletedCount;
      clearedItems.push(`Failed SMS: ${failedResult.deletedCount} records`);
    }

    if (resetType === 'logs' || resetType === 'all') {
      // Clear log files
      try {
        const logsDir = path.join(__dirname, '../logs');
        if (fs.existsSync(logsDir)) {
          const files = fs.readdirSync(logsDir);
          files.forEach(file => {
            const filePath = path.join(logsDir, file);
            fs.unlinkSync(filePath);
          });
          clearedItems.push(`Log files: ${files.length} files`);
        }
      } catch (logError) {
        console.error('Error clearing logs:', logError);
        clearedItems.push('Log files: Error clearing logs');
      }
    }

    // Log the reset action
    if (enableLogging) {
      await logger.logPerformance({
        operation: 'system_reset',
        resetType: resetType,
        deletedCount: deletedCount,
        clearedItems: clearedItems,
        performedBy: req.user?.email || 'unknown',
        timestamp: new Date().toISOString()
      });
    }

    console.log(`System reset completed: ${resetType}`);
    console.log(`Total records deleted: ${deletedCount}`);
    console.log(`Items cleared: ${clearedItems.join(', ')}`);

    res.json({
      success: true,
      message: 'System reset completed successfully',
      data: {
        resetType: resetType,
        totalDeleted: deletedCount,
        clearedItems: clearedItems,
        resetAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('System reset error:', error);
    
    if (enableLogging) {
      await logger.logError({
        operation: 'system_reset',
        error: error.message,
        performedBy: req.user?.email || 'unknown'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to reset system data',
      error: error.message
    });
  }
};

// Get system statistics
const getSystemStats = async (req, res) => {
  try {
    const smsQueueCount = await SMSQueue.countDocuments();
    const failedSMSCount = await FailedSMS.countDocuments();
    
    // Get log files count
    let logFilesCount = 0;
    let logFileSize = 0;
    try {
      const logsDir = path.join(__dirname, '../logs');
      if (fs.existsSync(logsDir)) {
        const files = fs.readdirSync(logsDir);
        logFilesCount = files.length;
        
        files.forEach(file => {
          const filePath = path.join(logsDir, file);
          const stats = fs.statSync(filePath);
          logFileSize += stats.size;
        });
      }
    } catch (logError) {
      console.error('Error reading log stats:', logError);
    }

    // Get oldest and newest records
    const oldestSMSQueue = await SMSQueue.findOne().sort({ createdAt: 1 });
    const newestSMSQueue = await SMSQueue.findOne().sort({ createdAt: -1 });
    const oldestFailedSMS = await FailedSMS.findOne().sort({ finalFailureAt: 1 });
    const newestFailedSMS = await FailedSMS.findOne().sort({ finalFailureAt: -1 });

    res.json({
      success: true,
      data: {
        smsQueue: {
          count: smsQueueCount,
          oldest: oldestSMSQueue?.createdAt,
          newest: newestSMSQueue?.createdAt
        },
        failedSMS: {
          count: failedSMSCount,
          oldest: oldestFailedSMS?.finalFailureAt,
          newest: newestFailedSMS?.finalFailureAt
        },
        logs: {
          filesCount: logFilesCount,
          totalSize: logFileSize,
          sizeFormatted: formatFileSize(logFileSize)
        },
        total: smsQueueCount + failedSMSCount
      }
    });

  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system statistics'
    });
  }
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

module.exports = {
  upload,
  uploadAttendanceExcel,
  uploadSalaryExcel,
  getQueueStatus,
  getFailedSMS,
  retryFailedSMS,
  getDailySummary,
  resetSystemData,
  getSystemStats
};
