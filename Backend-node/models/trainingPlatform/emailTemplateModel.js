import mongoose from "mongoose";
import { getDb } from "../../admindb.js";

const emailTemplateSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    subject: {
        type: String,
        require: true
    },
    isSubjectPhishing: {
        type: Boolean,
        default: false
    },
    senderAddress: {
        type: String,
        require: true
    },
    isSenderAddressPhishing: {
        type: Boolean,
        default: false
    },
    mailedBy: {
        type: String,
        require: true
    },
    isMailedByPhishing: {
        type: Boolean,
        default: false
    },
    signedBy: {
        type: String,
        required: true,
    },
    isSignedByPhishing: {
        type: Boolean,
        default: false
    },
    securityProtocol: {
        type: String,
        required: true,
    },
    isSecurityProtocolPhishing: {
        type: Boolean,
        default: false
    },
    htmlContent: {
        type: String,
        required: true,
    },
    group: {
        type: String,
        required: true,
    },
    isPhishing: {
        type: Boolean,
        required: true
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