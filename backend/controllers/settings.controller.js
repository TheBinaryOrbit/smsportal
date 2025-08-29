const fs = require('fs');
const path = require('path');

const SETTINGS_FILE_PATH = path.join(__dirname, '../settings.env');

// Helper function to read settings from file
const readSettingsFile = () => {
  try {
    if (!fs.existsSync(SETTINGS_FILE_PATH)) {
      // Create default settings file if it doesn't exist
      const defaultSettings = `# General Settings Configuration
# Excel Column Mappings for Data Processing

# Simplified Attendance Settings
ATTENDANCE_NAME_COLUMN=F
ATTENDANCE_PHONE_COLUMN=B
ATTENDANCE_EMPLOYEE_ID_COLUMN=D
ATTENDANCE_IN_TIME_COLUMN=I
ATTENDANCE_OUT_TIME_COLUMN=J
ATTENDANCE_WORK_DURATION_COLUMN=M

# Salary Settings
SALARY_NAME_COLUMN=A
SALARY_PHONE_COLUMN=B
SALARY_AMOUNT_COLUMN=C

# Template Name 
ATTENDANCE_TEMPLET_NAME=attedence
SALARY_TEMPLET_NAME=salary
`;
      
      fs.writeFileSync(SETTINGS_FILE_PATH, defaultSettings);
    }

    const content = fs.readFileSync(SETTINGS_FILE_PATH, 'utf8');
    const settings = {};
    
    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          settings[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    return settings;
  } catch (error) {
    console.error('Error reading settings file:', error);
    return {};
  }
};

// Helper function to write settings to file
const writeSettingsFile = (settings) => {
  try {
    let content = `# General Settings Configuration
# Excel Column Mappings for Data Processing

# Simplified Attendance Settings
ATTENDANCE_NAME_COLUMN=${settings.ATTENDANCE_NAME_COLUMN || 'F'}
ATTENDANCE_PHONE_COLUMN=${settings.ATTENDANCE_PHONE_COLUMN || 'B'}
ATTENDANCE_EMPLOYEE_ID_COLUMN=${settings.ATTENDANCE_EMPLOYEE_ID_COLUMN || 'D'}
ATTENDANCE_IN_TIME_COLUMN=${settings.ATTENDANCE_IN_TIME_COLUMN || 'I'}
ATTENDANCE_OUT_TIME_COLUMN=${settings.ATTENDANCE_OUT_TIME_COLUMN || 'J'}
ATTENDANCE_WORK_DURATION_COLUMN=${settings.ATTENDANCE_WORK_DURATION_COLUMN || 'M'}

# Salary Settings
SALARY_NAME_COLUMN=${settings.SALARY_NAME_COLUMN || 'A'}
SALARY_PHONE_COLUMN=${settings.SALARY_PHONE_COLUMN || 'B'}
SALARY_AMOUNT_COLUMN=${settings.SALARY_AMOUNT_COLUMN || 'C'}

# Template Name 
ATTENDANCE_TEMPLET_NAME=${settings.ATTENDANCE_TEMPLET_NAME || 'attedence'}
SALARY_TEMPLET_NAME=${settings.SALARY_TEMPLET_NAME || 'salary'}

`;

    fs.writeFileSync(SETTINGS_FILE_PATH, content);
    return true;
  } catch (error) {
    console.error('Error writing settings file:', error);
    return false;
  }
};

// Get general settings
const getSettings = async (req, res) => {
  try {
    const settings = readSettingsFile();
    
    // Organize settings by category
    const organizedSettings = {
      attendance: {
        nameColumn: settings.ATTENDANCE_NAME_COLUMN || 'F',
        phoneColumn: settings.ATTENDANCE_PHONE_COLUMN || 'B',
        employeeIdColumn: settings.ATTENDANCE_EMPLOYEE_ID_COLUMN || 'D',
        inTimeColumn: settings.ATTENDANCE_IN_TIME_COLUMN || 'I',
        outTimeColumn: settings.ATTENDANCE_OUT_TIME_COLUMN || 'J',
        workDurationColumn: settings.ATTENDANCE_WORK_DURATION_COLUMN || 'M'
      },
      salary: {
        nameColumn: settings.SALARY_NAME_COLUMN || 'A',
        phoneColumn: settings.SALARY_PHONE_COLUMN || 'B',
        amountColumn: settings.SALARY_AMOUNT_COLUMN || 'C'
      },
      templateNames: {
        attendanceTempletName: settings.ATTENDANCE_TEMPLET_NAME || 'attedence',
        salaryTempletName: settings.SALARY_TEMPLET_NAME || 'salary'
      }
    };

    res.json({
      success: true,
      data: organizedSettings
    });

  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings'
    });
  }
};

