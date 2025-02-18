import { getEmailTemplateModel } from "../../admindb.js";
import asyncHandler from "../../middlewares/asyncHandler.js"
import EmailTemplate from "../../models/trainingPlatform/emailTemplateModel.js"

// Create a new email template
export const createEmailTemplate = asyncHandler(async (req, res) => {
    const { title, htmlContent, group, isPhishing } = req.body;

    if (!title || !htmlContent) {
        return res.status(400).json({ 
            success: false, 
            message: "Title and HTML Content are required." 
        });
    }

    // Retrieve the EmailTemplate model from the adminDB connection
    const EmailTemplate = await getEmailTemplateModel();

    const emailTemplate = new EmailTemplate({
        title,
        htmlContent,
        group,
        isPhishing
    });

    // Save the new email template to MongoDB
    const savedTemplate = await emailTemplate.save();
    res.status(201).json({ success: true, template: savedTemplate });
});

// Get all email templates
export const getAllEmailTemplates = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const group = req.query.group || "all";

    // Build search filter for the title if provided
    const searchFilter = search ? {
        $or: [
            { title: { $regex: search, $options: 'i' } },
        ]
    } : {};

    // Build group filter if a specific group is provided
    const groupFilter = group === "all" ? {} : {
        group: { $regex: `^${group}$`, $options: "i" }
    };

    // Combine filters
    const queryFilter = { ...searchFilter, ...groupFilter };

    // Retrieve the EmailTemplate model from the adminDB connection
    const EmailTemplate = await getEmailTemplateModel();

    // Query with pagination
    const templates = await EmailTemplate.find(queryFilter)
        .skip(skip)
        .limit(limit);

    // Count the total number of matching documents for pagination
    const totalTemplates = await EmailTemplate.countDocuments(queryFilter);

    res.status(200).json({
        success: true,
        templates,
        currentPage: page,
        totalPages: Math.ceil(totalTemplates / limit),
        totalTemplates,
    });
});

// Get a single email template by ID
export const getEmailTemplateById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Retrieve the EmailTemplate model from the adminDB connection
    const EmailTemplate = await getEmailTemplateModel();

    const template = await EmailTemplate.findById(id);
    if (!template) {
        return res.status(404).json({ success: false, message: "Template not found." });
    }

    res.status(200).json({ success: true, template });
});

// Delete an email template by ID
export const deleteEmailTemplate = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Retrieve the EmailTemplate model from the adminDB connection
    const EmailTemplate = await getEmailTemplateModel();

    const deletedTemplate = await EmailTemplate.findByIdAndDelete(id);
    if (!deletedTemplate) {
        return res.status(404).json({ success: false, message: "Template not found." });
    }

    res.status(200).json({ success: true, message: "Template deleted successfully." });
});

// Edit an email template by ID
export const editEmailTemplate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, htmlContent, group, isPhishing } = req.body;

    // Retrieve the EmailTemplate model from the adminDB connection
    const EmailTemplate = await getEmailTemplateModel();

    const updatedTemplate = await EmailTemplate.findByIdAndUpdate(
        id,
        { title, htmlContent, group, isPhishing },
        { new: true, runValidators: true }
    );

    if (!updatedTemplate) {
        return res.status(404).json({ message: "Template not found" });
    }

    res.status(200).json(updatedTemplate);
});


// fetch group list
export const getTemplatesGroups = asyncHandler(async (req, res) => {
    // Retrieve the EmailTemplate model from the adminDB connection
    const EmailTemplate = await getEmailTemplateModel();
    
    // Fetch only the "group" field from all templates
    const groupsDocs = await EmailTemplate.find({}, "group");

    // Extract unique group values using a Set
    const uniqueGroups = [...new Set(groupsDocs.map((doc) => doc.group))];
    
    res.status(200).json(uniqueGroups);
});