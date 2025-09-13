// Currency formatting utilities - pure functions, no external dependencies

class CurrencyUtils {
  // Format currency values
  static formatCurrency(amount, currency = '₹') {
    if (typeof amount !== 'number') return `${currency}0.00`;
    
    return `${currency}${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  // Format numbers with Indian locale
  static formatNumber(number, decimalPlaces = 2) {
    if (typeof number !== 'number') return '0.00';
    
    return number.toLocaleString('en-IN', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    });
  }

  // Format units (3 decimal places)
  static formatUnits(units) {
    if (typeof units !== 'number') return '0.000';
    
    return units.toFixed(3);
  }

  // Format NAV (4 decimal places)
  static formatNav(nav) {
    if (typeof nav !== 'number') return '0.0000';
    
    return nav.toFixed(4);
  }

  // Format percentage values
  static formatPercentage(value, decimalPlaces = 2) {
    if (typeof value !== 'number') return '0.00%';
    
    return `${value.toFixed(decimalPlaces)}%`;
  }

  // Convert amount to words (for Indian numbering system)
  static convertToWords(amount) {
    if (typeof amount !== 'number') return 'Zero';
    
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (amount === 0) return 'Zero';
    
    let result = '';
    let crores = Math.floor(amount / 10000000);
    let lakhs = Math.floor((amount % 10000000) / 100000);
    let thousands = Math.floor((amount % 100000) / 1000);
    let hundreds = Math.floor((amount % 1000) / 100);
    let remainder = amount % 100;
    
    if (crores > 0) {
      result += this.convertHundreds(crores) + ' Crore ';
    }
    
    if (lakhs > 0) {
      result += this.convertHundreds(lakhs) + ' Lakh ';
    }
    
    if (thousands > 0) {
      result += this.convertHundreds(thousands) + ' Thousand ';
    }
    
    if (hundreds > 0) {
      result += ones[hundreds] + ' Hundred ';
    }
    
    if (remainder > 0) {
      if (remainder < 10) {
        result += ones[remainder];
      } else if (remainder < 20) {
        result += teens[remainder - 10];
      } else {
        result += tens[Math.floor(remainder / 10)];
        if (remainder % 10 > 0) {
          result += ' ' + ones[remainder % 10];
        }
      }
    }
    
    return result.trim();
  }

  // Helper function for convertToWords
  static convertHundreds(num) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    let result = '';
    
    if (num >= 100) {
      result += ones[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }
    
    if (num >= 20) {
      result += tens[Math.floor(num / 10)];
      if (num % 10 > 0) {
        result += ' ' + ones[num % 10];
      }
    } else if (num >= 10) {
      result += teens[num - 10];
    } else if (num > 0) {
      result += ones[num];
    }
    
    return result.trim();
  }

  // Format amount in Indian currency format (with commas)
  static formatIndianCurrency(amount) {
    if (typeof amount !== 'number') return '0';
    
    return amount.toLocaleString('en-IN');
  }

  // Parse currency string to number
  static parseCurrency(currencyString) {
    if (!currencyString || typeof currencyString !== 'string') return 0;
    
    // Remove currency symbols and commas
    const cleaned = currencyString.replace(/[₹$,\s]/g, '');
    const parsed = parseFloat(cleaned);
    
    return isNaN(parsed) ? 0 : parsed;
  }
}

export default CurrencyUtils;
