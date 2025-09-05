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

// Helper function to get Hindi month names
const getHindiMonth = (monthNumber, daysWorked) => {
  const hindiMonths = {
    1: 'जनवरी',
    2: 'फ़रवरी', 
    3: 'मार्च',
    4: 'अप्रैल',
    5: 'मई',
    6: 'जून',
    7: 'जुलाई',
    8: 'अगस्त',
    9: 'सितंबर',
    10: 'अक्टूबर',
    11: 'नवंबर',
    12: 'दिसंबर'
  };
  
  // If monthNumber is provided, use it; otherwise use current month
  let month;
  if (monthNumber && monthNumber >= 1 && monthNumber <= 12) {
    month = monthNumber;
  } else {
    month = new Date().getMonth() + 1;
  }
  
  // If daysWorked is provided, use it; otherwise calculate days in month
  let days;
  if (daysWorked) {
    days = daysWorked;
  } else {
    const currentYear = new Date().getFullYear();
    days = new Date(currentYear, month, 0).getDate();
  }
  
  return `${hindiMonths[month]}-${days}-दिन`;
};

// Helper function to calculate net salary
const calculateNetSalary = (grossSalary, pf, esi) => {
  const gross = parseFloat(grossSalary) || 0;
  const pfAmount = parseFloat(pf) || 0;
  const esiAmount = parseFloat(esi) || 0;
  const netPay = gross - (pfAmount + esiAmount);
  return `${gross}-${pfAmount}-${esiAmount} = ${netPay.toFixed(2)}`;
};


