import express from 'express';
import { authenticateAdmin } from '../../middlewares/auth-middleware.js';
import MasterSeeder from '../../../scripts/run-all-seeders.js';

const router = express.Router();

// Apply admin authentication to all routes
router.use(authenticateAdmin);

// POST /api/admin/seed - Run all seeders
router.post('/seed', async (req, res) => {
  try {
    console.log('Admin seeding requested by:', req.user.email);
    
    // Run seeders
    await MasterSeeder.runAllSeeders();
    
    res.status(200).json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        seededBy: req.user.email,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      }
    });
    
  } catch (error) {
    console.error('Seeding error:', error);
    res.status(500).json({
      success: false,
      message: 'Seeding failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/admin/seed/funds - Seed only funds
router.post('/seed/funds', async (req, res) => {
  try {
    console.log('Fund seeding requested by:', req.user.email);
    
    // Import and run fund seeder
    const { FundSeeder } = await import('../../seeders/fund-seeder.js');
    const fundSeeder = new FundSeeder();
    await fundSeeder.seedAllFunds();
    
    res.status(200).json({
      success: true,
      message: 'Funds seeded successfully',
      data: {
        seededBy: req.user.email,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Fund seeding error:', error);
    res.status(500).json({
      success: false,
      message: 'Fund seeding failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

export default router;
