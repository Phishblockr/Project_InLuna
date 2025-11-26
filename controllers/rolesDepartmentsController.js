import mongoose from "mongoose";
import getSelectOptionModel from "../models/selectOptionModel.js";

// Helper to fetch options for select inputs from admin DB
async function fetchOptions(kind) {
  // Use admin DB for central select options
  const adminConn = mongoose.connection.useDb("admindb", { useCache: true });
  const SelectOption = getSelectOptionModel(adminConn);

  const docs = await SelectOption.find({ kind }).sort({ name: 1 }).lean();
  // Return objects suitable for selects: { value, label }
  return docs.map((d) => ({ value: d.value || d.name, label: d.name }));
}

export const getRoles = async (req, res) => {
  try {
    const roles = await fetchOptions("role");
    return res.status(200).json({ success: true, data: roles });
  } catch (err) {
    console.error("getRoles error:", err?.message || err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getDepartments = async (req, res) => {
  try {
    const deps = await fetchOptions("department");
    return res.status(200).json({ success: true, data: deps });
  } catch (err) {
    console.error("getDepartments error:", err?.message || err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export default { getRoles, getDepartments };
