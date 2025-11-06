import cron from "node-cron";
import { getOrgModel } from "../models/organisationModel.js";
import { getRazorpay, rzpWrap } from "../lib/razorpay.js";

// Runs daily by default at 03:30 UTC. Override with RZP_CREATE_SUBSCRIPTION_CRON env var.
const CRON_SPEC = process.env.RZP_CREATE_SUBSCRIPTION_CRON || "30 3 * * *";

/**
 * Criteria (assumptions):
 * - Organization created at least 7 days ago
 * - perMemberPriceInPaise is set (we only auto-subscribe orgs that have pricing configured)
 * - subscriptionId is not set (no existing Razorpay subscription attached)
 *
 * The job is idempotent in that it will skip orgs once subscriptionId is saved.
 */
export const runCreatePendingSubscriptions = async () => {
  console.log(
    "[rzp.createSubscriptions] Starting job to create pending subscriptions"
  );
  try {
    const Org = await getOrgModel();
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    const candidates = await Org.find({
      subscriptionId: { $exists: false },
      createdAt: { $lte: cutoff },
      perMemberPriceInPaise: { $ne: null },
    }).limit(200); // limit to reasonable batch size

    console.log(
      `[rzp.createSubscriptions] Found ${candidates.length} candidate(s)`
    );

    const client = getRazorpay();

    for (const org of candidates) {
      try {
        console.log(`[rzp.createSubscriptions] Processing org ${org.orgId}`);

        // Ensure customer
        let customerId = org.razorpayCustomerId || null;
        if (!customerId) {
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
            await org.save();
            console.log(
              `[rzp.createSubscriptions] created customer ${customerId} for ${org.orgId}`
            );
          } catch (ce) {
            if (
              (ce.message || "")
                .toLowerCase()
                .includes("customer already exists")
            ) {
              console.warn(
                `[rzp.createSubscriptions] customer exists at Razerpay for org ${org.orgId} — skipping customer creation. Please supply existing customerId if needed.`
              );
            } else {
              throw ce;
            }
          }
        }

        // Ensure plan
        let planId = org.planId;
        if (!planId) {
          try {
            const planName = `${org.name || org.orgId} Per-Seat Plan`;
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
                await org.save();
                console.log(
                  `[rzp.createSubscriptions] reused plan ${planId} for ${org.orgId}`
                );
              }
            }
          } catch (listErr) {
            console.warn(
              "[rzp.createSubscriptions] plan list failed (will attempt create)",
              listErr.message
            );
          }
          if (!planId) {
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
            await org.save();
            console.log(
              `[rzp.createSubscriptions] created plan ${planId} for ${org.orgId}`
            );
          }
        }

        // Create subscription
        const qty = org.seatMeter?.currentSeats ?? org.usersCount ?? 0;
        if (qty <= 0) {
          console.warn(
            `[rzp.createSubscriptions] skipping ${org.orgId}: zero seats`
          );
          continue;
        }

        const sub = await rzpWrap(
          client.subscriptions.create({
            plan_id: planId,
            customer_id: org.razorpayCustomerId,
            quantity: Math.max(0, qty),
            total_count: Number.isInteger(
              process.env.RZP_SUB_TOTAL_COUNT
                ? parseInt(process.env.RZP_SUB_TOTAL_COUNT, 10)
                : 120
            )
              ? parseInt(process.env.RZP_SUB_TOTAL_COUNT || "120", 10)
              : 120,
            customer_notify: 1,
          })
        );

        org.subscriptionId = sub.id;
        if (!org.currency) org.currency = "INR";
        if (!org.billingCycleAnchor) org.billingCycleAnchor = new Date();
        await org.save();
        console.log(
          `[rzp.createSubscriptions] created subscription ${sub.id} for ${org.orgId}`
        );
      } catch (orgErr) {
        console.error(
          `[rzp.createSubscriptions] org ${org.orgId} failed:`,
          orgErr.message || orgErr
        );
      }
    }

    console.log("[rzp.createSubscriptions] Job complete");
  } catch (e) {
    console.error("[rzp.createSubscriptions] Fatal error:", e.message || e);
  }
};

// Schedule job
cron.schedule(CRON_SPEC, () => {
  runCreatePendingSubscriptions();
});

export default runCreatePendingSubscriptions;