// Update general settings
const updateSettings = async (req, res) => {
  try {
    const { attendance, salary , templateNames } = req.body;

    if (!attendance && !salary) {
      return res.status(400).json({
        success: false,
        message: 'At least one settings category must be provided'
      });
    }

    // Read current settings
    const currentSettings = readSettingsFile();

    // Update settings with new values
    const updatedSettings = { ...currentSettings };

    if (attendance) {
      if (attendance.nameColumn) updatedSettings.ATTENDANCE_NAME_COLUMN = attendance.nameColumn;
      if (attendance.phoneColumn) updatedSettings.ATTENDANCE_PHONE_COLUMN = attendance.phoneColumn;
      if (attendance.employeeIdColumn) updatedSettings.ATTENDANCE_EMPLOYEE_ID_COLUMN = attendance.employeeIdColumn;
      if (attendance.inTimeColumn) updatedSettings.ATTENDANCE_IN_TIME_COLUMN = attendance.inTimeColumn;
      if (attendance.outTimeColumn) updatedSettings.ATTENDANCE_OUT_TIME_COLUMN = attendance.outTimeColumn;
      if (attendance.workDurationColumn) updatedSettings.ATTENDANCE_WORK_DURATION_COLUMN = attendance.workDurationColumn;
    }

    if (salary) {
      if (salary.nameColumn) updatedSettings.SALARY_NAME_COLUMN = salary.nameColumn;
      if (salary.phoneColumn) updatedSettings.SALARY_PHONE_COLUMN = salary.phoneColumn;
      if (salary.amountColumn) updatedSettings.SALARY_AMOUNT_COLUMN = salary.amountColumn;
    }

    if (templateNames.attendanceTempletName) {
      updatedSettings.ATTENDANCE_TEMPLET_NAME = templateNames.attendanceTempletName;
    }

    if (templateNames.salaryTempletName) {
      updatedSettings.SALARY_TEMPLET_NAME = templateNames.salaryTempletName;
    }

    // Write updated settings to file
    const writeSuccess = writeSettingsFile(updatedSettings);

    if (!writeSuccess) {
      return res.status(500).json({
        success: false,
        message: 'Failed to save settings'
      });
    }

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        attendance: {
          nameColumn: updatedSettings.ATTENDANCE_NAME_COLUMN,
          phoneColumn: updatedSettings.ATTENDANCE_PHONE_COLUMN,
          employeeIdColumn: updatedSettings.ATTENDANCE_EMPLOYEE_ID_COLUMN,
          inTimeColumn: updatedSettings.ATTENDANCE_IN_TIME_COLUMN,
          outTimeColumn: updatedSettings.ATTENDANCE_OUT_TIME_COLUMN,
          workDurationColumn: updatedSettings.ATTENDANCE_WORK_DURATION_COLUMN
        },
        salary: {
          nameColumn: updatedSettings.SALARY_NAME_COLUMN,
          phoneColumn: updatedSettings.SALARY_PHONE_COLUMN,
          amountColumn: updatedSettings.SALARY_AMOUNT_COLUMN
        },
        templateNames: {
          attendanceTempletName: updatedSettings.ATTENDANCE_TEMPLET_NAME,
          salaryTempletName: updatedSettings.SALARY_TEMPLET_NAME
        }
      }
    });

  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
};

// Get specific column mappings for attendance
const getAttendanceMapping = async (req, res) => {
  try {
    const settings = readSettingsFile();
    
    res.json({
      success: true,
      data: {
        nameColumn: settings.ATTENDANCE_NAME_COLUMN || 'F',
        phoneColumn: settings.ATTENDANCE_PHONE_COLUMN || 'B',
        employeeIdColumn: settings.ATTENDANCE_EMPLOYEE_ID_COLUMN || 'D',
        inTimeColumn: settings.ATTENDANCE_IN_TIME_COLUMN || 'I',
        outTimeColumn: settings.ATTENDANCE_OUT_TIME_COLUMN || 'J',
        workDurationColumn: settings.ATTENDANCE_WORK_DURATION_COLUMN || 'M',
        exampleMapping: {
          F: 'Employee Name',
          B: 'Phone Number',
          D: 'Employee ID',
          I: 'In Time',
          J: 'Out Time',
          M: 'Work Duration'
        }
      }
    });

  } catch (error) {
    console.error('Get attendance mapping error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance mapping'
    });
  }
};

// Get specific column mappings for salary
const getSalaryMapping = async (req, res) => {
  try {
    const settings = readSettingsFile();
    
    res.json({
      success: true,
      data: {
        nameColumn: settings.SALARY_NAME_COLUMN || 'A',
        phoneColumn: settings.SALARY_PHONE_COLUMN || 'B',
        amountColumn: settings.SALARY_AMOUNT_COLUMN || 'C',
        exampleMapping: {
          A: 'Employee Name',
          B: 'Phone Number',
          C: 'Salary Amount'
        }
      }
    });

  } catch (error) {
    console.error('Get salary mapping error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch salary mapping'
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  getAttendanceMapping,
  getSalaryMapping,
  readSettingsFile
};
