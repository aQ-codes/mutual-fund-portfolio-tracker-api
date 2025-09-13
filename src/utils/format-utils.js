// Generic formatting utilities - pure functions, no external dependencies

class FormatUtils {

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
