import mongoose from "mongoose";

const selectOptionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    kind: { type: String, required: true, enum: ["role", "department"] },
    value: { type: String },
  },
  { timestamps: true }
);

// Ensure a single index on kind+name for idempotent upserts
selectOptionSchema.index({ kind: 1, name: 1 }, { unique: true });

export function getSelectOptionModel(conn) {
  // conn is a mongoose Connection (or mongoose)
  const connection = conn && conn.model ? conn : conn;
  try {
    // If model already compiled on this connection, return it
    return connection.model("SelectOption");
  } catch (err) {
    return connection.model("SelectOption", selectOptionSchema);
  }
}

export default getSelectOptionModel;
