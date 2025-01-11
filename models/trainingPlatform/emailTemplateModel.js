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
    phishingMarkers: [
        {
            elementId: { type: String, required: true },
            elementType: { type: String, required: true },
            description: { type: String },
        },
    ],
    images: [
        {
            url: {
                type: String,
                required: true,
            },
            altText: {
                type: String,
                default: "",
            },
        },
    ]
},
    { timestamps: true }
);

const emailTemplate =  mongoose.model("EmailTemplate", emailTemplateSchema);
export default emailTemplate;