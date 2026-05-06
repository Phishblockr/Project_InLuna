import { connect } from "./db-connenction.js";
import dotenv from "dotenv";
import organizationSchema from "./models/organisationModel.js"; // ✅ Import schema, not model
import courseSchema from "./models/trainingPlatform/courseModel.js";
import emailTemplateSchema from "./models/trainingPlatform/emailTemplateModel.js";

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
    return adminDb.models.Organization || adminDb.model("Organization", organizationSchema);
};

const getCourseModel = async () => {
    const adminDb = await getDb();
    return adminDb.models.Course || adminDb.model("Course", courseSchema);
};

const getEmailTemplateModel = async () => {
    const adminDb = await getDb();
    return adminDb.models.EmailTemplate || adminDb.model("EmailTemplate", emailTemplateSchema);
};

export { getTenantModel, getCourseModel, getEmailTemplateModel, getDb};
