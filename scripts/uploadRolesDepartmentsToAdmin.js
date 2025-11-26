#!/usr/bin/env node
import mongoose from "mongoose";
import dotenv from "dotenv";
import { ROLES, DEPARTMENTS } from "../data/rolesDepartments.js";
import getSelectOptionModel from "../models/selectOptionModel.js";

dotenv.config();

async function main() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGO_URI not set in environment");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  const conn = await mongoose.createConnection(mongoUri, {
    // do not pass dbName here; we'll switch to admin explicitly
    // keep default options
  });

  // Use / target the admin DB as requested
  const adminConn = conn.useDb("admindb", { useCache: true });

  const SelectOption = getSelectOptionModel(adminConn);

  // Prepare bulk ops for idempotent upsert
  const bulkOps = [];

  for (const role of ROLES) {
    bulkOps.push({
      updateOne: {
        filter: { kind: "role", name: role },
        update: { $set: { kind: "role", name: role, value: role } },
        upsert: true,
      },
    });
  }

  for (const dep of DEPARTMENTS) {
    bulkOps.push({
      updateOne: {
        filter: { kind: "department", name: dep },
        update: { $set: { kind: "department", name: dep, value: dep } },
        upsert: true,
      },
    });
  }

  if (bulkOps.length === 0) {
    console.log("No operations to run.");
    await conn.close();
    return;
  }

  console.log(
    `Running ${bulkOps.length} upsert operations into admin.SelectOption...`
  );
  const result = await SelectOption.bulkWrite(bulkOps, { ordered: false });
  console.log("Bulk write result:", result.result || result);

  const counts = {
    roles: await SelectOption.countDocuments({ kind: "role" }),
    departments: await SelectOption.countDocuments({ kind: "department" }),
  };

  console.log("Inserted/updated counts:", counts);

  await conn.close();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
