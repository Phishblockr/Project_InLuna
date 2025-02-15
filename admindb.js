import { connect } from "./db-connenction.js";
import dotenv from "dotenv";
import organizationSchema from "./models/organisationModel.js"; // ✅ Import schema, not model

dotenv.config();
const url = `${process.env.MONGO_URI}/admindb`;

let db;

const getDb = async () => {
    if (!db) {
        console.log("Connecting to Admin DB...");
        db = await connect(url);
    }
    return db;
};

const getTenantModel = async () => {
    const adminDb = await getDb();

    // ✅ Ensure the model is only registered once per connection
    return adminDb.models.Organization || adminDb.model("Organization", organizationSchema);
};

export { getTenantModel };
