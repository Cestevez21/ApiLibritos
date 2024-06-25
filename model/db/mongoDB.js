const mongoose = require('mongoose');
require('dotenv').config();
//mongodb
const mongoString = process.env.DATABASE_URL
const connectDB = async () => {
    try {
      await mongoose.connect(mongoString, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('MongoDB connected');
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  };
  
  module.exports = connectDB;