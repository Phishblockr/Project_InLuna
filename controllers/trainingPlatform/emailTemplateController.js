import asyncHandler from "../../middlewares/asyncHandler.js"
import EmailTemplate from "../../models/trainingPlatform/emailTemplateModel.js"

// Create a new email template
export const createEmailTemplate = asyncHandler(async (req, res) => {
  try {
    const { title, htmlContent, group, isPhishing } = req.body
    if (!title || !htmlContent) {
      return res.status(400).json({ success: false, message: "Title and HTML Content are required." });
    }
    const emailTemplate = new EmailTemplate({
      title,
      htmlContent,
      group,
      isPhishing
    });
    // save to mongo
    const savedTemplate = await emailTemplate.save();
    res.status(201).json({ success: true, template: savedTemplate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all email templates
export const getAllEmailTemplates = async (req, res) => {

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;
  const search = req.query.search || "";
  const group = req.query.group || "all";
  
  const searchFilter = search ? {
    $or: [
      { title: { $regex: search, $options: 'i' } },
    ]
  } : {};

  const groupFilter = group === "all" ? {} : {
    group: { $regex: `^${group}$`, $options: "i" }
  };

  try {
    const queryFilter = { ...searchFilter, ...groupFilter };
    const templates = await EmailTemplate.find(queryFilter);
    const totalTemplates = await EmailTemplate.countDocuments(queryFilter)
    res.status(200).json({
      success: true,
      templates,
      currentPage: page,
      totalPages: Math.ceil(totalTemplates / limit),
      totalTemplates,
    });
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

// Edit an email template by ID
export const editEmailTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, htmlContent, group, isPhishing } = req.body;

  try {
    const updatedTemplate = await EmailTemplate.findByIdAndUpdate(
      id,
      { title, htmlContent, group, isPhishing },
      { new: true, runValidators: true }
    );
    if (!updatedTemplate) {
      return res.status(404).json({ message: "Template not found" });
    }
    res.status(200).json(updatedTemplate);
  } catch (error) {
    console.error("Error updating template: ", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// fetch group list
export const getTemplatesGroups = asyncHandler(async (req, res) => {
  try {
    const groups = await EmailTemplate.find({}, "group");

    const uniqueGroups = [...new Set(groups.map((doc) => doc.group))];
    res.json(uniqueGroups);
  } catch (error) {
    console.error("Error fetching groups: ", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
})

