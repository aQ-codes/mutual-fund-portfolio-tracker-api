// Generic formatting utilities

class FormatUtils {
  // Format currency values
  static formatCurrency(amount, currency = '₹') {
    if (typeof amount !== 'number') return `${currency}0.00`;
    
    return `${currency}${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  // Format percentage values
  static formatPercentage(value, decimalPlaces = 2) {
    if (typeof value !== 'number') return '0.00%';
    
    return `${value.toFixed(decimalPlaces)}%`;
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

  // Truncate string with ellipsis
  static truncateString(str, maxLength = 50) {
    if (!str || typeof str !== 'string') return '';
    
    if (str.length <= maxLength) return str;
    
    return str.substring(0, maxLength - 3) + '...';
  }

  // Format scheme name for display
  static formatSchemeName(schemeName) {
    if (!schemeName || typeof schemeName !== 'string') return '';
    
    // Remove common suffixes for cleaner display
    return schemeName
      .replace(/\s*-\s*(Direct Plan|Regular Plan)\s*/gi, ' ')
      .replace(/\s*-\s*(Growth|Dividend)\s*/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Capitalize first letter of each word
  static titleCase(str) {
    if (!str || typeof str !== 'string') return '';
    
    return str.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  // Convert camelCase to Title Case
  static camelToTitle(str) {
    if (!str || typeof str !== 'string') return '';
    
    return str
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  // Format file size
  static formatFileSize(bytes) {
    if (typeof bytes !== 'number') return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  }

  // Format duration in milliseconds to human readable
  static formatDuration(ms) {
    if (typeof ms !== 'number') return '0ms';
    
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    
    return `${(ms / 3600000).toFixed(1)}h`;
  }
}

export default FormatUtils;
