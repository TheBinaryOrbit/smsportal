const XLSX = require('xlsx');
const path = require('path');

// Function to generate test data
const generateTestData = (count, type = 'attendance') => {
  const data = [];
  
  for (let i = 1; i <= count; i++) {
    if (type === 'attendance') {
      data.push({
        Name: `Employee ${i.toString().padStart(4, '0')}`,
        Phone: `${Math.floor(Math.random() * 3) + 6}${Math.floor(Math.random() * 900000000) + 100000000}`,
        Status: Math.random() > 0.2 ? 'Present' : 'Absent',
        Date: '2025-08-27'
      });
    } else if (type === 'salary') {
      data.push({
        Name: `Employee ${i.toString().padStart(4, '0')}`,
        Phone: `${Math.floor(Math.random() * 3) + 6}${Math.floor(Math.random() * 900000000) + 100000000}`,
        Amount: Math.floor(Math.random() * 50000) + 15000 // 15k to 65k salary
      });
    }
  }
  
  return data;
};

// Function to create Excel file
const createExcelFile = (data, filename) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  
  const filePath = path.join(__dirname, '../test-data', filename);
  XLSX.writeFile(workbook, filePath);
  console.log(`Created test file: ${filePath}`);
  return filePath;
};

// Create test data directory
const fs = require('fs');
const testDataDir = path.join(__dirname, '../test-data');
if (!fs.existsSync(testDataDir)) {
  fs.mkdirSync(testDataDir, { recursive: true });
}

// Generate test files
const testSizes = [500, 1000, 1500, 2000];

console.log('Generating test data files...');

testSizes.forEach(size => {
  // Generate attendance files
  const attendanceData = generateTestData(size, 'attendance');
  createExcelFile(attendanceData, `attendance_test_${size}_records.xlsx`);
  
  // Generate salary files
  const salaryData = generateTestData(size, 'salary');
  createExcelFile(salaryData, `salary_test_${size}_records.xlsx`);
});

console.log('Test data generation completed!');

// Generate a README for the test files
const readmeContent = `# Test Data Files

This directory contains test Excel files for SMS portal testing.

## Attendance Test Files:
- attendance_test_500_records.xlsx (500 records)
- attendance_test_1000_records.xlsx (1000 records)
- attendance_test_1500_records.xlsx (1500 records)
- attendance_test_2000_records.xlsx (2000 records)

## Salary Test Files:
- salary_test_500_records.xlsx (500 records)
- salary_test_1000_records.xlsx (1000 records)
- salary_test_1500_records.xlsx (1500 records)
- salary_test_2000_records.xlsx (2000 records)

## Column Structure:

### Attendance Files:
- Column A: Name
- Column B: Phone
- Column C: Status (Present/Absent)
- Column D: Date

### Salary Files:
- Column A: Name
- Column B: Phone
- Column C: Amount

## Usage:
1. Set SMS_DEMO_MODE=true in your .env file
2. Upload these files through the frontend
3. Monitor performance in logs directory

## Performance Testing:
Use these files to test different load scenarios and monitor:
- Processing time per SMS
- Memory usage
- Error rates
- Queue performance
`;

fs.writeFileSync(path.join(testDataDir, 'README.md'), readmeContent);
console.log('README.md created in test-data directory');
