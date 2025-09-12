import cron from 'node-cron';
import Portfolio from '../models/Portfolio.js';
import NavService from './nav-service.js';
import config from '../config/env.js';

class CronService {
  static jobs = new Map();

  /**
   * Initialize all cron jobs
   */
  static init() {
    console.log('🕒 Initializing cron jobs...');
    
    // Daily NAV update job - runs at 12:00 AM IST (6:30 PM UTC)
    this.scheduleDailyNavUpdate();
    
    console.log('✅ Cron jobs initialized successfully');
  }

  /**
   * Schedule daily NAV update job
   * Runs every day at 12:00 AM IST (after market hours)
   */
  static scheduleDailyNavUpdate() {
    const cronExpression = config.cronSchedule || '0 0 * * *'; // Default: 12:00 AM daily
    
    const job = cron.schedule(cronExpression, async () => {
      console.log('🔄 Starting daily NAV update job at:', new Date().toISOString());
      await this.updateAllPortfolioNavs();
    }, {
      scheduled: true,
      timezone: 'Asia/Kolkata' // IST timezone
    });

    this.jobs.set('dailyNavUpdate', job);
    console.log(`📅 Daily NAV update job scheduled with cron: ${cronExpression}`);
  }

  /**
   * Update NAVs for all funds in user portfolios
   */
  static async updateAllPortfolioNavs() {
    const startTime = Date.now();
    let totalUpdated = 0;
    let totalFailed = 0;

    try {
      console.log('📊 Fetching all unique scheme codes from portfolios...');
      
      // Get all unique scheme codes from user portfolios
      const portfolioSchemes = await Portfolio.distinct('holdings.schemeCode');
      
      if (portfolioSchemes.length === 0) {
        console.log('ℹ️ No portfolio holdings found. Skipping NAV update.');
        return;
      }

      console.log(`📈 Found ${portfolioSchemes.length} unique funds in portfolios`);

      // Update NAVs in batches to avoid API rate limits
      const batchSize = 10;
      const delayBetweenBatches = 2000; // 2 seconds between batches

      for (let i = 0; i < portfolioSchemes.length; i += batchSize) {
        const batch = portfolioSchemes.slice(i, i + batchSize);
        console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(portfolioSchemes.length / batchSize)}`);

        const batchPromises = batch.map(async (schemeCode) => {
          try {
            const navData = await NavService.fetchLatestNav(schemeCode);
            
            if (navData && navData.nav) {
              // Update latest NAV
              await NavService.saveLatestNav(schemeCode, navData.nav, navData.date);
              
              // Add to NAV history
              await NavService.saveNavHistory(schemeCode, navData.nav, navData.date);
              
              totalUpdated++;
              console.log(`✅ Updated NAV for scheme ${schemeCode}: ₹${navData.nav}`);
            } else {
              totalFailed++;
              console.log(`❌ Failed to fetch NAV for scheme ${schemeCode}`);
            }
          } catch (error) {
            totalFailed++;
            console.error(`❌ Error updating NAV for scheme ${schemeCode}:`, error.message);
          }
        });

        // Wait for current batch to complete
        await Promise.allSettled(batchPromises);

        // Delay between batches (except for the last batch)
        if (i + batchSize < portfolioSchemes.length) {
          console.log(`⏳ Waiting ${delayBetweenBatches}ms before next batch...`);
          await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
      }

      const duration = Date.now() - startTime;
      const summary = {
        totalFunds: portfolioSchemes.length,
        updated: totalUpdated,
        failed: totalFailed,
        duration: `${(duration / 1000).toFixed(2)}s`
      };

      console.log('🎉 Daily NAV update completed:', summary);

      // Send success notification if configured
      await this.sendNotification('NAV Update Completed', summary, 'success');

    } catch (error) {
      console.error('💥 Daily NAV update failed:', error);
      
      const errorSummary = {
        error: error.message,
        totalUpdated,
        totalFailed,
        duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`
      };

      // Send error notification
      await this.sendNotification('NAV Update Failed', errorSummary, 'error');
    }
  }

  /**
   * Manual NAV update for specific scheme codes
   */
  static async updateSpecificNavs(schemeCodes) {
    console.log(`🔄 Starting manual NAV update for ${schemeCodes.length} schemes...`);
    
    const results = await NavService.bulkUpdateNavs(schemeCodes, {
      batchSize: 5,
      delayBetweenRequests: 1000,
      delayBetweenBatches: 2000
    });

    console.log('📊 Manual NAV update results:', {
      successful: results.successful.length,
      failed: results.failed.length
    });

    return results;
  }

  /**
   * Send notification (placeholder for email/slack integration)
   */
  static async sendNotification(title, data, type = 'info') {
    // This is a placeholder for notification system
    // In production, you would integrate with email service, Slack, etc.
    
    if (config.nodeEnv === 'development') {
      console.log(`📧 ${type.toUpperCase()} Notification: ${title}`, data);
    }

    // TODO: Implement actual notification system
    // - Email notifications using nodemailer
    // - Slack notifications using webhook
    // - SMS notifications using Twilio
    // - Push notifications
  }

  /**
   * Get cron job status
   */
  static getJobStatus() {
    const jobs = {};
    
    this.jobs.forEach((job, name) => {
      jobs[name] = {
        running: job.running,
        scheduled: job.scheduled
      };
    });

    return jobs;
  }

  /**
   * Start a specific cron job
   */
  static startJob(jobName) {
    const job = this.jobs.get(jobName);
    if (job) {
      job.start();
      console.log(`✅ Started cron job: ${jobName}`);
      return true;
    }
    console.log(`❌ Cron job not found: ${jobName}`);
    return false;
  }

  /**
   * Stop a specific cron job
   */
  static stopJob(jobName) {
    const job = this.jobs.get(jobName);
    if (job) {
      job.stop();
      console.log(`🛑 Stopped cron job: ${jobName}`);
      return true;
    }
    console.log(`❌ Cron job not found: ${jobName}`);
    return false;
  }

  /**
   * Destroy all cron jobs (for graceful shutdown)
   */
  static destroyAll() {
    console.log('🛑 Destroying all cron jobs...');
    
    this.jobs.forEach((job, name) => {
      job.destroy();
      console.log(`🗑️ Destroyed cron job: ${name}`);
    });

    this.jobs.clear();
    console.log('✅ All cron jobs destroyed');
  }

  /**
   * Run daily NAV update manually (for testing)
   */
  static async runDailyNavUpdateNow() {
    console.log('🔄 Running daily NAV update manually...');
    await this.updateAllPortfolioNavs();
  }
}

export default CronService;
