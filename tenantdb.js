import { connect } from "./db-connenction.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import userSchema from "./models/userModel.js"; // Import schema, not model

dotenv.config();
const url = process.env.MONGO_URI;

const connections = {}; // Cache tenant connections

const getTenantDB = async (tenantId) => {
    const dbName = `tenant-${tenantId}`;

    if (connections[dbName]) {
        console.log(`Using cached DB for ${dbName}`);
        return connections[dbName];
    }

    try {
        console.log(`Connecting to tenant DB: ${dbName}`);
        const tenantDb = await connect(`${url}/${dbName}`);
        connections[dbName] = tenantDb;
        return tenantDb;
    } catch (error) {
        console.error(`Error connecting to tenant DB: ${dbName}`, error);
        throw error;
    }
};

const getUserModel = async (tenantId) => {
    const tenantDb = await getTenantDB(tenantId);

    // ✅ Ensure the model is only registered once per tenant DB
    return tenantDb.models.User || tenantDb.model("User", userSchema);
};

export { getUserModel, getTenantDB };
