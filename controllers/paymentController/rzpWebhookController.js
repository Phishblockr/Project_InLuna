import crypto from "crypto";
import { getOrgModel } from "../../models/organisationModel.js";
import { getBillingEventModel } from "../../models/billingEventModel.js";

export default async function rzpWebhook(req, res) {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const secret = process.env.RZP_WEBHOOK_SECRET;
    if (!secret) return res.status(500).send("Webhook secret not configured");

    const bodyBuf = req.body; // Buffer (raw)
    const expected = crypto
      .createHmac("sha256", secret)
      .update(bodyBuf)
      .digest("hex");

    const ok =
      signature &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    if (!ok) return res.status(400).send("Bad signature");

    const evt = JSON.parse(bodyBuf.toString("utf8"));

    const BillingEvent = await getBillingEventModel();
    // Idempotency: try insert; if exists, short-circuit
    try {
      await BillingEvent.create({
        eventId: evt.id,
        raw: evt,
        type: evt.event,
      });
    } catch (e) {
      if (e.code === 11000) {
        return res.send("duplicate");
      }
      throw e;
    }

    const Orgs = await getOrgModel();

    switch (evt.event) {
      case "invoice.paid": {
        const inv = evt.payload.invoice.entity;
        if (inv.subscription_id) {
          await Orgs.updateOne(
            { subscriptionId: inv.subscription_id },
            { $set: { billingStatus: "active" } }
          );
        }
        break;
      }
      case "invoice.payment_failed":
      case "payment.failed": {
        const inv = evt.payload?.invoice?.entity;
        if (inv?.subscription_id) {
          await Orgs.updateOne(
            { subscriptionId: inv.subscription_id },
            { $set: { billingStatus: "past_due" } }
          );
        }
        break;
      }
      case "subscription.updated": {
        const sub = evt.payload.subscription.entity;
        await Orgs.updateOne(
          { subscriptionId: sub.id },
          {
            $set: {
              /* Optionally persist sub.status or other metadata */
            },
          }
        );
        break;
      }
      case "subscription.cancelled": {
        const sub = evt.payload.subscription.entity;
        await Orgs.updateOne(
          { subscriptionId: sub.id },
          { $set: { billingStatus: "canceled" } }
        );
        break;
      }
      default:
        break;
    }

    res.send("ok");
  } catch (e) {
    console.error("Webhook error", e);
    res.status(500).send("error");
  }
}
