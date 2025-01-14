import mongoose from "mongoose";

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

const emailTemplate =  mongoose.model("EmailTemplate", emailTemplateSchema);
export default emailTemplate;