import User from '../models/user.js';
import { connectDB, disconnectDB } from '../config/db.js';
import envConfig from '../config/env.js';

class AdminSeeder {
  static async seedAdmin() {
    try {
      
      // Check if admin already exists
      const existingAdmin = await User.findOne({ role: 'admin' });
      if (existingAdmin) {
        console.log('Admin user already exists:', existingAdmin.email);
        return existingAdmin;
      }

      // Get admin credentials from environment variables
      const adminData = {
        name: envConfig.ADMIN_NAME,
        email: envConfig.ADMIN_EMAIL,
        password: envConfig.ADMIN_PASSWORD,
        role: 'admin'
      };

      // Create admin user (password will be hashed by User model pre-save hook)
      const admin = new User({
        name: adminData.name,
        email: adminData.email,
        passwordHash: adminData.password, // This will be hashed by the model
        role: adminData.role
      });

      await admin.save();
      
      console.log('Admin user seeded successfully');
      console.log('Email:', adminData.email);
      console.log('Password:', adminData.password);
      console.log('Role:', adminData.role);
      
      return admin;
      
    } catch (error) {
      console.error('Admin seeder error:', error);
      throw error;
    }
  }

  static async run() {
    try {
      console.log('Starting admin seeder...');
      await connectDB();
      await this.seedAdmin();
      console.log('Admin seeder completed successfully');
    } catch (error) {
      console.error('Admin seeder failed:', error);
      process.exit(1);
    } finally {
      await disconnectDB();
    }
  }
}

// Run seeder if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  AdminSeeder.run();
}

export default AdminSeeder;
