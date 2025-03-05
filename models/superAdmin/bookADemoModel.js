import mongoose from "mongoose";
import { getDb } from "../../admindb.js";

const appointmentSchema = new mongoose.Schema({
    appointmentDate: { type: Date, required: true },
    timeslot: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
}, { timestamps: true });

export const getBookADemoModel = async () => {
    const adminDb = await getDb();
    return (
        adminDb.models.BookADemo ||
        adminDb.model("BookADemo", appointmentSchema)
    );
};