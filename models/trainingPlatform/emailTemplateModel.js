import mongoose from "mongoose";
import { getDb } from "../../admindb.js";

const emailTemplateSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    htmlContent: {
        type: String,
        required: true,
    },
    group:{
        type:String,
        required:true,
    },
    isPhishing:{
        type:Boolean,
        required:true
    },
},
    { timestamps: true }
);

// const emailTemplate =  mongoose.model("EmailTemplate", emailTemplateSchema);
export default emailTemplateSchema;

export const getEmailTemplateModel = async () => {
    const adminDb = await getDb();
    return adminDb.models.EmailTemplate || adminDb.model("EmailTemplate", emailTemplateSchema);
};