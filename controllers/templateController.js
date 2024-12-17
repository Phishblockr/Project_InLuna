import Template from "../models/templateModel.js";

// Add a new HTML template
export const addTemplate = async (req, res) => {
  const { name, body, category } = req.body;
  const orgId = req.user.orgId;

  try {
    const newTemplate = new Template({
      name,
      body,
      category,
      orgId,
    });

    const savedTemplate = await newTemplate.save();

    res.status(201).json({ success: true, message: "Template created successfully", data: savedTemplate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all templates for the organization
export const getAllTemplates = async (req, res) => {
  const orgId = req.user.orgId;

  try {
    const templates = await Template.find({ orgId });
    res.status(200).json({ success: true, templates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
