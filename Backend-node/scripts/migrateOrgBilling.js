#!/usr/bin/env node
/**
 * One-time migration to backfill new billing + seat metering fields on existing organizations.
 * Run: node scripts/migrateOrgBilling.js
 * (Ensure MONGO_URI and any needed ENV vars are loaded.)
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import { getOrgModel } from "../models/organisationModel.js";
import { getDb } from "../admindb.js";

dotenv.config();

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI not set");
    process.exit(1);
  }
  await mongoose.connect(uri).catch((e) => {
    console.error("Mongo connect failed", e);
    process.exit(1);
  });
  console.log("Connected");
  const Orgs = await getOrgModel();

  const now = new Date();
  const cursor = Orgs.find({}).cursor();
  let count = 0;
  for await (const org of cursor) {
    let modified = false;

    // Backfill usersCount if suspicious or missing
    if (typeof org.usersCount !== "number") {
      org.usersCount = org.totalUsers || 0; // fallback
      modified = true;
    }

    // Initialize billingStatus
    if (!org.billingStatus) {
      org.billingStatus = "inactive";
      modified = true;
    }

    // Initialize currency
    if (!org.currency) {
      org.currency = "INR";
      modified = true;
    }

    // Ensure billingCycleAnchor
    if (!org.billingCycleAnchor) {
      org.billingCycleAnchor = org.createdAt || now;
      modified = true;
    }

    // Initialize seatMeter
    if (!org.seatMeter || !org.seatMeter.cycleStartAt) {
      org.seatMeter = {
        cycleStartAt: org.billingCycleAnchor,
        lastMeasureAt: now,
        currentSeats: org.usersCount || 0,
        seatMillis: 0,
      };
      modified = true;
    }

    // Initialize seatSegments array
    if (!Array.isArray(org.seatSegments)) {
      org.seatSegments = [];
      modified = true;
    }

    // nextPerMemberPriceInPaise null if undefined
    if (org.nextPerMemberPriceInPaise === undefined) {
      org.nextPerMemberPriceInPaise = null;
      modified = true;
    }

    // perMemberPriceInPaise MUST be set for billing usage endpoints; skip if still unset
    if (!org.perMemberPriceInPaise) {
      console.warn(
        `Org ${org.orgId} missing perMemberPriceInPaise - set manually before billing.`
      );
    }

    if (modified) {
      try {
        await org.save();
        count++;
        console.log(`Updated org ${org.orgId}`);
      } catch (e) {
        console.error(`Failed saving org ${org.orgId}:`, e.message);
      }
    }
  }

  console.log(`Migration complete. Orgs modified: ${count}`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
