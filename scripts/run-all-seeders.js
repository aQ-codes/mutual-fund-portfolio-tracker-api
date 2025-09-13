import { connectDB, disconnectDB } from '../src/config/db.js';
import { FundSeeder } from '../src/seeders/fund-seeder.js';
import AdminSeeder from '../src/seeders/admin-seeder.js';

class MasterSeeder {
  static async runAllSeeders() {
    try {
      console.log('Starting master seeder...');
      console.log('==========================================');
      
      // Connect to database
      await connectDB();
      console.log('Database connected');
      
      // Run admin seeder first
      console.log('\nRunning Admin Seeder...');
      await AdminSeeder.seedAdmin();
      
      // Check if we should seed funds (skip in production to avoid build timeouts)
      const shouldSeedFunds = process.env.SEED_FUNDS === 'true' || process.env.NODE_ENV === 'development';
      
      if (shouldSeedFunds) {
        console.log('\nRunning Fund Seeder...');
        const fundSeeder = new FundSeeder();
        await fundSeeder.seedAllFunds();
      } else {
        console.log('\nSkipping Fund Seeder in production (set SEED_FUNDS=true to enable)');
      }
      
      console.log('\n==========================================');
      console.log('All seeders completed successfully!');
      console.log('==========================================');
      
      console.log('\nSeeded Data Summary:');
      console.log('- Admin User: From environment variables');
      console.log('- Funds: Seeded from external API');
      console.log('- NAV Data: Latest and historical NAV data');
      
      console.log('\nReady to test with Postman!');
      console.log('1. Start server: yarn start');
      console.log('2. Login as admin using Postman');
      console.log('3. Test all endpoints');
      
    } catch (error) {
      console.error('Master seeder failed:', error);
      process.exit(1);
    } finally {
      await disconnectDB();
      console.log('Database disconnected');
    }
  }
}

// Run if called directly (not when imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  MasterSeeder.runAllSeeders();
}

export default MasterSeeder;
