const fs = require('fs');
const path = require('path');

class SMSLogger {
  constructor() {
    this.logsDir = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  getCurrentDate() {
    return new Date().toISOString().split('T')[0];
  }

  getCurrentTimestamp() {
    return new Date().toISOString();
  }

  getLogFilePath(type) {
    const date = this.getCurrentDate();
    return path.join(this.logsDir, `${type}_${date}.log`);
  }

  async logPerformance(data) {
    const logEntry = {
      timestamp: this.getCurrentTimestamp(),
      type: 'PERFORMANCE',
      ...data
    };

    const logLine = `${JSON.stringify(logEntry)}\n`;
    const logFile = this.getLogFilePath('performance');
    
    try {
      fs.appendFileSync(logFile, logLine);
    } catch (error) {
      console.error('Failed to write performance log:', error);
    }
  }

  async logSMSOperation(data) {
    const logEntry = {
      timestamp: this.getCurrentTimestamp(),
      type: 'SMS_OPERATION',
      ...data
    };

    const logLine = `${JSON.stringify(logEntry)}\n`;
    const logFile = this.getLogFilePath('sms_operations');
    
    try {
      fs.appendFileSync(logFile, logLine);
    } catch (error) {
      console.error('Failed to write SMS operation log:', error);
    }
  }

  async logBatchProcessing(data) {
    const logEntry = {
      timestamp: this.getCurrentTimestamp(),
      type: 'BATCH_PROCESSING',
      ...data
    };

    const logLine = `${JSON.stringify(logEntry)}\n`;
    const logFile = this.getLogFilePath('batch_processing');
    
    try {
      fs.appendFileSync(logFile, logLine);
    } catch (error) {
      console.error('Failed to write batch processing log:', error);
    }
  }

  async logError(data) {
    const logEntry = {
      timestamp: this.getCurrentTimestamp(),
      type: 'ERROR',
      ...data
    };

    const logLine = `${JSON.stringify(logEntry)}\n`;
    const logFile = this.getLogFilePath('errors');
    
    try {
      fs.appendFileSync(logFile, logLine);
    } catch (error) {
      console.error('Failed to write error log:', error);
    }
  }

  // Generate summary report for a specific date
  async generateDailySummary(date = null) {
    if (!date) {
      date = this.getCurrentDate();
    }

    const performanceFile = path.join(this.logsDir, `performance_${date}.log`);
    const smsFile = path.join(this.logsDir, `sms_operations_${date}.log`);
    const batchFile = path.join(this.logsDir, `batch_processing_${date}.log`);
    const errorFile = path.join(this.logsDir, `errors_${date}.log`);

    const summary = {
      date,
      totalOperations: 0,
      successfulSMS: 0,
      failedSMS: 0,
      avgProcessingTime: 0,
      batchSummary: [],
      errors: [],
      performanceMetrics: []
    };

    try {
      // Read and parse performance logs
      if (fs.existsSync(performanceFile)) {
        const performanceData = fs.readFileSync(performanceFile, 'utf8')
          .split('\n')
          .filter(line => line.trim())
          .map(line => JSON.parse(line));
        
        summary.performanceMetrics = performanceData;
        summary.avgProcessingTime = performanceData.reduce((sum, entry) => 
          sum + (entry.processingTime || 0), 0) / performanceData.length;
      }

      // Read and parse SMS operation logs
      if (fs.existsSync(smsFile)) {
        const smsData = fs.readFileSync(smsFile, 'utf8')
          .split('\n')
          .filter(line => line.trim())
          .map(line => JSON.parse(line));
        
        summary.totalOperations = smsData.length;
        summary.successfulSMS = smsData.filter(entry => entry.status === 'success').length;
        summary.failedSMS = smsData.filter(entry => entry.status === 'failed').length;
      }

      // Read and parse batch processing logs
      if (fs.existsSync(batchFile)) {
        const batchData = fs.readFileSync(batchFile, 'utf8')
          .split('\n')
          .filter(line => line.trim())
          .map(line => JSON.parse(line));
        
        summary.batchSummary = batchData;
      }

      // Read and parse error logs
      if (fs.existsSync(errorFile)) {
        const errorData = fs.readFileSync(errorFile, 'utf8')
          .split('\n')
          .filter(line => line.trim())
          .map(line => JSON.parse(line));
        
        summary.errors = errorData;
      }

      // Write summary to file
      const summaryFile = path.join(this.logsDir, `daily_summary_${date}.json`);
      fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));

      return summary;
    } catch (error) {
      console.error('Failed to generate daily summary:', error);
      return summary;
    }
  }
}

module.exports = new SMSLogger();
