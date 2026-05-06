import { getTenantModel } from "../admindb.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import { getUserModel } from "../tenantdb.js";

const getTenant = asyncHandler(async (req, res) => {
    const tenantId = req.query.tenantId;

    if (!tenantId) {
        return res.status(400).json({ error: "Tenant ID is required" });
    }

    const tenantModel = await getTenantModel();

    // Create or update the tenant
    let tenant = await tenantModel.findOneAndUpdate(
        { orgId: tenantId }, 
        { orgId: tenantId, name: tenantId }, 
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json(tenant);
});


const addTenantUser = asyncHandler(async (req, res) => {
    const { tenantId, name } = req.body;

    console.log(tenantId, name)

    if (!tenantId || !name) {
        return res.status(400).json({ error: "Tenant ID and User Name are required" });
    }

    const tenantModel = await getTenantModel();

    // Check if tenant exists
    let tenant = await tenantModel.findOne({ orgId: tenantId });
    if (!tenant) {
        return res.status(404).json({ error: "Tenant not found" });
    }

    const userModel = await getUserModel(tenantId);

    // Create or update the user
    let user = await userModel.findOneAndUpdate(
        { name },
        { name },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ message: "User added successfully", user });
});



export { getTenant, addTenantUser };
