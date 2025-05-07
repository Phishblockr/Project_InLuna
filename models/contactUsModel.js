import mongoose from "mongoose";
import { getDb } from "../admindb.js";
const { Schema } = mongoose;

const ContactUsSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name cannot be empty"],
    },
    email: {
      type: String,
      required: [true, "Email cannot be empty"],
    },
    message: {
      type: String,
      required: [true, "Message ID cannot be empty"],
    },
  },
  { timestamps: true },
);

export default ContactUsSchema;

export const getContactUsModel = async () => {
  const adminDb = await getDb();
  return (
    adminDb.models.ContactUs || adminDb.model("ContactUs", ContactUsSchema)
  );
};
