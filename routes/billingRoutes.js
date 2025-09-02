import express from "express";
import dashboardAdminMiddleware from "../middlewares/dashboardAdminMiddleware.js";
import {
  previewCycle,
  closeCycleAndCompute,
  updatePerMemberPrice,
} from "../services/billing.js";

const router = express.Router();

// GET /api/billing/summary?orgId=1234
// Lightweight summary for dashboard card.
router.get("/summary", dashboardAdminMiddleware, async (req, res) => {
  try {
    const { orgId } = req.query || {};
    if (!orgId) return res.status(400).json({ error: "orgId required" });
    const { getOrgModel } = await import("../models/organisationModel.js");
    const Orgs = await getOrgModel();
    const org = await Orgs.findOne({ orgId });
    if (!org) return res.status(404).json({ error: "Org not found" });

    // Coerce legacy string price if present
    if (
      org.perMemberPriceInPaise &&
      typeof org.perMemberPriceInPaise === "string"
    ) {
      const parsed = Math.round(parseFloat(org.perMemberPriceInPaise));
      if (!Number.isNaN(parsed)) {
        org.perMemberPriceInPaise = parsed; // in paise already
        await org.save();
      }
    }

    const pricePaise = org.perMemberPriceInPaise || null;
    const currentSeats = org.seatMeter?.currentSeats ?? org.usersCount ?? 0;
    let projectedBaseMonthlyPaise = null;
    if (pricePaise && currentSeats >= 0) {
      projectedBaseMonthlyPaise = pricePaise * currentSeats;
    }

    res.json({
      orgId: org.orgId,
      name: org.name,
      billingStatus: org.billingStatus,
      subscriptionId: org.subscriptionId || null,
      perMemberPriceInPaise: pricePaise,
      perMemberPriceInRupees: pricePaise ? (pricePaise / 100).toFixed(2) : null,
      currentSeats,
      usersCount: org.usersCount,
      seatMeter: org.seatMeter || null,
      projectedBaseMonthlyPaise,
      projectedBaseMonthlyRupees: projectedBaseMonthlyPaise
        ? (projectedBaseMonthlyPaise / 100).toFixed(2)
        : null,
      currency: org.currency || "INR",
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// POST /api/billing/preview
router.post("/preview", dashboardAdminMiddleware, async (req, res) => {
  try {
    const { orgId, asOf } = req.body || {};
    if (!orgId) return res.status(400).json({ error: "orgId required" });
    const result = await previewCycle(
      orgId,
      asOf ? new Date(asOf) : new Date()
    );
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// POST /api/billing/close
router.post("/close", dashboardAdminMiddleware, async (req, res) => {
  try {
    const { orgId, asOf } = req.body || {};
    if (!orgId) return res.status(400).json({ error: "orgId required" });
    const closed = await closeCycleAndCompute(
      orgId,
      asOf ? new Date(asOf) : new Date()
    );
    const invoiceDraft = {
      cycleStart: closed.cycleStart,
      cycleEnd: closed.cycleEnd,
      amountPaise: closed.amountPaise,
      lineItems: [
        {
          desc: `Seats (${closed.seatDays.toFixed(3)} seat-days)`,
          paise: closed.amountPaise,
        },
      ],
    };
    res.json({ invoiceDraft });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// PATCH /api/billing/price
router.patch("/price", dashboardAdminMiddleware, async (req, res) => {
  try {
    const { orgId, perMemberPriceInPaise, effective = "now" } = req.body || {};
    if (!orgId) return res.status(400).json({ error: "orgId required" });
    if (perMemberPriceInPaise == null)
      return res.status(400).json({ error: "perMemberPriceInPaise required" });
    const numeric = Number(perMemberPriceInPaise);
    if (!Number.isInteger(numeric) || numeric <= 0) {
      return res.status(400).json({
        error: "perMemberPriceInPaise must be a positive integer (paise)",
      });
    }
    const result = await updatePerMemberPrice(orgId, numeric, effective);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
