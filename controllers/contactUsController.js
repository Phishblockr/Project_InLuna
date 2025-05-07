import { getContactUsModel } from "../models/contactUsModel.js";

export const addContactUs = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    const contactUsModel = await getContactUsModel();

    const newContactUs = new contactUsModel({
      name,
      email,
      message,
    });
    await newContactUs.save();
    res.status(201).send(newContactUs);
  } catch (error) {
    res.status(400).send(error.message);
  }
};
