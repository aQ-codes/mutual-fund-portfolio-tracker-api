// FIFO (First In, First Out) calculation helpers for portfolio management

class FifoHelpers {
  // Calculate FIFO sell operation - returns remaining lots and realized P/L
  static calculateFifoSell(lots, unitsToSell, currentPrice) {
    if (!lots || lots.length === 0 || unitsToSell <= 0) {
      return { remainingLots: lots || [], realizedPL: 0, unitsSold: 0, remainingToSell: unitsToSell };
    }

    let remainingToSell = unitsToSell;
    let realizedPL = 0;
    let unitsSold = 0;
    const remainingLots = JSON.parse(JSON.stringify(lots)); // Deep copy to avoid mutation

    // FIFO: Remove from oldest lots first
    for (let i = 0; i < remainingLots.length && remainingToSell > 0; i++) {
      const lot = remainingLots[i];
      
      if (lot.units <= remainingToSell) {
        // Sell entire lot
        realizedPL += (currentPrice - lot.pricePerUnit) * lot.units;
        remainingToSell -= lot.units;
        unitsSold += lot.units;
        remainingLots.splice(i, 1);
        i--; // Adjust index after removal
      } else {
        // Partial lot sale
        realizedPL += (currentPrice - lot.pricePerUnit) * remainingToSell;
        unitsSold += remainingToSell;
        lot.units -= remainingToSell;
        remainingToSell = 0;
      }
    }

    return {
      remainingLots,
      realizedPL,
      unitsSold,
      remainingToSell // In case there weren't enough units
    };
  }

  // Calculate weighted average cost from lots
  static calculateWeightedAverageCost(lots) {
    if (!lots || lots.length === 0) {
      return 0;
    }
    
    const totalValue = lots.reduce((sum, lot) => sum + (lot.units * lot.pricePerUnit), 0);
    const totalUnits = lots.reduce((sum, lot) => sum + lot.units, 0);
    
    return totalUnits > 0 ? totalValue / totalUnits : 0;
  }

  // Add new lot to existing lots array
  static addLot(lots, newLot) {
    const updatedLots = [...(lots || [])];
    updatedLots.push({
      date: newLot.date || new Date(),
      units: newLot.units,
      pricePerUnit: newLot.pricePerUnit
    });
    
    // Sort by date (oldest first) to maintain FIFO order
    updatedLots.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return updatedLots;
  }

  // Calculate total units from lots
  static getTotalUnits(lots) {
    if (!lots || lots.length === 0) {
      return 0;
    }
    
    return lots.reduce((sum, lot) => sum + lot.units, 0);
  }

  // Calculate total invested amount from lots
  static getTotalInvestedAmount(lots) {
    if (!lots || lots.length === 0) {
      return 0;
    }
    
    return lots.reduce((sum, lot) => sum + (lot.units * lot.pricePerUnit), 0);
  }

  // Validate lot structure
  static validateLot(lot) {
    const errors = [];

    if (!lot || typeof lot !== 'object') {
      errors.push('Lot must be an object');
      return { isValid: false, errors };
    }

    if (!lot.units || typeof lot.units !== 'number' || lot.units <= 0) {
      errors.push('Lot units must be a positive number');
    }

    if (!lot.pricePerUnit || typeof lot.pricePerUnit !== 'number' || lot.pricePerUnit <= 0) {
      errors.push('Lot pricePerUnit must be a positive number');
    }

    if (lot.date && !(lot.date instanceof Date) && typeof lot.date !== 'string') {
      errors.push('Lot date must be a Date object or string');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Clean up lots with zero units
  static cleanupLots(lots) {
    if (!lots || lots.length === 0) {
      return [];
    }
    
    return lots.filter(lot => lot.units > 0);
  }

  // Get oldest lot (for FIFO operations)
  static getOldestLot(lots) {
    if (!lots || lots.length === 0) {
      return null;
    }
    
    return lots.reduce((oldest, current) => {
      const oldestDate = new Date(oldest.date);
      const currentDate = new Date(current.date);
      return currentDate < oldestDate ? current : oldest;
    });
  }
}

export default FifoHelpers;
