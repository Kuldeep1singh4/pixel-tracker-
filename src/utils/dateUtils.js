// src/utils/dateUtils.js

export const getTodayIST = () => {
  const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
  const formatter = new Intl.DateTimeFormat('en-CA', options); 
  return formatter.format(new Date());
};

// NEW: Gets the exact start and end dates of the current calendar month
export const getCurrentMonthRange = () => {
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();
  
  const firstDay = new Date(y, m, 1);
  const lastDay = new Date(y, m + 1, 0); // The 0th day of next month is the last day of this month
  
  const format = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  
  return { start: format(firstDay), end: format(lastDay) };
};

// UPDATED: Now generates dates between a specific start and end
export const generateChartDates = (startDateStr, endDateStr) => {
  const dates = [];
  let current = new Date(`${startDateStr}T00:00:00`);
  const end = new Date(`${endDateStr}T00:00:00`);
  
  while (current <= end) {
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
    
    current.setDate(current.getDate() + 1); // Move to next day
  }
  
  return dates; 
};

export const formatDateShort = (dateStr) => {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};