import mongoose from 'mongoose';
import Fund from '../models/Fund.js';
import FundHistory from '../models/FundHistory.js';
import LatestNav from '../models/LatestNav.js';
import ExternalNavApi from '../api/externalNavApi.js';
import config from '../config/env.js';

class FundSeeder {
  constructor() {
    this.successCount = 0;
    this.errorCount = 0;
    this.errors = [];
  }

  // Connect to database
  async connect() {
    try {
      await mongoose.connect(config.mongoUri);
      console.log('✅ Connected to MongoDB for seeding');
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      throw error;
    }
  }

  // Disconnect from database
  async disconnect() {
    try {
      await mongoose.disconnect();
      console.log('✅ Disconnected from MongoDB');
    } catch (error) {
      console.error('❌ MongoDB disconnection error:', error);
    }
  }

  // Seed a single fund with its history
  async seedSingleFund(schemeCode) {
    try {
      console.log(`\n🔄 Processing fund: ${schemeCode}`);

      // Check if fund already exists
      const existingFund = await Fund.findOne({ schemeCode });
      if (existingFund) {
        console.log(`⚠️  Fund ${schemeCode} already exists, skipping fund creation`);
      } else {
        // Fetch fund data with history from external API
        const fundResponse = await ExternalNavApi.getRecentHistory(schemeCode, 30);

        if (!fundResponse.success) {
          throw new Error(`Failed to fetch fund data: ${fundResponse.error}`);
        }

        const fundData = fundResponse.data;

        // Create Fund document
        const fund = new Fund({
          schemeCode: fundData.schemeCode,
          schemeName: fundData.schemeName,
          isinGrowth: fundData.isinGrowth,
          isinDivReinvestment: fundData.isinDivReinvestment,
          fundHouse: fundData.fundHouse,
          schemeType: fundData.schemeType,
          schemeCategory: fundData.schemeCategory
        });

        await fund.save();
        console.log(`✅ Created fund: ${fundData.schemeName}`);
      }

      // Always try to update/create NAV history (even for existing funds)
      const historyResponse = await ExternalNavApi.getRecentHistory(schemeCode, 30);
      
      if (!historyResponse.success) {
        throw new Error(`Failed to fetch NAV history: ${historyResponse.error}`);
      }

      const fundData = historyResponse.data;

      // Seed FundHistory (last 30 days)
      if (fundData.navHistory && fundData.navHistory.length > 0) {
        const historyData = fundData.navHistory.map(item => ({
          schemeCode: fundData.schemeCode,
          nav: item.nav,
          date: item.date
        }));

        // Use bulk upsert to handle duplicates
        await FundHistory.bulkUpsert(historyData);
        console.log(`✅ Seeded ${historyData.length} history records`);

        // Update LatestNav with most recent data
        const latestNavData = fundData.navHistory[0]; // First item is most recent
        await LatestNav.updateNav(
          fundData.schemeCode,
          latestNavData.nav,
          latestNavData.date
        );
        console.log(`✅ Updated latest NAV: ${latestNavData.nav} (${latestNavData.date})`);
      }

      this.successCount++;
      console.log(`✅ Successfully processed fund ${schemeCode}`);

    } catch (error) {
      this.errorCount++;
      const errorMessage = `Failed to seed fund ${schemeCode}: ${error.message}`;
      this.errors.push(errorMessage);
      console.error(`❌ ${errorMessage}`);
    }
  }

  // Seed active funds (following full-project logic)
  async seedAllFunds() {
    console.log('🚀 Starting fund seeding process...');

    const startTime = Date.now();

    // Step 1: Get active funds from API (scheme codes 150507-153826, limit 50)
    console.log('📡 Fetching active funds from external API...');
    const activeFundsResponse = await ExternalNavApi.getActiveFunds(50);
    
    if (!activeFundsResponse.success) {
      throw new Error(`Failed to fetch active funds: ${activeFundsResponse.error}`);
    }
    
    const selectedFunds = activeFundsResponse.data;
    console.log(`📊 Found ${activeFundsResponse.totalActive} active funds, selected ${activeFundsResponse.selected} for seeding`);

    // Process funds in batches to avoid overwhelming the external API
    const batchSize = 3;
    for (let i = 0; i < selectedFunds.length; i += batchSize) {
      const batch = selectedFunds.slice(i, i + batchSize);
      console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(selectedFunds.length / batchSize)}`);

      // Process batch sequentially to be respectful to the API
      for (const fundData of batch) {
        await this.seedSingleFund(fundData.schemeCode);
        
        // Small delay between funds
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Longer delay between batches
      if (i + batchSize < selectedFunds.length) {
        console.log('⏳ Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📈 SEEDING SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Successfully processed: ${this.successCount} funds`);
    console.log(`❌ Failed: ${this.errorCount} funds`);
    console.log(`⏱️  Total time: ${duration} seconds`);

    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach(error => console.log(`   • ${error}`));
    }

    // Database statistics
    const fundCount = await Fund.countDocuments();
    const historyCount = await FundHistory.countDocuments();
    const latestNavCount = await LatestNav.countDocuments();

    console.log('\n📊 DATABASE STATISTICS:');
    console.log(`   • Funds: ${fundCount}`);
    console.log(`   • History records: ${historyCount}`);
    console.log(`   • Latest NAV records: ${latestNavCount}`);
    console.log('='.repeat(50));
  }

  // Reseed specific funds (useful for updates)
  async reseedFunds(schemeCodes) {
    console.log(`🔄 Re-seeding specific funds: ${schemeCodes.join(', ')}`);
    
    for (const schemeCode of schemeCodes) {
      await this.seedSingleFund(schemeCode);
    }
  }

  // Clean up old data (optional maintenance)
  async cleanupOldData(daysToKeep = 365) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      // Convert to DD-MM-YYYY format for comparison
      const cutoffDateStr = cutoffDate.toLocaleDateString('en-GB');
      
      console.log(`🧹 Cleaning up history data older than ${cutoffDateStr}`);
      
      // Note: This is a simple cleanup. For production, you'd want more sophisticated date comparison
      // since we're storing dates as strings in DD-MM-YYYY format
      
      console.log('⚠️  Cleanup not implemented for string date format. Consider implementing proper date comparison.');
      
    } catch (error) {
      console.error('❌ Cleanup error:', error);
    }
  }
}

// Main execution function
async function runSeeder() {
  const seeder = new FundSeeder();

  try {
    await seeder.connect();
    await seeder.seedAllFunds();
  } catch (error) {
    console.error('❌ Seeding process failed:', error);
    process.exit(1);
  } finally {
    await seeder.disconnect();
  }
}

// Export for programmatic use
export { FundSeeder };

// Run seeder if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSeeder()
    .then(() => {
      console.log('🎉 Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}