// Simple SMS processing without Redis queue
const processDirectSMS = async (type, data, isRetry = false) => {
  const startTime = Date.now();
  const setting = readSettingsFile();
  
  try {
    let result;
    
    if (type === 'attendance') {
      console.log('Attendance Data:', data);
      
      // Create the new attendance message format
      // Format: {name-employeeId}|{date}|{inTime-outTime -कुल-workDuration घंटे}
      const nameWithId = `${data.name}–${data.employeeId}`;
      const dateFormatted = data.selectedDate;
      const inTime = data.inTime;
      const outTime = data.outTime;
      let workTimeWithTotal =  `${inTime}–${outTime} -कुल-${data.workDuration}`;

      // if(data.inTime == '00:00:00' && data.outTime == '00:00:00') {
      //   workTimeWithTotal = `अपनी अनुपस्थिति की-कुल-${data.workDuration}`;
      // }
      
      const variables = `${nameWithId}|${dateFormatted}|${workTimeWithTotal}`;
      
      console.log('Attendance Variables:', variables);
      console.log('Variable breakdown:');
      console.log('- Name with ID:', nameWithId);
      console.log('- Date:', dateFormatted);
      console.log('- Work time with total:', workTimeWithTotal);
      
      // Use demo or real API based on configuration
      result = isDemoMode ? 
        await sendDemoSMS(data.phone, '197597', variables) :
        await sendSMS(data.phone, '197597', variables);
    } else if (type === 'salary') {
      // Create the enhanced salary message format
      const nameWithId = `${data.name}-${data.employeeId}`;
      const monthDays = getHindiMonth(data.selectedMonth, data.days);
      const salaryCalculation = calculateNetSalary(data.grossSalary, data.pf, data.esi);
      
      const variables = `${nameWithId}|${monthDays}|${salaryCalculation}`;
      
      // Use demo or real API based on configuration
      result = isDemoMode ? 
        await sendDemoSMS(data.phone, '197376', variables) :
        await sendSMS(data.phone, '197376', variables);
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
              workDuration: data.workDuration,
              selectedDate: data.selectedDate
            } : 
            { 
              employeeId: data.employeeId,
              grossSalary: data.grossSalary,
              pf: data.pf,
              esi: data.esi,
              netPay: data.netPay,
              days: data.days,
              selectedMonth: data.selectedMonth
            },
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
            workDuration: data.workDuration,
            selectedDate: data.selectedDate
          } : 
          { 
            employeeId: data.employeeId,
            grossSalary: data.grossSalary,
            pf: data.pf,
            esi: data.esi,
            netPay: data.netPay,
            days: data.days,
            selectedMonth: data.selectedMonth
          },
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
    console.log(phoneNumber , templateId , variables)
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
    fileSize: 100 * 1024 * 1024 // 10MB limit
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

function parseExcelCell(cellValue) {
  if (typeof cellValue === "number") {
    // Treat it as Excel time (fraction of a day)
    let totalSeconds = Math.round(cellValue * 24 * 60 * 60);
    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  } else if (typeof cellValue === "string") {
    // If already text, just return as it is
    return cellValue.trim();
  } else {
    return "";
  }
}

// Upload and process attendance Excel to be changed
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

    // Get selected date from request body
    const selectedDate = req.body.selectedDate || new Date().toISOString().split('T')[0];
    
    // Format date as DD-MM-YYYY
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };
    
    const formattedDate = formatDate(selectedDate);

    console.log(`Starting attendance batch processing: ${batchId}`);
    console.log(`Selected date: ${selectedDate} (formatted: ${formattedDate})`);
    console.log(`Demo mode: ${isDemoMode ? 'ENABLED' : 'DISABLED'}`);
    console.log(`Logging: ${enableLogging ? 'ENABLED' : 'DISABLED'}`);

    const settings = readSettingsFile();
    
    // Column mapping from settings - Simplified attendance format (work duration calculated)
    const columnMapping = {
      name: settings.ATTENDANCE_NAME_COLUMN || 'F',
      phone: settings.ATTENDANCE_PHONE_COLUMN || 'B',
      employeeId: settings.ATTENDANCE_EMPLOYEE_ID_COLUMN || 'D',
      inTime: settings.ATTENDANCE_IN_TIME_COLUMN || 'I',
      outTime: settings.ATTENDANCE_OUT_TIME_COLUMN || 'J' ,
      workDuration : settings.ATTENDANCE_WORK_COLUMN || 'K'
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
      console.log('Processing row:', row);
      
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
      
      

      console.log(row);
      
      // Calculate work duration from in-time and out-time
      // const calculatedWorkDuration = calculateWorkDuration(row.inTime, row.outTime);

      console.log('Calculated work duration:', parseExcelCell(row.workDuration));
      console.log('In time:', parseExcelCell(row.inTime));
      console.log('Out time:', parseExcelCell(row.outTime));


      // return;
      processedData.push({
        name: row.name.toString().trim(),
        phone: row.phone.toString().trim(),
        employeeId: row.employeeId.toString().trim(),
        inTime: row.inTime == '00:00:00' ? '00:00:00' : parseExcelCell(row.inTime),
        outTime: row.outTime == '00:00:00' ? '00:00:00' : parseExcelCell(row.outTime),
        workDuration: parseExcelCell(row.workDuration),
        selectedDate: formattedDate
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
          workDuration: data.workDuration,
          selectedDate: data.selectedDate
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
          workDuration: data.workDuration,
          selectedDate: data.selectedDate
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
        avgProcessingTimePerSMS: batchProcessingTime / processedData.length,
        selectedDate: formattedDate
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
        isDemoMode: isDemoMode,
        selectedDate: formattedDate
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

    // Get selected month from request body (1-12)
    const selectedMonth = req.body.selectedMonth ? parseInt(req.body.selectedMonth) : new Date().getMonth() + 1;
    
    console.log(`Starting salary batch processing: ${batchId}`);
    console.log(`Selected month: ${selectedMonth}`);
    console.log(`Demo mode: ${isDemoMode ? 'ENABLED' : 'DISABLED'}`);
    console.log(`Logging: ${enableLogging ? 'ENABLED' : 'DISABLED'}`);

    const settings = readSettingsFile();
    
    // Column mapping from settings for enhanced salary
    const columnMapping = {
      name: settings.SALARY_NAME_COLUMN || 'A',
      phone: settings.SALARY_PHONE_COLUMN || 'B',
      employeeId: settings.SALARY_EMPLOYEE_ID_COLUMN || 'C',
      grossSalary: settings.SALARY_GROSS_SALARY_COLUMN || 'D',
      pf: settings.SALARY_PF_COLUMN || 'E',
      esi: settings.SALARY_ESI_COLUMN || 'F',
      netPay: settings.SALARY_NETPAY_COLUMN || 'G',
      days: settings.SALARY_DAYS_COLUMN || 'H'
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
      
      // Validate required fields - Updated for enhanced salary format
      if (!row.name || !row.phone || !row.employeeId || !row.grossSalary) {
        errors.push(`Row ${i + 2}: Missing required fields (name, phone, employeeId, grossSalary)`);
        continue;
      }
      
      // Validate phone number
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(row.phone.toString())) {
        errors.push(`Row ${i + 2}: Invalid phone number format`);
        continue;
      }
      
      // Validate gross salary (should be numeric)
      if (isNaN(row.grossSalary) || parseFloat(row.grossSalary) <= 0) {
        errors.push(`Row ${i + 2}: Invalid gross salary format`);
        continue;
      }
      
      // Validate PF and ESI (should be numeric if provided)
      const pf = row.pf ? parseFloat(row.pf) : 0;
      const esi = row.esi ? parseFloat(row.esi) : 0;
      
      if (row.pf && isNaN(pf)) {
        errors.push(`Row ${i + 2}: Invalid PF amount format`);
        continue;
      }
      
      if (row.esi && isNaN(esi)) {
        errors.push(`Row ${i + 2}: Invalid ESI amount format`);
        continue;
      }
      
      processedData.push({
        name: row.name.toString().trim(),
        phone: row.phone.toString().trim(),
        employeeId: row.employeeId.toString().trim(),
        grossSalary: parseFloat(row.grossSalary).toFixed(2),
        pf: pf.toFixed(2),
        esi: esi.toFixed(2),
        netPay: row.netPay ? parseFloat(row.netPay).toFixed(2) : (parseFloat(row.grossSalary) - pf - esi).toFixed(2),
        days: row.days ? row.days.toString().trim() : '31'
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
          employeeId: data.employeeId,
          grossSalary: data.grossSalary,
          pf: data.pf,
          esi: data.esi,
          netPay: data.netPay,
          days: data.days,
          selectedMonth: selectedMonth
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
          employeeId: data.employeeId,
          grossSalary: data.grossSalary,
          pf: data.pf,
          esi: data.esi,
          netPay: data.netPay,
          days: data.days,
          selectedMonth: selectedMonth
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
        { 
          employeeId: failedRecord.data.employeeId,
          inTime: failedRecord.data.inTime,
          outTime: failedRecord.data.outTime,
          workDuration: failedRecord.data.workDuration,
          selectedDate: failedRecord.data.selectedDate
        } :
        { 
          employeeId: failedRecord.data.employeeId,
          grossSalary: failedRecord.data.grossSalary,
          pf: failedRecord.data.pf,
          esi: failedRecord.data.esi,
          netPay: failedRecord.data.netPay,
          days: failedRecord.data.days,
          selectedMonth: failedRecord.data.selectedMonth || new Date().getMonth() + 1
        })
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

// Export attendance data to Excel or CSV
const exportAttendanceData = async (req, res) => {
  try {
    const { format = 'excel', date, status, type = 'attendance' } = req.query;
    
    // Build filter query
    const filter = { type };
    
    if (date) {
      // Convert YYYY-MM-DD to DD-MM-YYYY format to match stored format
      const convertedDate = new Date(date);
      const day = convertedDate.getDate().toString().padStart(2, '0');
      const month = (convertedDate.getMonth() + 1).toString().padStart(2, '0');
      const year = convertedDate.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;
      
      filter['data.selectedDate'] = formattedDate;
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    // Fetch attendance data
    const attendanceData = await SMSQueue.find(filter).sort({ createdAt: -1 });
    
    if (attendanceData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No attendance data found for the specified criteria'
      });
    }
    
    // Format data for export
    const formattedData = attendanceData.map(record => ({
      Name: record.name,
      Phone: record.phone,
      'Employee ID': record.data?.employeeId || 'N/A',
      Date: record.data?.selectedDate || new Date(record.createdAt).toLocaleDateString('en-GB'),
      'In Time': record.data?.inTime || 'N/A',
      'Out Time': record.data?.outTime || 'N/A',
      'Work Duration': record.data?.workDuration || 'N/A',
      Status: record.status,
      'Created At': new Date(record.createdAt).toLocaleString('en-GB'),
      'Message Template': generateAttendanceMessage(record),
      Error: record.error || ''
    }));
    
    if (format === 'csv') {
      // Generate CSV
      const headers = Object.keys(formattedData[0]);
      const csvContent = [
        headers.join(','),
        ...formattedData.map(row => 
          headers.map(header => `"${row[header]}"`).join(',')
        )
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="attendance_data_${Date.now()}.csv"`);
      return res.send(csvContent);
    } else {
      // Generate Excel
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      
      // Set column widths
      const columnWidths = [
        { wch: 20 }, // Name
        { wch: 15 }, // Phone
        { wch: 15 }, // Employee ID
        { wch: 12 }, // Date
        { wch: 10 }, // In Time
        { wch: 10 }, // Out Time
        { wch: 15 }, // Work Duration
        { wch: 10 }, // Status
        { wch: 20 }, // Created At
        { wch: 50 }, // Message Template
        { wch: 30 }  // Error
      ];
      worksheet['!cols'] = columnWidths;
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Data');
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="attendance_data_${Date.now()}.xlsx"`);
      return res.send(buffer);
    }
    
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export attendance data',
      error: error.message
    });
  }
};

// Helper function to generate attendance message template
const generateAttendanceMessage = (record) => {
  const { name, data } = record;
  const employeeId = data?.employeeId || 'N/A';
  const selectedDate = data?.selectedDate || new Date(record.createdAt).toLocaleDateString('en-GB');
  const workDuration = data?.workDuration || 'N/A';
  const inTime = data?.inTime || 'N/A';
  const outTime = data?.outTime || 'N/A';
  
  // Format the time string as: inTime–outTime -कुल-workDuration
  const timeDetails = `${inTime}–${outTime} -कुल-${workDuration}`;
  
  return `प्रिय ${name}–${employeeId}\n\nआज ${selectedDate} को आपने ${timeDetails} घंटे तक कार्य किया।\n\nधन्यवाद,\nसुख्मा सन्स`;
};

// Helper function to generate salary message template
const generateSalaryMessage = (record) => {
  const { name, data } = record;
  const employeeId = data?.employeeId || 'N/A';
  const grossSalary = data?.grossSalary || 'N/A';
  const pf = data?.pf || '0';
  const esi = data?.esi || '0';
  const netPay = data?.netPay || 'N/A';
  const selectedMonth = data?.selectedMonth || new Date().getMonth() + 1;
  const days = data?.days || '31';
  
  // Get Hindi month name with days
  const monthDays = getHindiMonth(selectedMonth, days);
  
  // Format salary calculation: Gross-PF-ESI = NetPay
  const totalDeductions = (parseFloat(pf) + parseFloat(esi)).toFixed(2);
  const salaryCalculation = `${grossSalary}-${totalDeductions} = ${netPay}`;
  
  return `प्रिय कर्मचारी ${name}-${employeeId}\n\nआपके ${monthDays} के वेतन का विवरण इस प्रकार है\n\nGross Salary-EPF & ESI Deduction = NETPAY:\n${salaryCalculation} INR\n\nयह भुगतान सुख्मा सन्स द्वारा आपके खाते में भेज दिया गया है।\n\n-Sukhmaa Sons`;
};

// Get attendance data for export preview
const getAttendanceData = async (req, res) => {
  try {
    const { page = 1, limit = 50, date, status, type = 'attendance' } = req.query;
    
    // Build filter query
    const filter = { type };
    
    if (date) {
      // Convert YYYY-MM-DD to DD-MM-YYYY format to match stored format
      const convertedDate = new Date(date);
      const day = convertedDate.getDate().toString().padStart(2, '0');
      const month = (convertedDate.getMonth() + 1).toString().padStart(2, '0');
      const year = convertedDate.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;
      
      // Filter by the selectedDate field in the data object
      filter['data.selectedDate'] = formattedDate;
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get total count
    const total = await SMSQueue.countDocuments(filter);
    
    // Get paginated data
    const attendanceData = await SMSQueue.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Format data
    const formattedData = attendanceData.map(record => ({
      _id: record._id,
      name: record.name,
      phone: record.phone,
      employeeId: record.data?.employeeId || 'N/A',
      selectedDate: record.data?.selectedDate || new Date(record.createdAt).toLocaleDateString('en-GB'),
      inTime: record.data?.inTime || 'N/A',
      outTime: record.data?.outTime || 'N/A',
      workDuration: record.data?.workDuration || 'N/A',
      status: record.status,
      createdAt: record.createdAt,
      error: record.error || '',
      messageTemplate: generateAttendanceMessage(record)
    }));
    
    res.json({
      success: true,
      data: {
        records: formattedData,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Get attendance data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance data',
      error: error.message
    });
  }
};

// Export salary data to Excel or CSV
const exportSalaryData = async (req, res) => {
  try {
    const { format = 'excel', date, status, month, type = 'salary' } = req.query;
    
    // Build filter query
    const filter = { type };
    
    // Filter by month if provided
    if (month) {
      filter['data.selectedMonth'] = parseInt(month);
    }
    
    // Filter by date if provided (creation date)
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      filter.createdAt = {
        $gte: startDate,
        $lt: endDate
      };
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    // Fetch salary data
    const salaryData = await SMSQueue.find(filter).sort({ createdAt: -1 });
    
    if (salaryData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No salary data found for the specified criteria'
      });
    }
    
    // Format data for export
    const formattedData = salaryData.map(record => ({
      Name: record.name,
      Phone: record.phone,
      'Employee ID': record.data?.employeeId || 'N/A',
      'Gross Salary': record.data?.grossSalary || 'N/A',
      'PF Deduction': record.data?.pf || 'N/A',
      'ESI Deduction': record.data?.esi || 'N/A',
      'Net Pay': record.data?.netPay || 'N/A',
      'Days Worked': record.data?.days || 'N/A',
      'Salary Month': getHindiMonth(record.data?.selectedMonth, record.data?.days),
      Status: record.status,
      'Created At': new Date(record.createdAt).toLocaleString('en-GB'),
      'Message Template': generateSalaryMessage(record),
      Error: record.error || ''
    }));
    
    if (format === 'csv') {
      // Generate CSV
      const headers = Object.keys(formattedData[0]);
      const csvContent = [
        headers.join(','),
        ...formattedData.map(row => 
          headers.map(header => `"${row[header]}"`).join(',')
        )
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="salary_data_${Date.now()}.csv"`);
      return res.send(csvContent);
    } else {
      // Generate Excel
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      
      // Set column widths
      const columnWidths = [
        { wch: 20 }, // Name
        { wch: 15 }, // Phone
        { wch: 15 }, // Employee ID
        { wch: 15 }, // Gross Salary
        { wch: 15 }, // PF Deduction
        { wch: 15 }, // ESI Deduction
        { wch: 15 }, // Net Pay
        { wch: 12 }, // Days Worked
        { wch: 20 }, // Salary Month
        { wch: 10 }, // Status
        { wch: 20 }, // Created At
        { wch: 60 }, // Message Template
        { wch: 30 }  // Error
      ];
      worksheet['!cols'] = columnWidths;
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Salary Data');
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="salary_data_${Date.now()}.xlsx"`);
      return res.send(buffer);
    }
    
  } catch (error) {
    console.error('Export salary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export salary data',
      error: error.message
    });
  }
};

