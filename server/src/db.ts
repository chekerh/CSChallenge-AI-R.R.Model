import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

export async function connect() {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/utopiahire';
  await mongoose.connect(uri);
  console.log('MongoDB connected');
}

export default connect;
