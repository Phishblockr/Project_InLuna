import express from "express";
import { getRazorpay, rzpWrap } from "../lib/razorpay.js";
import { getOrgModel } from "../models/organisationModel.js";
import { closeCycleAndCompute } from "../services/billing.js";

const router = express.Router();

// Default number of billing cycles if Razorpay requires a positive total_count.
// Monthly * 120 = 10 years which is effectively "indefinite" for most SaaS lifetimes.
const DEFAULT_SUB_TOTAL_COUNT = parseInt(
  process.env.RZP_SUB_TOTAL_COUNT || "120",
  10
);

// POST /api/rzp/subscribe { orgId }
// Auto-generates a Razorpay plan from perMemberPriceInPaise if planId not yet stored.
router.post("/subscribe", async (req, res, next) => {
  const debug = { stage: "init" };
  try {
    const Orgs = await getOrgModel();
    const { orgId, customerId: suppliedCustomerId } = req.body || {};
    if (!orgId) return res.status(400).json({ error: "orgId required" });
    debug.orgId = orgId;

    debug.stage = "load_org";
    const org = await Orgs.findOne({ orgId });
    if (!org) return res.status(404).json({ error: "Org not found" });

    // Normalize string price if needed
    if (
      org.perMemberPriceInPaise &&
      typeof org.perMemberPriceInPaise === "string"
    ) {
      const parsed = Math.round(parseFloat(org.perMemberPriceInPaise));
      if (!Number.isNaN(parsed)) org.perMemberPriceInPaise = parsed;
    }

    if (!org.perMemberPriceInPaise) {
      return res
        .status(400)
        .json({ error: "perMemberPriceInPaise not configured for org" });
    }

    // 1) Create or reuse customer
    debug.stage = "ensure_customer";
    let customerId = org.razorpayCustomerId || suppliedCustomerId;
    if (!customerId) {
      const client = getRazorpay();
      try {
        const customer = await rzpWrap(
          client.customers.create({
            name: org.name,
            email: org.adminEmailIds?.[0],
            notes: { orgId: org.orgId },
          })
        );
        customerId = customer.id;
        org.razorpayCustomerId = customerId;
        // Early persist so we don't lose the id if later stages fail
        await org.save();
        console.log(
          `[rzp.subscribe] created customer ${customerId} for org ${org.orgId}`
        );
      } catch (ce) {
        if (
          (ce.message || "").toLowerCase().includes("customer already exists")
        ) {
          return res.status(409).json({
            error:
              "Customer already exists at Razorpay. Provide existing customerId in body to attach.",
            stage: debug.stage,
            hint: "Call POST /api/rzp/subscribe with { orgId, customerId: 'cust_xxx' } after copying the customer ID from dashboard.",
          });
        }
        throw ce;
      }
    } else if (!org.razorpayCustomerId) {
      // If caller supplied a known customerId, attach & persist
      org.razorpayCustomerId = customerId;
      await org.save();
      console.log(
        `[rzp.subscribe] attached supplied customer ${customerId} to org ${org.orgId}`
      );
    } else {
      console.log(
        `[rzp.subscribe] reusing existing customer ${customerId} for org ${org.orgId}`
      );
    }

    // 2) Create plan if absent
    debug.stage = "ensure_plan";
    let planId = org.planId;
    if (!planId) {
      const client = getRazorpay();
      const planName = `${org.name || org.orgId} Per-Seat Plan`;
      // Attempt to reuse an existing compatible monthly plan with same amount before creating a new one.
      try {
        const existing = await rzpWrap(client.plans.all({ count: 100 }));
        if (Array.isArray(existing?.items)) {
          const match = existing.items.find(
            (p) =>
              p?.period === "monthly" &&
              p?.interval === 1 &&
              p?.item?.amount === org.perMemberPriceInPaise &&
              p?.item?.currency === (org.currency || "INR")
          );
          if (match) {
            planId = match.id;
            org.planId = planId;
            console.log(
              `[rzp.subscribe] reusing existing plan ${planId} (amount ${org.perMemberPriceInPaise})`
            );
          }
        }
      } catch (listErr) {
        console.warn(
          "[rzp.subscribe] plan list failed (will attempt create)",
          listErr.message
        );
      }
      if (!planId) {
        try {
          const plan = await rzpWrap(
            client.plans.create({
              period: "monthly",
              interval: 1,
              item: {
                name: planName,
                amount: org.perMemberPriceInPaise,
                currency: org.currency || "INR",
                description: `Auto-generated per-member plan for org ${org.orgId}`,
              },
            })
          );
          planId = plan.id;
          org.planId = planId;
        } catch (planErr) {
          console.error(
            "[rzp.subscribe] plan creation failed",
            { orgId: org.orgId, price: org.perMemberPriceInPaise },
            planErr.message,
            planErr.meta || {}
          );
          if (
            planErr.code === 404 ||
            /requested url was not found/i.test(planErr.message || "")
          ) {
            return res.status(502).json({
              error:
                "Razorpay plan creation 404. Ensure Subscriptions feature is enabled on your Razorpay account or create a plan manually and set org.planId.",
              stage: debug.stage,
              next: "Enable Subscriptions in Razorpay dashboard OR manually create a plan (monthly, amount in paise) then PATCH org with planId and retry subscribe.",
            });
          }
          throw planErr;
        }
      }
    }

    // 3) Create subscription
    debug.stage = "create_subscription";
    let qty = org.seatMeter?.currentSeats ?? org.usersCount ?? 0;
    if (qty <= 0) {
      return res.status(400).json({
        error:
          "Cannot start subscription with zero seats. Add at least one active user first.",
        stage: debug.stage,
      });
    }
    const client = getRazorpay();
    const sub = await rzpWrap(
      client.subscriptions.create({
        plan_id: planId,
        customer_id: customerId,
        quantity: Math.max(0, qty),
        total_count:
          Number.isInteger(DEFAULT_SUB_TOTAL_COUNT) &&
          DEFAULT_SUB_TOTAL_COUNT > 0
            ? DEFAULT_SUB_TOTAL_COUNT
            : 12, // safety fallback 1 year
        customer_notify: 1,
      })
    );
    console.log(
      `[rzp.subscribe] created subscription ${sub.id} for org ${org.orgId} plan ${planId} qty ${qty}`
    );

    debug.stage = "save";
    org.subscriptionId = sub.id;
    if (!org.currency) org.currency = "INR";
    if (!org.billingCycleAnchor) org.billingCycleAnchor = new Date();
    await org.save();
    debug.stage = "done";
    res.json({ ok: true, subscription: sub, planId, initialQuantity: qty });
  } catch (e) {
    console.error("[rzp.subscribe] failure", debug, e.message);
    // Provide stage context in response (non-sensitive)
    res.status(e.code && e.code >= 400 && e.code < 600 ? e.code : 500).json({
      error: e.message || "Subscription failure",
      stage: debug.stage,
    });
  }
});

