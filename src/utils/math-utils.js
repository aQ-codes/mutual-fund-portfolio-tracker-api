// Generic mathematical utilities

class MathUtils {
  // Round to specified decimal places
  static roundTo(number, decimalPlaces = 2) {
    if (typeof number !== 'number') return 0;
    
    const factor = Math.pow(10, decimalPlaces);
    return Math.round(number * factor) / factor;
  }

  // Calculate percentage change
  static percentageChange(oldValue, newValue) {
    if (typeof oldValue !== 'number' || typeof newValue !== 'number' || oldValue === 0) {
      return 0;
    }
    
    return ((newValue - oldValue) / oldValue) * 100;
  }

  // Calculate compound annual growth rate (CAGR)
  static calculateCAGR(beginningValue, endingValue, numberOfPeriods) {
    if (typeof beginningValue !== 'number' || 
        typeof endingValue !== 'number' || 
        typeof numberOfPeriods !== 'number' ||
        beginningValue <= 0 || numberOfPeriods <= 0) {
      return 0;
    }
    
    return (Math.pow(endingValue / beginningValue, 1 / numberOfPeriods) - 1) * 100;
  }

  // Calculate simple interest
  static simpleInterest(principal, rate, time) {
    if (typeof principal !== 'number' || 
        typeof rate !== 'number' || 
        typeof time !== 'number') {
      return 0;
    }
    
    return (principal * rate * time) / 100;
  }

  // Calculate compound interest
  static compoundInterest(principal, rate, time, compoundingFrequency = 1) {
    if (typeof principal !== 'number' || 
        typeof rate !== 'number' || 
        typeof time !== 'number' ||
        typeof compoundingFrequency !== 'number') {
      return 0;
    }
    
    const amount = principal * Math.pow(
      (1 + (rate / 100) / compoundingFrequency), 
      compoundingFrequency * time
    );
    
    return amount - principal;
  }

  // Calculate weighted average
  static weightedAverage(values, weights) {
    if (!Array.isArray(values) || !Array.isArray(weights) || values.length !== weights.length) {
      return 0;
    }
    
    const weightedSum = values.reduce((sum, value, index) => {
      return sum + (value * weights[index]);
    }, 0);
    
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  // Calculate standard deviation
  static standardDeviation(values) {
    if (!Array.isArray(values) || values.length === 0) {
      return 0;
    }
    
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
    const variance = squaredDifferences.reduce((sum, diff) => sum + diff, 0) / values.length;
    
    return Math.sqrt(variance);
  }

  // Find minimum value in array
  static min(values) {
    if (!Array.isArray(values) || values.length === 0) {
      return 0;
    }
    
    return Math.min(...values);
  }

  // Find maximum value in array
  static max(values) {
    if (!Array.isArray(values) || values.length === 0) {
      return 0;
    }
    
    return Math.max(...values);
  }

  // Calculate sum of array
  static sum(values) {
    if (!Array.isArray(values) || values.length === 0) {
      return 0;
    }
    
    return values.reduce((sum, value) => sum + (typeof value === 'number' ? value : 0), 0);
  }

  // Calculate average of array
  static average(values) {
    if (!Array.isArray(values) || values.length === 0) {
      return 0;
    }
    
    return this.sum(values) / values.length;
  }

  // Clamp number between min and max
  static clamp(number, min, max) {
    if (typeof number !== 'number') return min;
    
    return Math.min(Math.max(number, min), max);
  }

  // Check if number is within range
  static isInRange(number, min, max) {
    if (typeof number !== 'number') return false;
    
    return number >= min && number <= max;
  }
}

export default MathUtils;
