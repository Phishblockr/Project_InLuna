#!/usr/bin/env node
import mongoose from "mongoose";
import dotenv from "dotenv";
import { ROLES, DEPARTMENTS } from "../data/rolesDepartments.js";
import getSelectOptionModel from "../models/selectOptionModel.js";
import toSlug from "../utils/slugify.js";

dotenv.config();

// Simple slugify helper

async function main() {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        console.error("MONGO_URI not set in environment");
        process.exit(1);
    }

    console.log("Connecting to MongoDB...");
    const conn = await mongoose.createConnection(mongoUri, {
        // no dbName here; we switch to admindb explicitly
    });

    // Use / target the admin DB as requested
    const adminConn = conn.useDb("admindb", { useCache: true });

    const SelectOption = getSelectOptionModel(adminConn);

    const bulkOps = [];

    // Seed / update roles with slug values
    for (const role of ROLES) {
        const slug = toSlug(role);
        bulkOps.push({
            updateOne: {
                filter: { kind: "role", name: role },
                update: {
                    $set: {
                        kind: "role",
                        name: role,
                        value: slug, // 👈 store slug, not raw name
                    },
                },
                upsert: true,
            },
        });
    }

    // Seed / update departments with slug values
    for (const dep of DEPARTMENTS) {
        const slug = toSlug(dep);
        bulkOps.push({
            updateOne: {
                filter: { kind: "department", name: dep },
                update: {
                    $set: {
                        kind: "department",
                        name: dep,
                        value: slug, // 👈 store slug, not raw name
                    },
                },
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
        `Running ${bulkOps.length} upsert operations into admindb.SelectOption...`,
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
