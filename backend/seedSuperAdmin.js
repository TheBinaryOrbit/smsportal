const mongoose = require('mongoose');
const Admin = require('./models/admin.model');
require('dotenv').config();

const seedSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if super admin already exists
    const existingSuperAdmin = await Admin.findOne({ role: 'super-admin' });
    
    if (existingSuperAdmin) {
      console.log('Super admin already exists');
      process.exit(0);
    }

    // Create super admin
    const superAdmin = new Admin({
      username: 'superadmin',
      password: 'admin123',
      role: 'super-admin'
    });

    await superAdmin.save();
    console.log('Super admin created successfully');
    console.log('Username: superadmin');
    console.log('Password: admin123');
    console.log('Please change the password after first login');

  } catch (error) {
    console.error('Error seeding super admin:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedSuperAdmin();
