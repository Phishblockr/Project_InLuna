import mongoose from "mongoose";
import getSelectOptionModel from "../models/selectOptionModel.js";
import toSlug from "../utils/slugify.js";

// Helper to fetch options for select inputs from admin DB
async function fetchOptions(kind) {
    // Use admin DB for central select options
    const adminConn = mongoose.connection.useDb("admindb", { useCache: true });
    const SelectOption = getSelectOptionModel(adminConn);

    const docs = await SelectOption.find({ kind }).sort({ name: 1 }).lean();

    return docs.map((d) => {
        // Use existing slug if present, otherwise generate new slug from name
        const finalSlug = d.value
            ? d.value.toLowerCase()
            : toSlug(d.name).toLowerCase();

        return {
            value: finalSlug, // machine-safe slug
            label: d.name, // original human-readable name
        };
    });
}

export const getRoles = async (req, res) => {
    try {
        const roles = await fetchOptions("role");
        return res.status(200).json({ success: true, data: roles });
    } catch (err) {
        console.error("getRoles error:", err?.message || err);
        return res
            .status(500)
            .json({ success: false, message: "Server error" });
    }
};
export const getDepartments = async (req, res) => {
    try {
        const deps = await fetchOptions("department");
        return res.status(200).json({ success: true, data: deps });
    } catch (err) {
        console.error("getDepartments error:", err?.message || err);
        return res
            .status(500)
            .json({ success: false, message: "Server error" });
    }
};

export default { getRoles, getDepartments };
