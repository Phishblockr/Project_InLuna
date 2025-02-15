import { connect } from "./db-connenction.js";
import dotenv from "dotenv";
import SuperAdmin from "./models/superAdminModel.js"; // Import Super Admin Model

dotenv.config();
const url = `${process.env.MONGO_URI}/admindb?retryWrites=true&w=majority`;

let db;

const getAdminDb = async () => {
    if (!db) {
        console.log("Connecting to Admin DB...");
        db = await connect(url);
    }
    return db;
};

const getSuperAdminModel = async () => {
    const adminDb = await getAdminDb();
    return adminDb.models.SuperAdmin || adminDb.model("SuperAdmin", SuperAdmin.schema);
};

export { getSuperAdminModel };
