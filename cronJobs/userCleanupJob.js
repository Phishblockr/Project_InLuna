import cron from "node-cron";
import { getOrgModel } from "../models/organisationModel.js";
import userSchema from "../models/userModel.js";
import { getTenantDB } from "../tenantdb.js";
import { getAdminLogsModel } from "../models/adminlogsModel.js";

/**
 * Permanently purge users that were soft-deleted (removedAt set) before the start of the current month.
 * This lets you keep them through month-end for billing / reporting, then delete on the 1st.
 */
export const runMonthlyUserPurge = async () => {
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  console.log(
    `[UserCleanup] Starting monthly purge. Cutoff < ${monthStart.toISOString()}`
  );
  try {
    const Org = await getOrgModel();
    const orgs = await Org.find({}, "orgId").lean();
    let totalDeleted = 0;

    for (const org of orgs) {
      try {
        const tenantDb = await getTenantDB(org.orgId);
        const User = tenantDb.models.User || tenantDb.model("User", userSchema);
        const AdminLogs = getAdminLogsModel(tenantDb);

        // Find candidates first so we can log per user
        const usersToDelete = await User.find({
          removedAt: { $ne: null, $lt: monthStart },
        }).lean();
        if (!usersToDelete.length) continue;

        // Log each user deletion (system initiated)
        for (const u of usersToDelete) {
          try {
            await AdminLogs.create({
              userId: null, // system
              operationType: "delete",
              operationsPerformed: `User permanently purged post-retention: ${u.email}`,
              orgId: org.orgId,
              entityId: u._id,
              entityType: "user",
              entityDetails: {
                identifier: u.email,
                removedAt: u.removedAt,
                retention: "post month-end purge",
              },
            });
          } catch (logErr) {
            console.error(
              `[UserCleanup] Log failed for user ${u._id} in org ${org.orgId}:`,
              logErr.message
            );
          }
        }

        const deleteResult = await User.deleteMany({
          _id: { $in: usersToDelete.map((u) => u._id) },
        });
        totalDeleted += deleteResult.deletedCount || 0;
        console.log(
          `[UserCleanup] Org ${org.orgId}: purged ${deleteResult.deletedCount} users.`
        );
      } catch (orgErr) {
        console.error(
          `[UserCleanup] Error processing org ${org.orgId}:`,
          orgErr.message
        );
      }
    }

    console.log(
      `[UserCleanup] Monthly purge complete. Total users permanently deleted: ${totalDeleted}`
    );
  } catch (e) {
    console.error("[UserCleanup] Fatal error during monthly purge:", e.message);
  }
};

// Schedule: 02:15 UTC on the 1st of every month (adjust if needed for billing timezone)
cron.schedule("15 2 1 * *", () => {
  runMonthlyUserPurge();
});

export default runMonthlyUserPurge;
