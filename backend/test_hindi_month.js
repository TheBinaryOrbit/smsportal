// Test script for Hindi month function
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

// Test cases
console.log('Testing Hindi Month Function:');
console.log('1. Current month with auto days:', getHindiMonth());
console.log('2. August with 31 days:', getHindiMonth(8, 31));
console.log('3. February with 28 days:', getHindiMonth(2, 28));
console.log('4. December with 30 days:', getHindiMonth(12, 30));
console.log('5. January with 31 days:', getHindiMonth(1, 31));

// Test different month selections
for (let month = 1; month <= 12; month++) {
  console.log(`Month ${month}: ${getHindiMonth(month, 31)}`);
}