// Get salary data for export preview
const getSalaryData = async (req, res) => {
  try {
    const { page = 1, limit = 50, date, status, month, type = 'salary' } = req.query;
    
    // Build filter query
    const filter = { type };
    
    // Filter by month if provided
    if (month) {
      filter['data.selectedMonth'] = parseInt(month);
    }
    
    // Filter by date if provided (creation date)
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      filter.createdAt = {
        $gte: startDate,
        $lt: endDate
      };
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get total count
    const total = await SMSQueue.countDocuments(filter);
    
    // Get paginated data
    const salaryData = await SMSQueue.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Format data
    const formattedData = salaryData.map(record => ({
      _id: record._id,
      name: record.name,
      phone: record.phone,
      employeeId: record.data?.employeeId || 'N/A',
      grossSalary: record.data?.grossSalary || 'N/A',
      pf: record.data?.pf || 'N/A',
      esi: record.data?.esi || 'N/A',
      netPay: record.data?.netPay || 'N/A',
      days: record.data?.days || 'N/A',
      selectedMonth: record.data?.selectedMonth || new Date().getMonth() + 1,
      salaryMonth: getHindiMonth(record.data?.selectedMonth, record.data?.days),
      status: record.status,
      createdAt: record.createdAt,
      error: record.error || '',
      messageTemplate: generateSalaryMessage(record)
    }));
    
    res.json({
      success: true,
      data: {
        records: formattedData,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Get salary data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch salary data',
      error: error.message
    });
  }
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
  getSystemStats,
  exportAttendanceData,
  getAttendanceData,
  exportSalaryData,
  getSalaryData
};
