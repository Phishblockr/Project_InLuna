import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const mongoOptions = {
    autoIndex: true,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 30000
};

// Cache connections
const connections = {};

const connect = async (url) => {
    if (connections[url]) {
        console.log(`Reusing DB connection: ${url}`);
        return connections[url];
    }

    try {
        console.log(`Connecting to MongoDB at: ${url}`);
        const connection = await mongoose.createConnection(url, mongoOptions).asPromise();
        connections[url] = connection;
        console.log(`Connected to MongoDB: ${url}`);
        return connection;
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        throw error;
    }
};

export { connect };
