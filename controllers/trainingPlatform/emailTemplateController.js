import asyncHandler from "../../middlewares/asyncHandler.js"
import EmailTemplate from "../../models/trainingPlatform/emailTemplateModel.js"

// Create a new email template
export const createEmailTemplate = asyncHandler(async (req, res) => {
    try {
        const {title, htmlContent, phishingMarkers, images} = req.body;
        if (!title || !htmlContent){
            return res.status(400).json({success: false, message: "Title and HTML Content are required."});
        }
        const emailTemplate = new EmailTemplate({
            title,
            htmlContent,
            phishingMarkers: phishingMarkers || [],
            images: images || []
        });
        // save to mongo
        const  savedTemplate = await emailTemplate.save();
        res.status(201).json({success: ture, template: savedTemplate});
    } catch (error){
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get all email templates
export const getAllEmailTemplates = async (req, res) => {
    try {
      const templates = await EmailTemplate.find();
      res.status(200).json({ success: true, templates });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  
  // Get a single email template by ID
  export const getEmailTemplateById = async (req, res) => {
    try {
      const { id } = req.params;
  
      const template = await EmailTemplate.findById(id);
      if (!template) {
        return res.status(404).json({ success: false, message: "Template not found." });
      }
  
      res.status(200).json({ success: true, template });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  
  // Delete an email template by ID
  export const deleteEmailTemplate = async (req, res) => {
    try {
      const { id } = req.params;
  
      const deletedTemplate = await EmailTemplate.findByIdAndDelete(id);
      if (!deletedTemplate) {
        return res.status(404).json({ success: false, message: "Template not found." });
      }
  
      res.status(200).json({ success: true, message: "Template deleted successfully." });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
