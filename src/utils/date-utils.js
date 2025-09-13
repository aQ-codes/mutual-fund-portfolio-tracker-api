// Date formatting and manipulation utilities

class DateUtils {
  // Convert DD-MM-YYYY string to Date object
  static parseApiDate(dateString) {
    if (!dateString || typeof dateString !== 'string') {
      return null;
    }
    
    const parts = dateString.split('-');
    if (parts.length !== 3) {
      return null;
    }
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const year = parseInt(parts[2], 10);
    
    return new Date(year, month, day);
  }

  // Convert Date object to DD-MM-YYYY string
  static formatToApiDate(date) {
    if (!date || !(date instanceof Date)) {
      return null;
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  }

  // Get current date in DD-MM-YYYY format
  static getCurrentApiDate() {
    return this.formatToApiDate(new Date());
  }

  // Check if date is weekend (Saturday or Sunday)
  static isWeekend(date) {
    if (!date || !(date instanceof Date)) {
      return false;
    }
    
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
  }

  // Get previous business day (skipping weekends)
  static getPreviousBusinessDay(date = new Date()) {
    const prevDay = new Date(date);
    prevDay.setDate(prevDay.getDate() - 1);
    
    // Keep going back until we find a weekday
    while (this.isWeekend(prevDay)) {
      prevDay.setDate(prevDay.getDate() - 1);
    }
    
    return prevDay;
  }

  // Get next business day (skipping weekends)
  static getNextBusinessDay(date = new Date()) {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    // Keep going forward until we find a weekday
    while (this.isWeekend(nextDay)) {
      nextDay.setDate(nextDay.getDate() + 1);
    }
    
    return nextDay;
  }

  // Get date range for last N days
  static getLastNDays(days, endDate = new Date()) {
    const dates = [];
    const currentDate = new Date(endDate);
    
    for (let i = 0; i < days; i++) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    return dates.reverse(); // Return oldest first
  }

  // Check if date is a market holiday (basic implementation)
  static isMarketHoliday(date) {
    if (!date || !(date instanceof Date)) {
      return false;
    }
    
    // This is a basic implementation - in production, you'd maintain a proper holiday calendar
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // Common fixed holidays (this is a simplified list)
    const fixedHolidays = [
      { month: 1, day: 26 }, // Republic Day
      { month: 8, day: 15 }, // Independence Day
      { month: 10, day: 2 },  // Gandhi Jayanti
      { month: 12, day: 25 }  // Christmas
    ];
    
    return fixedHolidays.some(holiday => 
      holiday.month === month && holiday.day === day
    );
  }

  // Check if date is a trading day (not weekend or holiday)
  static isTradingDay(date) {
    return !this.isWeekend(date) && !this.isMarketHoliday(date);
  }

  // Format date for display (e.g., "12 Sep 2025")
  static formatForDisplay(date) {
    if (!date || !(date instanceof Date)) {
      return '';
    }
    
    const options = { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    };
    
    return date.toLocaleDateString('en-IN', options);
  }

  // Format date for API responses (e.g., "2025-09-12")
  static formatForApi(date) {
    if (!date || !(date instanceof Date)) {
      return null;
    }
    
    return date.toISOString().split('T')[0];
  }

  // Calculate days between two dates
  static daysBetween(startDate, endDate) {
    if (!startDate || !endDate || !(startDate instanceof Date) || !(endDate instanceof Date)) {
      return 0;
    }
    
    const timeDifference = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDifference / (1000 * 3600 * 24));
  }

  // Sort dates in ascending order
  static sortDatesAscending(dates) {
    return dates.sort((a, b) => new Date(a) - new Date(b));
  }

  // Sort dates in descending order
  static sortDatesDescending(dates) {
    return dates.sort((a, b) => new Date(b) - new Date(a));
  }
}

export default DateUtils;