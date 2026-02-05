require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');

    await User.deleteMany();

    await User.create([
      {
        username: 'admin',
        password: 'admin123',
        role: 'admin'
      },
      {
        username: 'user',
        password: 'user123',
        role: 'user'
      }
    ]);

    console.log('✅ Users seeded');
    process.exit();
  })
  .catch(err => {
    console.error('❌ MongoDB error:', err.message);
    process.exit(1);
  });
