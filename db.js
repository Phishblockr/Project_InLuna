import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const db = () => {
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true, 
    useUnifiedTopology: true
  })
  .then(() => {
    console.log(process.env.MONGO_URI);
    console.log('MongoDB Connected');
  })
  .catch(err => {
    console.error('Database connection error:', err);
  });
};

export default db;