// PATCH /api/rzp/sync-quantity { orgId, schedule: "now"|"cycle_end" }
router.patch("/sync-quantity", async (req, res, next) => {
  try {
    const Orgs = await getOrgModel();
    const { orgId, schedule = "now" } = req.body || {};
    if (!orgId) return res.status(400).json({ error: "orgId required" });
    const org = await Orgs.findOne({ orgId });
    if (!org?.subscriptionId)
      return res.status(400).json({ error: "No subscription attached" });

    const newQty = org.seatMeter?.currentSeats ?? org.usersCount ?? 0;
    const client = getRazorpay();
    const updated = await rzpWrap(
      client.subscriptions.update(org.subscriptionId, {
        quantity: newQty,
        schedule_change_at: schedule === "cycle_end" ? "cycle_end" : "now",
      })
    );

    res.json({ ok: true, subscription: updated });
  } catch (e) {
    next(e);
  }
});

// POST /api/rzp/bill/close { orgId }
// Closes internal billing cycle, syncs next cycle base quantity, and adds usage add-on
router.post("/bill/close", async (req, res, next) => {
  try {
    const Orgs = await getOrgModel();
    const { orgId } = req.body || {};
    if (!orgId) return res.status(400).json({ error: "orgId required" });

    const org = await Orgs.findOne({ orgId });
    if (!org?.subscriptionId)
      return res.status(400).json({ error: "No subscription attached" });

    // 1) Compute & close cycle
    const summary = await closeCycleAndCompute(org._id);

    // 2) Align quantity for next cycle baseline
    const nextQty = org.seatMeter?.currentSeats ?? org.usersCount ?? 0;
    const client = getRazorpay();
    await rzpWrap(
      client.subscriptions.update(org.subscriptionId, {
        quantity: nextQty,
        schedule_change_at: "now",
      })
    );

    // 3) Create one-time usage add-on for closed cycle
    await rzpWrap(
      client.subscriptions.addon.create(org.subscriptionId, {
        item: {
          name: `Seat usage ${new Date(summary.cycleStart)
            .toISOString()
            .slice(0, 10)} → ${new Date(summary.cycleEnd)
            .toISOString()
            .slice(0, 10)}`,
          amount: summary.amountPaise,
          currency: org.currency || "INR",
        },
        quantity: 1,
      })
    );

    res.json({ ok: true, invoiceDraft: summary, nextQuantity: nextQty });
  } catch (e) {
    next(e);
  }
});

// GET /api/rzp/subscription-status?orgId=1234
// Live fetch of subscription status & minimal plan/customer info for dashboard.
router.get("/subscription-status", async (req, res) => {
  try {
    const { orgId } = req.query || {};
    if (!orgId) return res.status(400).json({ error: "orgId required" });
    const Orgs = await getOrgModel();
    const org = await Orgs.findOne({ orgId });
    if (!org) return res.status(404).json({ error: "Org not found" });
    if (!org.subscriptionId)
      return res
        .status(404)
        .json({ error: "No subscription attached", orgId: org.orgId });
    const client = getRazorpay();
    const sub = await rzpWrap(client.subscriptions.fetch(org.subscriptionId));

    const response = {
      orgId: org.orgId,
      subscriptionId: sub.id,
      status: sub.status, // created | active | paused | cancelled etc.
      activationRequired: sub.status === "created",
      link: sub.short_url || null,
      planId: sub.plan_id,
      quantity: sub.quantity,
      totalCount: sub.total_count,
      remainingCount: sub.remaining_count,
      currentPeriodStart: sub.current_start
        ? new Date(sub.current_start * 1000)
        : null,
      currentPeriodEnd: sub.current_end
        ? new Date(sub.current_end * 1000)
        : null,
      nextChargeAt: sub.charge_at ? new Date(sub.charge_at * 1000) : null,
      customerId: sub.customer_id,
    };
    res.json(response);
  } catch (e) {
    console.error("[rzp.subscription-status] failure", e.message);
    res
      .status(502)
      .json({
        error: e.message || "Failed to fetch subscription",
        stage: "fetch",
      });
  }
});

export default router;
