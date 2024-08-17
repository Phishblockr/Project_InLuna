import mongoose from 'mongoose';

export const getAllLogs = async () => {
  try {
    const logs = await mongoose.connection.db.collection('logs').find().toArray(); // Example to get all logs from the 'logs' collection
    return logs;
  } catch (error) {
    console.log(error.message);
  }
};
